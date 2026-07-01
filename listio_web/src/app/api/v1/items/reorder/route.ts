import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError } from "@/lib/api-helpers"
import { reorderItemsSchema } from "@/lib/validation"

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { items } = reorderItemsSchema.parse(body)

    await db.$transaction(
      items.map(({ id, sortOrder, status, listId }) => {
        const data: Record<string, unknown> = { sortOrder }
        if (status) data.status = status
        if (listId) data.listId = listId
        return db.todoItem.updateMany({
          where: { id, list: { userId: user.id } },
          data,
        })
      })
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
