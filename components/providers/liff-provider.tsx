'use client'

import { useEffect } from 'react'
import Script from 'next/script'

export function LiffProvider() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.liff) {
      console.log('✅ LIFF SDK is already available')
    }
  }, [])

  return (
    <>
      <Script
        id="liff-sdk"
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        strategy="afterInteractive"
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
    </>
  )
} 