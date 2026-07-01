import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError } from "@/lib/api-helpers"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)

    const q = searchParams.get("q") || ""
    const listId = searchParams.get("listId")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const due = searchParams.get("due")

    const where: Record<string, unknown> = {
      list: { userId: user.id },
    }

    if (listId) where.listId = listId
    if (status) where.status = status
    if (priority) where.priority = priority

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ]
    }

    if (due) {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      if (due === "overdue") {
        where.dueDate = { lt: now }
      } else if (due === "today") {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        where.dueDate = { gte: now, lt: tomorrow }
      } else if (due === "week") {
        const weekEnd = new Date(now)
        weekEnd.setDate(weekEnd.getDate() + 7)
        where.dueDate = { gte: now, lt: weekEnd }
      }
    }

    const items = await db.todoItem.findMany({
      where: where as any,
      orderBy: { sortOrder: "asc" },
      include: {
        tags: { include: { tag: true } },
        list: { select: { id: true, name: true, color: true } },
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
