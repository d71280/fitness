import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // LIFFからのリクエストの場合、特別な処理
  const isLIFFRequest = request.headers.get('user-agent')?.includes('Line') || 
                       request.headers.get('x-requested-with')?.includes('line')
  
  if (isLIFFRequest) {
    console.log('LIFF request detected')
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - auth paths (authentication callbacks)
     * - api paths for LIFF requests
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}