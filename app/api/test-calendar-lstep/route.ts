import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Calendar to Lstep連携のテスト用エンドポイント
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dryRun = true } = body

    // テスト用のサンプル予約データ
    const sampleBookings = [
      {
        id: 'test_001',
        customerName: 'テスト 太郎',
        lineId: 'U1234567890abcdef1234567890abcdef', // テスト用LINE ID
        date: '2025-07-08',
        startTime: '10:00',
        endTime: '11:00',
        program: 'ヨガベーシック',
        instructor: '田中 美香',
        studio: 'スタジオA',
        phone: '090-1234-5678',
        email: 'test@example.com'
      },
      {
        id: 'test_002',
        customerName: 'テスト 花子',
        date: '2025-07-08',
        startTime: '14:00',
        endTime: '15:00',
        program: 'HIIT',
        instructor: '山田 健太',
        studio: 'スタジオB',
        phone: '090-2345-6789'
      }
    ]

    console.log('📅 Calendar to Lstep テスト開始')
    console.log(`DryRun モード: ${dryRun}`)

    // 実際のAPIを呼び出し
    const apiUrl = new URL('/api/calendar-to-lstep', request.url)
    const testRequest = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookings: sampleBookings,
        source: 'test',
        dryRun: dryRun
      })
    })

    const result = await testRequest.json()

    return NextResponse.json({
      success: true,
      message: 'Calendar to Lstep テスト完了',
      testData: {
        bookings: sampleBookings,
        dryRun: dryRun
      },
      result: result
    })

  } catch (error) {
    console.error('Calendar to Lstep テストエラー:', error)
    
    return NextResponse.json({
      success: false,
      error: 'テストに失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// テスト用の設定情報を取得
export async function GET(request: NextRequest) {
  try {
    const hasLstepKey = !!process.env.LSTEP_API_KEY
    const lstepUrl = process.env.LSTEP_API_URL || 'https://api.lstep.app/v1'

    return NextResponse.json({
      success: true,
      config: {
        lstepConfigured: hasLstepKey,
        lstepUrl: lstepUrl,
        environment: process.env.NODE_ENV
      },
      usage: {
        endpoint: '/api/calendar-to-lstep',
        method: 'POST',
        parameters: {
          bookings: 'Array<CalendarBooking>',
          source: 'string (optional)',
          dryRun: 'boolean (optional, default: false)'
        },
        example: {
          bookings: [
            {
              id: 'booking_123',
              customerName: '顧客名',
              lineId: 'LINE_USER_ID (optional)',
              date: '2025-07-08',
              startTime: '10:00',
              endTime: '11:00',
              program: 'プログラム名',
              instructor: 'インストラクター名',
              studio: 'スタジオ名',
              phone: '電話番号 (optional)',
              email: 'メールアドレス (optional)'
            }
          ],
          source: 'calendar',
          dryRun: false
        }
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'テスト設定の取得に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}