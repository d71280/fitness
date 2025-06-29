'use client'

import { useState, useEffect } from 'react'
import { Schedule, CreateScheduleData } from '@/types/api'

// フォールバック用のモックデータ
const generateMockSchedules = (weekStart: string): Record<string, Schedule[]> => {
  const mockSchedules: Record<string, Schedule[]> = {}
  const startDate = new Date(weekStart)
  
  // 平日（月〜金）にサンプルスケジュールを生成
  for (let i = 0; i < 5; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    
    mockSchedules[dateStr] = [
      {
        id: i * 2 + 1,
        date: dateStr,
        startTime: '10:00',
        endTime: '11:00',
        programId: 1,
        instructorId: 1,
        studioId: 1,
        capacity: 20,
        bookedCount: 5,
        program: { 
          id: 1, 
          name: 'ヨガベーシック', 
          description: '初心者向けヨガ', 
          color_class: 'bg-green-500',
          text_color_class: 'text-white',
          default_instructor_id: 1 
        },
        instructor: { 
          id: 1, 
          name: '田中先生', 
          email: 'tanaka@example.com', 
          bio: 'ヨガインストラクター',
          specialties: ['ヨガ', 'ピラティス']
        },
        studio: { 
          id: 1, 
          name: 'スタジオA', 
          capacity: 20,
          equipment: ['ヨガマット', 'ブロック'],
          description: 'メインスタジオ'
        }
      },
      {
        id: i * 2 + 2,
        date: dateStr,
        startTime: '19:00',
        endTime: '20:00',
        programId: 2,
        instructorId: 2,
        studioId: 1,
        capacity: 15,
        bookedCount: 8,
        program: { 
          id: 2, 
          name: 'HIIT', 
          description: '高強度インターバルトレーニング', 
          color_class: 'bg-red-500',
          text_color_class: 'text-white',
          default_instructor_id: 2 
        },
        instructor: { 
          id: 2, 
          name: '佐藤先生', 
          email: 'sato@example.com', 
          bio: 'フィットネストレーナー',
          specialties: ['HIIT', '筋トレ']
        },
        studio: { 
          id: 1, 
          name: 'スタジオA', 
          capacity: 20,
          equipment: ['ダンベル', 'マット'],
          description: 'メインスタジオ'
        }
      }
    ]
  }
  
  return mockSchedules
}

export function useSchedules(weekStart: string) {
  const [schedules, setSchedules] = useState<Record<string, Schedule[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/schedules/weekly?date=${weekStart}`)
      if (!response.ok) throw new Error('スケジュール取得に失敗しました')
      
      const data = await response.json()
      setSchedules(data.schedules || {})
      setError(null)
      setUsingMockData(false)
    } catch (err) {
      console.warn('API接続に失敗しました、モックデータを使用します:', err)
      // APIエラー時はモックデータを使用
      const mockData = generateMockSchedules(weekStart)
      setSchedules(mockData)
      setError('接続エラーのため、サンプルデータを表示しています')
      setUsingMockData(true)
    } finally {
      setLoading(false)
    }
  }

  const addSchedule = async (scheduleData: CreateScheduleData) => {
    try {
      console.log('=== useSchedules.addSchedule開始 ===')
      console.log('受信データ:', scheduleData)
      
      // APIが期待するフォーマットに変換
      const apiData = {
        baseDate: scheduleData.date,
        startTime: scheduleData.startTime,
        endTime: scheduleData.endTime,
        programId: scheduleData.programId,
        instructorId: scheduleData.instructorId,
        studioId: scheduleData.studioId,
        capacity: scheduleData.capacity,
      }

      console.log('API送信データ:', apiData)

      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      })

      console.log('API応答ステータス:', response.status)
      console.log('API応答OK:', response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API応答エラーデータ:', errorData)
        throw new Error(errorData.error || 'スケジュール追加に失敗しました')
      }
      
      const result = await response.json()
      console.log('API応答成功データ:', result)
      
      // 成功時はローカルデータを再取得
      await fetchSchedules()
      
      return result
    } catch (error) {
      console.error('=== addSchedule エラー詳細 ===')
      console.error('エラーオブジェクト:', error)
      console.error('エラーメッセージ:', error instanceof Error ? error.message : 'Unknown error')
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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '繰り返しスケジュール追加に失敗しました')
      }
      
      const result = await response.json()
      
      // 成功時はローカルデータを再取得
      await fetchSchedules()
      
      return result
    } catch (error) {
      console.error('繰り返しスケジュール追加エラー:', error)
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
    usingMockData,
    addSchedule,
    addRecurringSchedule,
    refetch: fetchSchedules,
  }
}