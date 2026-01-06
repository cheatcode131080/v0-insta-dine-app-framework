"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTenant } from "@/lib/hooks/use-tenant"
import { useState } from "react"
import { CreateTenantDialog } from "@/components/tenants/create-tenant-dialog"

export function TenantSwitcher() {
  const { tenant, tenants, switchTenant } = useTenant()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center gap-2">
      {tenants.length > 1 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[200px] justify-between bg-transparent"
            >
              {tenant?.name || "Select restaurant"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search restaurant..." />
              <CommandList>
                <CommandEmpty>No restaurant found.</CommandEmpty>
                <CommandGroup>
                  {tenants.map((t) => (
                    <CommandItem
                      key={t.id}
                      value={t.id}
                      onSelect={() => {
                        switchTenant(t.id)
                        setOpen(false)
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", tenant?.id === t.id ? "opacity-100" : "opacity-0")} />
                      {t.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
      <CreateTenantDialog />
    </div>
  )
}
