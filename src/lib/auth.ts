import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { getWebUser, createWebUser, verifyPassword } from "@/lib/database"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const email = credentials.email as string
                const password = credentials.password as string

                const user = getWebUser(email)
                if (!user) return null

                const isValid = await verifyPassword(email, password)
                if (!isValid) return null

                return {
                    id: email,
                    email: user.email,
                    name: user.name,
                    image: user.image || null,
                    role: user.role
                }
            }
        })
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                const email = user.email!
                let dbUser = getWebUser(email)

                if (!dbUser) {
                    // Create new user from Google profile
                    await createWebUser({
                        email: email,
                        password: null, // No password for OAuth users
                        name: user.name || "",
                        firstName: profile?.given_name || user.name?.split(' ')[0] || "",
                        lastName: profile?.family_name || user.name?.split(' ').slice(1).join(' ') || "",
                        role: "user",
                        provider: "google",
                        providerId: account.providerAccountId,
                        image: user.image || null
                    })
                }
            }
            return true
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.role = user.role
                token.provider = account?.provider
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as string
                session.user.provider = token.provider as string
            }
            return session
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt"
    }
})
