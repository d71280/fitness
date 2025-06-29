'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, MessageSquare, Smartphone, TestTube, Save, Eye, EyeOff, Mail, Clock, AlertCircle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ConnectionSettings {
  appBaseUrl: string
  lineChannelSecret: string
  lineChannelAccessToken: string
}

interface MessageSettings {
  bookingConfirmation: {
    enabled: boolean
    messageType: 'text' | 'flex'
    textMessage: string
    includeDetails: {
      date: boolean
      time: boolean
      program: boolean
      instructor: boolean
      studio: boolean
      capacity: boolean
    }
    customFields: string
  }
  reminder: {
    enabled: boolean
    hoursBefore: number
    messageText: string
  }
  cancellation: {
    enabled: boolean
    messageText: string
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ConnectionSettings>({
    appBaseUrl: '',
    lineChannelSecret: '',
    lineChannelAccessToken: ''
  })

  const [googleSheetsSettings, setGoogleSheetsSettings] = useState({
    serviceAccountEmail: '',
    privateKey: '',
    spreadsheetId: '',
    lineGroupToken: '',
    enabled: false
  })

  const [messageSettings, setMessageSettings] = useState<MessageSettings>({
    bookingConfirmation: {
      enabled: true,
      messageType: 'flex',
      textMessage: '✅ 予約が完了しました！\n\n📅 日時: {date} {time}\n🏃 プログラム: {program}\n👨‍🏫 インストラクター: {instructor}\n🏢 スタジオ: {studio}\n\nお忘れなくお越しください！',
      includeDetails: {
        date: true,
        time: true,
        program: true,
        instructor: true,
        studio: true,
        capacity: false
      },
      customFields: ''
    },
    reminder: {
      enabled: true,
      hoursBefore: 24,
      messageText: '【明日のレッスンのお知らせ】\n\n{program}\n📅 {date}\n⏰ {time}\n👨‍🏫 {instructor}\n🏢 {studio}\n\nお忘れなく！何かご不明な点があればお気軽にお声かけください😊'
    },
    cancellation: {
      enabled: true,
      messageText: 'ご予約をキャンセルしました。\n\nまたのご利用をお待ちしております。'
    }
  })

  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<{[key: string]: boolean | null}>({})
  const [showSecrets, setShowSecrets] = useState(false)
  const [previewMessage, setPreviewMessage] = useState('')

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(prevSettings => data.connection || prevSettings)
        setMessageSettings(prevMessageSettings => data.messages || prevMessageSettings)
        setGoogleSheetsSettings(prevGoogleSettings => data.googleSheets || prevGoogleSettings)
      }
    } catch (error) {
      console.error('設定読み込みエラー:', error)
    }
  }, [])

  // 設定を読み込み
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSave = async () => {
    setLoading(true)
    try {
      // URLにdev=trueパラメーターを追加
      const url = window.location.search.includes('dev=true') 
        ? '/api/settings?dev=true' 
        : '/api/settings'
        
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection: settings,
          messages: messageSettings,
          googleSheets: googleSheetsSettings
        })
      })

      const result = await response.json()

      if (response.ok) {
        if (result.isVercel) {
          // Vercel環境の場合は詳細な手順を表示
          const instructions = result.instructions.join('\n')
          alert(`${result.message}\n\n【設定手順】\n${instructions}`)
        } else {
          // ローカル環境の場合は通常メッセージ
          alert(result.message || '設定を保存しました')
        }
      } else {
        alert(`設定の保存に失敗しました\n\nエラー: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('設定保存エラー:', error)
      alert(`設定の保存に失敗しました\n\nエラー: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async (type: 'line') => {
    setLoading(true)
    try {
      const response = await fetch(`/api/test-connection?type=${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const result = await response.json()
      setTestResults(prev => ({ ...prev, [type]: result.success }))
      
      if (result.success) {
        alert('LINE接続テストが成功しました')
      } else {
        alert(`LINE接続テストが失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('接続テストエラー:', error)
      setTestResults(prev => ({ ...prev, [type]: false }))
      alert('接続テストに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (key: keyof ConnectionSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateMessageSetting = (section: keyof MessageSettings, key: string, value: any) => {
    setMessageSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  const updateIncludeDetail = (key: string, value: boolean) => {
    setMessageSettings(prev => ({
      ...prev,
      bookingConfirmation: {
        ...prev.bookingConfirmation,
        includeDetails: {
          ...prev.bookingConfirmation.includeDetails,
          [key]: value
        }
      }
    }))
  }

  const generatePreview = () => {
    const sampleData = {
      date: '2025年6月17日',
      time: '10:00 - 11:00',
      program: 'ヨガ',
      instructor: '田中 美香',
      studio: 'スタジオ1',
      capacity: '15/20名'
    }

    let message = messageSettings.bookingConfirmation.textMessage
    
    if (messageSettings.bookingConfirmation.includeDetails.date) {
      message = message.replace('{date}', sampleData.date)
    }
    if (messageSettings.bookingConfirmation.includeDetails.time) {
      message = message.replace('{time}', sampleData.time)
    }
    if (messageSettings.bookingConfirmation.includeDetails.program) {
      message = message.replace('{program}', sampleData.program)
    }
    if (messageSettings.bookingConfirmation.includeDetails.instructor) {
      message = message.replace('{instructor}', sampleData.instructor)
    }
    if (messageSettings.bookingConfirmation.includeDetails.studio) {
      message = message.replace('{studio}', sampleData.studio)
    }
    if (messageSettings.bookingConfirmation.includeDetails.capacity) {
      message = message.replace('{capacity}', sampleData.capacity)
    }

    setPreviewMessage(message)
  }

  const maskString = (str: string) => {
    if (!str) return ''
    if (str.length <= 8) return '*'.repeat(str.length)
    return str.substring(0, 4) + '*'.repeat(str.length - 8) + str.substring(str.length - 4)
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">システム設定</h1>
        <p className="text-gray-600">
          LINE公式アカウントとメッセージの設定を管理します
        </p>
      </div>

      {/* アプリケーション設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            アプリケーション設定
          </CardTitle>
          <CardDescription>
            基本的なアプリケーション設定
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="appBaseUrl">アプリベースURL</Label>
            <Input
              id="appBaseUrl"
              value={settings.appBaseUrl}
              onChange={(e) => updateSetting('appBaseUrl', e.target.value)}
              placeholder="https://yourdomain.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              このアプリケーションのベースURL
            </p>
          </div>
        </CardContent>
      </Card>

      {/* LINE公式アカウント設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-500" />
            LINE公式アカウント設定
          </CardTitle>
          <CardDescription>
            LINE Developers で取得した認証情報を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="lineChannelSecret">チャンネルシークレット</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="lineChannelSecret"
                type={showSecrets ? 'text' : 'password'}
                value={showSecrets ? settings.lineChannelSecret : maskString(settings.lineChannelSecret)}
                onChange={(e) => updateSetting('lineChannelSecret', e.target.value)}
                placeholder="LINE Developers から取得"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSecrets(!showSecrets)}
                className="shrink-0"
              >
                {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              LINE Developers → 作成したチャンネル → Basic settings → Channel secret
            </p>
          </div>

          <div>
            <Label htmlFor="lineChannelAccessToken">チャンネルアクセストークン</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="lineChannelAccessToken"
                type={showSecrets ? 'text' : 'password'}
                value={showSecrets ? settings.lineChannelAccessToken : maskString(settings.lineChannelAccessToken)}
                onChange={(e) => updateSetting('lineChannelAccessToken', e.target.value)}
                placeholder="LINE Developers から取得"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              LINE Developers → 作成したチャンネル → Messaging API → Channel access token
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => testConnection('line')}
              disabled={loading || !settings.lineChannelSecret || !settings.lineChannelAccessToken}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <TestTube className="h-4 w-4 mr-2" />
              接続テスト
            </Button>
            {testResults.line !== undefined && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                testResults.line ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {testResults.line ? '✓ 成功' : '✗ 失敗'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* メッセージ設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            自動メッセージ設定
          </CardTitle>
          <CardDescription>
            予約完了時やリマインダーなどの自動送信メッセージをカスタマイズできます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 予約完了メッセージ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">予約完了メッセージ</Label>
              <Switch
                checked={messageSettings.bookingConfirmation.enabled}
                onCheckedChange={(checked) => updateMessageSetting('bookingConfirmation', 'enabled', checked)}
              />
            </div>
            
            {messageSettings.bookingConfirmation.enabled && (
              <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                <div>
                  <Label htmlFor="messageType">メッセージ形式</Label>
                  <Select
                    value={messageSettings.bookingConfirmation.messageType}
                    onValueChange={(value) => updateMessageSetting('bookingConfirmation', 'messageType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">テキストメッセージ</SelectItem>
                      <SelectItem value="flex">リッチメッセージ（推奨）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="textMessage">メッセージ内容</Label>
                  <Textarea
                    id="textMessage"
                    value={messageSettings.bookingConfirmation.textMessage}
                    onChange={(e) => updateMessageSetting('bookingConfirmation', 'textMessage', e.target.value)}
                    rows={6}
                    placeholder="予約完了メッセージを入力..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    使用可能な変数: {'{date}'}, {'{time}'}, {'{program}'}, {'{instructor}'}, {'{studio}'}, {'{capacity}'}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">送信する情報を選択</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(messageSettings.bookingConfirmation.includeDetails).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) => updateIncludeDetail(key, checked)}
                        />
                        <Label className="text-sm">
                          {key === 'date' && '日付'}
                          {key === 'time' && '時間'}
                          {key === 'program' && 'プログラム'}
                          {key === 'instructor' && 'インストラクター'}
                          {key === 'studio' && 'スタジオ'}
                          {key === 'capacity' && '定員情報'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Button onClick={generatePreview} variant="outline" size="sm">
                    プレビュー生成
                  </Button>
                  {previewMessage && (
                    <div className="mt-2 p-3 bg-gray-50 rounded border">
                      <Label className="text-sm font-medium">プレビュー:</Label>
                      <div className="whitespace-pre-wrap text-sm mt-1">{previewMessage}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* リマインダーメッセージ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">リマインダーメッセージ</Label>
              <Switch
                checked={messageSettings.reminder.enabled}
                onCheckedChange={(checked) => updateMessageSetting('reminder', 'enabled', checked)}
              />
            </div>
            
            {messageSettings.reminder.enabled && (
              <div className="space-y-4 pl-4 border-l-2 border-orange-200">
                <div>
                  <Label htmlFor="reminderHours" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    送信タイミング（時間前）
                  </Label>
                  <Select
                    value={messageSettings.reminder.hoursBefore.toString()}
                    onValueChange={(value) => updateMessageSetting('reminder', 'hoursBefore', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1時間前</SelectItem>
                      <SelectItem value="3">3時間前</SelectItem>
                      <SelectItem value="6">6時間前</SelectItem>
                      <SelectItem value="12">12時間前</SelectItem>
                      <SelectItem value="24">24時間前（1日前）</SelectItem>
                      <SelectItem value="48">48時間前（2日前）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reminderMessage">リマインダーメッセージ</Label>
                  <Textarea
                    id="reminderMessage"
                    value={messageSettings.reminder.messageText}
                    onChange={(e) => updateMessageSetting('reminder', 'messageText', e.target.value)}
                    rows={4}
                    placeholder="リマインダーメッセージを入力..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* キャンセルメッセージ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">キャンセル通知メッセージ</Label>
              <Switch
                checked={messageSettings.cancellation.enabled}
                onCheckedChange={(checked) => updateMessageSetting('cancellation', 'enabled', checked)}
              />
            </div>
            
            {messageSettings.cancellation.enabled && (
              <div className="space-y-4 pl-4 border-l-2 border-red-200">
                <div>
                  <Label htmlFor="cancellationMessage">キャンセル通知メッセージ</Label>
                  <Textarea
                    id="cancellationMessage"
                    value={messageSettings.cancellation.messageText}
                    onChange={(e) => updateMessageSetting('cancellation', 'messageText', e.target.value)}
                    rows={3}
                    placeholder="キャンセル通知メッセージを入力..."
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* スプレッドシート連携設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 スプレッドシート & グループLINE連携
          </CardTitle>
          <CardDescription>
            予約データをスプレッドシートに自動記録し、事業者向けグループLINEに通知を送信
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={googleSheetsSettings.enabled}
              onCheckedChange={(checked) => 
                setGoogleSheetsSettings(prev => ({ ...prev, enabled: checked }))
              }
            />
            <Label className="text-sm font-medium">
              スプレッドシート連携を有効にする
            </Label>
          </div>

          {googleSheetsSettings.enabled && (
            <div className="space-y-4 pl-4 border-l-2 border-green-200">
              <div>
                <Label htmlFor="spreadsheetId">スプレッドシートID</Label>
                <Input
                  id="spreadsheetId"
                  type="text"
                  value={googleSheetsSettings.spreadsheetId}
                  onChange={(e) => setGoogleSheetsSettings(prev => ({ 
                    ...prev, 
                    spreadsheetId: e.target.value 
                  }))}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  スプレッドシートのURLから取得できます
                </p>
              </div>

              <div>
                <Label htmlFor="serviceAccountEmail">Google サービスアカウントEmail</Label>
                <Input
                  id="serviceAccountEmail"
                  type="email"
                  value={googleSheetsSettings.serviceAccountEmail}
                  onChange={(e) => setGoogleSheetsSettings(prev => ({ 
                    ...prev, 
                    serviceAccountEmail: e.target.value 
                  }))}
                  placeholder="service-account@project.iam.gserviceaccount.com"
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="privateKey">Google サービスアカウント秘密鍵</Label>
                <Textarea
                  id="privateKey"
                  value={showSecrets ? googleSheetsSettings.privateKey : '••••••••'}
                  onChange={(e) => setGoogleSheetsSettings(prev => ({ 
                    ...prev, 
                    privateKey: e.target.value 
                  }))}
                  placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                  className="font-mono text-xs h-20"
                  readOnly={!showSecrets}
                />
              </div>

              <div>
                <Label htmlFor="lineGroupToken">グループLINE Botアクセストークン</Label>
                <Input
                  id="lineGroupToken"
                  type={showSecrets ? 'text' : 'password'}
                  value={googleSheetsSettings.lineGroupToken}
                  onChange={(e) => setGoogleSheetsSettings(prev => ({ 
                    ...prev, 
                    lineGroupToken: e.target.value 
                  }))}
                  placeholder="グループ通知用のLINE Botアクセストークン"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  事業者通知用のグループLINE Botトークン
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={testGoogleSheetsConnection}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  📊 スプレッドシート接続テスト
                </Button>
                
                <Button
                  onClick={testGroupLineNotification}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  💬 グループLINE通知テスト
                </Button>
              </div>

              {(testResults.googleSheets !== undefined || testResults.groupLine !== undefined) && (
                <div className="mt-4 p-3 rounded-lg border bg-gray-50">
                  <h4 className="font-medium mb-2">テスト結果</h4>
                  {testResults.googleSheets !== undefined && (
                    <p className={`text-sm ${testResults.googleSheets ? 'text-green-600' : 'text-red-600'}`}>
                      📊 スプレッドシート接続: {testResults.googleSheets ? '✅ 成功' : '❌ 失敗'}
                    </p>
                  )}
                  {testResults.groupLine !== undefined && (
                    <p className={`text-sm ${testResults.groupLine ? 'text-green-600' : 'text-red-600'}`}>
                      💬 グループLINE通知: {testResults.groupLine ? '✅ 成功' : '❌ 失敗'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {loading ? '保存中...' : '設定を保存'}
        </Button>
      </div>
    </div>
  )

  // テスト関数
  async function testGoogleSheetsConnection() {
    setLoading(true)
    try {
      const response = await fetch('/api/test-connection?type=googlesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleSheetsSettings)
      })
      
      const result = await response.json()
      setTestResults(prev => ({ ...prev, googleSheets: result.success }))
      
      if (result.success) {
        alert(`✅ スプレッドシート接続成功!\nタイトル: ${result.spreadsheetTitle}`)
      } else {
        alert(`❌ スプレッドシート接続失敗: ${result.error}`)
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, googleSheets: false }))
      alert('❌ スプレッドシート接続テストでエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  async function testGroupLineNotification() {
    setLoading(true)
    try {
      const response = await fetch('/api/test-connection?type=groupline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleSheetsSettings)
      })
      
      const result = await response.json()
      setTestResults(prev => ({ ...prev, groupLine: result.success }))
      
      if (result.success) {
        alert('✅ グループLINE通知テスト送信成功!')
      } else {
        alert(`❌ グループLINE通知テスト失敗: ${result.error}`)
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, groupLine: false }))
      alert('❌ グループLINE通知テストでエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }
}