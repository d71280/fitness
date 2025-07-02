// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// 全予約データをGAS Webhookに送信
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 全予約データ同期開始')
    
    const supabase = await createClient()
    
    // 確定済みの全予約データを取得
    const { data: reservations, error } = await supabase
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
      .order('created_at', { ascending: false })
      .limit(100) // 最新100件に制限
    
    if (error) {
      console.error('Supabase予約取得エラー:', error)
      throw error
    }
    
    if (!reservations || reservations.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: '同期対象の予約データがありません'
      })
    }
    
    console.log(`📋 ${reservations.length}件の予約データを処理中...`)
    
    // GAS Webhook URL（サーバーサイドでは直接設定）
    const gasWebhookUrl = 'https://script.google.com/macros/s/AKfycbxdBJsI8pTHr-F0rfSazZbvowMIP_wfkYVdOLQNh2CX2HkY-y4pTtNWYY5L9tmVgDBL7A/exec'
    
    console.log('🔗 GAS Webhook URL:', gasWebhookUrl)
    
    let successCount = 0
    let errorCount = 0
    
    // 各予約データをGASに送信
    for (const reservation of reservations) {
      try {
        const schedule = reservation.schedule || {}
        const customer = reservation.customer || {}
        
        // データフォーマット
        const today = new Date().toLocaleDateString('ja-JP')
        const customerName = customer.name ? customer.name.split('(')[0].trim() : 'Unknown'
        const experienceDate = schedule.date ? new Date(schedule.date).toLocaleDateString('ja-JP') : ''
        const timeSlot = `${schedule.start_time?.slice(0, 5) || '時間未設定'}-${schedule.end_time?.slice(0, 5) || '時間未設定'}`
        const programName = schedule.program?.name || 'プログラム未設定'
        
        // GASに送信
        const response = await fetch(gasWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName,
            experienceDate,
            timeSlot,
            programName
          }),
          signal: AbortSignal.timeout(10000) // 10秒でタイムアウト
        })
        
        if (response.ok) {
          successCount++
          console.log(`✅ 予約ID ${reservation.id} 送信成功`)
        } else {
          errorCount++
          console.warn(`⚠️ 予約ID ${reservation.id} 送信失敗:`, response.status)
        }
        
        // レート制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 200))
        
      } catch (syncError) {
        errorCount++
        console.error(`❌ 予約ID ${reservation.id} 送信エラー:`, syncError)
      }
    }
    
    console.log(`🎉 同期完了: 成功${successCount}件, 失敗${errorCount}件`)
    
    return NextResponse.json({
      success: true,
      count: successCount,
      errors: errorCount,
      total: reservations.length,
      message: `${successCount}件の予約データを送信しました${errorCount > 0 ? ` (${errorCount}件失敗)` : ''}`
    })
    
  } catch (error) {
    console.error('全予約同期エラー:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '全予約データの同期に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}