import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError } from "@/lib/api-helpers"
import { createTagSchema } from "@/lib/validation"

export async function GET() {
  try {
    const user = await requireAuth()
    const tags = await db.tag.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { items: true } },
      },
    })
    return NextResponse.json(tags)
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
    const data = createTagSchema.parse(body)

    const existing = await db.tag.findUnique({
      where: { userId_name: { userId: user.id, name: data.name } },
    })
    if (existing) {
      return apiError("CONFLICT", "标签名已存在", 409)
    }

    const tag = await db.tag.create({
      data: { ...data, userId: user.id },
    })
    return NextResponse.json(tag, { status: 201 })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
