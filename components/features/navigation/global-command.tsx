"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { commandItems } from "@/constants/navigation"

export function GlobalCommand() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLocaleLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="min-w-52 justify-start text-muted-foreground"
      >
        <SearchIcon data-icon="inline-start" />
        Search QA Hub
        <kbd className="ml-auto text-xs">⌘K</kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search QA Hub"
        description="Search scenarios, runs, findings, feedback, and reports"
      >
        <Command>
          <CommandInput placeholder="Search QA work…" />
          <CommandList>
            <CommandEmpty>No QA records found.</CommandEmpty>
            <CommandGroup heading="Navigate">
              {commandItems.map((item) => (
                <CommandItem
                  key={`${item.href}-${item.title}`}
                  value={item.title}
                  onSelect={() => {
                    setOpen(false)
                    router.push(item.href)
                  }}
                >
                  <item.icon aria-hidden="true" />
                  <span>{item.title}</span>
                  <CommandShortcut>Open</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
