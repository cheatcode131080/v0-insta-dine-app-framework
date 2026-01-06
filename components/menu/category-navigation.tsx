"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"

interface CategoryNavigationProps {
  categories: { id: string; name: string }[]
  activeCategory: string | null
  onCategoryClick: (categoryId: string) => void
}

export function CategoryNavigation({ categories, activeCategory, onCategoryClick }: CategoryNavigationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const activeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (activeButtonRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const button = activeButtonRef.current
      const containerRect = container.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()

      if (buttonRect.left < containerRect.left || buttonRect.right > containerRect.right) {
        button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
      }
    }
  }, [activeCategory])

  return (
    <div
      ref={scrollContainerRef}
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {categories.map((category) => {
        const isActive = activeCategory === category.id
        return (
          <Button
            key={category.id}
            ref={isActive ? activeButtonRef : null}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryClick(category.id)}
            className={cn("whitespace-nowrap", isActive && "shadow-sm")}
          >
            {category.name}
          </Button>
        )
      })}
    </div>
  )
}
