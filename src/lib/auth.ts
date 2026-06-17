import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { tenant: true },
        })
        if (!user) return null
        if (user.password !== credentials.password) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
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
      image?: string | null
      role?: string
      tenantId?: string | null
    }
  }
  interface User {
    role?: string
    tenantId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    tenantId?: string | null
    userId?: string
  }
}
