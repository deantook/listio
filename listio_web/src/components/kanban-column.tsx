"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanCard } from "./kanban-card"
import { cn } from "@/lib/utils"

type Status = "TODO" | "IN_PROGRESS" | "DONE"
type TodoItemData = {
  id: string
  title: string
  status: Status
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate: Date | string | null
  tags: { tag: { id: string; name: string; color: string | null } }[]
}

const columnLabels: Record<Status, string> = {
  TODO: "待处理",
  IN_PROGRESS: "进行中",
  DONE: "已完成",
}

interface KanbanColumnProps {
  status: Status
  items: TodoItemData[]
}

export function KanbanColumn({ status, items }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[200px] w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/30",
        isOver && "border-primary/50 bg-primary/5"
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <h3 className="text-sm font-medium text-foreground">
          {columnLabels[status]}
        </h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {items.length}
        </span>
      </div>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
          {items.map((item) => (
            <KanbanCard key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
