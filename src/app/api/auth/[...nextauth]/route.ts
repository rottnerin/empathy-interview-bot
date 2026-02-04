import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        name: { label: 'Name', type: 'text' },
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.email) {
          return null
        }
        return {
          id: credentials.email,
          name: credentials.name,
          email: credentials.email,
        }
      },
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user = {
          name: token.name,
          email: token.email,
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name
        token.email = user.email
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
