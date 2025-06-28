'use client'

import React from 'react'
import { Schedule } from '@/types/api'
import { cn } from '@/lib/utils'

interface ScheduleBlockProps {
  schedule: Schedule
  onClick: (schedule: Schedule) => void
}

export function ScheduleBlock({ schedule, onClick }: ScheduleBlockProps) {
  const occupancyRate = (schedule.booked / schedule.capacity) * 100
  const isFullyBooked = schedule.booked >= schedule.capacity
  
  // 空き状況に応じた色の調整
  const getOpacityClass = () => {
    if (isFullyBooked) return 'opacity-60'
    if (occupancyRate > 80) return 'opacity-90'
    return 'opacity-100'
  }

  return (
    <div
      className={cn(
        'p-2 rounded cursor-pointer transition-all hover:scale-105 hover:shadow-md',
        schedule.color,
        schedule.textColor,
        getOpacityClass(),
        isFullyBooked && 'cursor-not-allowed'
      )}
      onClick={() => onClick(schedule)}
    >
      {/* 時間 */}
      <div className="text-xs font-medium mb-1">
        {schedule.time}
      </div>
      
      {/* プログラム名 */}
      <div className="text-sm font-bold leading-tight mb-1">
        {schedule.program}
      </div>
      
      {/* インストラクター */}
      <div className="text-xs opacity-90 mb-1">
        {schedule.instructor}
      </div>
      
      {/* 空き状況 */}
      <div className="flex justify-between items-center text-xs">
        <span className="opacity-90">{schedule.studio}</span>
        <span className={cn(
          'font-medium',
          isFullyBooked ? 'text-red-200' : 'text-current'
        )}>
          {isFullyBooked ? '満席' : `残${schedule.capacity - schedule.booked}`}
        </span>
      </div>
      
      {/* 定員表示 */}
      <div className="text-xs opacity-75 mt-1">
        {schedule.booked}/{schedule.capacity}名
      </div>
    </div>
  )
}