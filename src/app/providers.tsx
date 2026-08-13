"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { KeyboardShortcutsProvider } from "@/components/providers/KeyboardShortcutsProvider"
import { SSEProvider } from "@/components/providers/SSEProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <KeyboardShortcutsProvider>
          <SSEProvider>
            {children}
            <Toaster position="top-right" richColors />
          </SSEProvider>
        </KeyboardShortcutsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
