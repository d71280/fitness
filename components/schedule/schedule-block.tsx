'use client'

import React from 'react'
import { Schedule } from '@/types/api'

interface ScheduleBlockProps {
  schedule: Schedule
  onClick?: () => void
  className?: string
}

export function ScheduleBlock({ schedule, onClick, className = '' }: ScheduleBlockProps) {
  const programClass = schedule.program?.color_class || 'bg-gray-500'
  const textClass = schedule.program?.text_color_class || 'text-white'
  
  return (
    <div
      className={`p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${programClass} ${textClass} ${className}`}
      onClick={onClick}
    >
      <div className="text-xs font-medium mb-1">
        {schedule.startTime} - {schedule.endTime}
      </div>
      <div className="text-sm font-bold mb-1">
        {schedule.program?.name || 'プログラム名'}
      </div>
      <div className="text-xs opacity-90">
        {schedule.instructor?.name || 'インストラクター未設定'}
      </div>
    </div>
  )
}