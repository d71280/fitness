// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// 同期完了フラグを更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('同期フラグ更新 - 予約ID:', params.id)
    
    const supabase = await createClient()
    
    // 同期フラグを更新
    const { error } = await supabase
      .from('reservations')
      .update({ 
        synced_to_sheets: true,
        synced_at: new Date().toISOString()
      })
      .eq('id', params.id)
    
    if (error) {
      console.error('同期フラグ更新エラー:', error)
      throw error
    }
    
    console.log('✅ 同期フラグ更新成功')
    
    return NextResponse.json({
      success: true,
      message: '同期フラグを更新しました',
      reservationId: params.id
    })
    
  } catch (error) {
    console.error('同期フラグ更新エラー:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '同期フラグの更新に失敗しました'
      }, 
      { status: 500 }
    )
  }
}