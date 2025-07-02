// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

// 簡単なテスト用GAS同期エンドポイント
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 テスト同期開始')
    
    // GAS Webhook URL
    const gasWebhookUrl = 'https://script.google.com/macros/s/AKfycbxdBJsI8pTHr-F0rfSazZbvowMIP_wfkYVdOLQNh2CX2HkY-y4pTtNWYY5L9tmVgDBL7A/exec'
    console.log('🔗 GAS URL:', gasWebhookUrl)
    
    // テストデータ
    const testData = {
      customerName: 'テスト太郎',
      experienceDate: '2025/07/02',
      timeSlot: '10:00-11:00',
      programName: 'テストプログラム'
    }
    
    console.log('📤 送信データ:', testData)
    
    // GASにPOST
    const response = await fetch(gasWebhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData),
    })
    
    console.log('📥 GAS応答:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })
    
    const responseText = await response.text()
    console.log('📄 GAS応答内容:', responseText)
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'テスト同期成功',
        gasResponse: responseText,
        testData
      })
    } else {
      throw new Error(`GAS応答エラー: ${response.status} ${response.statusText}`)
    }
    
  } catch (error) {
    console.error('🚨 テスト同期エラー:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      fullError: error
    })
    
    return NextResponse.json(
      { 
        success: false,
        error: 'テスト同期に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'テスト同期エンドポイント',
    usage: 'POST /api/test-sync でテスト実行'
  })
}