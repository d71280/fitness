'use client'

import React from 'react'
import { Schedule } from '@/types/api'

interface ScheduleBlockProps {
  schedule: Schedule
  onClick?: (schedule: Schedule) => void
  className?: string
}

export function ScheduleBlock({ schedule, onClick, className = '' }: ScheduleBlockProps) {
  const programClass = schedule.program?.color_class || 'bg-gray-500'
  const textClass = schedule.program?.text_color_class || 'text-white'
  
  const currentBookings = schedule.currentBookings || 0
  const availableSlots = schedule.availableSlots || (schedule.capacity - currentBookings)
  const isFullyBooked = currentBookings >= schedule.capacity
  
  // デバッグ用ログ
  console.log('ScheduleBlock - schedule:', schedule)
  console.log('ScheduleBlock - currentBookings:', currentBookings, 'availableSlots:', availableSlots)
  
  return (
    <div
      className={`p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${programClass} ${textClass} ${className} ${isFullyBooked ? 'opacity-60' : ''}`}
      onClick={() => onClick?.(schedule)}
    >
      <div className="text-xs font-medium mb-1">
        {schedule.startTime?.slice(0, 5)} - {schedule.endTime?.slice(0, 5)}
      </div>
      <div className="text-sm font-bold mb-1">
        {schedule.program?.name || 'プログラム名'}
      </div>
      <div className="text-xs opacity-90">
        {isFullyBooked ? '満席' : `残り${isNaN(availableSlots) ? '?' : availableSlots}席`}
      </div>
    </div>
  )
}