import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError, ApiContext } from "@/lib/api-helpers"

export async function DELETE(
  _request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id } = await context.params

    const token = await db.apiToken.findUnique({ where: { id } })
    if (!token || token.userId !== user.id) {
      return apiError("NOT_FOUND", "Token 不存在", 404)
    }

    await db.apiToken.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
