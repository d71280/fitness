import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
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

        try {
          // データベース接続チェック
          const admin = await prisma.admin.findUnique({
            where: { email: credentials.email },
          })

          if (!admin || !await bcrypt.compare(credentials.password, admin.password)) {
            return null
          }

          return {
            id: admin.id.toString(),
            email: admin.email,
            name: admin.name,
            role: admin.role,
          }
        } catch (dbError) {
          console.warn('データベース接続エラー、デモアカウントでログインを許可します:', dbError)
          
          // デモアカウント用のハードコーディング認証
          if (credentials.email === 'admin@demo.com' && credentials.password === 'demo123') {
            return {
              id: '1',
              email: 'admin@demo.com',
              name: 'Demo Admin',
              role: 'admin',
            }
          }
          
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub || ''
        session.user.role = token.role || 'user'
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}