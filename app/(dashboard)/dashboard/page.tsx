'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardStats } from '@/components/admin/dashboard-stats'
import { WebhookSyncSection } from '@/components/admin/webhook-sync-section'
import { Calendar, Users, Activity, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground">
          フィットネススタジオの運営状況を確認できます
        </p>
      </div>

      {/* 統計カード */}
      <DashboardStats />

      {/* Google Sheets同期セクション */}
      <WebhookSyncSection />

      {/* グリッドレイアウト */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 今日のスケジュール */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              今日のスケジュール
            </CardTitle>
            <CardDescription>
              本日開催されるクラス一覧
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <div>
                  <div className="font-medium">ヨガ</div>
                  <div className="text-sm text-gray-600">10:00 - 11:00</div>
                </div>
                <div className="text-sm text-green-600">15/20名</div>
              </div>
              <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                <div>
                  <div className="font-medium">ピラティス</div>
                  <div className="text-sm text-gray-600">14:00 - 14:45</div>
                </div>
                <div className="text-sm text-purple-600">12/15名</div>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                <div>
                  <div className="font-medium">ズンバ</div>
                  <div className="text-sm text-gray-600">19:00 - 20:00</div>
                </div>
                <div className="text-sm text-red-600">28/30名</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 最近の予約 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              最近の予約
            </CardTitle>
            <CardDescription>
              直近の予約状況
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">山田 太郎</div>
                  <div className="text-sm text-gray-600">ヨガ - 6/17 10:00</div>
                </div>
                <div className="text-xs text-gray-500">5分前</div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">佐藤 花子</div>
                  <div className="text-sm text-gray-600">ピラティス - 6/17 14:00</div>
                </div>
                <div className="text-xs text-gray-500">12分前</div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">田中 一郎</div>
                  <div className="text-sm text-gray-600">HIIT - 6/18 09:00</div>
                </div>
                <div className="text-xs text-gray-500">23分前</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 人気プログラム */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              人気プログラム
            </CardTitle>
            <CardDescription>
              今月の予約数ランキング
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">ヨガ</span>
                </div>
                <span className="text-sm text-gray-600">124回</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="font-medium">ズンバ</span>
                </div>
                <span className="text-sm text-gray-600">98回</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="font-medium">ピラティス</span>
                </div>
                <span className="text-sm text-gray-600">76回</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="font-medium">HIIT</span>
                </div>
                <span className="text-sm text-gray-600">54回</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 追加情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            運営ヒント
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">📱 LINE通知</h3>
              <p className="text-sm text-blue-700">
                予約完了とリマインダー通知が自動で送信されます。開発環境ではコンソールに出力されます。
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">🔄 繰り返しスケジュール</h3>
              <p className="text-sm text-green-700">
                週次レッスンなどの定期開催には繰り返しスケジュール機能をご活用ください。
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">📊 空き状況</h3>
              <p className="text-sm text-purple-700">
                スケジュールブロックで各クラスの予約状況をリアルタイムで確認できます。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}