// @ts-nocheck
'use client'

import React, { useState, useMemo } from 'react'
import { WeeklyCalendar } from '@/components/schedule/weekly-calendar'
import { BookingModal } from '@/components/booking/booking-modal'
import { useSchedules } from '@/hooks/useSchedules'
import { useReservations } from '@/hooks/useReservations'
import { getWeekStart, formatDate } from '@/lib/utils'
import { Schedule, CreateReservationData } from '@/types/api'

export default function PublicSchedulePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    formatDate(getWeekStart(new Date()))
  )

  const { schedules, loading, error } = useSchedules()
  const { createReservation } = useReservations()
  
  // スケジュールを日付ごとにグループ化
  const schedulesByDate = useMemo(() => {
    const grouped: Record<string, Schedule[]> = {}
    schedules.forEach(schedule => {
      const date = schedule.date
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(schedule)
    })
    return grouped
  }, [schedules])
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)

  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setIsBookingModalOpen(true)
  }

  const handleReservationSubmit = async (data: CreateReservationData) => {
    try {
      const result = await createReservation(data)
      console.log('予約作成結果:', result)
      return result
    } catch (error) {
      console.error('予約作成エラー:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-red-500 text-center">
          <h1 className="text-xl font-bold mb-4">エラーが発生しました</h1>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              フィットネススタジオ予約
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                WEB版
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* 週間カレンダー */}
        <WeeklyCalendar
          currentWeekStart={currentWeekStart}
          onWeekChange={setCurrentWeekStart}
          schedulesByDate={schedulesByDate}
          onScheduleClick={handleScheduleClick}
          onDateClick={() => {}} // WEB版では新規スケジュール追加なし
          showAddButton={false}
        />

        {/* LINE通知についての案内 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-lg">ℹ️</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">LINE通知について</h3>
              <p className="text-blue-800 text-sm mb-2">
                こちらはWEB版の予約システムです。予約完了後のLINE通知は送信されません。
              </p>
              <p className="text-blue-800 text-sm">
                LINE通知をご希望の場合は、
                <a 
                  href={`https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}`}
                  className="underline font-medium hover:text-blue-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LINEアプリから予約
                </a>
                してください。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 予約モーダル */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        schedule={selectedSchedule!}
        onSubmit={handleReservationSubmit}
        liffUserId={null} // WEB版はLINE IDなし
      />
    </div>
  )
}