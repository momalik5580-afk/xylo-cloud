import { Suspense } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default function VIPLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0a0c10]">
      <Suspense fallback={<div className="w-16 bg-[#0a0c10]" />}>
        <Sidebar />
      </Suspense>
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <Header />
        {children}
      </div>
    </div>
  )
}
