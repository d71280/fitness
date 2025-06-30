'use client'

import React, { useState } from 'react'
import { WeeklyCalendar } from '@/components/schedule/weekly-calendar'
import { AddScheduleModal } from '@/components/schedule/add-schedule-modal'
import { EditScheduleModal } from '@/components/schedule/edit-schedule-modal'
import { useSchedules } from '@/hooks/useSchedules'
import { getWeekStart, formatDate } from '@/lib/utils'
import { Schedule, CreateScheduleData, UpdateScheduleData } from '@/types/api'

export default function AdminSchedulePage() {
  const [debugError, setDebugError] = useState<string | null>(null)

  const [currentWeek, setCurrentWeek] = useState(() => {
    try {
      return getWeekStart(new Date())
    } catch (error) {
      setDebugError(`getWeekStart error: ${error}`)
      return new Date()
    }
  })

  // 週が変更されたらフォーマットして新しいデータを取得
  const currentWeekStart = formatDate(currentWeek)
  const { schedules, loading, error, createSchedule, createRecurringSchedule, refetch } = useSchedules()
  
  // スケジュールを日付ごとにグループ化
  const schedulesByDate = React.useMemo(() => {
    try {
      const grouped: Record<string, Schedule[]> = {}
      schedules.forEach(schedule => {
        const date = schedule.date
        if (!grouped[date]) {
          grouped[date] = []
        }
        grouped[date].push(schedule)
      })
      return grouped
    } catch (error) {
      setDebugError(`schedulesByDate error: ${error}`)
      return {}
    }
  }, [schedules])
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)

  const handleAddSchedule = (date: string) => {
    try {
      setSelectedDate(date)
      setIsAddModalOpen(true)
    } catch (error) {
      setDebugError(`handleAddSchedule error: ${error}`)
    }
  }

  const handleScheduleClick = (schedule: Schedule) => {
    try {
      console.log('handleScheduleClick called with schedule:', schedule)
      console.log('Schedule ID:', schedule.id, 'Type:', typeof schedule.id)
      console.log('Schedule data:', {
        id: schedule.id,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        programId: schedule.programId,
        program: schedule.program
      })
      setSelectedSchedule(schedule)
      setIsEditModalOpen(true)
    } catch (error) {
      setDebugError(`handleScheduleClick error: ${error}`)
    }
  }

  const handleSubmitSchedule = async (data: CreateScheduleData) => {
    try {
      if (data.repeat === 'none') {
        await createSchedule(data)
      } else {
        // 繰り返しスケジュールの場合、必要なパラメータを追加
        const recurringData = {
          ...data,
          repeatWeeks: 4, // デフォルト値
          daysOfWeek: [new Date(data.date).getDay()], // 選択した日の曜日
        }
        await createRecurringSchedule(recurringData)
      }
      await refetch()
    } catch (error) {
      setDebugError(`handleSubmitSchedule error: ${error}`)
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
      setDebugError(`handleUpdateSchedule error: ${error}`)
      throw error
    }
  }

  const handleDeleteSchedule = async (scheduleId: number) => {
    try {
      console.log('handleDeleteSchedule called with ID:', scheduleId, 'Type:', typeof scheduleId)
      
      if (!scheduleId || typeof scheduleId !== 'number' || scheduleId <= 0) {
        console.error('Invalid schedule ID for deletion:', scheduleId)
        throw new Error('無効なスケジュールIDです')
      }
      
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'スケジュール削除に失敗しました')
      }

      await refetch()
    } catch (error) {
      setDebugError(`handleDeleteSchedule error: ${error}`)
      throw error
    }
  }

  // デバッグエラーがある場合は表示
  if (debugError) {
    return (
      <div className="container mx-auto p-4 md:p-6 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-2xl">
            <div className="text-6xl mb-4">🐛</div>
            <div className="text-lg text-red-600 mb-4">デバッグエラーが発生しました</div>
            <div className="text-sm text-gray-700 bg-gray-100 p-4 rounded-lg text-left">
              <pre>{debugError}</pre>
            </div>
            <button 
              onClick={() => setDebugError(null)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              エラーをクリアして再試行
            </button>
          </div>
        </div>
      </div>
    )
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

  try {
    return (
      <div className="container mx-auto p-4 md:p-6 min-h-screen">
        {/* デモモード警告 */}
        {false && (
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
            schedules={schedulesByDate}
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
  } catch (error) {
    setDebugError(`Render error: ${error}`)
    return null
  }
}