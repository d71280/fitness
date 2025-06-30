// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { lstepClient } from '@/lib/lstep-client'

// Webhook署名検証
function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature) return false
  
  const secret = process.env.LSTEP_WEBHOOK_SECRET
  if (!secret) {
    console.error('LSTEP_WEBHOOK_SECRET is not set')
    return false
  }
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  
  return hash === signature
}

// メッセージ受信処理
async function handleMessageReceived(event: any) {
  const { user, message } = event
  console.log('メッセージ受信:', { user: user.display_name, text: message.text })
  
  const supabase = createServiceRoleClient()
  
  // キャンセル希望の自動検出
  if (message.text && (message.text.includes('キャンセル') || message.text.includes('取消'))) {
    // 最新の予約を検索
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('line_id', user.line_id)
      .single()
    
    if (customer) {
      const { data: reservations } = await supabase
        .from('reservations')
        .select(`
          *,
          schedule:schedules(
            *,
            program:programs(*),
            instructor:instructors(*),
            studio:studios(*)
          )
        `)
        .eq('customer_id', customer.id)
        .eq('status', 'confirmed')
        .gte('schedules.date', new Date().toISOString().split('T')[0])
        .order('schedules.date', { ascending: true })
        .limit(1)
      
      if (reservations && reservations.length > 0) {
        const reservation = reservations[0]
        
        // キャンセル確認メッセージを送信
        await lstepClient.sendMessage(user.line_id, {
          type: 'template',
          altText: 'キャンセル確認',
          templateContent: {
            type: 'confirm',
            text: `以下の予約をキャンセルしますか？\n\n📅 ${reservation.schedule.date}\n⏰ ${reservation.schedule.start_time}\n🏃 ${reservation.schedule.program.name}`,
            actions: [
              {
                type: 'postback',
                label: 'はい',
                data: `action=cancel&reservation_id=${reservation.id}`
              },
              {
                type: 'postback',
                label: 'いいえ',
                data: 'action=cancel_no'
              }
            ]
          }
        })
      }
    }
  }
  
  // 予約希望の自動検出
  if (message.text && (message.text.includes('予約') || message.text.includes('申込'))) {
    await lstepClient.sendMessage(user.line_id, {
      type: 'text',
      text: '予約をご希望ですね！\n\n以下のリンクから予約画面にアクセスできます👇\nhttps://your-domain.com/booking\n\nまたは、下のリッチメニューから「予約する」をタップしてください😊'
    })
  }
}

// タグ追加処理
async function handleTagAdded(event: any) {
  const { user, tag } = event
  console.log('タグ追加:', { user: user.display_name, tag: tag.name })
  
  const supabase = createServiceRoleClient()
  
  // 顧客情報を更新
  if (tag.name === 'プレミアム会員') {
    const { error } = await supabase
      .from('customers')
      .update({ membership_type: 'premium' })
      .eq('line_id', user.line_id)
    
    if (!error) {
      console.log('会員ランクをプレミアムに更新')
    }
  }
}

// シナリオ完了処理
async function handleScenarioCompleted(event: any) {
  const { user, scenario } = event
  console.log('シナリオ完了:', { user: user.display_name, scenario: scenario.name })
  
  // オンボーディング完了時の処理
  if (scenario.name === 'オンボーディング') {
    const supabase = createServiceRoleClient()
    
    // 初回予約クーポンを送信
    await lstepClient.sendMessage(user.line_id, {
      type: 'text',
      text: '🎉 登録ありがとうございます！\n\n初回予約限定で20%OFFクーポンをプレゼント🎁\nクーポンコード: WELCOME20\n\nぜひお好きなクラスを予約してみてください！'
    })
  }
}

// リッチメニュークリック処理
async function handleRichMenuClicked(event: any) {
  const { user, action } = event
  console.log('リッチメニュークリック:', { user: user.display_name, action })
  
  switch (action) {
    case 'book_class':
      await lstepClient.sendMessage(user.line_id, {
        type: 'text',
        text: '予約画面はこちらです👇\nhttps://your-domain.com/booking\n\nお好きなクラスをお選びください！'
      })
      break
      
    case 'check_schedule':
      // 今週のスケジュールを取得して送信
      const supabase = createServiceRoleClient()
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      
      const { data: schedules } = await supabase
        .from('schedules')
        .select(`
          *,
          program:programs(*),
          instructor:instructors(*),
          studio:studios(*)
        `)
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', nextWeek.toISOString().split('T')[0])
        .order('date')
        .order('start_time')
        .limit(5)
      
      if (schedules && schedules.length > 0) {
        let scheduleText = '📅 今週のスケジュール\n\n'
        schedules.forEach(s => {
          scheduleText += `${s.date} ${s.start_time}\n${s.program.name} - ${s.instructor.name}\n\n`
        })
        
        await lstepClient.sendMessage(user.line_id, {
          type: 'text',
          text: scheduleText
        })
      }
      break
      
    case 'my_page':
      await lstepClient.sendMessage(user.line_id, {
        type: 'text',
        text: 'マイページはこちらです👇\nhttps://your-domain.com/mypage\n\n予約履歴やポイント残高を確認できます！'
      })
      break
      
    case 'contact':
      await lstepClient.sendMessage(user.line_id, {
        type: 'text',
        text: 'お問い合わせありがとうございます。\n\nご質問やご不明点がございましたら、このままメッセージでお送りください。\nスタッフが確認次第、返信させていただきます！'
      })
      break
  }
}

// Postbackアクション処理
async function handlePostback(event: any) {
  const { user, postback } = event
  const params = new URLSearchParams(postback.data)
  const action = params.get('action')
  
  if (action === 'cancel') {
    const reservationId = params.get('reservation_id')
    if (reservationId) {
      const supabase = createServiceRoleClient()
      
      // 予約をキャンセル
      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'LINEからキャンセル'
        })
        .eq('id', parseInt(reservationId))
      
      if (!error) {
        await lstepClient.sendMessage(user.line_id, {
          type: 'text',
          text: '✅ キャンセルが完了しました。\n\nまたのご利用をお待ちしております！'
        })
      } else {
        await lstepClient.sendMessage(user.line_id, {
          type: 'text',
          text: '❌ キャンセル処理中にエラーが発生しました。\n\nお手数ですが、再度お試しいただくか、お電話にてご連絡ください。'
        })
      }
    }
  } else if (action === 'cancel_no') {
    await lstepClient.sendMessage(user.line_id, {
      type: 'text',
      text: '承知いたしました。\n予約はそのまま維持されます。\n\n当日お待ちしております！😊'
    })
  }
}

// メインのWebhookハンドラー
export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.text()
    
    // 署名検証
    const signature = headers().get('x-lstep-signature')
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    // イベントをパース
    const event = JSON.parse(body)
    console.log('Lステップイベント受信:', event.type)
    
    // イベントタイプ別処理
    switch (event.type) {
      case 'message.received':
        await handleMessageReceived(event)
        break
        
      case 'tag.added':
        await handleTagAdded(event)
        break
        
      case 'scenario.completed':
        await handleScenarioCompleted(event)
        break
        
      case 'richmenu.clicked':
        await handleRichMenuClicked(event)
        break
        
      case 'postback':
        await handlePostback(event)
        break
        
      default:
        console.log('未対応のイベントタイプ:', event.type)
    }
    
    // 成功レスポンス
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Webhook処理エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Webhook検証用（Lステップ初回設定時）
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  
  if (mode === 'subscribe' && token === process.env.LSTEP_WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook検証成功')
    return new NextResponse(challenge, { status: 200 })
  }
  
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}