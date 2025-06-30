'use client'
// @ts-nocheck

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Reservation } from '@/types/api'

interface EditReservationModalProps {
  isOpen: boolean
  onClose: () => void
  reservation: Reservation | null
  onUpdate: () => Promise<void>
}

export function EditReservationModal({
  isOpen,
  onClose,
  reservation,
  onUpdate
}: EditReservationModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    status: 'confirmed',
    bookingType: 'advance',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (reservation) {
      setFormData({
        customerName: reservation.customer?.name || '',
        customerEmail: reservation.customer?.email || '',
        customerPhone: reservation.customer?.phone || '',
        status: reservation.status || 'confirmed',
        bookingType: (reservation as any).booking_type || 'advance',
        notes: (reservation as any).cancellation_reason || ''
      })
    }
  }, [reservation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reservation) return

    setLoading(true)
    try {
      // 顧客情報更新
      const customerResponse = await fetch(`/api/customers/${(reservation as any).customer_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.customerName,
          email: formData.customerEmail,
          phone: formData.customerPhone,
        }),
      })

      if (!customerResponse.ok) {
        throw new Error('顧客情報の更新に失敗しました')
      }

      // 予約情報更新
      const reservationResponse = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formData.status,
          booking_type: formData.bookingType,
          cancellation_reason: formData.notes || null,
        }),
      })

      if (!reservationResponse.ok) {
        const errorData = await reservationResponse.json()
        throw new Error(errorData.error || '予約情報の更新に失敗しました')
      }

      await onUpdate()
      onClose()
      alert('予約情報を更新しました')
    } catch (error) {
      console.error('予約更新エラー:', error)
      alert(error instanceof Error ? error.message : '更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (!reservation) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="予約情報編集"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 予約情報表示 */}
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-medium mb-2">予約詳細</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div><strong>予約ID:</strong> {reservation.id}</div>
            <div><strong>日時:</strong> {reservation.schedule?.date} {reservation.schedule?.startTime}-{reservation.schedule?.endTime}</div>
            <div><strong>プログラム:</strong> {reservation.schedule?.program?.name}</div>
          </div>
        </div>

        {/* 顧客情報編集 */}
        <div className="space-y-4">
          <h3 className="font-medium">顧客情報</h3>
          
          <div>
            <Label htmlFor="customerName">顧客名</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="customerEmail">メールアドレス</Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="customerPhone">電話番号</Label>
            <Input
              id="customerPhone"
              value={formData.customerPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
            />
          </div>
        </div>

        {/* 予約ステータス */}
        <div className="space-y-4">
          <h3 className="font-medium">予約ステータス</h3>
          
          <div>
            <Label htmlFor="status">ステータス</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="confirmed">確定</option>
              <option value="pending">保留中</option>
              <option value="cancelled">キャンセル</option>
            </select>
          </div>

          <div>
            <Label htmlFor="bookingType">予約タイプ</Label>
            <select
              id="bookingType"
              value={formData.bookingType}
              onChange={(e) => setFormData(prev => ({ ...prev, bookingType: e.target.value }))}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="advance">事前予約</option>
              <option value="walk_in">当日受付</option>
            </select>
          </div>

          <div>
            <Label htmlFor="notes">備考・キャンセル理由</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="備考やキャンセル理由を入力..."
            />
          </div>
        </div>

        {/* アクション */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '更新中...' : '更新する'}
          </Button>
        </div>
      </form>
    </Modal>
  )
} 