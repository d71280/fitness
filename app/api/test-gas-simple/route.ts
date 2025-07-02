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
    
    // 現在時刻を「2025/07/02 20:31:16」形式で生成
    const now = new Date()
    const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    
    const testData = {
      予約入力日時: timestamp,
      体験日: new Date().toLocaleDateString('ja-JP'),
      体験プログラム: 'ヨガ',
      '名前（漢字）': '',
      '名前（カタカナ）': '',
      電話番号: ''
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