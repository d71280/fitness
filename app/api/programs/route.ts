import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { mockPrograms } from '@/lib/mock-data'

// APIルートを動的にして Static Generation エラーを防ぐ
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    try {
      const supabase = createServiceRoleClient()
      
      const { data: programs, error } = await supabase
        .from('programs')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
      
      if (error) throw error
      
      return NextResponse.json(programs)
    } catch (dbError) {
      console.warn('データベース接続エラー、モックデータを使用します:', dbError)
      return NextResponse.json(mockPrograms)
    }
  } catch (error) {
    console.error('プログラム取得エラー:', error)
    return NextResponse.json(
      { error: 'プログラム取得に失敗しました' },
      { status: 500 }
    )
  }
}