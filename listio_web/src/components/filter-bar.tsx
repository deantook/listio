"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FilterBarProps {
  statusFilter: string
  priorityFilter: string
  searchQuery: string
  onStatusChange: (v: string) => void
  onPriorityChange: (v: string) => void
  onSearchChange: (v: string) => void
  onClear: () => void
}

export function FilterBar({
  statusFilter,
  priorityFilter,
  searchQuery,
  onStatusChange,
  onPriorityChange,
  onSearchChange,
  onClear,
}: FilterBarProps) {
  const hasFilters = statusFilter !== "ALL" || priorityFilter !== "ALL" || searchQuery !== ""

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <Input
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="搜索任务..."
        className="h-8 max-w-[200px] text-sm"
      />
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="h-8 w-[100px] text-sm">
          <SelectValue placeholder="状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">全部状态</SelectItem>
          <SelectItem value="TODO">待处理</SelectItem>
          <SelectItem value="IN_PROGRESS">进行中</SelectItem>
          <SelectItem value="DONE">已完成</SelectItem>
        </SelectContent>
      </Select>
      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="h-8 w-[100px] text-sm">
          <SelectValue placeholder="优先级" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">全部优先级</SelectItem>
          <SelectItem value="URGENT">紧急</SelectItem>
          <SelectItem value="HIGH">高</SelectItem>
          <SelectItem value="MEDIUM">中</SelectItem>
          <SelectItem value="LOW">低</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-8 px-2 text-xs">
          <X className="mr-1 size-3" />
          清除
        </Button>
      )}
    </div>
  )
}
