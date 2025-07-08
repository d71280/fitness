// @ts-nocheck
'use client'
// @ts-nocheck

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { usePrograms } from '@/hooks/usePrograms'
import { RecurringOptions } from './recurring-options'

import { Schedule, UpdateScheduleData } from '@/types/api'

interface EditScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  schedule: Schedule | null
  onSubmit: (data: UpdateScheduleData) => Promise<void>
  onDelete?: (scheduleId: number) => Promise<void>
}

export function EditScheduleModal({ 
  isOpen, 
  onClose, 
  schedule, 
  onSubmit,
  onDelete 
}: EditScheduleModalProps) {
  const { programs } = usePrograms()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    programId: '',
    repeat: 'none' as 'none' | 'weekly' | 'monthly',
    repeatEndDate: '',
    repeatCount: undefined as number | undefined,
  })

  // スケジュールデータを編集フォームに設定
  useEffect(() => {
    console.log('EditScheduleModal useEffect - schedule:', schedule)
    if (schedule) {
      const startTime = schedule.startTime || ''
      const endTime = schedule.endTime || ''
      
      console.log('Setting form data with:', {
        date: schedule.date,
        startTime: startTime.substring(0, 5),
        endTime: endTime.substring(0, 5),
        programId: schedule.programId?.toString() || '',
      })
      
      setFormData({
        date: schedule.date,
        startTime: startTime.substring(0, 5), // HH:MM形式に変換
        endTime: endTime.substring(0, 5), // HH:MM形式に変換
        programId: schedule.programId?.toString() || '',
        repeat: 'none',
        repeatEndDate: '',
        repeatCount: undefined,
      })
    } else {
      console.log('EditScheduleModal - no schedule provided')
    }
  }, [schedule])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schedule) return

    // バリデーション
    if (!formData.programId) {
      alert('プログラムを選択してください')
      return
    }

    if (!formData.startTime || !formData.endTime) {
      alert('開始時間と終了時間を入力してください')
      return
    }
    if (formData.startTime >= formData.endTime) {
      alert('終了時間は開始時間より後に設定してください')
      return
    }

    try {
      setLoading(true)
      await onSubmit({
        id: schedule.id,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        programId: parseInt(formData.programId),
        capacity: 20, // 固定値
        repeat: formData.repeat,
        repeatEndDate: formData.repeatEndDate || undefined,
        repeatCount: formData.repeatCount
      })
      onClose()
    } catch (error) {
      console.error('スケジュール更新エラー:', error)
      const errorMessage = error instanceof Error ? error.message : 'スケジュール更新に失敗しました'
      alert(`エラー: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!schedule || !onDelete) return
    
    console.log('handleDelete called - schedule:', schedule)
    console.log('Schedule ID:', schedule.id, 'Type:', typeof schedule.id)
    
    if (confirm('このスケジュールを削除しますか？\n※既存の予約も削除されます。')) {
      try {
        setLoading(true)
        await onDelete(schedule.id)
        onClose()
      } catch (error) {
        console.error('スケジュール削除エラー:', error)
        const errorMessage = error instanceof Error ? error.message : 'スケジュール削除に失敗しました'
        alert(`エラー: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }
  }

  if (!schedule) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="スケジュール編集"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 基本情報 */}
        <div>
          <Label htmlFor="date">日付</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            required
          />
        </div>

        {/* 時間設定 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startTime">開始時間</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="endTime">終了時間</Label>
            <Input
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              required
            />
          </div>
        </div>

        {/* プログラム・インストラクター・スタジオ */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="programId">プログラム</Label>
            <select
              id="programId"
              value={formData.programId}
              onChange={(e) => setFormData(prev => ({ ...prev, programId: e.target.value }))}
              required
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">プログラムを選択</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id.toString()}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>



        </div>

        {/* 繰り返し設定 */}
        <RecurringOptions 
          formData={formData}
          onChange={(field, value) => {
            setFormData(prev => ({ ...prev, [field]: value }))
          }}
        />

        {/* 操作ボタン */}
        <div className="flex justify-between pt-4">
          <div>
            {onDelete && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={loading}
              >
                スケジュール削除
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '更新中...' : 'スケジュール更新'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
} 