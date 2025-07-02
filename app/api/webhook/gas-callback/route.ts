// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

// GASからのコールバック受信用（必要な場合のみ）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📥 GASからのコールバック受信:', body)
    
    // 例：書き込み完了通知を処理
    if (body.status === 'success') {
      console.log(`✅ 予約ID ${body.reservationId} のGoogle Sheets書き込み完了`)
      // 必要に応じてDBの同期フラグを更新など
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'コールバック受信完了' 
    })
  } catch (error) {
    console.error('GASコールバックエラー:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}