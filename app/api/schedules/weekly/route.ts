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

    const supabase = createServiceRoleClient()
    
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select(`
        *,
        program:programs(*),
        instructor:instructors(*),
        studio:studios(*),
        reservations!inner(*)
      `)
      .gte('date', mondayStr)
      .lte('date', sundayStr)
      .eq('reservations.status', 'confirmed')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) throw error

    // 日付別にグループ化
    const schedulesByDate = schedules.reduce((acc, schedule) => {
      const dateKey = schedule.date
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(schedule)
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      weekStart: mondayStr,
      weekEnd: sundayStr,
      schedules: schedulesByDate,
    })
  } catch (error) {
    console.error('週次スケジュール取得エラー:', error)
    return NextResponse.json(
      { error: '週次スケジュール取得に失敗しました' },
      { status: 500 }
    )
  }
}