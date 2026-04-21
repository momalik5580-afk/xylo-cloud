"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

interface TaskSearchProps {
  onSearch: (query: string) => void
  placeholder?: string
  initialValue?: string
}

export function TaskSearch({ 
  onSearch, 
  placeholder = "Search tasks...",
  initialValue = "" 
}: TaskSearchProps) {
  const [query, setQuery] = useState(initialValue)

  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearch(query)
    }, 300) // Debounce 300ms

    return () => clearTimeout(timeout)
  }, [query, onSearch])

  function handleClear() {
    setQuery("")
    onSearch("")
  }

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E939D]0" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-10 pr-10 bg-slate-950 border-slate-700 text-[#8E939D] placeholder:text-[#8E939D]0 focus:bg-slate-900"
      />
      {query && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-[#8E939D]0 hover:text-slate-300"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}