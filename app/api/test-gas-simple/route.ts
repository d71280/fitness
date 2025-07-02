// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: '簡単GASテストエンドポイント',
    timestamp: new Date().toISOString(),
    status: 'ready'
  })
}

export async function POST(request: NextRequest) {
  console.log('🧪 簡単GASテスト開始')
  
  try {
    const GAS_URL = 'https://script.google.com/macros/s/AKfycby2nuyWwi_zwyytQ0-CJcI94uoGnEZV2sTVyrZJsaMbpvhpHT9c0U5il8tUb4SH65TElA/exec'
    
    const testData = {
      customerName: 'テスト太郎',
      experienceDate: new Date().toLocaleDateString('ja-JP'),
      timeSlot: '10:00-11:00',
      programName: 'テストプログラム',
      email: 'test@example.com',
      phone: '090-1234-5678',
      notes: '簡単テスト',
      status: '新規'
    }
    
    console.log('📤 テストデータ送信:', testData)
    console.log('📡 送信先URL:', GAS_URL)
    
    // 直接GASに送信
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })
    
    console.log('📥 GAS応答:', response.status, response.statusText)
    
    const responseText = await response.text()
    console.log('📄 GAS応答内容:', responseText)
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseText,
      sentData: testData,
      gasUrl: GAS_URL
    })
    
  } catch (error) {
    console.error('❌ 簡単GASテストエラー:', error)
    return NextResponse.json({
      success: false,
      error: 'テストでエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}