"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { FileDown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/lib/api/client"

interface PDFDownloadButtonProps {
  reportType: "asset-register" | "depreciation" | "disposal" | "audit"
  params?: Record<string, string>
  label?: string
  className?: string
}

export function PDFDownloadButton({
  reportType,
  params,
  label = "Download PDF",
  className,
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      const queryString = params
        ? "?" + new URLSearchParams(params).toString()
        : ""

      const response = await apiClient.get(
        `/reports/${reportType}/pdf${queryString}`,
        { responseType: "blob" },
      )

      const blob = new Blob([response.data as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `assetflow-${reportType}-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("PDF downloaded successfully")
    } catch {
      toast.error("Failed to generate PDF. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <motion.button
      whileHover={{ scale: isGenerating ? 1 : 1.01 }}
      whileTap={{ scale: isGenerating ? 1 : 0.98 }}
      onClick={handleDownload}
      disabled={isGenerating}
      className={[
        "inline-flex items-center gap-2 px-4 py-2.5",
        "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700",
        "text-slate-700 dark:text-slate-300 text-sm font-semibold",
        "rounded-xl border border-slate-200 dark:border-slate-700",
        "transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed",
        className ?? "",
      ].join(" ")}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          {label}
        </>
      )}
    </motion.button>
  )
}
