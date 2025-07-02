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
      .or('synced_to_sheets.is.null,synced_to_sheets.eq.false') // 同期フラグがnullまたはfalse
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
    
    // GAS Webhook URL（サーバーサイドでは直接設定）
    const gasWebhookUrl = 'https://script.google.com/macros/s/AKfycbxdBJsI8pTHr-F0rfSazZbvowMIP_wfkYVdOLQNh2CX2HkY-y4pTtNWYY5L9tmVgDBL7A/exec'
    
    console.log('🔗 GAS Webhook URL:', gasWebhookUrl)
    
    let successCount = 0
    let errorCount = 0
    
    // 各未同期予約データをGASに送信
    for (const reservation of reservations) {
      try {
        const schedule = reservation.schedule || {}
        const customer = reservation.customer || {}
        
        // GASが期待するデータフォーマットに合わせる
        const customerName = customer.name ? customer.name.split('(')[0].trim() : 'Unknown'
        const experienceDate = schedule.date ? new Date(schedule.date).toLocaleDateString('ja-JP') : ''
        const timeSlot = `${schedule.start_time?.slice(0, 5) || '時間未設定'}-${schedule.end_time?.slice(0, 5) || '時間未設定'}`
        const programName = schedule.program?.name || 'プログラム未設定'
        
        const gasData = {
          customerName: customerName,
          experienceDate: experienceDate,
          timeSlot: timeSlot,
          programName: programName,
          email: customer.email || '',
          phone: customer.phone || '',
          notes: `予約ID: ${reservation.id}`,
          status: '新規'
        }
        
        console.log('📤 GAS送信データ:', gasData)
        
        // GASに送信
        const response = await fetch(gasWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gasData),
          signal: AbortSignal.timeout(15000) // 15秒に延長
        })
        
        if (response.ok) {
          successCount++
          console.log(`✅ 予約ID ${reservation.id} 送信成功`)
          
          // 同期完了フラグを更新
          const { error: updateError } = await supabase
            .from('reservations')
            .update({ 
              synced_to_sheets: true,
              synced_at: new Date().toISOString()
            })
            .eq('id', reservation.id)
          
          if (updateError) {
            console.error(`❌ 予約ID${reservation.id}の同期ステータス更新失敗:`, updateError)
            errorCount++
          } else {
            console.log(`✅ 予約ID${reservation.id}をGASに同期完了`)
          }
            
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
    console.error('🚨 未同期予約同期エラー詳細:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown',
      fullError: error
    })
    
    return NextResponse.json(
      { 
        success: false,
        error: '未同期予約データの同期に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}

// GET メソッドも追加（ステータス確認用）
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'GAS同期エンドポイントは正常に動作しています',
    timestamp: new Date().toISOString()
  })
}