import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"

type TodoItemWithTags = {
  id: string
  title: string
  notes: string | null
  status: "TODO" | "IN_PROGRESS" | "DONE"
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate: Date | string | null
  sortOrder: number
  createdAt: Date | string
  updatedAt: Date | string
  listId: string
  tags: { tag: { id: string; name: string; color: string | null } }[]
}

export function useItems(listId: string, filters?: Record<string, string>) {
  const queryClient = useQueryClient()
  const queryKey = ["items", listId, filters]

  const query = useQuery({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams(filters)
      const qs = params.toString()
      return api.get<TodoItemWithTags[]>(
        `/api/v1/lists/${listId}/items${qs ? `?${qs}` : ""}`
      )
    },
    enabled: !!listId,
  })

  const createItem = useMutation({
    mutationFn: (data: { title: string }) =>
      api.post(`/api/v1/lists/${listId}/items`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", listId] })
      queryClient.invalidateQueries({ queryKey: ["lists"] })
    },
    onError: (err) => toast.error(err.message),
  })

  const toggleItem = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/v1/items/${id}/status`, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<TodoItemWithTags[]>(queryKey)
      queryClient.setQueryData<TodoItemWithTags[]>(queryKey, (old) =>
        old?.map((item) =>
          item.id === id ? { ...item, status: status as TodoItemWithTags["status"] } : item
        )
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
      toast.error("状态更新失败")
    },
  })

  const deleteItem = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", listId] })
      queryClient.invalidateQueries({ queryKey: ["lists"] })
      toast.success("任务已删除")
    },
    onError: (err) => toast.error(err.message),
  })

  const reorderItems = useMutation({
    mutationFn: (items: { id: string; sortOrder: number; status?: string }[]) =>
      api.put("/api/v1/items/reorder", { items }),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<TodoItemWithTags[]>(queryKey)
      queryClient.setQueryData<TodoItemWithTags[]>(queryKey, (old) => {
        if (!old) return old
        const updated = [...old]
        for (const reorderItem of items) {
          const idx = updated.findIndex((i) => i.id === reorderItem.id)
          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              sortOrder: reorderItem.sortOrder,
              ...(reorderItem.status
                ? { status: reorderItem.status as TodoItemWithTags["status"] }
                : {}),
            }
          }
        }
        updated.sort((a, b) => a.sortOrder - b.sortOrder)
        return updated
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
      toast.error("排序失败")
    },
  })

  return { ...query, createItem, toggleItem, deleteItem, reorderItems }
}
