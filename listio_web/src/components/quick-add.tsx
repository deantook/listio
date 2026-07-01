"use client"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"

export function QuickAdd({ listId }: { listId: string }) {
  const [title, setTitle] = useState("")
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (title: string) =>
      api.post(`/api/v1/lists/${listId}/items`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", listId] })
      queryClient.invalidateQueries({ queryKey: ["lists"] })
      setTitle("")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "添加失败")
    },
  })

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && title.trim()) {
        createMutation.mutate(title.trim())
      }
    },
    [title, createMutation]
  )

  return (
    <div className="px-4 py-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="添加任务，按 Enter 确认"
        className="bg-card"
        disabled={createMutation.isPending}
      />
    </div>
  )
}
