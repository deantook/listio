"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Copy, Trash2, Plus } from "lucide-react"
import { api } from "@/lib/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export default function SettingsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [tokenName, setTokenName] = useState("")

  const { data: tokens = [] } = useQuery({
    queryKey: ["tokens"],
    queryFn: () => api.get<Array<{ id: string; name: string; lastFour: string; createdAt: string }>>("/api/v1/tokens"),
  })

  const createToken = useMutation({
    mutationFn: (name: string) => api.post<{ id: string; name: string; token: string; lastFour: string }>("/api/v1/tokens", { name }),
    onSuccess: (data) => {
      toast.success(`Token 已创建: ${data.token}`)
      queryClient.invalidateQueries({ queryKey: ["tokens"] })
      setTokenName("")
    },
  })

  const deleteToken = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/tokens/${id}`),
    onSuccess: () => {
      toast.success("Token 已删除")
      queryClient.invalidateQueries({ queryKey: ["tokens"] })
    },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">设置</h1>
        <p className="text-sm text-muted-foreground">管理你的账户和 API 访问</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
          <CardDescription>你的账户详情</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            {session?.user?.image && (
              <img src={session.user.image} alt="" className="size-8 rounded-full" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">{session?.user?.name || "用户"}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Token</CardTitle>
          <CardDescription>用于 CLI、移动端等第三方客户端访问</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="Token 名称"
            />
            <Button
              onClick={() => tokenName.trim() && createToken.mutate(tokenName.trim())}
              disabled={!tokenName.trim()}
            >
              <Plus className="mr-1 size-4" />创建
            </Button>
          </div>
          {tokens.map((token) => (
            <div key={token.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">{token.name}</p>
                <p className="text-xs text-muted-foreground">...{token.lastFour} · {new Date(token.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="size-7" onClick={() => {
                  navigator.clipboard.writeText(token.id)
                  toast.success("Token ID 已复制")
                }}>
                  <Copy className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => deleteToken.mutate(token.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {tokens.length === 0 && (
            <p className="text-sm text-muted-foreground">还没有 API Token</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
