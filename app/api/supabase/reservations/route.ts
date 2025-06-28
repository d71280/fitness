import { NextRequest, NextResponse } from 'next/server'
import { reservationsService } from '@/lib/database/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const reservation = await reservationsService.create(body)
    return NextResponse.json(reservation)
  } catch (error) {
    console.error('予約作成エラー:', error)
    return NextResponse.json(
      { error: '予約の作成に失敗しました' },
      { status: 500 }
    )
  }
}