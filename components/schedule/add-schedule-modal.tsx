// @ts-nocheck
'use client'
// @ts-nocheck

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RecurringOptions } from './recurring-options'
import { usePrograms } from '@/hooks/usePrograms'
import { useInstructors } from '@/hooks/useInstructors'

import { CreateScheduleData } from '@/types/api'

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

  const [formData, setFormData] = useState<CreateScheduleData>({
    date: selectedDate,
    startTime: '10:00',
    endTime: '11:00',
    programId: programs.length > 0 ? programs[0].id : 0,
    instructorId: instructors.length > 0 ? instructors[0].id : 0,
    capacity: 20, // 固定値として設定（非表示）
    repeat: 'none',
  })

  const [selectedProgram, setSelectedProgram] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFormData(prev => ({ ...prev, date: selectedDate }))
  }, [selectedDate])

  // データが読み込まれた後に初期値を設定
  useEffect(() => {
    if (programs.length > 0) {
      setFormData(prev => ({
        ...prev,
        programId: prev.programId === 0 ? programs[0].id : prev.programId,
      }))
    }
  }, [programs])

  useEffect(() => {
    if (formData.programId && programs.length > 0) {
      const program = programs.find(p => p.id === formData.programId)
      setSelectedProgram(program)
    }
  }, [formData.programId, programs])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      
      const scheduleData = {
        ...formData,
        studioId: 1,
      }
      
      await onSubmit(scheduleData)
      onClose()
      
      // フォームリセット
      setFormData({
        date: selectedDate,
        startTime: '10:00',
        endTime: '11:00',
        programId: programs.length > 0 ? programs[0].id : 0,
        instructorId: 1, // デフォルトインストラクター
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
      title="スケジュール追加"
      size="lg"
    >
      <div className="space-y-6">
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

          {/* プログラム・インストラクター */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="programId">プログラム</Label>
              <select
                id="programId"
                value={formData.programId}
                onChange={(e) => setFormData(prev => ({ ...prev, programId: parseInt(e.target.value) }))}
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">プログラムを選択</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="instructorId">インストラクター</Label>
              <select
                id="instructorId"
                value={formData.instructorId}
                onChange={(e) => setFormData(prev => ({ ...prev, instructorId: parseInt(e.target.value) }))}
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">インストラクターを選択</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
              {loading ? '作成中...' : formData.repeat === 'none' ? 'スケジュール作成' : '繰り返しスケジュール作成'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}