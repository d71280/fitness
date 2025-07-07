// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { LineMessagingClient } from '@/lib/line-messaging'
import { getMessageSettings, getEnabledReminderSchedules, processMessageTemplate } from '@/lib/message-templates'

// 複数タイミングでのリマインドメッセージ送信
export async function GET(request: NextRequest) {
  try {
    console.log('🔔 リマインドメッセージ送信開始')
    
    const messageSettings = getMessageSettings()
    
    if (!messageSettings.reminder.enabled) {
      console.log('リマインド機能が無効です')
      return NextResponse.json({ 
        success: true, 
        message: 'リマインド機能が無効です',
        sent: 0 
      })
    }

    const enabledSchedules = getEnabledReminderSchedules()
    
    console.log('🔍 取得したリマインドスケジュール:', enabledSchedules)
    
    if (enabledSchedules.length === 0) {
      console.log('有効なリマインドスケジュールがありません')
      console.log('📋 メッセージ設定の詳細:', JSON.stringify(messageSettings, null, 2))
      return NextResponse.json({ 
        success: true, 
        message: '有効なリマインドスケジュールがありません',
        sent: 0,
        debug: {
          messageSettings,
          enabledSchedules
        }
      })
    }

    const supabase = await createClient()
    const lineClient = new LineMessagingClient()
    
    let totalSent = 0
    const results: any[] = []
    const errors: string[] = []

    // 各リマインドスケジュールを処理
    for (const schedule of enabledSchedules) {
      try {
        console.log(`📅 ${schedule.name}（${schedule.timingHours}時間前）のリマインド処理開始`)
        
        // 現在時刻を詳細出力（JST基準で計算）
        const now = new Date()
        
        // JST時刻を正確に計算
        const utcTime = now.getTime()
        const jstOffset = 9 * 60 * 60 * 1000 // 9時間をミリ秒に変換
        const jstTime = new Date(utcTime + jstOffset)
        
        console.log(`🕐 UTC時刻: ${now.toISOString()}`)
        console.log(`🕐 JST時刻: ${jstTime.toISOString()}`)
        
        // リマインド対象の日時を計算（JST基準）
        const targetDateTime = new Date(jstTime)
        targetDateTime.setHours(targetDateTime.getHours() + schedule.timingHours)
        
        const targetDate = targetDateTime.toISOString().split('T')[0] // YYYY-MM-DD
        const targetHour = targetDateTime.getHours()
        
        console.log(`🎯 ターゲット日時: ${targetDateTime.toISOString()} (JST: ${targetDateTime.toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})})`)
        console.log(`📅 対象日: ${targetDate}, 対象時間帯: ${targetHour}時台`)

        try {
          // 対象時間帯の予約を取得
          // まずスケジュールを取得してから予約を取得
          // 少し幅を広げて検索（15分前後の余裕を持たせる）
          const startHour = Math.max(0, targetHour - 1)
          const endHour = Math.min(23, targetHour + 1)
          
          const { data: schedules, error: scheduleError } = await supabase
            .from('schedules')
            .select('id, date, start_time')
            .eq('date', targetDate)
            .gte('start_time', `${startHour.toString().padStart(2, '0')}:00:00`)
            .lt('start_time', `${(endHour + 1).toString().padStart(2, '0')}:00:00`)
          
          console.log(`🔍 検索範囲を拡大: ${startHour}:00 - ${endHour + 1}:00`)

          if (scheduleError) {
            console.error('スケジュール取得エラー:', {
              error: scheduleError,
              targetDate,
              targetHour,
              query: {
                date: targetDate,
                start_time_gte: `${targetHour.toString().padStart(2, '0')}:00:00`,
                start_time_lt: `${(targetHour + 1).toString().padStart(2, '0')}:00:00`
              }
            })
            throw scheduleError
          }

          const scheduleIds = schedules?.map(s => s.id) || []
          console.log(`📅 対象スケジュールID: ${scheduleIds.join(', ')}`)

          if (scheduleIds.length === 0) {
            console.log('対象時間帯のスケジュールがありません')
            continue
          }

          const { data: reservations, error } = await supabase
            .from('reservations')
            .select(`
              *,
              schedule:schedules(
                *,
                program:programs(*),
                instructor:instructors(*),
                studio:studios(*)
              ),
              customer:customers(*)
            `)
            .eq('status', 'confirmed')
            .in('schedule_id', scheduleIds)

          console.log(`🔍 データベースクエリ実行完了`)
          console.log(`   - 対象日: ${targetDate}`)
          console.log(`   - 開始時間範囲: ${targetHour.toString().padStart(2, '0')}:00:00 以上`)
          console.log(`   - 終了時間範囲: ${(targetHour + 1).toString().padStart(2, '0')}:00:00 未満`)

          if (error) {
            console.error('予約取得エラー:', {
              error: error,
              scheduleIds: scheduleIds,
              query: {
                status: 'confirmed',
                schedule_id_in: scheduleIds
              }
            })
            throw error
          }

          console.log(`📊 クエリ結果: ${reservations?.length || 0}件の予約`)
          if (reservations && reservations.length > 0) {
            reservations.forEach((res, index) => {
              console.log(`   ${index + 1}. 予約ID: ${res.id}, 顧客: ${res.customer?.name}, スケジュール: ${res.schedule?.date} ${res.schedule?.start_time}, LINE ID: ${res.customer?.line_id}`)
            })
          }

          if (!reservations || reservations.length === 0) {
            console.log(`${schedule.name}: 対象の予約はありません`)
            continue
          }

          console.log(`${schedule.name}: 対象予約数 ${reservations.length}`)

          let scheduleSeenCount = 0

          // 各予約に対してリマインドメッセージを送信
          for (const reservation of reservations) {
            try {
              const customer = reservation.customer
              const scheduleData = reservation.schedule

              if (!customer?.line_id) {
                console.warn(`LINE IDがありません - 顧客: ${customer?.name}`)
                continue
              }

              // 重複送信防止のチェック（同じ予約に対して同じタイプのリマインドを1日に1回まで）
              const today = new Date().toISOString().split('T')[0]
              const checkKey = `${schedule.id}_${reservation.id}_${today}`
              
              // Supabaseでの重複チェック（notification_logsテーブルを使用）
              const { data: existingLog } = await supabase
                .from('notification_logs')
                .select('id')
                .eq('reservation_id', reservation.id)
                .eq('reminder_type', schedule.id)
                .eq('sent_date', today)
                .single()
              
              if (existingLog) {
                console.log(`⏭️ 重複送信をスキップ - 予約ID: ${reservation.id}, リマインダー: ${schedule.name}`)
                continue
              }

              // メッセージデータの準備
              const messageData = {
                date: scheduleData.date,
                time: `${scheduleData.start_time.slice(0, 5)} - ${scheduleData.end_time.slice(0, 5)}`,
                program: scheduleData.program.name,
                instructor: scheduleData.instructor.name,
                studio: scheduleData.studio.name
              }

              // テンプレートメッセージの生成
              const messageText = processMessageTemplate(
                schedule.messageTemplate,
                messageData
              )

              // LINE通知送信
              const lineResult = await lineClient.pushMessage(customer.line_id, {
                type: 'text',
                text: messageText
              })

              if (lineResult.success) {
                scheduleSeenCount++
                totalSent++
                console.log(`${schedule.name} リマインド送信成功 - 顧客: ${customer.name}`)
                
                // 送信ログを記録（重複防止のため）
                await supabase
                  .from('notification_logs')
                  .insert({
                    reservation_id: reservation.id,
                    customer_id: customer.id,
                    reminder_type: schedule.id,
                    sent_date: today,
                    message_content: messageText,
                    status: 'sent'
                  })
              } else {
                const error = `${schedule.name} リマインド送信失敗 - 顧客: ${customer.name}, エラー: ${lineResult.error}`
                console.error(error)
                errors.push(error)
              }

              // API制限を考慮した遅延
              await new Promise(resolve => setTimeout(resolve, 100))

            } catch (error) {
              const errorMsg = `予約ID ${reservation.id} の${schedule.name}リマインド送信エラー: ${error}`
              console.error(errorMsg)
              errors.push(errorMsg)
            }
          }

          results.push({
            scheduleId: schedule.id,
            scheduleName: schedule.name,
            timingHours: schedule.timingHours,
            sent: scheduleSeenCount,
            total: reservations.length
          })

        } catch (dbError) {
          console.warn(`${schedule.name}: Supabase接続エラー`, dbError)
          results.push({
            scheduleId: schedule.id,
            scheduleName: schedule.name,
            timingHours: schedule.timingHours,
            error: 'データベース接続エラー',
            sent: 0
          })
        }

      } catch (error) {
        const errorMsg = `${schedule.name}の処理でエラー: ${error}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    console.log(`🔔 リマインドメッセージ送信完了 - 合計送信数: ${totalSent}`)

    return NextResponse.json({
      success: true,
      message: 'リマインドメッセージ送信完了',
      totalSent: totalSent,
      results: results,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('リマインドメッセージ送信エラー:', error)
    
    return NextResponse.json({
      success: false,
      error: 'リマインドメッセージ送信に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// 手動実行用のPOSTエンドポイント
export async function POST(request: NextRequest) {
  // 認証チェック（必要に応じて追加）
  
  return GET(request)
} 