// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 テスト同期開始')
    
    // GAS Webhook URL
    const gasWebhookUrl = 'https://script.google.com/macros/s/AKfycbx16laKZK-V7gVgzGz39e8mW1S_JU2TtKKMXZEKnHWdYL3MYWyJGb8cNBlQzAktbD71bg/exec'
    console.log('🔗 GAS URL:', gasWebhookUrl)
    
    // 現在時刻を「2025/07/02 20:31:16」形式で生成
    const now = new Date()
    const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    
    // GASに送信するデータ（テスト用）
    const testData = {
      予約入力日時: timestamp,
      体験日: '2025/07/02',
      体験プログラム: 'ヨガ',
      '名前（漢字）': 'テスト太郎',
      '名前（カタカナ）': 'テストタロウ',
      電話番号: '090-1234-5678'
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