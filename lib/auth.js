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
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id;
      return session;
    },
  },

  pages: {
    signIn: '/auth',
    error:  '/auth',
  },
};
