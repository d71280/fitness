import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// 繰り返しスケジュールグループ削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const groupId = params.groupId
    
    if (!groupId) {
      return NextResponse.json(
        { error: '無効なグループIDです' },
        { status: 400 }
      )
    }

    console.log('Deleting recurring schedule group:', groupId)

    const supabase = createServiceRoleClient()

    // まず該当する繰り返しスケジュールをすべて取得
    const { data: schedules, error: fetchError } = await supabase
      .from('schedules')
      .select('id')
      .eq('recurring_group_id', groupId)

    if (fetchError) {
      console.error('Error fetching schedules to delete:', fetchError)
      throw fetchError
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json(
        { error: '該当する繰り返しスケジュールが見つかりません' },
        { status: 404 }
      )
    }

    console.log(`Found ${schedules.length} schedules to delete`)

    // 関連する予約をすべて削除
    const scheduleIds = schedules.map(s => s.id)
    const { error: reservationsError } = await supabase
      .from('reservations')
      .delete()
      .in('schedule_id', scheduleIds)

    if (reservationsError) {
      console.error('Error deleting reservations:', reservationsError)
      // 予約削除エラーは警告のみ（予約がない場合もある）
    }

    // 繰り返しスケジュールグループをすべて削除
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('recurring_group_id', groupId)

    if (deleteError) {
      console.error('Error deleting recurring schedules:', deleteError)
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: `繰り返しスケジュールグループ（${schedules.length}個のスケジュール）を削除しました`,
      deletedCount: schedules.length
    })

  } catch (error) {
    console.error('繰り返しスケジュール削除エラー:', error)
    return NextResponse.json(
      { 
        error: '繰り返しスケジュールの削除に失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}