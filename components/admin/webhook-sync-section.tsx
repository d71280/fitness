'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Send, RefreshCw, CheckCircle, XCircle, Clock, Database } from 'lucide-react'

export function WebhookSyncSection() {
  const [isLoading, setIsLoading] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<'success' | 'error' | 'pending' | null>(null)
  const [syncMessage, setSyncMessage] = useState<string>('')

  // 手動でwebhookに全予約データを送信
  const handleManualSync = async () => {
    setIsLoading(true)
    setSyncStatus('pending')
    setSyncMessage('同期中...')

    try {
      const response = await fetch('/api/webhook/sync-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setSyncStatus('success')
        setSyncMessage(`同期完了: ${result.count}件の予約データを送信しました`)
        setLastSync(new Date())
      } else {
        const error = await response.json()
        setSyncStatus('error')
        setSyncMessage(`同期失敗: ${error.message}`)
      }
    } catch (error) {
      setSyncStatus('error')
      setSyncMessage(`同期エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 未同期データのみを送信
  const handleSyncUnsynced = async () => {
    setIsLoading(true)
    setSyncStatus('pending')
    setSyncMessage('未同期データを確認中...')

    try {
      const response = await fetch('/api/webhook/sync-unsynced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setSyncStatus('success')
        setSyncMessage(`同期完了: ${result.count}件の未同期データを送信しました`)
        setLastSync(new Date())
      } else {
        const error = await response.json()
        setSyncStatus('error')
        setSyncMessage(`同期失敗: ${error.message}`)
      }
    } catch (error) {
      setSyncStatus('error')
      setSyncMessage(`同期エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Database className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Google Sheets連携
        </CardTitle>
        <CardDescription>
          予約データをGoogle Sheetsに手動で同期できます
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 同期ステータス */}
        {syncStatus && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
            {getStatusIcon()}
            <Badge variant="secondary" className={getStatusColor()}>
              {syncMessage}
            </Badge>
          </div>
        )}

        {/* 最終同期時刻 */}
        {lastSync && (
          <div className="text-sm text-gray-600">
            最終同期: {lastSync.toLocaleString('ja-JP')}
          </div>
        )}

        <Separator />

        {/* 同期ボタン */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Button
              onClick={handleSyncUnsynced}
              disabled={isLoading}
              className="w-full"
              variant="default"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              未同期データを送信
            </Button>
            <p className="text-xs text-gray-500">
              まだGoogle Sheetsに送信されていない予約データのみを同期します
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleManualSync}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              全データを再送信
            </Button>
            <p className="text-xs text-gray-500">
              すべての予約データをGoogle Sheetsに再送信します
            </p>
          </div>
        </div>

        {/* 自動同期の説明 */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-1">📡 自動同期について</h4>
          <p className="text-xs text-blue-700">
            新しい予約が完了すると、自動的にGoogle Sheetsに同期されます。
            上記のボタンは手動で同期を行う場合にご利用ください。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}