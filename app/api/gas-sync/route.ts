// app/api/gas-sync/route.ts
// 安全版 - Supabaseを使わずGAS直接接続

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🔄 GAS同期処理開始')
  
  try {
    // GAS Webhook URL（新しいURL）
    const gasWebhookUrl = 'https://script.google.com/macros/s/AKfycbyCHPRIrSjqCdAnK2eN32WyLoodNGtxbhZg5EPbNiaPM762RLsEUz_ArMlnfRXmKhYaDw/exec'
    console.log('🔗 GAS URL:', gasWebhookUrl)
    
    // リクエストボディを安全に取得
    let requestData = {}
    try {
      const body = await request.text()
      if (body) {
        requestData = JSON.parse(body)
        console.log('📥 受信データ:', requestData)
      }
    } catch (bodyError) {
      console.log('📝 リクエストボディ解析失敗:', bodyError)
      // デフォルトデータを使用
    }
    
    // GASに送信するデータ（型安全）
    const gasData = {
      customerName: (requestData as any)?.customerName || 'テストユーザー',
      experienceDate: (requestData as any)?.experienceDate || new Date().toLocaleDateString('ja-JP'),
      timeSlot: (requestData as any)?.timeSlot || '10:00-11:00',
      programName: (requestData as any)?.programName || 'テストプログラム',
      email: (requestData as any)?.email || '',
      phone: (requestData as any)?.phone || '',
      notes: (requestData as any)?.notes || 'API自動テスト',
      status: (requestData as any)?.status || '新規'
    }
    
    console.log('📤 GAS送信データ:', gasData)
    
    // GASに送信（シンプル版）
    const response = await fetch(gasWebhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gasData)
    })
    
    console.log('📡 GAS応答ステータス:', response.status)
    
    if (response.ok) {
      const responseText = await response.text()
      console.log('✅ GAS送信成功:', responseText)
      
      return NextResponse.json({
        success: true,
        message: 'GAS同期が成功しました',
        gasResponse: responseText,
        sentData: gasData
      })
    } else {
      const errorText = await response.text().catch(() => 'レスポンス読み込み失敗')
      console.error('❌ GAS送信失敗:', response.status, errorText)
      
      return NextResponse.json({
        success: false,
        error: `GAS送信失敗: ${response.status}`,
        details: errorText
      }, { status: 400 }) // 500ではなく400を返す
    }
    
  } catch (error) {
    console.error('🚨 GAS同期エラー:', error)
    
    // エラーの詳細情報を含める
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined
    }
    
    return NextResponse.json({
      success: false,
      error: 'GAS同期処理でエラーが発生しました',
      details: errorDetails
    }, { status: 400 }) // 500ではなく400を返す
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'GAS同期エンドポイントは正常に動作しています',
    timestamp: new Date().toISOString(),
    endpoint: '/api/gas-sync'
  })
}