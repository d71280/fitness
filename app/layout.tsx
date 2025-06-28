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
        {/* LIFF SDK - 公式ドキュメント推奨設定 */}
        <script 
          charSet="utf-8"
          src="https://static.line-scdn.net/liff/edge/2/sdk.js"
          defer
        ></script>
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}