import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST() {
  try {
    const supabase = createClient()
    
    // 設定を直接更新
    const { data, error } = await supabase
      .from('app_settings')
      .upsert({
        id: 'default',
        message_settings: {
          bookingConfirmation: {
            enabled: true,
            messageType: 'flex',
            textMessage: 'こんばんは！よろしくお願いします！',
            includeDetails: {
              date: true,
              time: true,
              program: true,
              instructor: true,
              studio: false,
              capacity: false
            },
            customFields: ''
          },
          reminder: {
            enabled: true,
            schedules: [{
              id: '1d',
              name: '1日前',
              enabled: true,
              hoursBefore: 24,
              messageText: '明日のレッスンのお知らせ'
            }],
            customSchedules: []
          },
          cancellation: {
            enabled: true,
            messageText: 'ご予約をキャンセルしました。'
          }
        },
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('データベース更新エラー:', error)
      return NextResponse.json({ success: false, error: error.message })
    }

    console.log('データベース更新成功:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('処理エラー:', error)
    return NextResponse.json({ success: false, error: error.message })
  }
}