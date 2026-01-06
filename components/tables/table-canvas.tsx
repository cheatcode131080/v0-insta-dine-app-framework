"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import type { TableWithLayout } from "@/lib/types/database"
import { updateTablePosition } from "@/lib/tables/layouts"
import { cn } from "@/lib/utils"

interface TableCanvasProps {
  tables: TableWithLayout[]
  selectedTableId: string | null
  onTableSelect: (tableId: string) => void
  onTablesChange: () => void
  isAdmin: boolean
  tenantId: string
}

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const GRID_SIZE = 20

interface DragState {
  tableId: string
  offsetX: number
  offsetY: number
}

export function TableCanvas({
  tables,
  selectedTableId,
  onTableSelect,
  onTablesChange,
  isAdmin,
  tenantId,
}: TableCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({})

  // Initialize local positions from tables
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {}
    tables.forEach((table) => {
      if (table.layout) {
        positions[table.id] = { x: table.layout.x, y: table.layout.y }
      }
    })
    setLocalPositions(positions)
  }, [tables])

  function handleMouseDown(e: React.MouseEvent, table: TableWithLayout) {
    if (!isAdmin) return

    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const radius = table.layout?.radius || 30
    const x = localPositions[table.id]?.x || table.layout?.x || 0
    const y = localPositions[table.id]?.y || table.layout?.y || 0

    setDragState({
      tableId: table.id,
      offsetX: e.clientX - rect.left - x,
      offsetY: e.clientY - rect.top - y,
    })

    onTableSelect(table.id)
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragState || !isAdmin) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    let newX = e.clientX - rect.left - dragState.offsetX
    let newY = e.clientY - rect.top - dragState.offsetY

    // Constrain to canvas bounds
    const radius = 30
    newX = Math.max(radius, Math.min(CANVAS_WIDTH - radius, newX))
    newY = Math.max(radius, Math.min(CANVAS_HEIGHT - radius, newY))

    // Update local position immediately
    setLocalPositions((prev) => ({
      ...prev,
      [dragState.tableId]: { x: newX, y: newY },
    }))
  }

  async function handleMouseUp() {
    if (!dragState || !isAdmin) return

    const position = localPositions[dragState.tableId]
    if (position) {
      try {
        await updateTablePosition(dragState.tableId, tenantId, position.x, position.y)
        onTablesChange()
      } catch (error) {
        console.error("[v0] Error saving position:", error)
      }
    }

    setDragState(null)
  }

  function handleTableClick(table: TableWithLayout) {
    onTableSelect(table.id)
  }

  return (
    <div
      ref={canvasRef}
      className="relative overflow-hidden rounded-lg border bg-muted/20"
      style={{
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundImage: `
          linear-gradient(0deg, transparent 24%, rgba(0, 0, 0, .03) 25%, rgba(0, 0, 0, .03) 26%, transparent 27%, transparent 74%, rgba(0, 0, 0, .03) 75%, rgba(0, 0, 0, .03) 76%, transparent 77%, transparent),
          linear-gradient(90deg, transparent 24%, rgba(0, 0, 0, .03) 25%, rgba(0, 0, 0, .03) 26%, transparent 27%, transparent 74%, rgba(0, 0, 0, .03) 75%, rgba(0, 0, 0, .03) 76%, transparent 77%, transparent)
        `,
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {tables.map((table) => {
        const x = localPositions[table.id]?.x || table.layout?.x || 400
        const y = localPositions[table.id]?.y || table.layout?.y || 300
        const radius = table.layout?.radius || 30
        const isSelected = selectedTableId === table.id
        const isDragging = dragState?.tableId === table.id

        return (
          <div
            key={table.id}
            className={cn(
              "absolute flex items-center justify-center rounded-full border-2 bg-background text-sm font-medium shadow-sm transition-all",
              isSelected && "border-primary ring-2 ring-primary ring-offset-2",
              !isSelected && "border-border hover:border-primary",
              isAdmin && "cursor-move",
              isDragging && "cursor-grabbing",
            )}
            style={{
              left: x - radius,
              top: y - radius,
              width: radius * 2,
              height: radius * 2,
            }}
            onMouseDown={(e) => handleMouseDown(e, table)}
            onClick={() => handleTableClick(table)}
          >
            <span className="select-none text-center">{table.display_name}</span>
          </div>
        )
      })}
    </div>
  )
}
