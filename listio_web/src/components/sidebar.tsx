"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { Tag, Settings, LogOut, Plus } from "lucide-react"
import { signOut } from "next-auth/react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

type ListWithCounts = {
  id: string
  name: string
  color: string | null
  sortOrder: number
  _count: { items: number }
  completedCount: number
}

type AuthUser = {
  id?: string | null
  name?: string | null
  email?: string | null
  image?: string | null
}

export function Sidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newListName, setNewListName] = useState("")

  const { data: lists = [] } = useQuery<ListWithCounts[]>({
    queryKey: ["lists"],
    queryFn: () => api.get("/api/v1/lists"),
  })

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
      {/* User info */}
      <div className="flex items-center gap-2 border-b border-border p-3">
        <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {user.name || user.email}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="size-3.5" />
        </Button>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-xs font-medium text-muted-foreground">列表</span>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
              <Plus className="size-4" />
              新建列表
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建列表</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="列表名称"
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && newListName.trim()) {
                    try {
                      const list = await api.post<{ id: string }>("/api/v1/lists", {
                        name: newListName.trim(),
                      })
                      queryClient.invalidateQueries({ queryKey: ["lists"] })
                      setDialogOpen(false)
                      setNewListName("")
                      router.push(`/app/lists/${list.id}`)
                    } catch {
                      toast.error("创建失败")
                    }
                  }
                }}
              />
              <Button
                className="w-full"
                onClick={async () => {
                  if (newListName.trim()) {
                    try {
                      const list = await api.post<{ id: string }>("/api/v1/lists", {
                        name: newListName.trim(),
                      })
                      queryClient.invalidateQueries({ queryKey: ["lists"] })
                      setDialogOpen(false)
                      setNewListName("")
                      router.push(`/app/lists/${list.id}`)
                    } catch {
                      toast.error("创建失败")
                    }
                  }
                }}
              >
                创建
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/app/lists/${list.id}`}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary",
              pathname.startsWith(`/app/lists/${list.id}`)
                ? "bg-secondary text-foreground"
                : "text-muted-foreground"
            )}
          >
            {list.color && (
              <div
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: list.color }}
              />
            )}
            <span className="flex-1 truncate">{list.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {list._count.items}
            </span>
          </Link>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="border-t border-border p-2 space-y-1">
        <Link
          href="/app/tags"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary",
            pathname === "/app/tags" ? "bg-secondary text-foreground" : "text-muted-foreground"
          )}
        >
          <Tag className="size-4" />
          标签管理
        </Link>
        <Link
          href="/app/settings"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary",
            pathname === "/app/settings" ? "bg-secondary text-foreground" : "text-muted-foreground"
          )}
        >
          <Settings className="size-4" />
          设置
        </Link>
        <div className="flex items-center justify-between rounded-md px-2 py-1">
          <span className="text-sm text-muted-foreground">主题</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
