import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { LiffProvider } from '@/components/providers/liff-provider'

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
        <LiffProvider />
        {children}
      </body>
    </html>
  )
}