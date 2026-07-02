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
import { Copy, Trash2, Plus, Pencil, Key, Mail, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

function EmailSection() {
  const { data: session, update } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [email, setEmail] = useState("")

  const bindEmail = useMutation({
    mutationFn: (newEmail: string) =>
      api.patch<{ email: string }>("/api/v1/user/email", { email: newEmail }),
    onSuccess: () => {
      toast.success("邮箱已更新")
      setIsEditing(false)
      update()
    },
    onError: (err: Error) => {
      toast.error(err.message || "更新失败")
    },
  })

  const handleSave = () => {
    if (email.trim()) {
      bindEmail.mutate(email.trim())
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            onClick={handleSave}
            disabled={!email.trim() || bindEmail.isPending}
          >
            {bindEmail.isPending && <Loader2 className="mr-1 size-3 animate-spin" />}
            保存
          </Button>
          <Button variant="ghost" onClick={() => setIsEditing(false)}>
            取消
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Mail className="size-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {session?.user?.email || "未绑定邮箱"}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setEmail(session?.user?.email || "")
          setIsEditing(true)
        }}
      >
        <Pencil className="mr-1 size-3" />
        {session?.user?.email ? "修改" : "绑定"}
      </Button>
    </div>
  )
}

function PasswordSection() {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const { data: passwordStatus } = useQuery({
    queryKey: ["user-password-status"],
    queryFn: () => api.get<{ hasPassword: boolean }>("/api/v1/user/password"),
  })

  const hasPassword = passwordStatus?.hasPassword ?? false

  const passwordMutation = useMutation({
    mutationFn: (data: { password?: string; currentPassword?: string; newPassword?: string }) =>
      api.patch<{ message: string }>("/api/v1/user/password", data),
    onSuccess: (data) => {
      toast.success(data.message || "操作成功")
      setIsEditing(false)
      setCurrentPassword("")
      setNewPassword("")
      queryClient.invalidateQueries({ queryKey: ["user-password-status"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "操作失败")
    },
  })

  const handleSubmit = () => {
    if (hasPassword) {
      passwordMutation.mutate({ currentPassword, newPassword })
    } else {
      passwordMutation.mutate({ password: newPassword })
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-3">
        {hasPassword && (
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">当前密码</span>
            <Input
              type="password"
              placeholder="输入当前密码"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
        )}
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">
            {hasPassword ? "新密码" : "设置密码"}
          </span>
          <Input
            type="password"
            placeholder="至少8个字符"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={
              (hasPassword && (!currentPassword || !newPassword)) ||
              (!hasPassword && !newPassword) ||
              passwordMutation.isPending
            }
          >
            {passwordMutation.isPending && <Loader2 className="mr-1 size-3 animate-spin" />}
            保存
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setIsEditing(false)
              setCurrentPassword("")
              setNewPassword("")
            }}
          >
            取消
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Key className="size-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {hasPassword ? "密码已设置" : "未设置密码"}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditing(true)}
      >
        <Pencil className="mr-1 size-3" />
        {hasPassword ? "修改" : "设置"}
      </Button>
    </div>
  )
}

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
          <CardTitle>邮箱</CardTitle>
          <CardDescription>绑定或修改你的登录邮箱</CardDescription>
        </CardHeader>
        <CardContent>
          <EmailSection />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>密码</CardTitle>
          <CardDescription>设置密码后可使用邮箱密码登录</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordSection />
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
