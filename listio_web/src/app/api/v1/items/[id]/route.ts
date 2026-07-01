import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError, ApiContext } from "@/lib/api-helpers"
import { updateItemSchema } from "@/lib/validation"

export async function PATCH(
  request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id } = await context.params
    const body = await request.json()
    const data = updateItemSchema.parse(body)

    const item = await db.todoItem.findUnique({
      where: { id },
      include: { list: { select: { userId: true } } },
    })
    if (!item || item.list.userId !== user.id) {
      return apiError("NOT_FOUND", "任务不存在", 404)
    }

    const updated = await db.todoItem.update({
      where: { id },
      data,
      include: { tags: { include: { tag: true } } },
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

    const item = await db.todoItem.findUnique({
      where: { id },
      include: { list: { select: { userId: true } } },
    })
    if (!item || item.list.userId !== user.id) {
      return apiError("NOT_FOUND", "任务不存在", 404)
    }

    await db.todoItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
