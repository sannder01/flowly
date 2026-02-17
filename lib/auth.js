// lib/auth.js
import GoogleProvider from 'next-auth/providers/google';
import { PostgresAdapter } from './auth-adapter';

/** @type {import('next-auth').NextAuthOptions} */
export const authOptions = {
  adapter: PostgresAdapter(),

  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],

  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },

  pages: {
    signIn: '/auth',
    error:  '/auth',
  },

  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      },
    },
  },
};
