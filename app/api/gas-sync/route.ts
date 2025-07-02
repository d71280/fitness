// app/api/gas-sync/route.ts
// 安全版 - Supabaseを使わずGAS直接接続

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🔄 GAS同期処理開始')
  
  try {
    // GAS Webhook URL（最新URL）
    const gasWebhookUrl = 'https://script.google.com/macros/s/AKfycbzbr8zH7YOd0h7g8DJdv-tj4qb01bMvSic1g71gdi6WvqQyRcOtkGlPO9AJdUiYxJ-oaA/exec'
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
    
    // 現在時刻を「2025/07/02 20:31:16」形式で生成
    const now = new Date()
    const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    
    // GASに送信するデータ
    const gasData = {
      予約入力日時: timestamp,
      体験日: (requestData as any)?.experienceDate || new Date().toLocaleDateString('ja-JP'),
      体験プログラム: (requestData as any)?.programName || '',
      '名前（漢字）': (requestData as any)?.customerNameKanji || (requestData as any)?.customerName || '',
      '名前（カタカナ）': (requestData as any)?.customerNameKatakana || '',
      電話番号: (requestData as any)?.phone || ''
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