import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError } from "@/lib/api-helpers"
import { createTokenSchema } from "@/lib/validation"
import { randomBytes, createHash } from "crypto"

export async function GET() {
  try {
    const user = await requireAuth()
    const tokens = await db.apiToken.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, lastFour: true, createdAt: true },
    })
    return NextResponse.json(tokens)
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
    const { name } = createTokenSchema.parse(body)

    const rawToken = `lst_${randomBytes(32).toString("hex")}`
    const hash = createHash("sha256").update(rawToken).digest("hex")

    const token = await db.apiToken.create({
      data: {
        name,
        hash,
        lastFour: rawToken.slice(-4),
        userId: user.id,
      },
    })

    return NextResponse.json(
      {
        id: token.id,
        name: token.name,
        lastFour: token.lastFour,
        token: rawToken,
        createdAt: token.createdAt,
      },
      { status: 201 }
    )
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
