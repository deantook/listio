export type ListWithCounts = {
  id: string
  name: string
  color: string | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  userId: string
  _count: {
    items: number
  }
  completedCount: number
}

export type TodoItemWithTags = {
  id: string
  title: string
  notes: string | null
  status: "TODO" | "IN_PROGRESS" | "DONE"
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate: Date | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  listId: string
  tags: { tag: { id: string; name: string; color: string | null } }[]
}

export type TagWithCount = {
  id: string
  name: string
  color: string | null
  createdAt: Date
  _count: { items: number }
}

export type ApiError = {
  error: {
    code: string
    message: string
  }
}

export type ApiTokenResponse = {
  id: string
  name: string
  lastFour: string
  token: string
  createdAt: Date
}

export type ApiTokenListItem = {
  id: string
  name: string
  lastFour: string
  createdAt: Date
}
