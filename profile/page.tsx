// src/app/profile/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "../../store"
import { generateAvatarFallback } from "../../lib/utils"
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  Building,
  Shield,
  Camera,
  Save,
} from "lucide-react"
import { toast } from "react-hot-toast"

interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatar?: string
  department?: {
    name: string
    code: string
  }
  role?: {
    name: string
    level: number
  }
  createdAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user: authUser } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const res = await fetch(`/api/users/me`)
      const data = await res.json()
      
      if (data.user) {
        setProfile(data.user)
        setFormData({
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success("Profile updated successfully")
        fetchProfile()
      } else {
        toast.error("Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("avatar", file)

    try {
      const res = await fetch("/api/users/me/avatar", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        toast.success("Avatar updated")
        fetchProfile()
      }
    } catch (error) {
      toast.error("Failed to upload avatar")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
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
          <h1 className="text-2xl font-bold text-[#8E939D]">My Profile</h1>
          <p className="text-sm text-slate-400">Manage your account information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block">
                <Avatar className="h-32 w-32 border-4 border-slate-800 mx-auto">
                  <AvatarImage src={profile?.avatar} />
                  <AvatarFallback className="bg-blue-600 text-[#8E939D] text-3xl">
                    {profile ? generateAvatarFallback(`${profile.firstName} ${profile.lastName}`) : "U"}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 p-2 bg-slate-800 rounded-full cursor-pointer hover:bg-slate-700 transition-colors border border-slate-700">
                  <Camera className="h-4 w-4 text-slate-400" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-[#8E939D]">
                {profile?.firstName} {profile?.lastName}
              </h2>
              <p className="text-sm text-slate-400">{profile?.email}</p>
              <div className="mt-4 flex justify-center gap-2">
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400">
                  {profile?.role?.name}
                </Badge>
                {profile?.department && (
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400">
                    {profile.department.code}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-[#8E939D] text-base">Account Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-slate-500" />
                <span className="text-slate-400">Role Level:</span>
                <span className="text-[#8E939D]">{profile?.role?.level}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Building className="h-4 w-4 text-slate-500" />
                <span className="text-slate-400">Department:</span>
                <span className="text-[#8E939D]">{profile?.department?.name || "N/A"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-slate-500" />
                <span className="text-slate-400">Member Since:</span>
                <span className="text-[#8E939D]">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-[#8E939D]">Edit Profile</CardTitle>
              <CardDescription className="text-slate-400">
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-300">
                      First Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="pl-10 bg-slate-950 border-slate-700 text-[#8E939D]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-300">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="bg-slate-950 border-slate-700 text-[#8E939D]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 bg-slate-950 border-slate-700 text-[#8E939D]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-300">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="pl-10 bg-slate-950 border-slate-700 text-[#8E939D]"
                    />
                  </div>
                </div>

                <Separator className="bg-slate-800" />

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-[#8E939D]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 mt-6">
            <CardHeader>
              <CardTitle className="text-[#8E939D]">Security</CardTitle>
              <CardDescription className="text-slate-400">
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                onClick={() => router.push("/profile/change-password")}
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 justify-start"
              >
                <Shield className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}