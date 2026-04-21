"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { KPICardsContainer } from "@/components/dashboard/kpi-cards"
import { DepartmentPanels } from "@/components/dashboard/department-panels"
import { DepartmentTabs } from "@/components/dashboard/department-tabs"
import { RunningTasksTable } from "@/components/dashboard/tasks-table"
import { ActivitySummary } from "@/components/dashboard/activity-summary"// Fixed import
import { GuestSentiment } from "@/components/dashboard/guest-sentiment"
import { InventoryAlerts } from "@/components/dashboard/inventory-alerts"
import { RealTimeEventFeed } from "@/components/dashboard/event-feed"
import { RoomsWidget } from "@/components/dashboard/rooms-widget"
import { VIPWidget } from "@/components/dashboard/vip-widget"
import { HotelSettingsContent } from "@/components/dashboard/content/settings-content"
import { useAuthStore } from "@/store"
import { HousekeepingContent } from "@/components/dashboard/content/housekeeping-content"
import { RestaurantsContent } from "@/components/dashboard/content/restaurants-content"
import { BanquetContent } from "@/components/dashboard/content/banquet-content"
import { RoomServiceContent } from "@/components/dashboard/content/room-service-content"
import { KitchenContent } from "@/components/dashboard/content/kitchen-content"
import { SpaContent } from "@/components/dashboard/content/spa-content"
import { GymContent } from "@/components/dashboard/content/gym-content"
import { ClinicContent } from "@/components/dashboard/content/clinic-content"
import { SecurityContent } from "@/components/dashboard/content/security-content"
import { EngineeringContent } from "@/components/dashboard/content/engineering-content" 
import { ITContent } from "@/components/dashboard/content/it-content"
import { FinanceContent } from "@/components/dashboard/content/finance-content"
import { HRContent } from "@/components/dashboard/content/hr-content"
import { SalesContent } from "@/components/dashboard/content/sales-content"
import { ChannelContent } from "@/components/dashboard/content/channel-content"
import { ReportsContent } from "@/components/dashboard/content/reports-content"
import { UsersContent } from "@/components/dashboard/content/users-content"
import { GMOverviewContent } from "@/components/dashboard/content/gm-overview-content"
import { FrontDeskContent } from "@/components/dashboard/content/front-desk-content"
import { VIPDashboard } from "@/components/vip/vip-dashboard"
import { cn } from "@/lib/utils"

type ViewType = "default" | "settings" | "gm-overview" | "rooms" | "vip" | "housekeeping" | 
                "restaurants" | "banquet" | "room-service" | "kitchen" |
                "spa" | "gym" | "clinic" | "engineering" | "security" | "it" |
                "finance" | "hr" | "sales" | "channel" | "reports" | "users" | "front-desk" | "hotel-settings"

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuthStore()
  
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return (params.get("view") as ViewType) || "default"
    }
    return "default"
  })

  useEffect(() => {
    if (!isAuthenticated) router.push("/login")
  }, [isAuthenticated, router])

  useEffect(() => {
    const view = searchParams.get("view") as ViewType
    setCurrentView(view || "default")
  }, [searchParams])

  if (!isAuthenticated) return null

  const renderContent = () => {
    switch (currentView) {
      case "settings":
        return <HotelSettingsContent />
      case "rooms":
        return <FrontDeskContent />
      case "vip":
        return <VIPDashboard />
      case "housekeeping":
        return <HousekeepingContent />
      case "restaurants":
        return <RestaurantsContent />
      case "banquet":
        return <BanquetContent />
      case "room-service":
        return <RoomServiceContent />
      case "kitchen":
        return <KitchenContent />
      case "spa":
        return <SpaContent />
      case "gym":
        return <GymContent />
      case "clinic":
        return <ClinicContent />
      case "security":
        return <SecurityContent />  
      case 'engineering':  
        return <EngineeringContent /> 
      case 'it':
        return <ITContent />
      case 'finance':
        return <FinanceContent />  
      case 'hr':
        return <HRContent />  
      case 'sales':
        return <SalesContent />
      case 'channel':
        return <ChannelContent />
      case 'reports':
        return <ReportsContent />
      case 'users':
        return <UsersContent /> 
      case 'gm-overview':
        return <GMOverviewContent />
      case 'front-desk':
        return <FrontDeskContent /> 
      case 'hotel-settings':
        return <HotelSettingsContent />
      default:
        return (
          <div className="space-y-4">
            <KPICardsContainer />
            <DepartmentPanels />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Running Tasks - Fixed height with scroll */}
              <div className="lg:col-span-2 flex flex-col">
                <div className="rounded-2xl border border-[#00f2ff]/20 bg-[#0a0c10] shadow-[0_0_15px_rgba(0,242,255,0.05)] overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-auto max-h-[400px] custom-scrollbar">
                    <RunningTasksTable />
                  </div>
                </div>
              </div>
              {/* Activity Summary */}
              <div className="space-y-4">
                <ActivitySummary />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <GuestSentiment />
              <InventoryAlerts />
              <RoomsWidget />
              <VIPWidget />
            </div>
            <RealTimeEventFeed />
          </div>
        )
    }
  }

  return (
    <main className="flex-1 overflow-auto p-4 bg-[#0a0c10] text-[#8E939D]">
      <div className="mx-auto max-w-[1920px]">
        {renderContent()}
      </div>
    </main>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#0a0c10]">
        <div className="text-[#00f2ff] tracking-[0.2em] font-bold animate-pulse drop-shadow-[0_0_8px_rgba(0,242,255,0.8)] font-sans">LOADING DASHBOARD...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}