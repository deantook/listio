import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError, ApiContext } from "@/lib/api-helpers"
import { bindTagSchema } from "@/lib/validation"

export async function POST(
  request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id: itemId } = await context.params
    const body = await request.json()
    const { tagId } = bindTagSchema.parse(body)

    const item = await db.todoItem.findUnique({
      where: { id: itemId },
      include: { list: { select: { userId: true } } },
    })
    if (!item || item.list.userId !== user.id) {
      return apiError("NOT_FOUND", "任务不存在", 404)
    }

    const tag = await db.tag.findUnique({ where: { id: tagId } })
    if (!tag || tag.userId !== user.id) {
      return apiError("NOT_FOUND", "标签不存在", 404)
    }

    await db.todoItemTag.create({
      data: { itemId, tagId },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
