'use client'

import React, { useState } from 'react'
import { WeeklyCalendar } from '@/components/schedule/weekly-calendar'
import { AddScheduleModal } from '@/components/schedule/add-schedule-modal'
import { EditScheduleModal } from '@/components/schedule/edit-schedule-modal'
import { useSchedules } from '@/hooks/useSchedules'
import { getWeekStart, formatDate } from '@/lib/utils'
import { Schedule, CreateScheduleData, UpdateScheduleData } from '@/types/api'

export default function AdminSchedulePage() {
  const [currentWeek, setCurrentWeek] = useState(() => 
    getWeekStart(new Date())
  )

  // 週が変更されたらフォーマットして新しいデータを取得
  const currentWeekStart = formatDate(currentWeek)
  const { schedules, loading, error, usingMockData, addSchedule, addRecurringSchedule, refetch } = useSchedules(currentWeekStart)
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)

  const handleAddSchedule = (date: string) => {
    setSelectedDate(date)
    setIsAddModalOpen(true)
  }

  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setIsEditModalOpen(true)
  }

  const handleSubmitSchedule = async (data: CreateScheduleData) => {
    try {
      if (data.repeat === 'none') {
        await addSchedule(data)
      } else {
        await addRecurringSchedule(data)
      }
      await refetch()
    } catch (error) {
      throw error
    }
  }

  const handleUpdateSchedule = async (data: UpdateScheduleData) => {
    try {
      const response = await fetch(`/api/schedules/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'スケジュール更新に失敗しました')
      }

      await refetch()
    } catch (error) {
      throw error
    }
  }

  const handleDeleteSchedule = async (scheduleId: number) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'スケジュール削除に失敗しました')
      }

      await refetch()
    } catch (error) {
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">スケジュールを読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">スケジュール管理</h1>
        <p className="text-muted-foreground">
          週間スケジュールの表示・追加・編集ができます。スケジュールをクリックして編集できます。
        </p>
      </div>

      {/* エラー・警告メッセージ */}
      {error && (
        <div className={`p-4 rounded-md ${usingMockData ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
          <div className={`text-sm ${usingMockData ? 'text-yellow-800' : 'text-red-800'}`}>
            {usingMockData ? '⚠️ ' : '❌ '}
            {usingMockData 
              ? 'デモモードで動作中です。追加したスケジュールはサンプルデータとして表示されますが、実際のデータベースには保存されません。' 
              : error
            }
          </div>
        </div>
      )}

      <WeeklyCalendar
        schedules={schedules}
        onAddSchedule={handleAddSchedule}
        onScheduleClick={handleScheduleClick}
        showAddButton={true}
        currentWeek={currentWeek}
        onWeekChange={setCurrentWeek}
      />

      <AddScheduleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        selectedDate={selectedDate}
        onSubmit={handleSubmitSchedule}
      />

      <EditScheduleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        schedule={selectedSchedule}
        onSubmit={handleUpdateSchedule}
        onDelete={handleDeleteSchedule}
      />
    </div>
  )
}