import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { compare } from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  logger: {
    error(code, metadata) {
      console.error("NextAuth error:", code, metadata)
    },
    warn(code) {
      console.warn("NextAuth warning:", code)
    },
    debug(code, metadata) {
      console.debug("NextAuth debug:", code, metadata)
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim()
        const password = credentials?.password

        if (!email || !password) {
          console.warn("Credentials sign-in missing email or password.")
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, passwordHash: true, emailVerified: true },
        })

        if (!user?.passwordHash) {
          console.warn("Credentials sign-in failed: no password hash for email.")
          return null
        }

        const isValid = await compare(password, user.passwordHash)
        if (!isValid) {
          console.warn("Credentials sign-in failed: invalid password.")
          return null
        }

        // Require email verification before first sign-in (credentials only; Google sets emailVerified)
        if (!user.emailVerified) {
          return { id: null, email: null, name: null, error: "EmailNotVerified" } as unknown as { id: string; email: string | null; name: string | null }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.events.readonly",
          prompt: "consent",
          access_type: "offline",
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Block sign-in when credentials authorize returned an error (e.g. email not verified)
      const err = (user as { error?: string } | null)?.error
      if (err) {
        throw new Error(err)
      }
      console.debug("NextAuth signIn callback:", {
        provider: account?.provider,
        hasUser: Boolean(user?.id),
        hasProfile: Boolean(profile),
      })
      return true
    },
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = user?.id ?? (token.id as string | undefined)
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
}

// Extend the default session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}
