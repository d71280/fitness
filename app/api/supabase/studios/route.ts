import { NextRequest, NextResponse } from 'next/server'
import { studiosService } from '@/lib/database/supabase-client'

export async function GET() {
  try {
    const studios = await studiosService.getAll()
    return NextResponse.json(studios)
  } catch (error) {
    console.error('スタジオ取得エラー:', error)
    return NextResponse.json(
      { error: 'スタジオの取得に失敗しました' },
      { status: 500 }
    )
  }
}