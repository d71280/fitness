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
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbzbr8zH7YOd0h7g8DJdv-tj4qb01bMvSic1g71gdi6WvqQyRcOtkGlPO9AJdUiYxJ-oaA/exec'
    
    // 現在時刻を「2025/07/02 20:31:16」形式で生成
    const now = new Date()
    const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    
    const testData = {
      予約入力日時: timestamp,
      体験日: new Date().toLocaleDateString('ja-JP'),
      体験プログラム: 'ヨガ',
      '名前（漢字）': 'テスト花子',
      '名前（カタカナ）': 'テストハナコ',
      電話番号: '080-9876-5432'
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