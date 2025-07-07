import { NextRequest, NextResponse } from 'next/server'
import { proxyServerClient } from '@/lib/proxy-server-client'

export const dynamic = 'force-dynamic'

// プロキシサーバー連携のテスト用エンドポイント
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type = 'booking_completion', testData } = body

    console.log('📡 プロキシサーバーテスト開始:', type)

    // デフォルトのテストデータ
    const defaultBookingData = {
      lineId: 'U1234567890abcdef1234567890abcdef',
      customerName: 'テスト 太郎',
      reservationId: 999,
      date: '2025-07-08',
      time: '10:00 - 11:00',
      program: 'ヨガベーシック',
      instructor: '田中 美香',
      studio: 'スタジオA',
      messageContent: '✅ 予約が完了しました！\n\n📅 日時: 2025-07-08 10:00 - 11:00\n🏃 プログラム: ヨガベーシック\n\nお忘れなくお越しください！'
    }

    const defaultReminderData = {
      ...defaultBookingData,
      hoursUntil: 24,
      reminderType: '1日前',
      messageContent: '【明日のレッスンのお知らせ】\n\nヨガベーシック\n📅 2025-07-08\n⏰ 10:00 - 11:00\n👨‍🏫 田中 美香\n\n明日はレッスンです！お忘れなく💪\n何かご不明な点があればお気軽にお声かけください😊'
    }

    let result

    switch (type) {
      case 'booking_completion':
        const bookingData = { ...defaultBookingData, ...testData }
        result = await proxyServerClient.sendBookingCompletion(bookingData)
        break

      case 'reminder':
        const reminderData = { ...defaultReminderData, ...testData }
        result = await proxyServerClient.sendReminder(reminderData)
        break

      case 'cancellation':
        const cancellationData = {
          ...defaultBookingData,
          messageContent: 'ご予約をキャンセルしました。\n\nまたのご利用をお待ちしております。',
          ...testData
        }
        result = await proxyServerClient.sendCancellation(cancellationData)
        break

      default:
        throw new Error(`Unknown test type: ${type}`)
    }

    console.log('📡 プロキシサーバーテスト結果:', result)

    return NextResponse.json({
      success: true,
      message: 'プロキシサーバーテスト完了',
      testType: type,
      result: result
    })

  } catch (error) {
    console.error('プロキシサーバーテストエラー:', error)
    
    return NextResponse.json({
      success: false,
      error: 'テストに失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// プロキシサーバーの状況確認
export async function GET(request: NextRequest) {
  try {
    // ヘルスチェック
    const healthy = await proxyServerClient.healthCheck()
    
    // 状況確認
    const status = await proxyServerClient.getStatus()

    // 設定情報
    const config = {
      url: process.env.PROXY_SERVER_URL || '',
      hasApiKey: !!process.env.PROXY_SERVER_API_KEY,
      environment: process.env.NODE_ENV
    }

    return NextResponse.json({
      success: true,
      config: config,
      health: {
        healthy: healthy,
        status: status
      },
      usage: {
        bookingCompletion: {
          endpoint: 'POST /api/test-proxy-server',
          payload: {
            type: 'booking_completion',
            testData: {
              lineId: 'LINE_USER_ID',
              customerName: '顧客名',
              reservationId: 123,
              date: '2025-07-08',
              time: '10:00 - 11:00',
              program: 'プログラム名',
              instructor: 'インストラクター名',
              studio: 'スタジオ名',
              messageContent: 'メッセージ内容'
            }
          }
        },
        reminder: {
          endpoint: 'POST /api/test-proxy-server',
          payload: {
            type: 'reminder',
            testData: {
              hoursUntil: 24,
              reminderType: '1日前'
            }
          }
        }
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '状況確認に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}