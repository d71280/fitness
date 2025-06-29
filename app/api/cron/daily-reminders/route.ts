import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { LineMessagingClient } from '@/lib/line-messaging'
import { getMessageSettings, processMessageTemplate } from '@/lib/message-templates'

// 毎日のリマインドメッセージ送信
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

    const supabase = await createClient()
    const lineClient = new LineMessagingClient()
    
    // 明日の日付を計算
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0] // YYYY-MM-DD

    console.log(`明日の予約を検索: ${tomorrowStr}`)

    try {
      // 明日の予約を取得
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
        .eq('schedule.date', tomorrowStr)

      if (error) {
        console.error('予約取得エラー:', error)
        throw error
      }

      if (!reservations || reservations.length === 0) {
        console.log('明日の予約はありません')
        return NextResponse.json({ 
          success: true, 
          message: '明日の予約はありません',
          sent: 0 
        })
      }

      console.log(`明日の予約数: ${reservations.length}`)

      let sentCount = 0
      const errors: string[] = []

      // 各予約に対してリマインドメッセージを送信
      for (const reservation of reservations) {
        try {
          const customer = reservation.customer
          const schedule = reservation.schedule

          if (!customer?.line_id) {
            console.warn(`LINE IDがありません - 顧客: ${customer?.name}`)
            continue
          }

          // メッセージデータの準備
          const messageData = {
            date: schedule.date,
            time: `${schedule.start_time} - ${schedule.end_time}`,
            program: schedule.program.name,
            instructor: schedule.instructor.name,
            studio: schedule.studio.name
          }

          // テンプレートメッセージの生成
          const messageText = processMessageTemplate(
            messageSettings.reminder.messageText,
            messageData
          )

          // LINE通知送信
          const lineResult = await lineClient.pushMessage(customer.line_id, {
            type: 'text',
            text: messageText
          })

          if (lineResult.success) {
            sentCount++
            console.log(`リマインド送信成功 - 顧客: ${customer.name}`)
          } else {
            const error = `リマインド送信失敗 - 顧客: ${customer.name}, エラー: ${lineResult.error}`
            console.error(error)
            errors.push(error)
          }

          // API制限を考慮した遅延
          await new Promise(resolve => setTimeout(resolve, 100))

        } catch (error) {
          const errorMsg = `予約ID ${reservation.id} のリマインド送信エラー: ${error}`
          console.error(errorMsg)
          errors.push(errorMsg)
        }
      }

      console.log(`🔔 リマインドメッセージ送信完了 - 送信数: ${sentCount}/${reservations.length}`)

      return NextResponse.json({
        success: true,
        message: 'リマインドメッセージ送信完了',
        sent: sentCount,
        total: reservations.length,
        errors: errors.length > 0 ? errors : undefined
      })

    } catch (dbError) {
      console.warn('Supabase接続エラー、デモモードで応答します:', dbError)
      
      return NextResponse.json({
        success: true,
        message: 'デモモード: データベース接続エラーのため実際の送信は行われませんでした',
        sent: 0,
        demo: true
      })
    }

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