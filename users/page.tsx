"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/store"
import { normalizeRole, ROLE_LABELS } from "@/lib/roles"
import { toast } from "react-hot-toast"
import { Loader2, Plus, Search, ArrowLeft, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  role: {
    id: string
    name: string
    level: number
  }
  department?: {
    id: string
    name: string
    code: string
  }
}

export default function UsersPage() {
  const router = useRouter()
  const { user: authUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users")
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) =>
    `${user.firstName} ${user.lastName} ${user.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
            className="text-slate-400 hover:text-[#8E939D]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#8E939D]">Users</h1>
            <p className="text-sm text-slate-400">Manage hotel staff accounts</p>
          </div>
        </div>
        <Button 
          onClick={() => router.push("/users/new")}
          className="bg-blue-600 hover:bg-blue-700 text-[#8E939D]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-slate-950 border-slate-700 text-[#8E939D]"
        />
      </div>

      {/* Users List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-[#8E939D]">All Users</CardTitle>
          <CardDescription className="text-slate-400">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => {
              const normalizedRole = normalizeRole(user.role.name)
              
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border border-slate-700">
                      <AvatarImage src={user.avatar || ""} />
                      <AvatarFallback className="bg-blue-600 text-[#8E939D]">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-[#8E939D]">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className="bg-blue-500/20 text-blue-400 border-blue-500/30"
                      >
                        {ROLE_LABELS[normalizedRole] || user.role.name}
                      </Badge>
                      {user.department && (
                        <p className="text-xs text-slate-500 mt-1">
                          {user.department.name}
                        </p>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                        <DropdownMenuItem 
                          onClick={() => router.push(`/users/${user.id}`)}
                          className="text-slate-300 focus:text-[#8E939D] focus:bg-slate-800 cursor-pointer"
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => router.push(`/users/${user.id}/reset-password`)}
                          className="text-slate-300 focus:text-[#8E939D] focus:bg-slate-800 cursor-pointer"
                        >
                          Reset Password
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}