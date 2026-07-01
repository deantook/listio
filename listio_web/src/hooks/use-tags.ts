import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"

type TagWithCount = {
  id: string
  name: string
  color: string | null
  _count: { items: number }
}

export function useTags() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<TagWithCount[]>("/api/v1/tags"),
  })

  const createTag = useMutation({
    mutationFn: (data: { name: string; color?: string | null }) =>
      api.post("/api/v1/tags", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      toast.success("标签已创建")
    },
    onError: (err) => toast.error(err.message),
  })

  const updateTag = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; color?: string | null }) =>
      api.patch(`/api/v1/tags/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] }),
  })

  const deleteTag = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      queryClient.invalidateQueries({ queryKey: ["items"] })
      toast.success("标签已删除")
    },
    onError: (err) => toast.error(err.message),
  })

  return { ...query, createTag, updateTag, deleteTag }
}
