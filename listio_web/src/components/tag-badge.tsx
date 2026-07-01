import { Badge } from "@/components/ui/badge"

export function TagBadge({
  name,
  color,
}: {
  name: string
  color: string | null
}) {
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      {color && (
        <div
          className="size-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {name}
    </Badge>
  )
}
