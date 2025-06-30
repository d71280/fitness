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
        headers: {
          'Content-Type': 'application/json',
        },
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
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <div className="text-lg">スケジュール読み込み中...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-lg text-red-600">スケジュールの読み込みでエラーが発生しました</div>
          <div className="text-sm text-gray-500 mt-2">{typeof error === 'string' ? error : 'エラーが発生しました'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 min-h-screen">
      {/* デモモード警告 */}
      {usingMockData && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-3">⚠️</div>
            <div>
              <div className="text-lg font-semibold text-yellow-800">デモモード</div>
              <div className="text-sm text-yellow-700">
                データベース接続エラーのため、サンプルデータを表示しています。
                実際のスケジュール登録は正常に動作します。
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">スケジュール管理</h1>
          <p className="text-gray-600 mt-2">週間スケジュールの表示・追加・編集ができます。スケジュールをクリックで編集できます。</p>
        </div>

        <WeeklyCalendar
          schedules={schedules}
          onAddSchedule={handleAddSchedule}
          onScheduleClick={handleScheduleClick}
          showAddButton={true}
          currentWeek={currentWeek}
          onWeekChange={setCurrentWeek}
        />
      </div>

      <AddScheduleModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setSelectedDate('')
        }}
        selectedDate={selectedDate}
        onSubmit={handleSubmitSchedule}
      />

      <EditScheduleModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedSchedule(null)
        }}
        schedule={selectedSchedule}
        onSubmit={handleUpdateSchedule}
        onDelete={handleDeleteSchedule}
      />
    </div>
  )
}