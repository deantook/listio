import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError, ApiContext } from "@/lib/api-helpers"
import { updateListSchema } from "@/lib/validation"

export async function PATCH(
  request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id } = await context.params
    const body = await request.json()
    const data = updateListSchema.parse(body)

    const list = await db.list.findUnique({ where: { id } })
    if (!list || list.userId !== user.id) {
      return apiError("NOT_FOUND", "列表不存在", 404)
    }

    const updated = await db.list.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}

export async function DELETE(
  _request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id } = await context.params

    const list = await db.list.findUnique({ where: { id } })
    if (!list || list.userId !== user.id) {
      return apiError("NOT_FOUND", "列表不存在", 404)
    }

    await db.list.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
