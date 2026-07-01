import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError, ApiContext } from "@/lib/api-helpers"
import { createItemSchema } from "@/lib/validation"

export async function GET(
  request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id: listId } = await context.params
    const { searchParams } = new URL(request.url)

    const list = await db.list.findUnique({ where: { id: listId } })
    if (!list || list.userId !== user.id) {
      return apiError("NOT_FOUND", "列表不存在", 404)
    }

    const where: Record<string, unknown> = { listId }

    const status = searchParams.get("status")
    if (status) where.status = status

    const priority = searchParams.get("priority")
    if (priority) where.priority = priority

    const q = searchParams.get("q")
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ]
    }

    const tagFilter = searchParams.get("tag")
    if (tagFilter) {
      where.tags = { some: { tagId: tagFilter } }
    }

    const items = await db.todoItem.findMany({
      where: where as any,
      orderBy: { sortOrder: "asc" },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    })

    return NextResponse.json(items)
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}

export async function POST(
  request: NextRequest,
  context: ApiContext
) {
  try {
    const user = await requireAuth()
    const { id: listId } = await context.params
    const body = await request.json()
    const data = createItemSchema.parse(body)

    const list = await db.list.findUnique({ where: { id: listId } })
    if (!list || list.userId !== user.id) {
      return apiError("NOT_FOUND", "列表不存在", 404)
    }

    const lastItem = await db.todoItem.findFirst({
      where: { listId },
      orderBy: { sortOrder: "desc" },
    })

    const item = await db.todoItem.create({
      data: {
        ...data,
        listId,
        sortOrder: data.sortOrder ?? (lastItem?.sortOrder ?? 0) + 100,
      },
      include: {
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
