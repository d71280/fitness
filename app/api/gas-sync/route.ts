// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

const GAS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxdBJsI8pTHr-F0rfSazZbvowMIP_wfkYVdOLQNh2CX2HkY-y4pTtNWY5L9tmVgDBL7A/exec'

export async function POST(request: NextRequest) {
  console.log('🔄 GAS同期開始')
  
  try {
    const body = await request.json()
    console.log('📝 受信データ:', body)
    
    // GASに送信するデータを準備
    const gasData = {
      customerName: body.customerNameKanji || 'テスト太郎',
      experienceDate: new Date().toLocaleDateString('ja-JP'),
      timeSlot: '10:00-11:00',
      programName: body.programName || 'テストプログラム',
      email: body.email || '',
      phone: body.phone || '',
      notes: body.notes || 'API経由の予約',
      status: '新規'
    }
    
    console.log('📤 GAS送信データ:', gasData)
    
    // GASに送信
    const response = await fetch(GAS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gasData),
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
        message: 'GAS同期成功',
        gasResponse: responseText,
        sentData: gasData
      })
    } else {
      return NextResponse.json({
        success: false,
        error: `GAS同期失敗: ${response.status} ${response.statusText}`,
        gasResponse: responseText
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ GAS同期エラー:', error)
    return NextResponse.json({
      success: false,
      error: 'GAS同期でエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'GAS同期エンドポイント準備完了',
    gasUrl: GAS_WEBHOOK_URL,
    timestamp: new Date().toISOString()
  })
}