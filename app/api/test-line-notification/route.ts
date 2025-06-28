import { NextRequest, NextResponse } from 'next/server'
import { LStepClient } from '@/lib/lstep'

export async function POST(request: NextRequest) {
  try {
    const { lineId } = await request.json()
    
    if (!lineId) {
      return NextResponse.json(
        { error: 'LINE IDが必要です' },
        { status: 400 }
      )
    }

    // テスト用予約データ
    const testBookingData = {
      id: 12345,
      date: new Date().toISOString().split('T')[0],
      time: '10:00 - 11:00',
      program: 'テストヨガクラス',
      instructor: 'テストインストラクター',
      studio: 'テストスタジオ',
      customerName: 'テストユーザー',
    }

    console.log('📱 LINE通知テスト開始:', {
      lineId: lineId,
      environment: process.env.NODE_ENV,
      hasLineToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
      appBaseUrl: process.env.APP_BASE_URL
    })

    // LINE通知送信
    const lstepClient = new LStepClient()
    const result = await lstepClient.sendBookingConfirmation(lineId, testBookingData)

    console.log('📱 LINE通知テスト結果:', result)

    return NextResponse.json({
      success: true,
      result: result,
      testData: testBookingData,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasLineToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
        appBaseUrl: process.env.APP_BASE_URL,
        debugMode: process.env.LINE_DEBUG_MODE
      }
    })
  } catch (error) {
    console.error('LINE通知テストエラー:', error)
    return NextResponse.json(
      { 
        error: 'LINE通知テストに失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'LINE通知テストエンドポイント',
    usage: 'POST /api/test-line-notification { "lineId": "USER_LINE_ID" }',
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasLineToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
      appBaseUrl: process.env.APP_BASE_URL,
      debugMode: process.env.LINE_DEBUG_MODE
    }
  })
} 