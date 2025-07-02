// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 GAS同期処理開始')
    
    // GAS Webhook URL（確認済みで動作中）
    const gasWebhookUrl = 'https://script.google.com/macros/s/AKfycbxdBJsI8pTHr-F0rfSazZbvowMIP_wfkYVdOLQNh2CX2HkY-y4pTtNWY5L9tmVgDBL7A/exec'
    console.log('🔗 GAS URL:', gasWebhookUrl)
    
    // リクエストボディを取得
    let requestData = {}
    try {
      const body = await request.text()
      if (body) {
        requestData = JSON.parse(body)
        console.log('📥 受信データ:', requestData)
      }
    } catch (error) {
      console.log('📝 リクエストボディ解析失敗、デフォルトデータを使用')
    }
    
    // GASに送信するテストデータ（実際の予約データがない場合）
    const gasData = {
      customerName: requestData.customerName || 'テストユーザー',
      experienceDate: requestData.experienceDate || new Date().toLocaleDateString('ja-JP'),
      timeSlot: requestData.timeSlot || '10:00-11:00',
      programName: requestData.programName || 'テストプログラム',
      email: requestData.email || '',
      phone: requestData.phone || '',
      notes: requestData.notes || 'API自動テスト',
      status: requestData.status || '新規'
    }
    
    console.log('📤 GAS送信データ:', gasData)
    
    // GASに送信
    const response = await fetch(gasWebhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'FitnessApp/1.0'
      },
      body: JSON.stringify(gasData),
      signal: AbortSignal.timeout(10000)
    })
    
    console.log('📡 GAS応答:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })
    
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
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('🚨 GAS同期エラー:', error)
    
    return NextResponse.json({
      success: false,
      error: 'GAS同期処理でエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'GAS同期エンドポイントは正常に動作しています',
    timestamp: new Date().toISOString(),
    endpoint: '/api/gas-sync',
    gasUrl: 'https://script.google.com/macros/s/AKfycbxdBJsI8pTHr-F0rfSazZbvowMIP_wfkYVdOL QNh2CX2HkY-y4pTtNWY5L9tmVgDBL7A/exec'
  })
}