"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store"
import { toast } from "react-hot-toast"
import { Hotel, Shield, Eye, EyeOff, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { setAuth, isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard")
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Invalid credentials")
        return
      }

      // Store user & token in Zustand (persisted)
      setAuth(data.user, data.token)
      toast.success(`Welcome back, ${data.user.firstName}!`)
      window.location.href = "/dashboard"
    } catch (error) {
      toast.error("Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0c10] p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] bg-[#00f2ff]/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-[#0ea5e9]/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00f2ff]/5 border border-[#00f2ff]/30 shadow-[0_0_15px_rgba(0,242,255,0.2)] relative group">
              <div className="absolute inset-0 bg-[#00f2ff]/20 blur-md rounded-xl opacity-50" />
              <Hotel className="h-6 w-6 text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.4)] relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-[0.2em] text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]">XYLO</h1>
              <p className="text-[9px] uppercase tracking-widest font-bold text-[#5C6270]">Hotel Operations Command Center</p>
            </div>
          </div>
        </div>

        <Card className="border-[#00f2ff]/20 bg-[#0a0c10]/80 backdrop-blur-xl shadow-[0_0_30px_rgba(0,242,255,0.05)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00f2ff]/5 pointer-events-none" />
          <CardHeader className="space-y-1 pb-6 border-b border-[#00f2ff]/10 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[12px] uppercase tracking-widest font-bold text-[#00f2ff] drop-shadow-[0_0_5px_rgba(0,242,255,0.2)]">Sign In</CardTitle>
              <Badge variant="outline" className="bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/30 text-[8px] uppercase tracking-widest px-2 py-0.5 shadow-[0_0_10px_rgba(0,242,255,0.1)]">
                <Shield className="h-3 w-3 mr-1" />
                SECURE
              </Badge>
            </div>
            <CardDescription className="text-[9px] uppercase tracking-[0.1em] font-bold text-[#5C6270] mt-2">
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 relative z-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">Email</label>
                <Input
                  type="email"
                  placeholder="name@xylo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-[#0a0c10]/50 border-[#00f2ff]/20 text-[#8E939D] placeholder:text-[#5C6270]/50 focus:bg-[#00f2ff]/10 focus:border-[#00f2ff]/40 focus:shadow-[0_0_15px_rgba(0,242,255,0.1)] transition-all h-11 drop-shadow-[0_0_5px_rgba(0,242,255,0.05)]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[#5C6270]">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-[#0a0c10]/50 border-[#00f2ff]/20 text-[#8E939D] placeholder:text-[#5C6270]/50 focus:bg-[#00f2ff]/10 focus:border-[#00f2ff]/40 focus:shadow-[0_0_15px_rgba(0,242,255,0.1)] transition-all h-11 pr-10 drop-shadow-[0_0_5px_rgba(0,242,255,0.05)]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C6270] hover:text-[#00f2ff] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 drop-shadow-[0_0_5px_rgba(0,242,255,0.2)]" /> : <Eye className="h-4 w-4 drop-shadow-[0_0_5px_rgba(0,242,255,0.2)]" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#00f2ff]/10 border border-[#00f2ff]/30 hover:bg-[#00f2ff]/20 hover:border-[#00f2ff]/50 hover:shadow-[0_0_20px_rgba(0,242,255,0.25)] text-[#00f2ff] text-[10px] font-bold uppercase tracking-widest transition-all mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AUTHENTICATING...
                  </>
                ) : (
                  "INITIALIZE SESSION"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-[8px] font-bold uppercase tracking-[0.2em] text-[#5C6270]">
          Â© 2024 XYLO Hotel Operations. All rights reserved.
        </p>
      </div>
    </div>
  )
}
