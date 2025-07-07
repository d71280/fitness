// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { LineMessagingClient } from '@/lib/line-messaging'
import { getMessageSettings, processMessageTemplate } from '@/lib/message-templates'

// リマインダーメッセージのテスト送信
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reservationId, hoursBeforeClass = 24 } = body
    
    console.log('🧪 リマインダーテスト開始')
    console.log(`予約ID: ${reservationId}, テストタイミング: ${hoursBeforeClass}時間前`)
    
    // メッセージ設定を取得
    const messageSettings = getMessageSettings()
    
    if (!messageSettings.reminder.enabled) {
      return NextResponse.json({
        success: false,
        message: 'リマインド機能が無効になっています。管理画面で有効にしてください。'
      }, { status: 400 })
    }
    
    // 指定されたタイミングのリマインドスケジュールを探す
    const reminderSchedule = messageSettings.reminder.schedules.find(
      s => s.timingHours === hoursBeforeClass && s.enabled
    )
    
    if (!reminderSchedule) {
      return NextResponse.json({
        success: false,
        message: `${hoursBeforeClass}時間前のリマインドは設定されていないか無効です`
      }, { status: 400 })
    }
    
    const supabase = await createClient()
    const lineClient = new LineMessagingClient()
    
    // 予約情報を取得
    if (!reservationId) {
      return NextResponse.json({
        success: false,
        message: '予約IDが指定されていません'
      }, { status: 400 })
    }
    
    const { data: reservation, error } = await supabase
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
      .eq('id', reservationId)
      .single()
    
    if (error || !reservation) {
      console.error('予約取得エラー:', error)
      return NextResponse.json({
        success: false,
        message: '予約が見つかりません',
        error: error?.message
      }, { status: 404 })
    }
    
    const customer = reservation.customer
    const schedule = reservation.schedule
    
    console.log('顧客データ:', customer)
    console.log('顧客LINE ID:', customer?.line_id)
    
    if (!customer?.line_id) {
      console.error('LINE IDが見つかりません。顧客データ:', customer)
      return NextResponse.json({
        success: false,
        message: 'お客様のLINE IDが登録されていません',
        debug: {
          customerId: customer?.id,
          customerName: customer?.name || customer?.name_kanji,
          lineId: customer?.line_id
        }
      }, { status: 400 })
    }
    
    // メッセージデータの準備
    const messageData = {
      date: schedule.date,
      time: `${schedule.start_time.slice(0, 5)} - ${schedule.end_time.slice(0, 5)}`,
      program: schedule.program.name,
      instructor: schedule.instructor?.name || '未定',
      studio: schedule.studio?.name || 'スタジオ'
    }
    
    // テンプレートメッセージの生成
    const messageText = processMessageTemplate(
      reminderSchedule.messageTemplate,
      messageData
    )
    
    console.log('📨 送信するメッセージ:')
    console.log(messageText)
    console.log(`送信先LINE ID: ${customer.line_id}`)
    
    // LINE通知送信
    const lineResult = await lineClient.pushMessage(customer.line_id, {
      type: 'text',
      text: messageText
    })
    
    if (lineResult.success) {
      console.log('✅ リマインダーテスト送信成功')
      return NextResponse.json({
        success: true,
        message: 'リマインダーメッセージを送信しました',
        details: {
          customerName: customer.name || customer.name_kanji,
          scheduleName: `${schedule.date} ${schedule.program.name}`,
          timing: `${hoursBeforeClass}時間前`,
          messagePreview: messageText.substring(0, 100) + '...'
        }
      })
    } else {
      console.error('❌ リマインダーテスト送信失敗:', lineResult.error)
      return NextResponse.json({
        success: false,
        message: 'メッセージ送信に失敗しました',
        error: lineResult.error
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('リマインダーテストエラー:', error)
    return NextResponse.json({
      success: false,
      message: 'リマインダーテスト中にエラーが発生しました',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// テスト用GETエンドポイント（最新の予約を自動的に使用）
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 最新の確認済み予約を取得
    const { data: latestReservation, error } = await supabase
      .from('reservations')
      .select('id, customer:customers(name), schedule:schedules(date, program:programs(name))')
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error || !latestReservation) {
      return NextResponse.json({
        success: false,
        message: 'テスト可能な予約が見つかりません'
      }, { status: 404 })
    }
    
    // 最新の予約でテスト実行
    const testRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reservationId: latestReservation.id,
        hoursBeforeClass: 24 // デフォルトは24時間前
      })
    })
    
    const result = await POST(testRequest)
    let resultData
    try {
      resultData = await result.json()
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        message: 'テスト実行中にレスポンス解析エラーが発生しました',
        error: parseError instanceof Error ? parseError.message : String(parseError)
      }, { status: 500 })
    }
    
    return NextResponse.json({
      ...resultData,
      testInfo: {
        message: '最新の予約を使用してテストを実行しました',
        reservation: {
          id: latestReservation.id,
          customer: latestReservation.customer?.name,
          schedule: `${latestReservation.schedule?.date} ${latestReservation.schedule?.program?.name}`
        }
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'テスト実行中にエラーが発生しました',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}