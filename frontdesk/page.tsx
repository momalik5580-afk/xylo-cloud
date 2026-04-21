"use client"

import { Suspense } from "react"
import { FrontDeskContent } from "@/components/dashboard/content/front-desk-content"

export default function FrontDeskPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-400">Loading...</div>}>
      <FrontDeskContent />
    </Suspense>
  )
}
