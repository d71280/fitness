// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { SpreadsheetBookingData } from '@/lib/google-sheets'
import { LineMessagingClient } from '@/lib/line-messaging'
import { getMessageSettings, processMessageTemplate } from '@/lib/message-templates'
import { z } from 'zod'

const createReservationSchema = z.object({
  scheduleId: z.number(),
  customerNameKanji: z.string().min(1),
  customerNameKatakana: z.string().min(1),
  lineId: z.string().min(1),
  phone: z.string().min(1),
})

// CORSヘッダー
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Provider-Token',
  'Access-Control-Allow-Credentials': 'true',
}

// プリフライトリクエスト処理
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

// 予約一覧取得
export async function GET(request: NextRequest) {
  try {
    console.log('予約一覧取得 - リクエスト開始')
    const supabase = await createClient()
    console.log('予約一覧取得 - Supabaseクライアント作成成功')
    
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
      .order('created_at', { ascending: false })

    console.log('予約一覧取得 - クエリ実行結果:', { 
      reservationsCount: reservations?.length || 0, 
      error: error?.message,
      sampleReservation: reservations?.[0]
    })

    if (error) {
      console.error('Supabase予約取得エラー:', error)
      throw error
    }

    console.log('予約一覧取得 - 成功:', reservations?.length || 0, '件')
    return NextResponse.json(reservations || [], { headers: corsHeaders })
  } catch (error) {
    console.error('予約一覧取得 - 重大なエラー:', error)
    
    // エラーの詳細情報を返す
    return NextResponse.json(
      { 
        error: '予約データの取得に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: true
      }, 
      { status: 500, headers: corsHeaders }
    )
  }
}

// 新規予約作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId, customerNameKanji, customerNameKatakana, lineId, phone } = createReservationSchema.parse(body)
    
    console.log('予約リクエスト受信:', { scheduleId, customerNameKanji, customerNameKatakana, lineId, phone })

    // Supabase接続を試行
    let supabase
    try {
      supabase = await createClient()
      console.log('Supabase接続成功')
    } catch (connectionError) {
      console.warn('Supabase接続失敗、モックモードで処理します:', connectionError)
      
      // Supabase接続に失敗した場合のモック予約
      const mockReservation = {
        id: Date.now(),
        schedule_id: scheduleId,
        customer_id: Date.now() + 1000,
        status: 'confirmed',
        booking_type: 'advance',
        created_at: new Date().toISOString(),
        schedule: {
          id: scheduleId,
          date: new Date().toISOString().split('T')[0],
          start_time: '10:00',
          end_time: '11:00',
          capacity: 15,
          program: { name: 'ヨガベーシック' },
        },
        customer: {
          id: Date.now() + 1000,
          name: `${customerNameKanji} (${customerNameKatakana})`,
          line_id: lineId,
          phone: phone,
        },
      }

      console.log('モック予約作成:', mockReservation)

      return NextResponse.json({
        success: true,
        reservation: mockReservation,
        message: '予約が完了しました（デモモード）',
        demo_mode: true
      }, { status: 201 })
    }

    try {
      // 顧客を取得または作成
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('line_id', lineId)
        .single()

      let customer
      if (existingCustomer) {
        // 既存顧客の場合は、名前と最終予約日を更新
        const { data: updatedCustomer, error: updateError } = await supabase
          .from('customers')
          .update({
            name: `${customerNameKanji} (${customerNameKatakana})`,
            phone: phone,
            last_booking_date: new Date().toISOString(),
          })
          .eq('line_id', lineId)
          .select()
          .single()

        if (updateError) throw updateError
        customer = updatedCustomer
      } else {
        // 新規顧客作成
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            name: `${customerNameKanji} (${customerNameKatakana})`,
            line_id: lineId,
            phone: phone,
            preferred_programs: [],
            last_booking_date: new Date().toISOString(),
          })
          .select()
          .single()

        if (createError) throw createError
        customer = newCustomer
      }

      // スケジュール情報と空き状況を確認
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedules')
        .select(`
          *,
          program:programs(*),
          reservations!inner(count)
        `)
        .eq('id', scheduleId)
        .eq('reservations.status', 'confirmed')
        .single()

      if (scheduleError) {
        console.error('スケジュール取得エラー:', scheduleError)
        return NextResponse.json(
          { error: 'スケジュールが見つかりません' },
          { status: 404 }
        )
      }

      // 空き状況確認（より簡易的な方法）
      const { count: confirmedReservations } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('schedule_id', scheduleId)
        .eq('status', 'confirmed')

      if (confirmedReservations && confirmedReservations >= schedule.capacity) {
        return NextResponse.json(
          { error: 'このクラスは満席です' },
          { status: 400 }
        )
      }

      // 重複予約チェック
      const { data: existingReservation } = await supabase
        .from('reservations')
        .select('*')
        .eq('schedule_id', scheduleId)
        .eq('customer_id', customer.id)
        .in('status', ['confirmed', 'waiting'])
        .single()

      if (existingReservation) {
        return NextResponse.json(
          { error: '既にこのクラスを予約済みです' },
          { status: 400 }
        )
      }

      // 予約作成
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          schedule_id: scheduleId,
          customer_id: customer.id,
          status: 'confirmed',
          booking_type: 'advance',
        })
        .select(`
          *,
          schedule:schedules(
            *,
            program:programs(*)
          ),
          customer:customers(*)
        `)
        .single()

      if (reservationError) {
        console.error('❌ 予約作成エラー:', reservationError)
        throw reservationError
      }

      console.log('✅ 予約作成が完了しました:', {
        reservationId: reservation.id,
        customerId: reservation.customer_id,
        scheduleId: reservation.schedule_id
      })
      console.log('✅ 予約作成が完了しました。追加処理を開始します。')

      // セッション情報を取得（サーバーサイド）
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      let providerToken = currentSession?.provider_token

      // サーバーサイドでセッションが取得できない場合、リクエストヘッダーから取得
      if (!providerToken) {
        providerToken = request.headers.get('X-Provider-Token') || ''
        console.log('リクエストヘッダーからトークンを取得:', {
          hasHeaderToken: !!providerToken,
          tokenLength: providerToken?.length
        })
      }

      console.log('🔍 メイン処理でのセッション情報:', {
        hasCurrentSession: !!currentSession,
        hasProviderToken: !!providerToken,
        tokenLength: providerToken?.length,
        tokenSource: currentSession?.provider_token ? 'supabase-session' : 'request-header',
        tokenStart: providerToken ? providerToken.substring(0, 20) + '...' : 'none'
      })

      // Google Sheets連携を先に実行（メイン処理内で）
      if (providerToken) {
        try {
          console.log('🔥 === Google Sheets 予約記録開始（メイン処理） ===')
        console.log('🔥 使用するOAuthトークン:', providerToken ? providerToken.substring(0, 20) + '...' : 'none')
          
          // 予約データを準備
          const today = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit', 
            day: '2-digit'
          }).replace(/\//g, '/')
          
          const experienceDate = new Date(schedule.date).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit' 
          }).replace(/\//g, '/')
          
          const customerName = customer.name.split('(')[0].trim()
          const programName = schedule.program?.name || 'プログラム未設定'
          const timeSlot = `${schedule.start_time?.slice(0, 5) || '時間未設定'}-${schedule.end_time?.slice(0, 5) || '時間未設定'}`

          const writeData = [today, customerName, experienceDate, timeSlot, programName]
          
          console.log('🔥 準備された予約データ（メイン処理）:', writeData)
          console.log('🔥 Google Sheets API URL:', `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/B5:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`)

          // Google Sheets APIを直接呼び出し
          const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID || '1fE2aimUZu7yGyswe5rGqu27ohXnYB5pJ37x13bOQ4'
          
          const sheetsResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/B5:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${providerToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                values: [writeData]
              })
            }
          )

          console.log('🔥 Google Sheets API応答（メイン処理）:', {
            status: sheetsResponse.status,
            statusText: sheetsResponse.statusText,
            ok: sheetsResponse.ok,
            url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/B5:append`,
            headers: Object.fromEntries(sheetsResponse.headers.entries())
          })

          if (sheetsResponse.ok) {
            const sheetsResult = await sheetsResponse.json()
            console.log('✅ Google Sheets 予約記録成功（メイン処理）:', sheetsResult)
          } else {
            const errorText = await sheetsResponse.text()
            console.error('❌ Google Sheets 予約記録失敗（メイン処理）:', {
              status: sheetsResponse.status,
              statusText: sheetsResponse.statusText,
              error: errorText
            })
          }
        } catch (sheetsError) {
          console.error('❌ Google Sheets 予約記録エラー（メイン処理）:', {
            error: sheetsError.message,
            stack: sheetsError.stack
          })
        }
      } else {
        console.error('🔥 ❌ Google OAuthトークンがありません。Google Sheets書き込みをスキップします（メイン処理）。')
        console.error('🔥 ❌ セッション情報:', {
          hasSession: !!currentSession,
          hasHeaderToken: !!request.headers.get('X-Provider-Token'),
          headerTokenValue: request.headers.get('X-Provider-Token')?.substring(0, 20) + '...'
        })
      }

      // LINE通知のみ非同期で実行
      Promise.resolve().then(async () => {
        // LINE通知送信（堅牢性向上）
        try {
          console.log('LINE通知処理を開始します...')
          console.log('環境変数チェック:', {
            hasAccessToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
            debugMode: process.env.LINE_DEBUG_MODE,
            nodeEnv: process.env.NODE_ENV
          })
          
          if (customer.line_id) {
            console.log('顧客のLINE ID:', customer.line_id)
            
            // 環境変数の詳細チェック
            const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
            console.log('LINE アクセストークン確認:', {
              hasToken: !!accessToken,
              tokenStart: accessToken?.substring(0, 10),
              isTestToken: accessToken === 'test_token',
              startsWithPlaceholder: accessToken?.startsWith('your_line_channel')
            })
            
            if (!accessToken || accessToken === 'test_token' || accessToken.startsWith('your_line_channel')) {
              console.warn('⚠️ LINE_CHANNEL_ACCESS_TOKEN が正しく設定されていません:', accessToken)
              return // LINE通知をスキップ
            }
            
            try {
              const lineClient = new LineMessagingClient()
              
              // シンプルなメッセージ
              const messageText = `✅ 予約が完了しました！\n\n📅 日時: ${schedule.date} ${schedule.start_time?.slice(0, 5)} - ${schedule.end_time?.slice(0, 5)}\n🏃 プログラム: ${schedule.program.name}\n\nお忘れなくお越しください！`
              
              console.log('送信メッセージ:', messageText)
              
              // LINE通知送信
              const lineResult = await lineClient.pushMessage(customer.line_id, {
                type: 'text',
                text: messageText
              })
              
              if (lineResult.success) {
                console.log('✅ LINE通知送信成功:', lineResult)
              } else {
                console.error('❌ LINE通知送信失敗:', lineResult.error)
              }
            } catch (lineApiError) {
              console.error('❌ LINE API呼び出しエラー:', lineApiError)
            }
          } else {
            console.log('⚠️ 顧客のLINE IDが設定されていません')
          }
        } catch (lineError) {
          console.error('❌ LINE通知処理エラー:', lineError)
        }
      }).catch(error => {
        console.error('❌ 非同期処理でエラーが発生しました:', error)
      })

      return NextResponse.json({
        success: true,
        reservation,
        message: '予約が完了しました'
      }, { status: 201, headers: corsHeaders })

    } catch (dbError) {
      console.warn('Supabase操作エラー、フォールバック処理を実行:', dbError)
      
      // フォールバック応答を返す（スプレッドシート連携は省略）
      return NextResponse.json({
        success: true,
        reservation: {
          id: Date.now(),
          status: 'confirmed',
          booking_type: 'advance',
          created_at: new Date().toISOString(),
          schedule: {
            id: scheduleId,
            program: { name: `スケジュール${scheduleId}のクラス` },
          },
          customer: {
            name: `${customerNameKanji} (${customerNameKatakana})`,
            line_id: lineId,
            phone: phone,
          },
        },
        message: '予約が完了しました（Supabase接続エラー時のフォールバック）',
        debug: {
          dbError: 'Supabase connection failed, using fallback data',
          scheduleId: scheduleId,
          timestamp: new Date().toISOString()
        }
      }, { status: 201 })
    }
  } catch (error) {
    console.error('予約作成エラー:', error)
    return NextResponse.json(
      { error: '予約作成に失敗しました' },
      { status: 500 }
    )
  }
}