// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

// CORSヘッダー
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
}

// プリフライトリクエスト処理
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

// 予約完了トリガーAPI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reservation, trigger } = body
    
    console.log('🚀 予約完了トリガー受信:', {
      trigger,
      reservationId: reservation?.id,
      scheduleId: reservation?.schedule_id,
      customerId: reservation?.customer_id,
      timestamp: new Date().toISOString()
    })

    // ここに任意の処理を追加できます
    // 例: 外部システムへの通知、追加のログ出力、データ分析など
    
    // シンプルなテスト実装
    if (trigger === 'reservation_complete') {
      console.log('✅ 予約完了処理を実行しました:', {
        message: 'Reservation completed successfully',
        reservationData: {
          id: reservation?.id,
          schedule: reservation?.schedule,
          customer: reservation?.customer,
          status: reservation?.status
        }
      })

      // 将来的に追加したい処理の例：
      // - 外部システムへのWebhook送信
      // - 分析データの送信
      // - 追加のメール通知
      // - CRMシステムとの連携
      
      return NextResponse.json({
        success: true,
        message: '予約完了トリガーが正常に実行されました',
        trigger: trigger,
        processed_at: new Date().toISOString()
      }, { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    return NextResponse.json({
      success: false,
      message: '不明なトリガータイプです',
      trigger: trigger
    }, { 
      status: 400, 
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('❌ 予約完了トリガーエラー:', error)
    
    return NextResponse.json({
      success: false,
      message: 'トリガー処理でエラーが発生しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500, 
      headers: corsHeaders 
    })
  }
}