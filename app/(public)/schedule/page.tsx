'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { WeeklyCalendar } from '@/components/schedule/weekly-calendar'
import { AddScheduleModal } from '@/components/schedule/add-schedule-modal'
import { BookingModal } from '@/components/booking/booking-modal'
import { useSchedules } from '@/hooks/useSchedules'
import { useReservations } from '@/hooks/useReservations'
import { getWeekStart, formatDate } from '@/lib/utils'
import { Schedule, CreateScheduleData, CreateReservationData } from '@/types/api'

export default function SchedulePage() {
  const searchParams = useSearchParams()
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    formatDate(getWeekStart(new Date()))
  )

  const { schedules, loading, error, addSchedule, addRecurringSchedule, refetch } = useSchedules(currentWeekStart)
  const { createReservation } = useReservations()
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [lineIdFromUrl, setLineIdFromUrl] = useState<string | null>(null)

  // URLパラメータからLINE ID情報を取得
  useEffect(() => {
    const lineId = searchParams.get('line_id') || searchParams.get('lineId') || searchParams.get('uid')
    if (lineId) {
      setLineIdFromUrl(lineId)
    }
  }, [searchParams])

  const handleAddSchedule = (date: string) => {
    setSelectedDate(date)
    setIsAddModalOpen(true)
  }

  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setIsBookingModalOpen(true)
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

  const handleSubmitReservation = async (data: CreateReservationData) => {
    try {
      await createReservation(data)
      await refetch() // スケジュールを再取得して空き状況を更新
    } catch (error) {
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">スケジュールを読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">エラー: {error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <WeeklyCalendar
        schedules={schedules}
        onScheduleClick={handleScheduleClick}
        showAddButton={false}
      />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false)
          setSelectedSchedule(null)
        }}
        schedule={selectedSchedule}
        onSubmit={handleSubmitReservation}
        prefilledLineId={lineIdFromUrl}
      />
    </div>
  )
}