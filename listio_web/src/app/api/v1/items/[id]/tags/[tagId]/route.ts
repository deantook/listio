import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError, ApiContext } from "@/lib/api-helpers"

export async function DELETE(
  _request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id: itemId, tagId } = await context.params

    const item = await db.todoItem.findUnique({
      where: { id: itemId },
      include: { list: { select: { userId: true } } },
    })
    if (!item || item.list.userId !== user.id) {
      return apiError("NOT_FOUND", "任务不存在", 404)
    }

    await db.todoItemTag.delete({
      where: { itemId_tagId: { itemId, tagId } },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
