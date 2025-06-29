import { NextRequest, NextResponse } from 'next/server'
import { messagingService } from '@/lib/messaging-service'

// Lステップ通信テスト用エンドポイント
export async function GET(request: NextRequest) {
  try {
    // ヘルスチェック
    const health = await messagingService.healthCheck()
    
    return NextResponse.json({
      message: 'Lステップ通信テスト',
      health,
      providers: {
        line: 'LINE公式アカウント直送信',
        lstep: 'Lステップ経由送信'
      },
      current_provider: health.currentProvider
    })
  } catch (error: any) {
    console.error('Lステップテストエラー:', error)
    return NextResponse.json(
      { error: 'テストに失敗しました', details: error.message },
      { status: 500 }
    )
  }
}

// テスト送信
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lineId, provider = 'lstep', testType = 'booking' } = body

    if (!lineId) {
      return NextResponse.json(
        { error: 'lineIdは必須です' },
        { status: 400 }
      )
    }

    if (testType === 'booking') {
      // 予約確認テスト
      const result = await messagingService.sendBookingConfirmation({
        customerName: 'テストユーザー',
        lineId: lineId,
        date: '2025-06-30',
        time: '10:00-11:00',
        program: 'ヨガベーシック',
        instructor: '田中 美香',
        studio: 'スタジオ1',
        reservationId: 12345,
        programColor: '#4CAF50'
      }, provider as 'line' | 'lstep')

      return NextResponse.json({
        message: '予約確認テスト送信完了',
        result,
        test_data: {
          type: 'booking_confirmation',
          provider: result.provider,
          line_id: lineId
        }
      })
    } else if (testType === 'reminder') {
      // リマインダーテスト
      const result = await messagingService.sendReminder({
        customerName: 'テストユーザー',
        lineId: lineId,
        date: '2025-06-30',
        time: '10:00-11:00',
        program: 'ヨガベーシック',
        studio: 'スタジオ1',
        hoursUntil: 2
      }, provider as 'line' | 'lstep')

      return NextResponse.json({
        message: 'リマインダーテスト送信完了',
        result,
        test_data: {
          type: 'reminder',
          provider: result.provider,
          line_id: lineId
        }
      })
    } else if (testType === 'cancellation') {
      // キャンセル確認テスト
      const result = await messagingService.sendCancellationConfirmation({
        customerName: 'テストユーザー',
        lineId: lineId,
        date: '2025-06-30',
        time: '10:00-11:00',
        program: 'ヨガベーシック',
        reason: 'スケジュール都合'
      }, provider as 'line' | 'lstep')

      return NextResponse.json({
        message: 'キャンセル確認テスト送信完了',
        result,
        test_data: {
          type: 'cancellation',
          provider: result.provider,
          line_id: lineId
        }
      })
    } else {
      return NextResponse.json(
        { error: '無効なテストタイプです。booking, reminder, cancellation のいずれかを指定してください' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Lステップテスト送信エラー:', error)
    return NextResponse.json(
      { error: 'テスト送信に失敗しました', details: error.message },
      { status: 500 }
    )
  }
}