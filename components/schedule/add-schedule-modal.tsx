'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePrograms } from '@/hooks/usePrograms'
import { useInstructors } from '@/hooks/useInstructors'
import { useStudios } from '@/hooks/useStudios'
import { CreateScheduleData } from '@/types/api'
import { RecurringOptions } from './recurring-options'

interface AddScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string
  onSubmit: (data: CreateScheduleData) => Promise<void>
}

export function AddScheduleModal({ 
  isOpen, 
  onClose, 
  selectedDate, 
  onSubmit 
}: AddScheduleModalProps) {
  const { programs } = usePrograms()
  const { instructors } = useInstructors()
  const { studios } = useStudios()

  const [formData, setFormData] = useState<CreateScheduleData>({
    date: selectedDate,
    startTime: '10:00',
    endTime: '11:00',
    programId: 0,
    instructorId: 0,
    studioId: 0,
    capacity: 20,
    repeat: 'none',
  })

  const [selectedProgram, setSelectedProgram] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFormData(prev => ({ ...prev, date: selectedDate }))
  }, [selectedDate])

  useEffect(() => {
    if (formData.programId && programs.length > 0) {
      const program = programs.find(p => p.id === formData.programId)
      setSelectedProgram(program)
    }
  }, [formData.programId, programs])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.programId || !formData.instructorId || !formData.studioId) {
      alert('全ての必須項目を入力してください')
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
      onClose()
      // フォームをリセット
      setFormData({
        date: selectedDate,
        startTime: '10:00',
        endTime: '11:00',
        programId: 0,
        instructorId: 0,
        studioId: 0,
        capacity: 20,
        repeat: 'none',
      })
    } catch (error) {
      console.error('スケジュール作成エラー:', error)
      const errorMessage = error instanceof Error ? error.message : 'スケジュール作成に失敗しました'
      alert(`エラー: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="新しいスケジュール追加"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 日付 */}
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

        {/* 時間 */}
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

        {/* プログラム */}
        <div>
          <Label htmlFor="program">プログラム</Label>
          <select
            id="program"
            value={formData.programId.toString()}
            onChange={(e) => setFormData(prev => ({ ...prev, programId: parseInt(e.target.value) }))}
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

        {/* インストラクター */}
        <div>
          <Label htmlFor="instructor">インストラクター</Label>
          <select
            id="instructor"
            value={formData.instructorId.toString()}
            onChange={(e) => setFormData(prev => ({ ...prev, instructorId: parseInt(e.target.value) }))}
            required
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">インストラクターを選択</option>
            {instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id.toString()}>
                {instructor.name}
              </option>
            ))}
          </select>
        </div>

        {/* スタジオ */}
        <div>
          <Label htmlFor="studio">スタジオ</Label>
          <select
            id="studio"
            value={formData.studioId.toString()}
            onChange={(e) => setFormData(prev => ({ ...prev, studioId: parseInt(e.target.value) }))}
            required
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">スタジオを選択</option>
            {studios.map((studio) => (
              <option key={studio.id} value={studio.id.toString()}>
                {studio.name} (定員{studio.capacity}名)
              </option>
            ))}
          </select>
        </div>

        {/* 定員 */}
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

        {/* 繰り返し設定 */}
        <RecurringOptions
          formData={formData}
          setFormData={setFormData}
        />

        {/* プレビュー */}
        {selectedProgram && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">プレビュー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-3 rounded ${selectedProgram.color_class} ${selectedProgram.text_color_class}`}>
                <div className="text-xs font-medium mb-1">
                  {formData.startTime} - {formData.endTime}
                </div>
                <div className="text-sm font-bold mb-1">
                  {selectedProgram.name}
                </div>
                <div className="text-xs opacity-90">
                  {instructors.find(i => i.id === formData.instructorId)?.name}
                </div>
                <div className="text-xs opacity-75 mt-1">
                  {studios.find(s => s.id === formData.studioId)?.name} | 定員{formData.capacity}名
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* アクション */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '作成中...' : 'スケジュール作成'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}