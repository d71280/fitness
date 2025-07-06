// app/api/gas-sync/route.ts
// 安全版 - Supabaseを使わずGAS直接接続

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🔄 GAS同期処理開始')
  
  try {
    // GAS Webhook URL（最新URL）
    const gasWebhookUrl = 'https://script.google.com/macros/s/AKfycbzBd6RgcgiuSwkt6EjIWftnEGmx1tfZTr2CvEyunVlnc2oBFPti-e18GVryQmViF__3Sw/exec'
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
    
    // 新しいGASコードに合わせたデータ形式
    const reservationData = {
      // 基本情報
      experienceDate: (requestData as any)?.experienceDate || new Date().toLocaleDateString('ja-JP'),
      programName: (requestData as any)?.programName || '',
      timeSlot: (requestData as any)?.timeSlot || '',
      
      // 顧客情報
      customerNameKanji: (requestData as any)?.customerNameKanji || (requestData as any)?.customerName || '',
      customerNameKatakana: (requestData as any)?.customerNameKatakana || '',
      phone: (requestData as any)?.phone || '',
      lineId: (requestData as any)?.lineId || '',
      
      // 時間情報（GAS側の期待する形式）
      start_time: (requestData as any)?.start_time || '',
      end_time: (requestData as any)?.end_time || '',
      
      // 追加データ
      reservationDateTime: timestamp
    }
    
    console.log('📤 GAS送信データ:', reservationData)
    console.log('📡 送信先URL:', gasWebhookUrl)
    console.log('🔍 送信JSONサイズ:', JSON.stringify(reservationData).length, 'bytes')
    
    // GASに送信（新しいwriteToSpreadsheet関数対応）
    const response = await fetch(gasWebhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reservationData)
    })
    
    console.log('📡 GAS応答ステータス:', response.status)
    
    if (response.ok) {
      const responseText = await response.text()
      console.log('✅ GAS送信成功:', responseText)
      
      return NextResponse.json({
        success: true,
        message: 'GAS同期が成功しました',
        gasResponse: responseText,
        sentData: reservationData
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