import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// APIルートを動的にして Static Generation エラーを防ぐ
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    console.log('週次スケジュール取得中:', { date })

    // その週の月曜日を計算
    const targetDate = new Date(date)
    const dayOfWeek = targetDate.getDay()
    const monday = new Date(targetDate)
    monday.setDate(targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
    
    // その週の日曜日を計算
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const mondayStr = monday.toISOString().split('T')[0]
    const sundayStr = sunday.toISOString().split('T')[0]

    console.log('週間範囲:', { mondayStr, sundayStr })

    try {
      const supabase = createServiceRoleClient()
      
      // 予約がないスケジュールも表示するため、外部結合に変更
      const { data: schedules, error } = await supabase
        .from('schedules')
        .select(`
          *,
          program:programs(*),
          instructor:instructors(*),
          studio:studios(*),
          reservations(
            *,
            customer:customers(*)
          )
        `)
        .gte('date', mondayStr)
        .lte('date', sundayStr)
        .eq('is_cancelled', false)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error

      console.log('取得されたスケジュール数:', schedules?.length)

      // 日付別にグループ化
      const schedulesByDate = schedules.reduce((acc, schedule) => {
        const dateKey = schedule.date
        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        
        // 確定済み予約のみカウント
        const confirmedReservations = schedule.reservations?.filter(
          (reservation: any) => reservation.status === 'confirmed'
        ) || []
        
        // スケジュール情報を整形
        const formattedSchedule = {
          ...schedule,
          currentBookings: confirmedReservations.length,
          availableSlots: schedule.capacity - confirmedReservations.length,
          reservations: confirmedReservations
        }
        
        acc[dateKey].push(formattedSchedule)
        return acc
      }, {} as Record<string, any[]>)

      return NextResponse.json({
        weekStart: mondayStr,
        weekEnd: sundayStr,
        schedules: schedulesByDate,
      })
    } catch (dbError) {
      console.warn('データベース接続エラー、モックデータを返します:', dbError)
      
      // モックスケジュールデータを生成
      const mockSchedules: Record<string, any[]> = {}
      
      // 週の各日にサンプルスケジュールを追加
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(monday)
        currentDate.setDate(monday.getDate() + i)
        const dateKey = currentDate.toISOString().split('T')[0]
        
        // 平日のみスケジュールを生成（土日は空）
        if (i < 5) {
          mockSchedules[dateKey] = [
            {
              id: i * 10 + 1,
              date: dateKey,
              start_time: '10:00:00',
              end_time: '11:00:00',
              capacity: 20,
              is_cancelled: false,
              program: {
                id: 1,
                name: 'ヨガベーシック',
                color_class: 'bg-green-500',
                text_color_class: 'text-white'
              },
              instructor: {
                id: 1,
                name: '山田太郎'
              },
              studio: {
                id: 1,
                name: 'スタジオA'
              },
              currentBookings: 5,
              availableSlots: 15,
              reservations: []
            },
            {
              id: i * 10 + 2,
              date: dateKey,
              start_time: '14:00:00',
              end_time: '15:00:00',
              capacity: 15,
              is_cancelled: false,
              program: {
                id: 2,
                name: 'HIIT',
                color_class: 'bg-red-500',
                text_color_class: 'text-white'
              },
              instructor: {
                id: 2,
                name: '鈴木花子'
              },
              studio: {
                id: 2,
                name: 'スタジオB'
              },
              currentBookings: 8,
              availableSlots: 7,
              reservations: []
            }
          ]
        }
      }

      return NextResponse.json({
        weekStart: mondayStr,
        weekEnd: sundayStr,
        schedules: mockSchedules,
        _mock: true
      })
    }
  } catch (error) {
    console.error('週次スケジュール取得エラー:', error)
    return NextResponse.json(
      { error: '週次スケジュール取得に失敗しました' },
      { status: 500 }
    )
  }
}