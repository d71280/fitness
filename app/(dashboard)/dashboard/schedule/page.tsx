'use client'

import React, { useState } from 'react'
import { WeeklyCalendar } from '@/components/schedule/weekly-calendar'
import { AddScheduleModal } from '@/components/schedule/add-schedule-modal'
import { useSchedules } from '@/hooks/useSchedules'
import { getWeekStart, formatDate } from '@/lib/utils'
import { Schedule, CreateScheduleData } from '@/types/api'

export default function AdminSchedulePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    formatDate(getWeekStart(new Date()))
  )

  const { schedules, loading, error, usingMockData, addSchedule, addRecurringSchedule, refetch } = useSchedules(currentWeekStart)
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')

  const handleAddSchedule = (date: string) => {
    setSelectedDate(date)
    setIsAddModalOpen(true)
  }

  const handleScheduleClick = (schedule: Schedule) => {
    // 管理画面では予約ではなく編集機能を実装予定
    console.log('スケジュール編集:', schedule)
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
          週間スケジュールの表示・追加・編集ができます
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
      />

      <AddScheduleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        selectedDate={selectedDate}
        onSubmit={handleSubmitSchedule}
      />
    </div>
  )
}