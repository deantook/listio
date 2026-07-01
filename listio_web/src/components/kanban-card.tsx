"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { PriorityBadge } from "./priority-badge"
import { TagBadge } from "./tag-badge"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type TodoItemData = {
  id: string
  title: string
  status: "TODO" | "IN_PROGRESS" | "DONE"
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate: Date | string | null
  tags: { tag: { id: string; name: string; color: string | null } }[]
}

export function KanbanCard({ item }: { item: TodoItemData }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = { transform: CSS.Transform.toString(transform), transition }

  const isOverdue =
    item.dueDate && new Date(item.dueDate) < new Date() && item.status !== "DONE"

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab rounded-lg border border-border bg-card p-3 text-sm active:cursor-grabbing",
        isDragging && "z-50 opacity-70 shadow-lg"
      )}
    >
      <p className="text-foreground">{item.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {item.priority !== "NONE" && (
          <PriorityBadge priority={item.priority} />
        )}
        {item.tags.slice(0, 2).map(({ tag }) => (
          <TagBadge key={tag.id} name={tag.name} color={tag.color} />
        ))}
        {item.dueDate && (
          <span className={cn(
            "text-xs",
            isOverdue ? "text-red-400" : "text-muted-foreground"
          )}>
            {isOverdue ? "逾期: " : ""}
            {format(new Date(item.dueDate), "MM-dd")}
          </span>
        )}
      </div>
    </div>
  )
}
