"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, MoreHorizontal } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface TodoItemRowProps {
  item: TodoItemData
  onToggle: (id: string, current: string) => void
  onDelete: (id: string) => void
}

export function TodoItemRow({ item, onToggle, onDelete }: TodoItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverdue =
    item.dueDate && new Date(item.dueDate) < new Date() && item.status !== "DONE"

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-transparent bg-card px-3 py-2.5 transition-colors hover:border-border",
        isDragging && "z-50 border-border opacity-80 shadow-lg",
        item.status === "DONE" && "opacity-60"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>

      <Checkbox
        checked={item.status === "DONE"}
        onCheckedChange={() => onToggle(item.id, item.status)}
        className="rounded-full data-[state=checked]:border-primary data-[state=checked]:bg-primary"
      />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            item.status === "DONE"
              ? "text-muted-foreground line-through"
              : "text-foreground"
          )}
        >
          {item.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {item.priority !== "NONE" && (
            <PriorityBadge priority={item.priority} />
          )}
          {item.tags.slice(0, 2).map(({ tag }) => (
            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
          ))}
          {item.tags.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{item.tags.length - 2}
            </span>
          )}
          {item.dueDate && (
            <span
              className={cn(
                "text-xs",
                isOverdue ? "text-red-400" : "text-muted-foreground"
              )}
            >
              {isOverdue ? "逾期: " : ""}
              {format(new Date(item.dueDate), "MM-dd")}
            </span>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100"><MoreHorizontal className="size-4" /></Button>}>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>编辑</DropdownMenuItem>
          <DropdownMenuItem>修改优先级</DropdownMenuItem>
          <DropdownMenuItem>修改截止日</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDelete(item.id)}
          >
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
