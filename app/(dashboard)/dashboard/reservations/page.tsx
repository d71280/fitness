'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useReservations } from '@/hooks/useReservations'
import { Reservation, Customer } from '@/types/api'
import { EditReservationModal } from '@/components/admin/edit-reservation-modal'
import { 
  UserCheck, 
  Users, 
  Calendar,
  Clock,
  Mail,
  Phone,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react'

interface CustomerWithStats extends Customer {
  reservationsCount: number;
  lastReservation: string;
}

export default function ReservationsCustomersPage() {
  const { reservations, loading, error, refetch } = useReservations()
  
  const [activeTab, setActiveTab] = useState<'reservations' | 'customers'>('reservations')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // 予約データから顧客データを抽出
  const customers: CustomerWithStats[] = reservations.reduce((acc: CustomerWithStats[], reservation: Reservation) => {
    if (reservation.customer) {
      const existingCustomer = acc.find(c => c.id === reservation.customer!.id)
      if (!existingCustomer) {
        acc.push({
          ...reservation.customer,
          reservationsCount: 1,
          lastReservation: reservation.schedule?.date || reservation.created_at || new Date().toISOString().split('T')[0]
        })
      } else {
        existingCustomer.reservationsCount += 1
        if (reservation.schedule?.date && reservation.schedule.date > existingCustomer.lastReservation) {
          existingCustomer.lastReservation = reservation.schedule.date
        }
      }
    }
    return acc
  }, [])

  // フィルタリング
  const filteredReservations = reservations.filter((reservation: Reservation) => {
    const matchesSearch = !searchTerm || 
      reservation.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.schedule?.program?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const filteredCustomers = customers.filter((customer: CustomerWithStats) => {
    return !searchTerm || 
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <AlertCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return '確定'
      case 'pending': return '保留中'
      case 'cancelled': return 'キャンセル'
      default: return '不明'
    }
  }

  // 予約編集
  const handleEditReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setIsEditModalOpen(true)
  }

  // 予約削除
  const handleDeleteReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setIsDeleteDialogOpen(true)
  }

  // 予約削除実行
  const confirmDeleteReservation = async () => {
    if (!selectedReservation) return

    try {
      const response = await fetch(`/api/reservations/${selectedReservation.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '予約削除に失敗しました')
      }

      await refetch()
      setIsDeleteDialogOpen(false)
      setSelectedReservation(null)
      alert('予約を削除しました')
    } catch (error) {
      console.error('予約削除エラー:', error)
      alert(error instanceof Error ? error.message : '予約削除に失敗しました')
    }
  }

  // ステータス変更
  const handleStatusChange = async (reservationId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'ステータス更新に失敗しました')
      }

      await refetch()
      alert('ステータスを更新しました')
    } catch (error) {
      console.error('ステータス更新エラー:', error)
      alert(error instanceof Error ? error.message : 'ステータス更新に失敗しました')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">予約・顧客管理</h1>
        <p className="text-muted-foreground">
          予約状況と顧客情報を統合管理します
        </p>
      </div>

      {/* タブナビゲーション */}
      <div className="flex space-x-1 border-b">
        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'reservations'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserCheck className="inline w-4 h-4 mr-2" />
          予約管理
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'customers'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="inline w-4 h-4 mr-2" />
          顧客管理
        </button>
      </div>

      {/* 検索・フィルター */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={activeTab === 'reservations' ? '予約者名、メール、プログラムで検索...' : '顧客名、メール、電話番号で検索...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {activeTab === 'reservations' && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">全ステータス</option>
              <option value="confirmed">確定済み</option>
              <option value="pending">保留中</option>
              <option value="cancelled">キャンセル</option>
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">エラー: {error}</div>
      ) : (
        <>
          {/* 予約管理タブ */}
          {activeTab === 'reservations' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">予約一覧 ({filteredReservations.length}件)</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredReservations.map((reservation: Reservation) => (
                  <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* 予約情報 */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(reservation.status || 'pending')}`}>
                                {getStatusIcon(reservation.status || 'pending')}
                                {getStatusText(reservation.status || 'pending')}
                              </div>
                              <span className="text-sm text-gray-500">ID: {reservation.id}</span>
                            </div>
                            
                            {/* アクションボタン */}
                            <div className="flex items-center gap-2">
                              {/* ステータス変更 */}
                              <select
                                value={reservation.status || 'pending'}
                                onChange={(e) => handleStatusChange(reservation.id, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="confirmed">確定</option>
                                <option value="pending">保留中</option>
                                <option value="cancelled">キャンセル</option>
                              </select>
                              
                              {/* 編集ボタン */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditReservation(reservation)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              {/* 削除ボタン */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteReservation(reservation)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 顧客情報 */}
                            <div>
                              <h3 className="font-medium text-lg">{reservation.customer?.name || '顧客情報なし'}</h3>
                              <div className="space-y-1 text-sm text-gray-600">
                                {reservation.customer?.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {reservation.customer.email}
                                  </div>
                                )}
                                {reservation.customer?.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {reservation.customer.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* スケジュール情報 */}
                            <div>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-1 font-medium">
                                  <Calendar className="w-3 h-3" />
                                  {reservation.schedule?.date && new Date(reservation.schedule.date).toLocaleDateString('ja-JP')}
                                </div>
                                <div className="flex items-center gap-1 font-medium text-blue-600">
                                  <Clock className="w-3 h-3" />
                                  {(reservation.schedule?.start_time || reservation.schedule?.startTime)?.slice(0, 5)} - {(reservation.schedule?.end_time || reservation.schedule?.endTime)?.slice(0, 5)}
                                </div>
                                <div className="text-gray-600">
                                  プログラム: {reservation.schedule?.program?.name || '不明'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredReservations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    予約が見つかりません
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 顧客管理タブ */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">顧客一覧 ({filteredCustomers.length}件)</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map((customer: CustomerWithStats) => (
                  <Card key={customer.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-lg">{customer.name}</h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {customer.reservationsCount}回予約
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {customer.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-1" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-1" />
                            {customer.phone}
                          </div>
                        )}
                        <div className="text-sm text-gray-600">
                          最終予約: {new Date(customer.lastReservation).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredCustomers.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    顧客が見つかりません
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* 編集モーダル */}
      <EditReservationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedReservation(null)
        }}
        reservation={selectedReservation}
        onUpdate={refetch}
      />

      {/* 削除確認ダイアログ */}
      {isDeleteDialogOpen && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">予約削除の確認</h3>
            <p className="text-gray-600 mb-6">
              以下の予約を削除しますか？この操作は取り消せません。
            </p>
            <div className="bg-gray-50 p-4 rounded mb-6">
              <div className="text-sm">
                <div><strong>予約者:</strong> {selectedReservation.customer?.name}</div>
                <div><strong>日時:</strong> {selectedReservation.schedule?.date} {(selectedReservation.schedule?.start_time || selectedReservation.schedule?.startTime)?.slice(0, 5)}-{(selectedReservation.schedule?.end_time || selectedReservation.schedule?.endTime)?.slice(0, 5)}</div>
                <div><strong>プログラム:</strong> {selectedReservation.schedule?.program?.name}</div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setSelectedReservation(null)
                }}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteReservation}
              >
                削除する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 