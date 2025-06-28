'use client'

import { useState, useEffect } from 'react'
import { Schedule, CreateScheduleData } from '@/types/api'

export function useSchedules(weekStart: string) {
  const [schedules, setSchedules] = useState<Record<string, Schedule[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/schedules/weekly?start=${weekStart}`)
      if (!response.ok) throw new Error('スケジュール取得に失敗しました')
      
      const data = await response.json()
      setSchedules(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const addSchedule = async (scheduleData: CreateScheduleData) => {
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      })

      if (!response.ok) throw new Error('スケジュール追加に失敗しました')
      
      const result = await response.json()
      await fetchSchedules() // 再取得
      return result
    } catch (error) {
      throw error
    }
  }

  const addRecurringSchedule = async (scheduleData: CreateScheduleData) => {
    try {
      const response = await fetch('/api/schedules/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      })

      if (!response.ok) throw new Error('繰り返しスケジュール追加に失敗しました')
      
      const result = await response.json()
      await fetchSchedules() // 再取得
      return result
    } catch (error) {
      throw error
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [weekStart])

  return {
    schedules,
    loading,
    error,
    addSchedule,
    addRecurringSchedule,
    refetch: fetchSchedules,
  }
}