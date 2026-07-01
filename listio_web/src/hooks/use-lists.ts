import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"

type ListWithCounts = {
  id: string
  name: string
  color: string | null
  sortOrder: number
  _count: { items: number }
  completedCount: number
}

export function useLists() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["lists"],
    queryFn: () => api.get<ListWithCounts[]>("/api/v1/lists"),
  })

  const createList = useMutation({
    mutationFn: (data: { name: string; color?: string | null }) =>
      api.post("/api/v1/lists", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] })
      toast.success("列表已创建")
    },
    onError: (err) => toast.error(err.message),
  })

  const updateList = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; color?: string | null }) =>
      api.patch(`/api/v1/lists/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lists"] }),
  })

  const deleteList = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/lists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] })
      toast.success("列表已删除")
    },
    onError: (err) => toast.error(err.message),
  })

  return { ...query, createList, updateList, deleteList }
}
