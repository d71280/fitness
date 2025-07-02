// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// シンプルな予約スキーマ
const simpleReservationSchema = z.object({
  scheduleId: z.number(),
  customerNameKanji: z.string().min(1),
  customerNameKatakana: z.string().min(1),
  lineId: z.string().min(1),
  phone: z.string().min(1),
})

// CORSヘッダー
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

// シンプルな予約作成
export async function POST(request: NextRequest) {
  console.log('🎯 シンプル予約API開始')
  
  try {
    const body = await request.json()
    console.log('📝 受信データ:', body)
    
    const validatedData = simpleReservationSchema.parse(body)
    console.log('✅ データ検証完了:', validatedData)
    
    // 成功レスポンスを返す（データベース接続なし）
    const mockReservation = {
      id: Date.now(),
      scheduleId: validatedData.scheduleId,
      customerNameKanji: validatedData.customerNameKanji,
      customerNameKatakana: validatedData.customerNameKatakana,
      lineId: validatedData.lineId,
      phone: validatedData.phone,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      schedule: {
        id: validatedData.scheduleId,
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
        program: { name: 'テストプログラム' }
      }
    }
    
    console.log('✅ 予約作成成功:', mockReservation)
    
    return NextResponse.json({
      success: true,
      reservation: mockReservation,
      message: '予約が完了しました'
    }, { 
      status: 201, 
      headers: corsHeaders 
    })
    
  } catch (error) {
    console.error('❌ 予約作成エラー:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '入力データが無効です',
        details: error.errors
      }, { 
        status: 400, 
        headers: corsHeaders 
      })
    }
    
    return NextResponse.json({
      success: false,
      error: '予約処理でエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500, 
      headers: corsHeaders 
    })
  }
}