"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

const SEQUENCES = [
  { sequence: "gd", route: "/dashboard" },
  { sequence: "ga", route: "/assets" },
  { sequence: "gb", route: "/branches" },
  { sequence: "gm", route: "/maintenance" },
  { sequence: "gr", route: "/reports" },
  { sequence: "gn", route: "/notifications" },
  { sequence: "gs", route: "/settings" },
]

export function useSequenceShortcuts() {
  const router = useRouter()
  const keyBufferRef = useRef<string>("")
  const bufferTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return
      }

      keyBufferRef.current += event.key.toLowerCase()
      if (keyBufferRef.current.length > 2) {
        keyBufferRef.current = keyBufferRef.current.slice(-2)
      }

      if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current)
      bufferTimeoutRef.current = setTimeout(() => {
        keyBufferRef.current = ""
      }, 1000)

      for (const seq of SEQUENCES) {
        if (keyBufferRef.current === seq.sequence) {
          event.preventDefault()
          router.push(seq.route)
          keyBufferRef.current = ""
          break
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current)
    }
  }, [router])
}
