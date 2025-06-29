import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { mockStudios } from '@/lib/mock-data'

// APIルートを動的にして Static Generation エラーを防ぐ
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    try {
      const supabase = createServiceRoleClient()
      
      const { data: studios, error } = await supabase
        .from('studios')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
      
      if (error) throw error
      
      return NextResponse.json(studios)
    } catch (dbError) {
      console.warn('データベース接続エラー、モックデータを使用します:', dbError)
      return NextResponse.json(mockStudios)
    }
  } catch (error) {
    console.error('スタジオ取得エラー:', error)
    return NextResponse.json(
      { error: 'スタジオ取得に失敗しました' },
      { status: 500 }
    )
  }
}