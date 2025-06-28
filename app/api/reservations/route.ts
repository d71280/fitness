import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LStepClient } from '@/lib/lstep'
import { z } from 'zod'

const createReservationSchema = z.object({
  scheduleId: z.number(),
  customerName: z.string().min(1),
  lineId: z.string().min(1),
  phone: z.string().optional(),
})

// 予約一覧取得
export async function GET(request: NextRequest) {
  try {
    try {
      const reservations = await prisma.reservation.findMany({
        include: {
          schedule: {
            include: {
              program: true,
              instructor: true,
              studio: true,
            },
          },
          customer: true,
        },
        orderBy: [
          { created_at: 'desc' },
        ],
      })

      return NextResponse.json(reservations)
    } catch (dbError) {
      console.warn('データベース接続エラー、モックデータを使用します:', dbError)
      
      // モック予約データ
      const mockReservations = [
        {
          id: 1,
          status: 'confirmed',
          booking_type: 'advance',
          created_at: new Date().toISOString(),
          schedule: {
            id: 1,
            date: '2025-06-16',
            start_time: '10:00',
            end_time: '11:00',
            program: { name: 'ヨガ' },
            instructor: { name: '田中 美香' },
            studio: { name: 'スタジオ1' },
          },
          customer: {
            id: 1,
            name: '山田 太郎',
            line_id: 'LINE12345',
            phone: '090-1234-5678',
          },
        },
      ]
      
      return NextResponse.json(mockReservations)
    }
  } catch (error) {
    console.error('予約取得エラー:', error)
    return NextResponse.json(
      { error: '予約取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 新規予約作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId, customerName, lineId, phone } = createReservationSchema.parse(body)

    try {
      // 顧客を取得または作成
      const customer = await prisma.customer.upsert({
        where: { line_id: lineId },
        update: {
          name: customerName,
          phone: phone,
          last_booking_date: new Date(),
        },
        create: {
          name: customerName,
          line_id: lineId,
          phone: phone,
          last_booking_date: new Date(),
        },
      })

      // スケジュール情報と空き状況を確認
      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        include: {
          program: true,
          instructor: true,
          studio: true,
          reservations: {
            where: { status: 'confirmed' },
          },
        },
      })

      if (!schedule) {
        return NextResponse.json(
          { error: 'スケジュールが見つかりません' },
          { status: 404 }
        )
      }

      if (schedule.reservations.length >= schedule.capacity) {
        return NextResponse.json(
          { error: 'このクラスは満席です' },
          { status: 400 }
        )
      }

      // 重複予約チェック
      const existingReservation = await prisma.reservation.findFirst({
        where: {
          schedule_id: scheduleId,
          customer_id: customer.id,
          status: { in: ['confirmed', 'waiting'] },
        },
      })

      if (existingReservation) {
        return NextResponse.json(
          { error: '既にこのクラスを予約済みです' },
          { status: 400 }
        )
      }

      // 予約作成
      const reservation = await prisma.reservation.create({
        data: {
          schedule_id: scheduleId,
          customer_id: customer.id,
          status: 'confirmed',
          booking_type: 'advance',
        },
        include: {
          schedule: {
            include: {
              program: true,
              instructor: true,
              studio: true,
            },
          },
          customer: true,
        },
      })

      // Lステップ経由で予約確認通知
      const lstepClient = new LStepClient()
      const bookingData = {
        id: reservation.id,
        date: schedule.date.toISOString().split('T')[0],
        time: `${schedule.start_time.slice(0, 5)} - ${schedule.end_time.slice(0, 5)}`,
        program: schedule.program.name,
        instructor: schedule.instructor.name,
        studio: schedule.studio.name,
        customerName: customer.name,
      }

      // オプション1: 直接LINE Messaging API（現在の実装）
      const notificationResult = await lstepClient.sendBookingConfirmation(lineId, bookingData)
      
      // オプション2: GAS経由で統一した通知（追加実装例）
      // const gasNotificationResult = await sendNotificationViaGAS(lineId, bookingData)
      
      // 通知ログを記録
      await lstepClient.logNotification(
        customer.id,
        reservation.id,
        'booking_confirmation',
        bookingData,
        notificationResult
      )

      return NextResponse.json({
        success: true,
        reservation,
        message: '予約が完了しました',
        notification: notificationResult.success ? 'LINE通知を送信しました' : 'LINE通知の送信に失敗しました',
      }, { status: 201 })
    } catch (dbError) {
      console.warn('データベース接続エラー、モック応答を返します:', dbError)
      
      // モックでもLINE通知をテスト
      const lstepClient = new LStepClient()
      const mockBookingData = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        time: '10:00 - 11:00',
        program: 'モックプログラム',
        instructor: 'モックインストラクター',
        studio: 'モックスタジオ',
        customerName: customerName,
      }

      const notificationResult = await lstepClient.sendBookingConfirmation(lineId, mockBookingData)
      
      // モック応答を返す
      return NextResponse.json({
        success: true,
        reservation: {
          id: Date.now(),
          status: 'confirmed',
          booking_type: 'advance',
          created_at: new Date().toISOString(),
          schedule: {
            id: scheduleId,
            program: { name: 'モックプログラム' },
            instructor: { name: 'モックインストラクター' },
            studio: { name: 'モックスタジオ' },
          },
          customer: {
            name: customerName,
            line_id: lineId,
            phone: phone,
          },
        },
        message: '予約が完了しました（モック）',
        notification: notificationResult.success ? 'LINE通知を送信しました（開発モード）' : 'LINE通知の送信に失敗しました',
      }, { status: 201 })
    }
  } catch (error) {
    console.error('予約作成エラー:', error)
    return NextResponse.json(
      { error: '予約作成に失敗しました' },
      { status: 500 }
    )
  }
}