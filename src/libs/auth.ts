import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
  session: {
    strategy: 'jwt'
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'
          const trimmedBase = (rawBase || '').replace(/\/+$/, '')
          
          // Remove endpoints to get the base host
          let baseHost = trimmedBase
          if (baseHost.endsWith('/api')) baseHost = baseHost.slice(0, -4)
          if (baseHost.endsWith('/bk')) baseHost = baseHost.slice(0, -3)
          
          const loginUrl = `${baseHost}/bk/login`

          const res = await fetch(loginUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password
            })
          })

          const text = await res.text()
          let data: any
          try {
            data = text ? JSON.parse(text) : {}
          } catch {
            data = { success: false, message: text || 'Invalid response' }
          }

          if (!res.ok || data?.success === false) {
            const errMsg =
              (typeof data?.message === 'string' && data.message) ||
              (typeof data?.error === 'string' && data.error) ||
              'CredentialsSignin'
            throw new Error(errMsg)
          }

          const payload = data?.data ?? data
          const userPayload = payload?.user ?? payload?.usuario ?? null
          const token = payload?.token ?? payload?.access_token ?? payload?.accessToken ?? null

          if (userPayload && token) {
            const permissionsSource =
              payload?.permisos?.permisos ??
              userPayload?.permissions ??
              []

            const normalizedPermissions = Array.isArray(permissionsSource)
              ? permissionsSource.map((p: any) =>
                  typeof p === 'string' ? { id: 0, name: p } : p
                )
              : []

            const roleObj = userPayload?.role ||
              (userPayload?.role_id
                ? {
                    id: userPayload.role_id,
                    name: userPayload.role_name,
                    permissions: normalizedPermissions
                  }
                : undefined)

            const user: any = {
              id: String(userPayload.id ?? userPayload.user_id ?? ''),
              name: userPayload.name ?? userPayload.nombre ?? '',
              email: userPayload.email ?? userPayload.correo ?? '',
              superadmin: Boolean(userPayload.superadmin),
              role_id: userPayload.role_id,
              role: roleObj,
              permissions: normalizedPermissions,
              accessToken: token
            }

            return user
          }

          return null
        } catch (error: any) {
          const message = typeof error?.message === 'string' ? error.message : 'CredentialsSignin'
          throw new Error(message)
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        ;(token as any).id = (user as any).id
        ;(token as any).name = (user as any).name
        ;(token as any).email = (user as any).email
        ;(token as any).superadmin = (user as any).superadmin
        ;(token as any).role_id = (user as any).role_id
        ;(token as any).role = (user as any).role
        ;(token as any).permissions = (user as any).permissions
        ;(token as any).accessToken = (user as any).accessToken
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = (token as any).id
        session.user.name = (token as any).name
        session.user.email = (token as any).email
        ;(session.user as any).superadmin = (token as any).superadmin
        ;(session.user as any).role_id = (token as any).role_id
        ;(session.user as any).role = (token as any).role
        ;(session.user as any).permissions = (token as any).permissions
        ;(session.user as any).accessToken = (token as any).accessToken
      }
      return session
    }
  }
}

export default NextAuth(authOptions)
