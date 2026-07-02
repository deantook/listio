import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, apiError, handleError } from "@/lib/api-helpers"
import { setPasswordSchema, changePasswordSchema } from "@/lib/validation"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const user = await requireAuth()

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    })

    if (!dbUser) {
      return apiError("NOT_FOUND", "用户不存在", 404)
    }

    return NextResponse.json({ hasPassword: !!dbUser.password })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth()

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    })

    if (!dbUser) {
      return apiError("NOT_FOUND", "用户不存在", 404)
    }

    const body = await request.json()

    if (dbUser.password) {
      // User already has a password - require current password
      const { currentPassword, newPassword } = changePasswordSchema.parse(body)

      const isValid = await bcrypt.compare(currentPassword, dbUser.password)
      if (!isValid) {
        return apiError("VALIDATION", "当前密码错误", 422)
      }

      const hashed = await bcrypt.hash(newPassword, 12)
      await db.user.update({
        where: { id: user.id },
        data: { password: hashed },
      })

      return NextResponse.json({ message: "密码已修改" })
    }

    // User has no password yet - set initial password
    const { password } = setPasswordSchema.parse(body)
    const hashed = await bcrypt.hash(password, 12)

    await db.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })

    return NextResponse.json({ message: "密码已设置" })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return apiError("UNAUTHORIZED", "请先登录", 401)
    }
    return handleError(err)
  }
}
