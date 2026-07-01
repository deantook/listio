"use client"

import { useState } from "react"
import { useTags } from "@/hooks/use-tags"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export default function TagsPage() {
  const { data: tags = [], isLoading, createTag, updateTag, deleteTag } = useTags()
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#6366f1")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  function handleCreate() {
    if (!newName.trim()) return
    createTag.mutate(
      { name: newName.trim(), color: newColor },
      {
        onSuccess: () => {
          setNewName("")
          setNewColor("#6366f1")
        },
      }
    )
  }

  function handleEditStart(tag: { id: string; name: string }) {
    setEditingId(tag.id)
    setEditName(tag.name)
  }

  function handleEditSave() {
    if (!editingId || !editName.trim()) return
    updateTag.mutate(
      { id: editingId, name: editName.trim() },
      { onSuccess: () => setEditingId(null) }
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">标签管理</h1>
        <Dialog>
          <DialogTrigger render={<Button size="sm"><Plus className="mr-1 size-4" />新建标签</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建标签</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">名称</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="标签名称"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">颜色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="size-8 cursor-pointer rounded border border-border bg-transparent"
                  />
                  <span className="text-sm text-muted-foreground">{newColor}</span>
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!newName.trim()}>
                创建
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-1">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border"
          >
            <div
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: tag.color || "#6366f1" }}
            />
            {editingId === tag.id ? (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
                <Button size="sm" onClick={handleEditSave}>保存</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>取消</Button>
              </div>
            ) : (
              <>
                <span className="flex-1 text-sm text-foreground">{tag.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {tag._count.items} 项
                </span>
                <Button variant="ghost" size="icon" className="size-7" onClick={() => handleEditStart(tag)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => deleteTag.mutate(tag.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </>
            )}
          </div>
        ))}
        {tags.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">暂无标签，创建一个吧</p>
        )}
      </div>
    </div>
  )
}
