'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Schedule, CreateReservationData } from '@/types/api'
import { Calendar, Clock, User, MapPin, Users } from 'lucide-react'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  schedule: Schedule | null
  onSubmit: (data: CreateReservationData) => Promise<void>
  prefilledLineId?: string | null
}

export function BookingModal({ 
  isOpen, 
  onClose, 
  schedule, 
  onSubmit,
  prefilledLineId 
}: BookingModalProps) {
  const [formData, setFormData] = useState<CreateReservationData>({
    scheduleId: 0,
    customerName: '',
    lineId: '',
    phone: '',
  })

  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (schedule) {
      setFormData(prev => ({ ...prev, scheduleId: schedule.id }))
    }
  }, [schedule])

  // URLパラメータからのLINE IDを自動入力
  React.useEffect(() => {
    if (prefilledLineId) {
      setFormData(prev => ({ ...prev, lineId: prefilledLineId }))
    }
  }, [prefilledLineId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.customerName || !formData.lineId) {
      alert('名前とLINE IDは必須項目です')
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
      onClose()
      // フォームをリセット
      setFormData({
        scheduleId: 0,
        customerName: '',
        lineId: '',
        phone: '',
      })
      alert('予約が完了しました！')
    } catch (error) {
      console.error('予約エラー:', error)
      alert('予約に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (!schedule) return null

  const isFullyBooked = schedule.booked >= schedule.capacity
  const availableSpots = schedule.capacity - schedule.booked

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="クラス予約"
      size="md"
    >
      <div className="space-y-6">
        {/* スケジュール詳細 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">予約内容</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg ${schedule.color} ${schedule.textColor}`}>
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Clock className="h-4 w-4" />
                {schedule.time}
              </div>
              <div className="text-lg font-bold mb-2">
                {schedule.program}
              </div>
              <div className="flex items-center gap-4 text-sm opacity-90">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {schedule.instructor}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {schedule.studio}
                </div>
              </div>
            </div>

            {/* 空き状況 */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">
                  {isFullyBooked ? '満席' : `残り${availableSpots}席`}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {schedule.booked}/{schedule.capacity}名
              </span>
            </div>

            {isFullyBooked && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  このクラスは満席です。キャンセル待ちをご希望の場合は、スタジオにお問い合わせください。
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 予約フォーム */}
        {!isFullyBooked && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="customerName">
                お名前 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerName"
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="山田 太郎"
                required
              />
            </div>

            <div>
              <Label htmlFor="lineId">
                LINE ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lineId"
                type="text"
                value={formData.lineId}
                onChange={(e) => setFormData(prev => ({ ...prev, lineId: e.target.value }))}
                placeholder="your_line_id"
                required
                disabled={!!prefilledLineId}
              />
              <p className="text-xs text-gray-500 mt-1">
                {prefilledLineId 
                  ? 'LINE経由でアクセスされたため、自動入力されています'
                  : '予約確認とリマインダー通知のために使用します'
                }
              </p>
            </div>

            <div>
              <Label htmlFor="phone">電話番号（任意）</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="090-1234-5678"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>予約確認について</strong><br />
                予約完了後、LINE経由で確認メッセージをお送りします。
                レッスン前日にはリマインダーも配信されます。
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '予約中...' : '予約する'}
              </Button>
            </div>
          </form>
        )}

        {isFullyBooked && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              閉じる
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}