"use client"

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core"
import { KanbanColumn } from "./kanban-column"

type Status = "TODO" | "IN_PROGRESS" | "DONE"
type TodoItemData = {
  id: string
  title: string
  status: Status
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate: Date | string | null
  tags: { tag: { id: string; name: string; color: string | null } }[]
}

interface KanbanBoardProps {
  items: TodoItemData[]
  onReorder: (items: { id: string; sortOrder: number; status?: string }[]) => void
}

export function KanbanBoard({ items, onReorder }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const columns: Record<Status, TodoItemData[]> = {
    TODO: items.filter((i) => i.status === "TODO"),
    IN_PROGRESS: items.filter((i) => i.status === "IN_PROGRESS"),
    DONE: items.filter((i) => i.status === "DONE"),
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeItem = items.find((i) => i.id === activeId)
    const overItem = items.find((i) => i.id === overId)
    let targetStatus: Status | undefined

    if (overItem) {
      targetStatus = overItem.status
    } else {
      const statuses: Status[] = ["TODO", "IN_PROGRESS", "DONE"]
      targetStatus = statuses.find((s) => s === overId) as Status
    }

    if (!activeItem || !targetStatus) return

    const allItems = [...items]
    const activeIndex = allItems.findIndex((i) => i.id === activeId)
    allItems.splice(activeIndex, 1)

    const movedItem = { ...activeItem, status: targetStatus }

    if (overItem) {
      const overIndex = allItems.findIndex((i) => i.id === overId)
      allItems.splice(overIndex, 0, movedItem)
    } else {
      allItems.push(movedItem)
    }

    const reorderData = allItems.map((item, index) => ({
      id: item.id,
      sortOrder: index * 100,
      status: item.status,
    }))

    onReorder(reorderData)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4">
        {(["TODO", "IN_PROGRESS", "DONE"] as Status[]).map((status) => (
          <KanbanColumn key={status} status={status} items={columns[status]} />
        ))}
      </div>
    </DndContext>
  )
}
