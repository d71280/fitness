'use client'

import { useState, useEffect } from 'react'
import { Schedule, CreateScheduleData, UpdateScheduleData } from '@/types/api'

export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      // より広い範囲でスケジュールを取得（現在の月から3ヶ月先まで）
      const today = new Date()
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1) // 今月の最初の日
      const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0) // 3ヶ月後の最後の日

      const response = await fetch('/api/schedules')
      
      if (!response.ok) throw new Error('スケジュール取得に失敗しました')
      
      const data = await response.json()
      console.log('📅 取得したスケジュール数:', data.length)
      console.log('📅 取得したスケジュール:', data)
      setSchedules(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  const createSchedule = async (scheduleData: CreateScheduleData) => {
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseDate: scheduleData.date,
          startTime: scheduleData.startTime,
          endTime: scheduleData.endTime,
          programId: scheduleData.programId,
          capacity: scheduleData.capacity,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'スケジュール作成に失敗しました')
      }

      const result = await response.json()
      await fetchSchedules()
      return result
    } catch (error) {
      console.error('スケジュール作成エラー:', error)
      throw error
    }
  }

  const createRecurringSchedule = async (scheduleData: CreateScheduleData & { 
    repeatWeeks: number, 
    daysOfWeek: number[] 
  }) => {
    try {
      const requestData = {
        baseDate: scheduleData.date,
        startTime: scheduleData.startTime,
        endTime: scheduleData.endTime,
        programId: scheduleData.programId,
        capacity: scheduleData.capacity,
        repeatWeeks: scheduleData.repeatWeeks,
        daysOfWeek: scheduleData.daysOfWeek,
      }
      
      console.log('🚀 Sending recurring schedule request:', requestData)
      
      const response = await fetch('/api/schedules/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      console.log('📡 Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error Response:', errorData)
        throw new Error(errorData.error || '繰り返しスケジュール作成に失敗しました')
      }

      const result = await response.json()
      console.log('✅ API Success Response:', result)
      
      await fetchSchedules()
      return result
    } catch (error) {
      console.error('❌ 繰り返しスケジュール作成エラー:', error)
      throw error
    }
  }

  const updateSchedule = async (scheduleData: UpdateScheduleData) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: scheduleData.startTime,
          endTime: scheduleData.endTime,
          programId: scheduleData.programId,
          capacity: scheduleData.capacity,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'スケジュール更新に失敗しました')
      }

      const result = await response.json()
      await fetchSchedules()
      return result
    } catch (error) {
      console.error('スケジュール更新エラー:', error)
      throw error
    }
  }

  const deleteSchedule = async (scheduleId: number) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'スケジュール削除に失敗しました')
      }

      const result = await response.json()
      await fetchSchedules()
      return result
    } catch (error) {
      console.error('スケジュール削除エラー:', error)
      throw error
    }
  }

  return {
    schedules,
    loading,
    error,
    createSchedule,
    createRecurringSchedule,
    updateSchedule,
    deleteSchedule,
    refetch: fetchSchedules,
  }
}