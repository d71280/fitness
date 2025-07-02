// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 テスト同期開始')
    
    // GAS Webhook URL
    const gasWebhookUrl = 'https://script.google.com/macros/s/AKfycbxdBJsI8pTHr-F0rfSazZbvowMIP_wfkYVdOLQNh2CX2HkY-y4pTtNWY5L9tmVgDBL7A/exec'
    console.log('🔗 GAS URL:', gasWebhookUrl)
    
    // テストデータ（GAS期待フォーマット）
    const testData = {
      customerName: 'テスト太郎',
      experienceDate: '2025/07/02',
      timeSlot: '10:00-11:00',
      programName: 'テストプログラム',
      email: 'test@example.com',
      phone: '090-1234-5678',
      notes: 'API自動テスト',
      status: '新規'
    }
    
    console.log('📤 送信データ:', testData)
    
    const response = await fetch(gasWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
      signal: AbortSignal.timeout(15000)
    })
    
    const responseText = await response.text()
    console.log('📥 GAS応答:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    })
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'GAS接続テスト成功',
        gasResponse: responseText,
        testData: testData
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'GAS接続テスト失敗',
        status: response.status,
        statusText: response.statusText,
        gasResponse: responseText
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ テスト同期エラー:', error)
    return NextResponse.json({
      success: false,
      error: 'テスト同期でエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET メソッド（ヘルスチェック）
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'GASテスト同期エンドポイントは準備完了です',
    timestamp: new Date().toISOString()
  })
}