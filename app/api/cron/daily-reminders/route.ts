import { NextRequest, NextResponse } from 'next/server'
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

    // 現在はモックデータでリマインダー機能をテスト
    // 将来的にデータベース接続時にPrismaを使用予定
    console.log('リマインダー処理開始:', tomorrowStr)
    
    const lstepClient = new LStepClient()
    const mockReservations = [
      {
        id: 1,
        customer: { 
          id: 1,
          line_id: 'mock_line_id_1', 
          name: '山田 太郎' 
        },
        schedule: {
          program: { name: 'ヨガ' },
          instructor: { name: '田中 美香' },
          studio: { name: 'スタジオ1' },
        }
      },
      {
        id: 2,
        customer: { 
          id: 2,
          line_id: 'mock_line_id_2', 
          name: '佐藤 花子' 
        },
        schedule: {
          program: { name: 'ピラティス' },
          instructor: { name: '鈴木 健太' },
          studio: { name: 'スタジオ2' },
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

        // 通知ログを記録（将来的にデータベースに保存）
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
      processed: mockReservations.length,
      successful: successCount,
      failed: mockReservations.length - successCount,
      date: tomorrowStr,
      mode: 'mock'
    })

  } catch (error) {
    console.error('リマインダー処理エラー:', error)
    return NextResponse.json(
      { error: 'リマインダー処理に失敗しました' },
      { status: 500 }
    )
  }
}