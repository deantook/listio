"use client"

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { TodoItemRow } from "./todo-item-row"
import { EmptyState } from "./empty-state"

type TodoItemData = {
  id: string
  title: string
  status: "TODO" | "IN_PROGRESS" | "DONE"
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate: Date | string | null
  tags: { tag: { id: string; name: string; color: string | null } }[]
}

interface TodoListViewProps {
  items: TodoItemData[]
  onToggle: (id: string, current: string) => void
  onDelete: (id: string) => void
  onReorder: (items: { id: string; sortOrder: number }[]) => void
}

export function TodoListView({
  items,
  onToggle,
  onDelete,
  onReorder,
}: TodoListViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...items]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    const reorderData = reordered.map((item, index) => ({
      id: item.id,
      sortOrder: index * 100,
    }))

    onReorder(reorderData)
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="尚无任务"
        description="在下方输入框中输入任务后按 Enter 添加"
      />
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-0.5 p-2">
          {items.map((item) => (
            <TodoItemRow
              key={item.id}
              item={item}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
