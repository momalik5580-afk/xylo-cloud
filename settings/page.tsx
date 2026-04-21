"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store"
import { toast } from "react-hot-toast"
import { Loader2, Save, User, Bell, Shield, Palette, ArrowLeft, Camera, BellRing, BellOff } from "lucide-react"
import { useDesktopNotifications } from "@/hooks/use-desktop-notifications"

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [saving, setSaving] = useState(false)
  
  // Desktop notifications
  const { isSupported, permission, requestPermission } = useDesktopNotifications()

  // Profile form
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatar: "",
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    taskAssignments: true,
    slaBreaches: true,
    dailySummary: false,
  })

  // Appearance settings
  const [appearance, setAppearance] = useState({
    darkMode: true,
    compactView: false,
    autoRefresh: true,
    refreshInterval: "30",
  })

  // Security settings
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
  })

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: (user as any).phone || "",
        avatar: user.avatar || "",
      })
    }
  }, [user])

  async function saveProfile() {
    setSaving(true)
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })

      if (res.ok) {
        toast.success("Profile updated successfully")
      } else {
        toast.error("Failed to update profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  async function saveNotifications() {
    setSaving(true)
    try {
      toast.success("Notification preferences saved")
    } catch (error) {
      toast.error("Failed to save preferences")
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    if (security.newPassword !== security.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/users/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: security.currentPassword,
          newPassword: security.newPassword,
        }),
      })

      if (res.ok) {
        toast.success("Password changed successfully")
        setSecurity({
          ...security,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        toast.error("Failed to change password")
      }
    } catch (error) {
      toast.error("Failed to change password")
    } finally {
      setSaving(false)
    }
  }

  // Type-safe handler for switch changes
  const handleNotificationChange = (key: keyof typeof notifications) => (checked: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: checked }))
  }

  const handleAppearanceChange = (key: keyof typeof appearance) => (checked: boolean) => {
    setAppearance(prev => ({ ...prev, [key]: checked }))
  }

  const handleSecurityChange = (key: keyof typeof security) => (checked: boolean) => {
    if (key === 'twoFactorEnabled') {
      setSecurity(prev => ({ ...prev, [key]: checked }))
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          // FIX: Remove variant and size props
          onClick={() => router.push("/dashboard")}
          className="text-slate-400 hover:text-[#8E939D]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#8E939D]">Settings</h1>
          <p className="text-sm text-slate-400">Manage your account and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-[#8E939D]">Profile Information</CardTitle>
              <CardDescription className="text-slate-400">
                Update your personal information and profile picture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-slate-700">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="bg-blue-600 text-[#8E939D] text-2xl">
                    {profile.firstName[0] || ''}
                    {profile.lastName[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button
                    // FIX LINE 161: Remove variant prop
                    className="border border-slate-700 text-slate-300 hover:bg-slate-800 px-4 py-2 rounded-md text-sm"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                  <p className="text-xs text-slate-500 mt-2">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <Separator className="bg-slate-800" />

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-300">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="bg-slate-950 border-slate-700 text-[#8E939D]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-300">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="bg-slate-950 border-slate-700 text-[#8E939D]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-[#8E939D]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="bg-slate-950 border-slate-700 text-[#8E939D]"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <Button
                onClick={saveProfile}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-[#8E939D]">Notification Preferences</CardTitle>
              <CardDescription className="text-slate-400">
                Choose how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Desktop Notification Status */}
              {isSupported && (
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {permission === 'granted' ? (
                        <BellRing className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <BellOff className="h-5 w-5 text-slate-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-[#8E939D]">
                          Desktop Notifications
                        </p>
                        <p className="text-xs text-slate-500">
                          {permission === 'granted' 
                            ? 'You will receive notifications when the tab is in background' 
                            : permission === 'denied'
                            ? 'Notifications blocked. Enable in browser settings.'
                            : 'Enable to get desktop notifications'}
                        </p>
                      </div>
                    </div>
                    {permission !== 'granted' && permission !== 'denied' && (
                      <Button
                        onClick={() => requestPermission()}
                        // FIX LINE 340: Remove size prop
                        className="bg-blue-600 hover:bg-blue-700 text-[#8E939D] px-3 py-1.5 rounded-md text-xs"
                      >
                        Enable
                      </Button>
                    )}
                    {permission === 'denied' && (
                      // FIX LINE 347: Remove variant prop
                      <Badge className="border border-red-500/30 text-red-400 bg-transparent px-2 py-0.5 text-xs">
                        Blocked
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {[
                {
                  id: "emailAlerts",
                  label: "Email Alerts",
                  description: "Receive email notifications for important updates",
                },
                {
                  id: "pushNotifications",
                  label: "Push Notifications",
                  description: "Receive push notifications in your browser",
                },
                {
                  id: "taskAssignments",
                  label: "Task Assignments",
                  description: "Notify when you are assigned a new task",
                },
                {
                  id: "slaBreaches",
                  label: "SLA Breaches",
                  description: "Alert when tasks breach SLA deadlines",
                },
                {
                  id: "dailySummary",
                  label: "Daily Summary",
                  description: "Receive a daily summary of your tasks",
                },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={item.id} className="text-[#8E939D]">
                      {item.label}
                    </Label>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                  <Switch
                    id={item.id}
                    checked={notifications[item.id as keyof typeof notifications]}
                    onCheckedChange={handleNotificationChange(item.id as keyof typeof notifications)}
                  />
                </div>
              ))}

              <Separator className="bg-slate-800" />

              <Button
                onClick={saveNotifications}
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
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-[#8E939D]">Appearance</CardTitle>
              <CardDescription className="text-slate-400">
                Customize how the dashboard looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-[#8E939D]">Dark Mode</Label>
                  <p className="text-sm text-slate-500">Use dark theme</p>
                </div>
                <Switch
                  checked={appearance.darkMode}
                  onCheckedChange={handleAppearanceChange('darkMode')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-[#8E939D]">Compact View</Label>
                  <p className="text-sm text-slate-500">Show more content with less spacing</p>
                </div>
                <Switch
                  checked={appearance.compactView}
                  onCheckedChange={handleAppearanceChange('compactView')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-[#8E939D]">Auto Refresh</Label>
                  <p className="text-sm text-slate-500">Automatically refresh dashboard data</p>
                </div>
                <Switch
                  checked={appearance.autoRefresh}
                  onCheckedChange={handleAppearanceChange('autoRefresh')}
                />
              </div>

              {appearance.autoRefresh && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Refresh Interval (seconds)</Label>
                  <Input
                    type="number"
                    value={appearance.refreshInterval}
                    onChange={(e) =>
                      setAppearance({ ...appearance, refreshInterval: e.target.value })
                    }
                    className="bg-slate-950 border-slate-700 text-[#8E939D] w-32"
                    min="10"
                    max="300"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-[#8E939D]">Change Password</CardTitle>
              <CardDescription className="text-slate-400">
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-slate-300">
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={security.currentPassword}
                  onChange={(e) =>
                    setSecurity({ ...security, currentPassword: e.target.value })
                  }
                  className="bg-slate-950 border-slate-700 text-[#8E939D]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-slate-300">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={security.newPassword}
                  onChange={(e) =>
                    setSecurity({ ...security, newPassword: e.target.value })
                  }
                  className="bg-slate-950 border-slate-700 text-[#8E939D]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={security.confirmPassword}
                  onChange={(e) =>
                    setSecurity({ ...security, confirmPassword: e.target.value })
                  }
                  className="bg-slate-950 border-slate-700 text-[#8E939D]"
                />
              </div>

              <Button
                onClick={changePassword}
                disabled={saving || !security.currentPassword || !security.newPassword}
                className="bg-blue-600 hover:bg-blue-700 text-[#8E939D]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-[#8E939D]">Two-Factor Authentication</CardTitle>
              <CardDescription className="text-slate-400">
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-[#8E939D]">Enable 2FA</Label>
                  <p className="text-sm text-slate-500">
                    Require a verification code when signing in
                  </p>
                </div>
                <Switch
                  checked={security.twoFactorEnabled}
                  onCheckedChange={handleSecurityChange('twoFactorEnabled')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}