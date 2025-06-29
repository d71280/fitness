import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { mockInstructors } from '@/lib/mock-data'

// APIルートを動的にして Static Generation エラーを防ぐ
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    try {
      const supabase = createServiceRoleClient()
      
      const { data: instructors, error } = await supabase
        .from('instructors')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
      
      if (error) throw error
      
      return NextResponse.json(instructors)
    } catch (dbError) {
      console.warn('データベース接続エラー、モックデータを使用します:', dbError)
      return NextResponse.json(mockInstructors)
    }
  } catch (error) {
    console.error('インストラクター取得エラー:', error)
    return NextResponse.json(
      { error: 'インストラクター取得に失敗しました' },
      { status: 500 }
    )
  }
}