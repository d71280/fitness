// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// CORSヘッダー
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// プリフライトリクエスト処理
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

// 未同期予約データ取得
export async function GET(request: NextRequest) {
  try {
    console.log('未同期予約データ取得 - リクエスト開始')
    
    // URLパラメーターから最終チェック時刻を取得
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')
    
    const supabase = await createClient()
    
    // 未同期の予約データを取得
    let query = supabase
      .from('reservations')
      .select(`
        *,
        schedule:schedules(
          *,
          program:programs(*)
        ),
        customer:customers(*)
      `)
      .eq('status', 'confirmed')
      .is('synced_to_sheets', null) // 同期フラグがnullのもの
      .order('created_at', { ascending: true })
    
    // 最終チェック時刻以降のデータのみ取得
    if (since) {
      query = query.gte('created_at', since)
    }
    
    const { data: reservations, error } = await query
    
    if (error) {
      console.error('Supabase未同期予約取得エラー:', error)
      throw error
    }
    
    console.log('未同期予約取得成功:', reservations?.length || 0, '件')
    
    return NextResponse.json({
      success: true,
      reservations: reservations || [],
      count: reservations?.length || 0,
      timestamp: new Date().toISOString()
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('未同期予約取得エラー:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '未同期予約データの取得に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500, headers: corsHeaders }
    )
  }
}