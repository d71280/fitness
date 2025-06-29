'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { usePrograms } from '@/hooks/usePrograms'
import { useInstructors } from '@/hooks/useInstructors'
import { useStudios } from '@/hooks/useStudios'
import { Schedule, UpdateScheduleData } from '@/types/api'
import { X } from 'lucide-react'

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
  const { instructors } = useInstructors()
  const { studios } = useStudios()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    programId: '',
    instructorId: '',
    studioId: '',
    capacity: 20
  })

  // スケジュールデータを編集フォームに設定
  useEffect(() => {
    if (schedule) {
      const startTime = schedule.startTime || (schedule as any).start_time || ''
      const endTime = schedule.endTime || (schedule as any).end_time || ''
      
      setFormData({
        date: schedule.date,
        startTime: startTime.substring(0, 5), // HH:MM形式に変換
        endTime: endTime.substring(0, 5), // HH:MM形式に変換
        programId: schedule.programId?.toString() || '',
        instructorId: schedule.instructorId?.toString() || '',
        studioId: schedule.studioId?.toString() || '',
        capacity: schedule.capacity || 20
      })
    }
  }, [schedule])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schedule) return

    try {
      setLoading(true)
      await onSubmit({
        id: schedule.id,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        programId: parseInt(formData.programId),
        instructorId: parseInt(formData.instructorId),
        studioId: parseInt(formData.studioId),
        capacity: formData.capacity
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
        <div className="grid grid-cols-2 gap-4">
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
          
          <div>
            <Label htmlFor="capacity">定員</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              max="100"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
              required
            />
          </div>
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
            <Select
              value={formData.programId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, programId: value }))}
              required
            >
              <option value="">プログラムを選択</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id.toString()}>
                  {program.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="instructorId">インストラクター</Label>
            <Select
              value={formData.instructorId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, instructorId: value }))}
              required
            >
              <option value="">インストラクターを選択</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id.toString()}>
                  {instructor.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="studioId">スタジオ</Label>
            <Select
              value={formData.studioId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, studioId: value }))}
              required
            >
              <option value="">スタジオを選択</option>
              {studios.map((studio) => (
                <option key={studio.id} value={studio.id.toString()}>
                  {studio.name} (定員{studio.capacity}名)
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* ボタンエリア */}
        <div className="flex justify-between pt-4">
          <div>
            {onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? '削除中...' : 'スケジュール削除'}
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              キャンセル
            </Button>
            
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? '更新中...' : 'スケジュール更新'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
} 