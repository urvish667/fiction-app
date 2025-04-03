import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import { defaultPreferences, UserPreferences } from '@/types/user'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { User } from '@prisma/client'

declare module 'next-auth' {
  interface User extends Omit<User, 'preferences'> {
    preferences: UserPreferences
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      username?: string | null
      isProfileComplete?: boolean
      unreadNotifications: number
      preferences: UserPreferences
    }
    expires: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username?: string | null
    isProfileComplete?: boolean
    unreadNotifications: number
    preferences: UserPreferences
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          return null
        }

        const preferences = user.preferences ? JSON.parse(user.preferences as string) as UserPreferences : defaultPreferences

        return {
          ...user,
          preferences,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.username = token.username
        session.user.isProfileComplete = token.isProfileComplete
        session.user.unreadNotifications = token.unreadNotifications
        session.user.preferences = token.preferences
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.isProfileComplete = user.isProfileComplete
        token.unreadNotifications = user.unreadNotifications
        token.preferences = user.preferences
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
} 