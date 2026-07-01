import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError } from "@/lib/api-helpers"
import { reorderListsSchema } from "@/lib/validation"

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { ids } = reorderListsSchema.parse(body)

    await db.$transaction(
      ids.map((id, index) =>
        db.list.updateMany({
          where: { id, userId: user.id },
          data: { sortOrder: index * 100 },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
