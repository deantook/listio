import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export default async function AppPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const firstList = await db.list.findFirst({
    where: { userId: session.user.id },
    orderBy: { sortOrder: "asc" },
  })

  if (firstList) {
    redirect(`/app/lists/${firstList.id}`)
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="mb-2 text-lg font-semibold text-foreground">欢迎使用 Listio</h2>
        <p className="text-sm text-muted-foreground">在侧边栏创建一个列表开始吧</p>
      </div>
    </div>
  )
}
