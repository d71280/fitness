import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fitness Studio Booking System',
  description: 'フィットネススタジオの予約管理システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={inter.className}>
        {/* LIFF SDK - Next.js Script コンポーネント使用 */}
        <Script
          id="liff-sdk"
          src="https://static.line-scdn.net/liff/edge/2/sdk.js"
          strategy="beforeInteractive"
          onLoad={() => {
            console.log('✅ LIFF SDK読み込み成功')
            if (typeof window !== 'undefined') {
              console.log('🔧 window.liff:', typeof window.liff)
            }
          }}
          onError={(e) => {
            console.error('❌ LIFF SDK読み込みエラー:', e)
          }}
        />
        {children}
      </body>
    </html>
  )
}