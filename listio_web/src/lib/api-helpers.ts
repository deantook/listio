import { NextResponse } from "next/server"
import { auth } from "./auth"
import { ZodError } from "zod"
import { db } from "./db"

export type ApiContext = {
  params: Promise<Record<string, string>>
}

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return apiError("VALIDATION", err.errors.map(e => e.message).join("; "), 422)
  }
  console.error(err)
  return apiError("INTERNAL", "服务器内部错误", 500)
}

export async function getAuthUser() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED")
  }
  return session.user
}

export async function requireAuth() {
  const user = await getAuthUser()
  return user
}

export async function verifyTokenAuth(request: Request) {
  // Check session first
  const session = await auth()
  if (session?.user?.id) {
    return session.user
  }

  // Check Bearer token
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    const { createHash } = await import("crypto")
    const hash = createHash("sha256").update(token).digest("hex")

    const apiToken = await db.apiToken.findUnique({ where: { hash } })
    if (apiToken) {
      const user = await db.user.findUnique({ where: { id: apiToken.userId } })
      if (user) {
        return { id: user.id, email: user.email, name: user.name }
      }
    }
  }

  throw new Error("UNAUTHORIZED")
}
