import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError } from "@/lib/api-helpers"
import { bindEmailSchema } from "@/lib/validation"

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { email } = bindEmailSchema.parse(body)

    const existing = await db.user.findUnique({ where: { email } })
    if (existing && existing.id !== user.id) {
      return apiError("CONFLICT", "该邮箱已被其他账户使用", 409)
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: { email },
    })

    return NextResponse.json({
      email: updated.email,
    })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
