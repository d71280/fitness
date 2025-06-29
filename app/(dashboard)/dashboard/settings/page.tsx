'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, TestTube, Save, Eye, EyeOff, Mail, Smartphone } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

interface ConnectionSettings {
  appBaseUrl: string
  lineChannelAccessToken: string
  lineChannelSecret: string
  liffId: string
  richMenuId: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ConnectionSettings>({
    appBaseUrl: '',
    lineChannelAccessToken: '',
    lineChannelSecret: '',
    liffId: '',
    richMenuId: ''
  })

  const [googleSheetsSettings, setGoogleSheetsSettings] = useState({
    serviceAccountEmail: '',
    privateKey: '',
    spreadsheetId: '',
    lineGroupToken: '',
    enabled: false
  })

  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<{[key: string]: boolean | null}>({})
  const [showSecrets, setShowSecrets] = useState(false)

  // 設定読み込み
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      
      if (data.success && data.connection) {
        setSettings({
          appBaseUrl: data.connection.appBaseUrl || '',
          lineChannelAccessToken: data.connection.lineChannelAccessToken || '',
          lineChannelSecret: data.connection.lineChannelSecret || '',
          liffId: data.connection.liffId || '',
          richMenuId: data.connection.richMenuId || ''
        })
      }
      
      if (data.success && data.googleSheets) {
        setGoogleSheetsSettings(data.googleSheets)
      }
    } catch (error) {
      console.error('設定読み込みエラー:', error)
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection: settings,
          googleSheets: googleSheetsSettings
        })
      })

      const result = await response.json()
      
      if (result.success) {
        alert('設定が保存されました')
      } else {
        alert(`設定保存に失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('設定保存エラー:', error)
      alert('設定保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const testGoogleSheets = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-connection?type=sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleSheetsSettings)
      })

      const result = await response.json()
      setTestResults(prev => ({ ...prev, sheets: result.success }))
      
      if (result.success) {
        alert('Google Sheets接続テストが成功しました')
      } else {
        alert(`Google Sheets接続テストが失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('Google Sheets接続テストエラー:', error)
      setTestResults(prev => ({ ...prev, sheets: false }))
      alert('Google Sheets接続テストに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const testLineNotification = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-connection?type=line-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleSheetsSettings)
      })

      const result = await response.json()
      setTestResults(prev => ({ ...prev, lineGroup: result.success }))
      
      if (result.success) {
        alert('グループLINE通知テストが成功しました')
      } else {
        alert(`グループLINE通知テストが失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('グループLINE通知テストエラー:', error)
      setTestResults(prev => ({ ...prev, lineGroup: false }))
      alert('グループLINE通知テストに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const testLineOfficial = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-connection?type=line-official', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const result = await response.json()
      setTestResults(prev => ({ ...prev, lineOfficial: result.success }))
      
      if (result.success) {
        alert('LINE公式アカウント接続テストが成功しました')
      } else {
        alert(`LINE公式アカウント接続テストが失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('LINE公式アカウント接続テストエラー:', error)
      setTestResults(prev => ({ ...prev, lineOfficial: false }))
      alert('LINE公式アカウント接続テストに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (key: keyof ConnectionSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateGoogleSheetsSetting = (key: string, value: any) => {
    setGoogleSheetsSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const maskString = (str: string) => {
    if (!str || str.length <= 8) return str
    const start = str.substring(0, 4)
    const end = str.substring(str.length - 4)
    return `${start}${'*'.repeat(str.length - 8)}${end}`
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">システム設定</h1>
        <p className="text-gray-600">
          アプリケーション設定とスプレッドシート連携を管理します
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
            LINE公式アカウント連携
          </CardTitle>
          <CardDescription>
            LINE Messaging API設定とLIFF設定を管理します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="lineChannelAccessToken">チャンネルアクセストークン</Label>
            <div className="relative">
              <Input
                id="lineChannelAccessToken"
                type={showSecrets ? 'text' : 'password'}
                value={settings.lineChannelAccessToken}
                onChange={(e) => updateSetting('lineChannelAccessToken', e.target.value)}
                placeholder="LINE Developers > Messaging API > チャンネルアクセストークン"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSecrets(!showSecrets)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="lineChannelSecret">チャンネルシークレット</Label>
            <Input
              id="lineChannelSecret"
              type={showSecrets ? 'text' : 'password'}
              value={settings.lineChannelSecret}
              onChange={(e) => updateSetting('lineChannelSecret', e.target.value)}
              placeholder="LINE Developers > Basic settings > チャンネルシークレット"
            />
          </div>
          
          <div>
            <Label htmlFor="liffId">LIFF ID</Label>
            <Input
              id="liffId"
              value={settings.liffId}
              onChange={(e) => updateSetting('liffId', e.target.value)}
              placeholder="LINE Developers > LIFF > LIFF ID"
            />
          </div>
          
          <div>
            <Label htmlFor="richMenuId">リッチメニューID（任意）</Label>
            <Input
              id="richMenuId"
              value={settings.richMenuId}
              onChange={(e) => updateSetting('richMenuId', e.target.value)}
              placeholder="richMenuId-xxxxx..."
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={testLineOfficial}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              {loading ? '接続テスト中...' : 'LINE接続テスト'}
            </Button>
            {testResults.lineOfficial !== null && (
              <div className={`px-3 py-2 rounded-md text-sm ${
                testResults.lineOfficial 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {testResults.lineOfficial ? '✓ 接続成功' : '✗ 接続失敗'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* スプレッドシート & グループLINE連携設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-green-500" />
            スプレッドシート & グループLINE連携
          </CardTitle>
          <CardDescription>
            予約情報をGoogle Sheetsに記録し、グループLINEに通知を送信します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enable-sheets">スプレッドシート連携を有効にする</Label>
              <p className="text-xs text-gray-500 mt-1">
                予約完了時に自動でスプレッドシートに記録されます
              </p>
            </div>
            <Switch
              id="enable-sheets"
              checked={googleSheetsSettings.enabled}
              onCheckedChange={(checked) => updateGoogleSheetsSetting('enabled', checked)}
            />
          </div>

          {googleSheetsSettings.enabled && (
            <>
              <div>
                <Label htmlFor="serviceAccountEmail">Google サービスアカウントメール</Label>
                <Input
                  id="serviceAccountEmail"
                  value={googleSheetsSettings.serviceAccountEmail}
                  onChange={(e) => updateGoogleSheetsSetting('serviceAccountEmail', e.target.value)}
                  placeholder="service-account@project.iam.gserviceaccount.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Google Cloud Platform で作成したサービスアカウントのメールアドレス
                </p>
              </div>

              <div>
                <Label htmlFor="privateKey">Google プライベートキー</Label>
                <Textarea
                  id="privateKey"
                  value={showSecrets ? googleSheetsSettings.privateKey : maskString(googleSheetsSettings.privateKey)}
                  onChange={(e) => updateGoogleSheetsSetting('privateKey', e.target.value)}
                  placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                  rows={4}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    サービスアカウントのJSONキーファイルから取得
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSecrets(!showSecrets)}
                  >
                    {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="spreadsheetId">スプレッドシートID</Label>
                <Input
                  id="spreadsheetId"
                  value={googleSheetsSettings.spreadsheetId}
                  onChange={(e) => updateGoogleSheetsSetting('spreadsheetId', e.target.value)}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Google SheetsのURLから取得: https://docs.google.com/spreadsheets/d/<strong>ID</strong>/edit
                </p>
              </div>

              <div>
                <Label htmlFor="lineGroupToken">グループLINE Botアクセストークン</Label>
                <Input
                  id="lineGroupToken"
                  type={showSecrets ? 'text' : 'password'}
                  value={showSecrets ? googleSheetsSettings.lineGroupToken : maskString(googleSheetsSettings.lineGroupToken)}
                  onChange={(e) => updateGoogleSheetsSetting('lineGroupToken', e.target.value)}
                  placeholder="グループ通知用のLINE Botトークン"
                />
                <p className="text-xs text-gray-500 mt-1">
                  事業者グループ通知用のLINE Botアクセストークン（Google Apps Scriptで使用）
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={testGoogleSheets}
                  disabled={loading || !googleSheetsSettings.spreadsheetId}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  📊 スプレッドシート接続テスト
                </Button>
                {testResults.sheets !== undefined && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                    testResults.sheets ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {testResults.sheets ? '✓ 成功' : '✗ 失敗'}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={testLineNotification}
                  disabled={loading || !googleSheetsSettings.lineGroupToken}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  💬 グループLINE通知テスト
                </Button>
                {testResults.lineGroup !== undefined && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                    testResults.lineGroup ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {testResults.lineGroup ? '✓ 成功' : '✗ 失敗'}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          設定を保存
        </Button>
      </div>
    </div>
  )
}