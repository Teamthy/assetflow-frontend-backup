"use client"

import { useEffect, useCallback } from "react"

export interface Shortcut {
  key: string
  meta?: boolean
  ctrl?: boolean
  shift?: boolean
  handler: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        return
      }

      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta
          ? event.metaKey || event.ctrlKey
          : !event.metaKey && !event.ctrlKey
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
        const keyMatch =
          event.key.toLowerCase() === shortcut.key.toLowerCase()

        if (keyMatch && metaMatch && shiftMatch) {
          event.preventDefault()
          shortcut.handler()
          return
        }
      }
    },
    [shortcuts],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])
}
