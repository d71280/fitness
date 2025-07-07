import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { lstepClient } from '@/lib/lstep-client'

export const dynamic = 'force-dynamic'

interface CalendarBooking {
  id: string
  customerName: string
  lineId?: string
  date: string
  startTime: string
  endTime: string
  program: string
  instructor: string
  studio: string
  phone?: string
  email?: string
}

// Google CalendarからLstepへの予約データ連携
export async function POST(request: NextRequest) {
  try {
    console.log('📅 Calendar to Lstep 連携開始')
    
    const body = await request.json()
    const { bookings, source = 'calendar', dryRun = false } = body

    if (!bookings || !Array.isArray(bookings)) {
      return NextResponse.json({
        success: false,
        error: 'bookings配列が必要です'
      }, { status: 400 })
    }

    const supabase = await createClient()
    const results = []
    const errors = []

    for (const booking of bookings) {
      try {
        console.log(`📋 予約処理開始: ${booking.customerName}`)
        
        // バリデーション
        if (!booking.customerName || !booking.date || !booking.program) {
          errors.push(`必須フィールドが不足: ${booking.id || 'unknown'}`)
          continue
        }

        // LINE IDが提供されていない場合は顧客データベースから検索
        let lineId = booking.lineId
        if (!lineId && (booking.phone || booking.email)) {
          const { data: customer } = await supabase
            .from('customers')
            .select('line_id')
            .or(`phone.eq.${booking.phone},email.eq.${booking.email}`)
            .single()
          
          lineId = customer?.line_id
        }

        if (!lineId) {
          console.warn(`⚠️ LINE IDが見つかりません: ${booking.customerName}`)
          results.push({
            booking: booking.id,
            status: 'skipped',
            reason: 'LINE ID not found'
          })
          continue
        }

        if (dryRun) {
          console.log(`🧪 DryRun モード: ${booking.customerName} (LINE: ${lineId})`)
          results.push({
            booking: booking.id,
            status: 'dry_run',
            lineId: lineId
          })
          continue
        }

        // Lstep連携データの準備
        const bookingData = {
          customerName: booking.customerName,
          date: booking.date,
          time: `${booking.startTime} - ${booking.endTime}`,
          program: booking.program,
          instructor: booking.instructor,
          studio: booking.studio,
          reservationId: parseInt(booking.id) || Date.now()
        }

        // Lstep経由で予約完了メッセージ送信
        const lstepResult = await lstepClient.sendBookingConfirmation(lineId, bookingData)

        if (lstepResult.success) {
          console.log(`✅ Lstep送信成功: ${booking.customerName}`)
          
          // 連携ログをデータベースに記録
          await supabase
            .from('notification_logs')
            .insert({
              customer_id: null, // カレンダーからの場合は不明
              reservation_id: booking.id,
              reminder_type: 'calendar_lstep',
              sent_date: new Date().toISOString().split('T')[0],
              message_content: `Calendar to Lstep: ${booking.program}`,
              status: 'sent',
              line_id: lineId
            })

          results.push({
            booking: booking.id,
            status: 'success',
            messageId: lstepResult.messageId,
            lineId: lineId
          })
        } else {
          console.error(`❌ Lstep送信失敗: ${booking.customerName}`, lstepResult.error)
          errors.push(`Lstep送信失敗 (${booking.customerName}): ${lstepResult.error}`)
          
          results.push({
            booking: booking.id,
            status: 'failed',
            error: lstepResult.error,
            lineId: lineId
          })
        }

        // API制限を考慮した遅延
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        console.error(`❌ 予約処理エラー: ${booking.customerName || booking.id}`, error)
        errors.push(`予約処理エラー (${booking.customerName || booking.id}): ${error}`)
        
        results.push({
          booking: booking.id,
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    const summary = {
      total: bookings.length,
      success: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length
    }

    console.log('📊 Calendar to Lstep 連携完了:', summary)

    return NextResponse.json({
      success: true,
      message: 'Calendar to Lstep 連携完了',
      summary,
      results,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Calendar to Lstep 連携エラー:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Calendar to Lstep 連携に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// 連携状況の確認
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 最近の連携ログを取得
    const { data: recentLogs } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('reminder_type', 'calendar_lstep')
      .order('created_at', { ascending: false })
      .limit(50)

    // Lstepのヘルスチェック
    const lstepHealthy = await lstepClient.healthCheck()

    return NextResponse.json({
      success: true,
      lstepStatus: lstepHealthy ? 'healthy' : 'unhealthy',
      recentSyncs: recentLogs?.length || 0,
      lastSync: recentLogs?.[0]?.created_at || null,
      logs: recentLogs
    })

  } catch (error) {
    console.error('Calendar to Lstep 状況確認エラー:', error)
    
    return NextResponse.json({
      success: false,
      error: '状況確認に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}