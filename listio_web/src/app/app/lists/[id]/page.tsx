"use client"

import { use, useMemo, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useItems } from "@/hooks/use-items"
import { useLists } from "@/hooks/use-lists"
import { ListHeader } from "@/components/list-header"
import { QuickAdd } from "@/components/quick-add"
import { FilterBar } from "@/components/filter-bar"
import { TodoListView } from "@/components/todo-list-view"
import { KanbanBoard } from "@/components/kanban-board"
import { EmptyState } from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"

export default function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const view = searchParams.get("view") || "list"

  const [statusFilter, setStatusFilter] = useState("ALL")
  const [priorityFilter, setPriorityFilter] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const filters = useMemo(() => {
    const f: Record<string, string> = {}
    if (statusFilter !== "ALL") f.status = statusFilter
    if (priorityFilter !== "ALL") f.priority = priorityFilter
    if (searchQuery) f.q = searchQuery
    return f
  }, [statusFilter, priorityFilter, searchQuery])

  const { data: listData } = useLists()
  const {
    data: items = [],
    isLoading,
    toggleItem,
    deleteItem,
    reorderItems,
  } = useItems(id, filters)

  const list = listData?.find((l) => l.id === id)

  const handleToggle = useCallback(
    (itemId: string, currentStatus: string) => {
      const nextStatus =
        currentStatus === "DONE" ? "TODO" : "DONE"
      toggleItem.mutate({ id: itemId, status: nextStatus })
    },
    [toggleItem]
  )

  const handleReorder = useCallback(
    (reorderData: { id: string; sortOrder: number; status?: string }[]) => {
      reorderItems.mutate(reorderData)
    },
    [reorderItems]
  )

  const clearFilters = useCallback(() => {
    setStatusFilter("ALL")
    setPriorityFilter("ALL")
    setSearchQuery("")
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (!list) {
    return (
      <EmptyState
        title="列表不存在"
        description="该列表可能已被删除或你没有访问权限"
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      <ListHeader listName={list.name} />
      <QuickAdd listId={id} />
      <FilterBar
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        searchQuery={searchQuery}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onSearchChange={setSearchQuery}
        onClear={clearFilters}
      />
      <div className="flex-1 overflow-y-auto">
        {view === "board" ? (
          <KanbanBoard items={items} onReorder={handleReorder} />
        ) : (
          <TodoListView
            items={items}
            onToggle={handleToggle}
            onDelete={(itemId) => deleteItem.mutate(itemId)}
            onReorder={handleReorder}
          />
        )}
      </div>
    </div>
  )
}
