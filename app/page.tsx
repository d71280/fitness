'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, Settings, BookOpen } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Google OAuth認証コールバックの一時的な処理
  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      console.log('Auth code detected on root page, redirecting to callback...')
      // Google認証のcodeパラメータがある場合、正しいコールバックURLにリダイレクト
      const currentUrl = new URL(window.location.href)
      const callbackUrl = `/auth/callback${currentUrl.search}`
      router.replace(callbackUrl)
    }
  }, [searchParams, router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">
            フィットネススタジオ予約システム
          </h1>
          <p className="text-lg text-gray-600">
            簡単予約、スマート管理で、より良いフィットネス体験を
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                WEB版予約
              </CardTitle>
              <CardDescription>
                ブラウザから簡単予約（LINE通知なし）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/public-schedule">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  WEB版で予約する
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                LINE版予約
              </CardTitle>
              <CardDescription>
                LINE認証で予約完了通知あり
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a 
                href={`https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  LINEアプリで予約する
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                管理ダッシュボード
              </CardTitle>
              <CardDescription>
                スケジュール管理、予約管理、顧客管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/signin">
                <Button className="w-full">
                  管理画面へログイン
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                予約履歴
              </CardTitle>
              <CardDescription>
                お客様の予約履歴とマイページ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                準備中
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                システム設定
              </CardTitle>
              <CardDescription>
                プログラム管理、インストラクター管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                準備中
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-sm text-gray-500">
          Phase 1: 基本機能（週間カレンダー、スケジュール管理）実装完了
        </div>
      </div>
    </main>
  )
}