import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if the user's email domain is @aes.ac.in
      if (user.email && user.email.endsWith('@aes.ac.in')) {
        return true
      }
      // Redirect to error page or return false to deny access
      return false
    },
    async session({ session, token }) {
      // Ensure only @aes.ac.in emails are in the session
      if (session.user?.email && !session.user.email.endsWith('@aes.ac.in')) {
        throw new Error('Unauthorized domain')
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        // Verify domain on token creation
        if (user.email && !user.email.endsWith('@aes.ac.in')) {
          throw new Error('Unauthorized domain')
        }
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
