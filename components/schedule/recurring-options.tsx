'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateScheduleData } from '@/types/api'
import { Repeat } from 'lucide-react'

interface RecurringOptionsProps {
  formData: CreateScheduleData
  setFormData: React.Dispatch<React.SetStateAction<CreateScheduleData>>
}

export function RecurringOptions({ formData, setFormData }: RecurringOptionsProps) {
  const repeatOptions = [
    { value: 'none', label: 'なし（単発）' },
    { value: 'daily', label: '毎日' },
    { value: 'weekly', label: '毎週' },
    { value: 'monthly', label: '毎月' },
    { value: 'yearly', label: '毎年' },
  ]

  const getPreviewText = () => {
    if (formData.repeat === 'none') return '単発のスケジュールです'
    
    let text = `${repeatOptions.find(opt => opt.value === formData.repeat)?.label}繰り返し`
    
    if (formData.repeatEndDate) {
      text += ` (${formData.repeatEndDate}まで)`
    } else if (formData.repeatCount) {
      text += ` (${formData.repeatCount}回)`
    }
    
    return text
  }

  const calculateEstimatedCount = () => {
    if (formData.repeat === 'none') return 1
    if (formData.repeatCount) return formData.repeatCount
    if (!formData.repeatEndDate) return '無制限'

    const start = new Date(formData.date)
    const end = new Date(formData.repeatEndDate)
    const diffTime = end.getTime() - start.getTime()
    
    switch (formData.repeat) {
      case 'daily':
        return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
      case 'weekly':
        return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1
      case 'monthly':
        return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30)) + 1
      case 'yearly':
        return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365)) + 1
      default:
        return 1
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Repeat className="h-4 w-4" />
          繰り返し設定
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 繰り返しパターン */}
        <div>
          <Label htmlFor="repeat">繰り返しパターン</Label>
          <select
            id="repeat"
            value={formData.repeat}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              repeat: e.target.value as CreateScheduleData['repeat'],
              repeatEndDate: undefined,
              repeatCount: undefined,
            }))}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {repeatOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 繰り返し条件（繰り返しが「なし」以外の場合） */}
        {formData.repeat !== 'none' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              繰り返しの終了条件を設定してください（どちらか一方を選択）
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* 終了日 */}
              <div>
                <Label htmlFor="repeatEndDate">終了日</Label>
                <Input
                  id="repeatEndDate"
                  type="date"
                  value={formData.repeatEndDate || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    repeatEndDate: e.target.value || undefined,
                    repeatCount: undefined,
                  }))}
                  min={formData.date}
                />
              </div>

              {/* 回数制限 */}
              <div>
                <Label htmlFor="repeatCount">回数制限</Label>
                <Input
                  id="repeatCount"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.repeatCount || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    repeatCount: e.target.value ? parseInt(e.target.value) : undefined,
                    repeatEndDate: undefined,
                  }))}
                  placeholder="回数を入力"
                />
              </div>
            </div>

            {/* プレビュー */}
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="text-sm font-medium text-blue-900 mb-1">
                設定プレビュー
              </div>
              <div className="text-sm text-blue-700">
                {getPreviewText()}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                作成される予定数: {calculateEstimatedCount()}件
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}