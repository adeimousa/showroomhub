import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or Phone', type: 'text' },
        password:   { label: 'Password',       type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null

        // Try to find user by email or phone
        const identifier = credentials.identifier.trim()
        let user = null

        // First try email (contains @)
        if (identifier.includes('@')) {
          user = await db.user.findUnique({
            where: { email: identifier.toLowerCase() },
            include: { tenant: true },
          })
        }

        // If not found by email, try phone (sanitize: keep only digits)
        if (!user) {
          const sanitizedPhone = identifier.replace(/\D/g, '') // Remove all non-digits
          user = await db.user.findUnique({
            where: { phone: sanitizedPhone },
            include: { tenant: true },
          })
        }

        if (!user) return null
        if (user.password !== credentials.password) return null

        return {
          id: user.id,
          email: user.email || user.phone, // Use phone as fallback for email field
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          phone: user.phone,
        } as any
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-expect-error custom fields
        token.role = user.role
        // @ts-expect-error custom fields
        token.tenantId = user.tenantId
        // @ts-expect-error custom fields
        token.userId = user.id
        // @ts-expect-error custom fields
        token.phone = user.phone
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error custom fields
        session.user.role = token.role
        // @ts-expect-error custom fields
        session.user.tenantId = token.tenantId
        // @ts-expect-error custom fields
        session.user.id = token.userId
        // @ts-expect-error custom fields
        session.user.phone = token.phone
      }
      return session
    },
  },
  pages: {
    // We don't use NextAuth's login page — our root `/` handles login.
    // Avoid setting signIn here to prevent redirect loops on preview domains.
    signOut: '/',
    error: '/',
  },
}

// Augment NextAuth types for custom fields
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      phone?: string | null
      image?: string | null
      role?: string
      tenantId?: string | null
    }
  }
  interface User {
    role?: string
    tenantId?: string | null
    phone?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    tenantId?: string | null
    userId?: string
    phone?: string | null
  }
}
