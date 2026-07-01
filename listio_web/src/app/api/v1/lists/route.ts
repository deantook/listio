import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError } from "@/lib/api-helpers"
import { createListSchema } from "@/lib/validation"

export async function GET() {
  try {
    const user = await requireAuth()
    const lists = await db.list.findMany({
      where: { userId: user.id },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { items: true } },
        items: {
          where: { status: "DONE" },
          select: { id: true },
        },
      },
    })

    const result = lists.map(({ items, ...list }) => ({
      ...list,
      completedCount: items.length,
    }))

    return NextResponse.json(result)
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = createListSchema.parse(body)

    const lastList = await db.list.findFirst({
      where: { userId: user.id },
      orderBy: { sortOrder: "desc" },
    })

    const list = await db.list.create({
      data: {
        ...data,
        userId: user.id,
        sortOrder: (lastList?.sortOrder ?? 0) + 100,
      },
    })

    return NextResponse.json(list, { status: 201 })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
