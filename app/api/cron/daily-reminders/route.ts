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
        
        // 現在時刻を詳細出力
        const now = new Date()
        console.log(`🕐 現在時刻: ${now.toISOString()} (JST: ${now.toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})})`)
        
        // リマインド対象の日時を計算
        const targetDateTime = new Date()
        targetDateTime.setHours(targetDateTime.getHours() + schedule.timingHours)
        
        const targetDate = targetDateTime.toISOString().split('T')[0] // YYYY-MM-DD
        const targetHour = targetDateTime.getHours()
        
        console.log(`🎯 ターゲット日時: ${targetDateTime.toISOString()} (JST: ${targetDateTime.toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})})`)
        console.log(`📅 対象日: ${targetDate}, 対象時間帯: ${targetHour}時台`)

        try {
          // 対象時間帯の予約を取得
          // まずスケジュールを取得してから予約を取得
          const { data: schedules, error: scheduleError } = await supabase
            .from('schedules')
            .select('id')
            .eq('date', targetDate)
            .gte('start_time', `${targetHour.toString().padStart(2, '0')}:00:00`)
            .lt('start_time', `${(targetHour + 1).toString().padStart(2, '0')}:00:00`)

          if (scheduleError) {
            console.error('スケジュール取得エラー:', scheduleError)
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
            console.error('予約取得エラー:', error)
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
              const checkKey = `reminder_${schedule.id}_${reservation.id}_${today}`
              
              // TODO: 実際のプロダクションでは Redis や データベースでの重複チェックを実装
              // 現在は簡易的に処理をスキップ

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