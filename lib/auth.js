// lib/auth.js
// ─────────────────────────────────────────────────────────────
//  NextAuth configuration — shared between:
//   - app/api/auth/[...nextauth]/route.js  (API handler)
//   - any server component that calls getServerSession()
// ─────────────────────────────────────────────────────────────
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
          // Request offline access so we get a refresh token
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],

  session: {
    strategy: 'database',   // store sessions in pg, not JWT cookies
    maxAge: 30 * 24 * 60 * 60,  // 30 days
  },

  callbacks: {
    // Expose user.id in the session object so we can use it in API routes
    async session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },

  pages: {
    signIn: '/auth',    // our custom sign-in page
    error:  '/auth',    // redirect errors to same page
  },
};
