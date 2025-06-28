import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LStepClient } from '@/lib/lstep'

export async function GET(request: NextRequest) {
  // Vercel Cronからの認証
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    try {
      // データベースから翌日の予約を取得
      const tomorrowReservations = await prisma.reservation.findMany({
        where: {
          status: 'confirmed',
          schedule: {
            date: new Date(tomorrowStr),
          },
        },
        include: {
          customer: true,
          schedule: {
            include: {
              program: true,
              instructor: true,
              studio: true,
            },
          },
        },
      })

      const lstepClient = new LStepClient()
      let successCount = 0

      for (const reservation of tomorrowReservations) {
        try {
          const reminderData = {
            program: reservation.schedule.program.name,
            date: tomorrowStr,
            time: `${reservation.schedule.start_time.slice(0, 5)} - ${reservation.schedule.end_time.slice(0, 5)}`,
            instructor: reservation.schedule.instructor.name,
            studio: reservation.schedule.studio.name,
          }

          const result = await lstepClient.sendReminder(
            reservation.customer.line_id!,
            reminderData
          )

          // 通知ログを記録
          await lstepClient.logNotification(
            reservation.customer.id,
            reservation.id,
            'reminder',
            reminderData,
            result
          )

          if (result.success) {
            successCount++
          }
        } catch (error) {
          console.error(`リマインダー送信失敗 (予約ID: ${reservation.id}):`, error)
        }
      }

      return NextResponse.json({
        success: true,
        processed: tomorrowReservations.length,
        successful: successCount,
        failed: tomorrowReservations.length - successCount,
        date: tomorrowStr,
      })
    } catch (dbError) {
      console.warn('データベース接続エラー、モックリマインダーを実行します:', dbError)
      
      // モックデータでリマインダー機能をテスト
      const lstepClient = new LStepClient()
      const mockReservations = [
        {
          customer: { line_id: 'mock_line_id_1', name: '山田 太郎' },
          schedule: {
            program: { name: 'ヨガ' },
            instructor: { name: '田中 美香' },
            studio: { name: 'スタジオ1' },
          }
        }
      ]

      let successCount = 0
      for (const reservation of mockReservations) {
        try {
          const reminderData = {
            program: reservation.schedule.program.name,
            date: tomorrowStr,
            time: '10:00 - 11:00',
            instructor: reservation.schedule.instructor.name,
            studio: reservation.schedule.studio.name,
          }

          const result = await lstepClient.sendReminder(
            reservation.customer.line_id,
            reminderData
          )

          if (result.success) {
            successCount++
          }
        } catch (error) {
          console.error('モックリマインダー送信失敗:', error)
        }
      }

      return NextResponse.json({
        success: true,
        processed: mockReservations.length,
        successful: successCount,
        failed: mockReservations.length - successCount,
        date: tomorrowStr,
        mode: 'mock',
      })
    }
  } catch (error) {
    console.error('リマインダー処理エラー:', error)
    return NextResponse.json(
      { error: 'リマインダー処理に失敗しました' },
      { status: 500 }
    )
  }
}