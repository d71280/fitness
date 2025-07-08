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
            textMessage: '無料体験ご予約が完了しました！\n\n【予約内容】\n日程：{date}, {time}\nプログラム：{program}\n\n\n【持ち物】\n・汗拭きタオル\n・バスタオル（シャワーあり）\n・運動シューズ（室内用）\n・運動できる服装または着替え\n・飲み物（自販機あり）\n※一式レンタル（550円）も可能です。\n\n【変更・キャンセル】\n電話番号：011-200-9154\n\n当日、レッスン開始30分前にお越し下さい😊\n\n当日お会いできることを楽しみにしております！',
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
            schedules: [
              {
                id: '5d',
                name: '5日前',
                enabled: true,
                hoursBefore: 120,
                messageText: '【5日後のレッスンのご案内】\n\n{program}\n📅 {date}\n⏰ {time}\n👨‍🏫 {instructor}\n\n5日後にレッスンがございます。スケジュールの確認をお願いします📝\nキャンセルをご希望の場合はお早めにご連絡ください。'
              },
              {
                id: '3d',
                name: '3日前',
                enabled: true,
                hoursBefore: 72,
                messageText: 'ご予約の3日前となりました！\n\n【予約内容】\n日程：{date}, {time}\nプログラム：{program}\n\n\n【持ち物】\n・汗拭きタオル\n・バスタオル（シャワーあり）\n・運動シューズ（室内用）\n・運動できる服装または着替え\n・飲み物（自販機あり）\n※一式レンタル（550円）も可能です。\n\n【変更・キャンセル】\n電話番号：011-200-9154\n\n当日、レッスン開始30分前にお越し下さい😊\n\n当日お会いできることを楽しみにしております！'
              },
              {
                id: '1d',
                name: '1日前',
                enabled: true,
                hoursBefore: 24,
                messageText: 'ご予約の1日前となりました！\n\n【予約内容】\n日程：{date}, {time}\nプログラム：{program}\n\n\n【持ち物】\n・汗拭きタオル\n・バスタオル（シャワーあり）\n・運動シューズ（室内用）\n・運動できる服装または着替え\n・飲み物（自販機あり）\n※一式レンタル（550円）も可能です。\n\n【変更・キャンセル】\n電話番号：011-200-9154\n\n当日、レッスン開始30分前にお越し下さい😊\n\n当日お会いできることを楽しみにしております！'
              }
            ],
            customSchedules: []
          },
          cancellation: {
            enabled: true,
            messageText: 'ご予約をキャンセルしました。\n\nまたのご利用をお待ちしております。'
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