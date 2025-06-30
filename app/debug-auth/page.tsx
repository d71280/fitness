'use client'

// 動的レンダリングを強制してプリレンダリングエラーを回避
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthDebugPage() {
  const [diagnostics, setDiagnostics] = useState<any>({})
  const [supabaseConfig, setSupabaseConfig] = useState<any>({})
  
  useEffect(() => {
    const runDiagnostics = async () => {
      // ブラウザ環境情報
      const browserInfo = {
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        origin: window.location.origin,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        port: window.location.port,
        pathname: window.location.pathname,
      }

      // 環境変数情報
      const envInfo = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        nodeEnv: process.env.NODE_ENV,
      }

      // Supabaseクライアント情報
      const supabase = createClient()
      let authInfo = {}
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        authInfo = {
          isAuthenticated: !!user,
          userId: user?.id,
          userEmail: user?.email,
          error: error?.message,
        }
      } catch (err: any) {
        authInfo = {
          isAuthenticated: false,
          error: err.message,
        }
      }

      // 推奨設定値
      const recommendations = {
        googleCloudConsole: {
          authorizedJavaScriptOrigins: [
            'http://localhost:3000',
            window.location.origin,
          ],
          authorizedRedirectUris: [
            'http://localhost:3000/auth/callback',
            `${window.location.origin}/auth/callback`,
            'https://*.supabase.co/auth/v1/callback',
          ],
        },
        supabaseSettings: {
          siteUrl: window.location.origin,
          redirectUrls: [
            'http://localhost:3000/**',
            `${window.location.origin}/**`,
          ],
        },
      }

      setDiagnostics({
        browserInfo,
        envInfo,
        authInfo,
        recommendations,
        timestamp: new Date().toISOString(),
      })
    }

    runDiagnostics()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('クリップボードにコピーしました')
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Google認証診断ページ</h1>
      
      <div className="space-y-6">
        {/* ブラウザ環境情報 */}
        <Card>
          <CardHeader>
            <CardTitle>🌐 ブラウザ環境情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              {Object.entries(diagnostics.browserInfo || {}).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-4">
                  <span className="font-medium">{key}:</span>
                  <span className="col-span-2 break-all">{value as string}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 環境変数情報 */}
        <Card>
          <CardHeader>
            <CardTitle>⚙️ 環境変数情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              {Object.entries(diagnostics.envInfo || {}).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-4">
                  <span className="font-medium">{key}:</span>
                  <span className="col-span-2">{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 認証状態 */}
        <Card>
          <CardHeader>
            <CardTitle>🔐 認証状態</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              {Object.entries(diagnostics.authInfo || {}).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-4">
                  <span className="font-medium">{key}:</span>
                  <span className="col-span-2">{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Google Cloud Console推奨設定 */}
        <Card>
          <CardHeader>
            <CardTitle>☁️ Google Cloud Console推奨設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">承認済みJavaScriptの生成元:</h4>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                  {diagnostics.recommendations?.googleCloudConsole?.authorizedJavaScriptOrigins?.map((url: string, i: number) => (
                    <div key={i} className="flex justify-between items-center">
                      <span>{url}</span>
                      <button 
                        onClick={() => copyToClipboard(url)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        コピー
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">承認済みリダイレクトURI:</h4>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                  {diagnostics.recommendations?.googleCloudConsole?.authorizedRedirectUris?.map((url: string, i: number) => (
                    <div key={i} className="flex justify-between items-center">
                      <span>{url}</span>
                      <button 
                        onClick={() => copyToClipboard(url)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        コピー
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supabase推奨設定 */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Supabase推奨設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Site URL:</h4>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm flex justify-between items-center">
                  <span>{diagnostics.recommendations?.supabaseSettings?.siteUrl}</span>
                  <button 
                    onClick={() => copyToClipboard(diagnostics.recommendations?.supabaseSettings?.siteUrl)}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    コピー
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Redirect URLs:</h4>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                  {diagnostics.recommendations?.supabaseSettings?.redirectUrls?.map((url: string, i: number) => (
                    <div key={i} className="flex justify-between items-center">
                      <span>{url}</span>
                      <button 
                        onClick={() => copyToClipboard(url)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        コピー
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* デバッグ情報 */}
        <Card>
          <CardHeader>
            <CardTitle>🐛 デバッグ情報（JSON）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-3 rounded">
              <button 
                onClick={() => copyToClipboard(JSON.stringify(diagnostics, null, 2))}
                className="mb-2 text-blue-600 hover:underline text-sm"
              >
                全データをコピー
              </button>
              <pre className="text-xs overflow-auto max-h-96">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 