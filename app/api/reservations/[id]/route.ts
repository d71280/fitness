import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateReservationSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  booking_type: z.enum(['advance', 'walk_in']).optional(),
  cancellation_reason: z.string().nullable().optional(),
})

// 予約更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateReservationSchema.parse(body)
    const reservationId = parseInt(params.id)

    if (isNaN(reservationId)) {
      return NextResponse.json(
        { error: '無効な予約IDです' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    const { data: reservation, error } = await supabase
      .from('reservations')
      .update({
        status: data.status,
        booking_type: data.booking_type,
        cancellation_reason: data.cancellation_reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId)
      .select()
      .single()

    if (error) {
      console.error('予約更新エラー:', error)
      return NextResponse.json(
        { error: '予約の更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reservation })
  } catch (error) {
    console.error('予約更新エラー:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'リクエストデータが無効です', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: '予約の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// 予約削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = parseInt(params.id)

    if (isNaN(reservationId)) {
      return NextResponse.json(
        { error: '無効な予約IDです' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // 予約が存在するかチェック
    const { data: existingReservation, error: checkError } = await supabase
      .from('reservations')
      .select('id')
      .eq('id', reservationId)
      .single()

    if (checkError || !existingReservation) {
      return NextResponse.json(
        { error: '予約が見つかりません' },
        { status: 404 }
      )
    }

    // 予約削除
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservationId)

    if (error) {
      console.error('予約削除エラー:', error)
      return NextResponse.json(
        { error: '予約の削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: '予約を削除しました' })
  } catch (error) {
    console.error('予約削除エラー:', error)
    return NextResponse.json(
      { error: '予約の削除に失敗しました' },
      { status: 500 }
    )
  }
} 