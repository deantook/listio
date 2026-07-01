import { Badge } from "@/components/ui/badge"

type Priority = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT"

const priorityConfig: Record<Priority, { label: string; className: string } | null> = {
  NONE: null,
  LOW: { label: "低", className: "border-muted-foreground/30 text-muted-foreground" },
  MEDIUM: { label: "中", className: "border-primary/50 text-primary" },
  HIGH: { label: "高", className: "border-amber-500/50 text-amber-400" },
  URGENT: { label: "紧急", className: "border-red-500/50 text-red-400" },
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority]
  if (!config) return null

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
