// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// 未同期予約データのみをGAS Webhookに送信
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 未同期予約データ同期開始')
    
    const supabase = await createClient()
    
    // 未同期の予約データを取得
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
      .is('synced_to_sheets', null) // 同期フラグがnullのもの
      .order('created_at', { ascending: true })
      .limit(50) // 最大50件
    
    if (error) {
      console.error('Supabase未同期予約取得エラー:', error)
      throw error
    }
    
    if (!reservations || reservations.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: '未同期の予約データはありません'
      })
    }
    
    console.log(`📋 ${reservations.length}件の未同期予約データを処理中...`)
    
    // GAS Webhook URL
    const gasWebhookUrl = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL
    if (!gasWebhookUrl || gasWebhookUrl.includes('YOUR_GAS_ID')) {
      throw new Error('GAS Webhook URLが設定されていません')
    }
    
    let successCount = 0
    let errorCount = 0
    
    // 各未同期予約データをGASに送信
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
          
          // 同期完了フラグを更新
          await supabase
            .from('reservations')
            .update({ 
              synced_to_sheets: true,
              synced_at: new Date().toISOString()
            })
            .eq('id', reservation.id)
            
        } else {
          errorCount++
          console.warn(`⚠️ 予約ID ${reservation.id} 送信失敗:`, response.status)
        }
        
        // レート制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 300))
        
      } catch (syncError) {
        errorCount++
        console.error(`❌ 予約ID ${reservation.id} 送信エラー:`, syncError)
      }
    }
    
    console.log(`🎉 未同期データ同期完了: 成功${successCount}件, 失敗${errorCount}件`)
    
    return NextResponse.json({
      success: true,
      count: successCount,
      errors: errorCount,
      total: reservations.length,
      message: `${successCount}件の未同期予約データを送信しました${errorCount > 0 ? ` (${errorCount}件失敗)` : ''}`
    })
    
  } catch (error) {
    console.error('未同期予約同期エラー:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '未同期予約データの同期に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}