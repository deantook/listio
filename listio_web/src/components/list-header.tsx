"use client"

import { useRouter, useSearchParams } from "next/navigation"

export function ListHeader({ listName }: { listName: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams.get("view") || "list"

  const handleViewChange = (value: string) => {
    if (!value) return
    const params = new URLSearchParams(searchParams)
    if (value === "list") {
      params.delete("view")
    } else {
      params.set("view", value)
    }
    router.replace(`?${params.toString()}`)
  }

  return (
    <div className="flex h-14 items-center justify-between border-b border-border px-4">
      <h1 className="text-lg font-semibold text-foreground">{listName}</h1>
      <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
        <button
          onClick={() => handleViewChange("list")}
          className={`rounded-md px-3 py-1 text-sm transition-colors ${
            view === "list"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          列表
        </button>
        <button
          onClick={() => handleViewChange("board")}
          className={`rounded-md px-3 py-1 text-sm transition-colors ${
            view === "board"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          看板
        </button>
      </div>
    </div>
  )
}
