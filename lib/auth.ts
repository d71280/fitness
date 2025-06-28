import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-key-change-in-production',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // シンプルなデモ認証（ビルドエラー回避）
        if (credentials.email === 'admin@demo.com' && credentials.password === 'demo123') {
          return {
            id: '1',
            email: 'admin@demo.com',
            name: 'Demo Admin',
            role: 'admin',
          }
        }

        // 今後、実際のデータベース認証を実装予定
        return null
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.sub || ''
        ;(session.user as any).role = token.role || 'user'
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}