"use client"

import { useState, useEffect, useRef } from "react"
import { useAuthStore, useChannelStore } from "@/store"
import type { ChannelMessage } from "@/store"
import { useRealtime } from "@/hooks/use-realtime"
import { DEPT_NAMES, DeptCode } from "@/lib/roles"
import { canManageDepartment } from "@/lib/permissions"
import {
  Send, AlertTriangle, Radio, MessageSquare,
  CheckCheck, Clock, CheckCircle,
} from "lucide-react"

const TYPE_CONFIG = {
  message:   { label: "Message",   icon: MessageSquare },
  request:   { label: "Request",   icon: Clock },
  urgent:    { label: "Urgent",    icon: AlertTriangle },
  broadcast: { label: "Broadcast", icon: Radio },
}

const STATUS_CONFIG = {
  pending:      { label: "Pending",      icon: Clock       },
  acknowledged: { label: "Acknowledged", icon: CheckCircle },
  done:         { label: "Done",         icon: CheckCheck  },
}

function MessageBubble({ msg, isOwn, onUpdateStatus, canUpdate, userId }: {
  msg: ChannelMessage
  isOwn: boolean
  onUpdateStatus: (id: string, status: ChannelMessage["status"]) => void
  canUpdate: boolean
  userId: string  // ✅ Add userId prop
}) {

  const typeConf = TYPE_CONFIG[msg.type]
  const statusConf = STATUS_CONFIG[msg.status]
  const StatusIcon = statusConf.icon
  const TypeIcon = typeConf.icon
  const isUrgent = msg.type === "urgent"
  const isBroadcast = msg.type === "broadcast"

  return (
    <div className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"} mb-3`}>
      <div className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold text-[#8E939D]
        ${isUrgent ? "bg-red-600" : isBroadcast ? "bg-purple-600" : "bg-blue-600"}`}>
        {msg.senderName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
      </div>

      <div className={`max-w-[70%] space-y-1 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`flex items-center gap-2 text-xs text-slate-500 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className="font-medium text-slate-300">{msg.senderName}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium
            ${msg.senderDept === "HK"  ? "bg-emerald-500/20 text-emerald-400" :
              msg.senderDept === "ENG" ? "bg-amber-500/20 text-amber-400" :
              msg.senderDept === "FNB" ? "bg-orange-500/20 text-orange-400" :
              msg.senderDept === "GS"  ? "bg-blue-500/20 text-blue-400" :
              msg.senderDept === "SEC" ? "bg-red-500/20 text-red-400" :
              "bg-purple-500/20 text-purple-400"}`}>
            {msg.senderDept === "GM" ? "General Manager" : DEPT_NAMES[msg.senderDept as DeptCode] || msg.senderDept}
          </span>
          {msg.targetDept && (
            <span className="text-slate-600">→ {DEPT_NAMES[msg.targetDept as DeptCode] || msg.targetDept}</span>
          )}
          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>

        <div className={`rounded-2xl px-4 py-3 text-sm
          ${isUrgent    ? "bg-red-950/60 border border-red-500/40 text-red-100" :
            isBroadcast ? "bg-purple-950/60 border border-purple-500/40 text-purple-100" :
            isOwn       ? "bg-blue-600/30 border border-blue-500/30 text-[#8E939D]" :
                          "bg-slate-800/80 border border-slate-700/60 text-[#8E939D]"}`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <TypeIcon className={`h-3.5 w-3.5 ${isUrgent ? "text-red-400" : isBroadcast ? "text-purple-400" : "text-blue-400"}`} />
            <span className={`text-xs font-semibold uppercase tracking-wider
              ${isUrgent ? "text-red-400" : isBroadcast ? "text-purple-400" : "text-blue-400"}`}>
              {typeConf.label}
            </span>
          </div>
          {msg.content}
        </div>

        {(msg.type === "request" || msg.type === "urgent") && (
          <div className={`flex items-center gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
            <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border
              ${msg.status === "done"         ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                msg.status === "acknowledged" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                                               "bg-slate-800 border-slate-700 text-slate-500"}`}>
              <StatusIcon className="h-3 w-3" />
              {statusConf.label}
            </div>
            {canUpdate && !isOwn && msg.status !== "done" && (
              <div className="flex gap-1">
                {msg.status === "pending" && (
                  <button onClick={() => onUpdateStatus(msg.id, "acknowledged")}
                    className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors">
                    Acknowledge
                  </button>
                )}
                {/* ✅ Only managers can mark as done, or GM */}
                {(canUpdate || msg.senderId === userId) && (
                  <button onClick={() => onUpdateStatus(msg.id, "done")}
                    className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                  Mark Done
                  </button>
                 )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChannelPage() {
  const { user, permissions } = useAuthStore()
  const { messages, setMessages, addMessage, markRead, updateStatus } = useChannelStore()
  const [content, setContent] = useState("")
  const [type, setType] = useState<ChannelMessage["type"]>("message")
  const [targetDept, setTargetDept] = useState<string>("")
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<string>("all")
  const containerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  // ✅ Permission checks
  const canBroadcast = permissions?.broadcastToAll || false
  const canSendUrgent = user?.role === 'GENERAL_MANAGER' || user?.role?.includes('MANAGER') || false
  const canManageDept = (deptCode: string) => {
    return canManageDepartment(user?.role || 'GENERAL_MANAGER', user?.departmentCode, deptCode)
  }

  const deptCode = user ? (user.role === "GENERAL_MANAGER" ? "GM" : user.departmentCode || "") : ""

  // Scroll to bottom helper
  const scrollToBottom = (smooth = false) => {
    const el = containerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }

  // Track if user is at bottom
  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50
  }

  // SSE real-time — new messages arrive instantly
  const { isConnected: sseConnected } = useRealtime({
  userId: user?.id || "",
  enabled: !!user?.id,
  enableDesktopNotifications: true, // ✅ Add this line
  onChannelMessage: () => {
    // New message via SSE — fetch to get full data
    fetchMessages(false)
  },
})

  // Initial fetch
  useEffect(() => {
    fetchMessages(true)
    markRead()
    // Fallback polling only when SSE disconnected (every 10s)
    if (!sseConnected) {
      const interval = setInterval(() => fetchMessages(false), 10000)
      return () => clearInterval(interval)
    }
  }, [])

  // Scroll to bottom when messages change only if user is at bottom
  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom()
    }
  }, [messages])

  async function fetchMessages(initial = false) {
    try {
      const res = await fetch(`/api/channel?limit=100`)
      const data = await res.json()
      if (data.messages) {
        if (initial) {
          // On first load: set all messages then scroll
          setMessages(data.messages)
          setTimeout(() => {
            isAtBottomRef.current = true
            scrollToBottom()
          }, 50)
        } else {
          // On poll: only add truly new messages to avoid scroll jump
          setMessages((prev: ChannelMessage[]) => {
            const existingIds = new Set(prev.map((m: ChannelMessage) => m.id))
            const newMsgs = data.messages.filter((m: ChannelMessage) => !existingIds.has(m.id))
            if (newMsgs.length === 0) return prev
            return [...prev, ...newMsgs]
          })
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || !user) return
    setSending(true)
    try {
      const res = await fetch("/api/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.id,
          senderName: `${user.firstName} ${user.lastName}`,
          senderDept: deptCode,
          senderRole: user.role,
          targetDept: type === "broadcast" ? null : targetDept || null,
          type,
          content: content.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        addMessage(data.message)
        setContent("")
        setTargetDept("")
        setType("message")
        // Always scroll to bottom after sending
        isAtBottomRef.current = true
        setTimeout(() => scrollToBottom(), 30)
      }
    } finally {
      setSending(false)
    }
  }

  async function handleUpdateStatus(id: string, status: ChannelMessage["status"]) {
    await fetch("/api/channel", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    updateStatus(id, status)
  }

  const filteredMessages = messages.filter((m) => {
    if (filter === "all") return true
    if (filter === "urgent") return m.type === "urgent"
    if (filter === "requests") return m.type === "request"
    if (filter === "broadcast") return m.type === "broadcast"
    return true
  })

  const DEPT_OPTIONS: DeptCode[] = ["HK", "ENG", "FNB", "GS", "SEC"]

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
        <div>
          <h1 className="text-lg font-bold text-[#8E939D] flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            Operations Channel
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time communication between all departments</p>
        </div>
        <div className="flex items-center gap-3">
          {/* SSE connection indicator */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            sseConnected
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          }`}>
            <div className={`h-1.5 w-1.5 rounded-full ${sseConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            {sseConnected ? "Live" : "Polling"}
          </div>
          {["all", "urgent", "requests", "broadcast"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-colors
                ${filter === f ? "bg-blue-600 text-[#8E939D]" : "bg-slate-800 text-slate-400 hover:text-[#8E939D]"}`}>
              {f === "all" ? "All" : f === "urgent" ? "🚨 Urgent" : f === "requests" ? "📋 Requests" : "📢 Broadcasts"}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4"
      >
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-12 w-12 text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm">No messages yet.</p>
            <p className="text-slate-600 text-xs mt-1">Send a message, request, or alert below.</p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
         <MessageBubble
  key={msg.id}
  msg={msg}
  isOwn={msg.senderId === user?.id}
  onUpdateStatus={handleUpdateStatus}
  canUpdate={canManageDept(msg.targetDept || '')}
  userId={user?.id || ''}  // ✅ Pass userId
/>
          ))
        )}
      </div>

      {/* Compose */}
      <div className="border-t border-slate-800 bg-slate-900/80 px-6 py-4">
        <form onSubmit={handleSend} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex gap-2">
              {/* Message - everyone */}
              <button type="button" onClick={() => setType("message")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${type === "message" ? "bg-blue-600 text-[#8E939D]" : "bg-slate-800 text-slate-400 hover:text-[#8E939D]"}`}>
                <MessageSquare className="h-3.5 w-3.5" />
                Message
              </button>
              
              {/* Request - everyone */}
              <button type="button" onClick={() => setType("request")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${type === "request" ? "bg-amber-600 text-[#8E939D]" : "bg-slate-800 text-slate-400 hover:text-[#8E939D]"}`}>
                <Clock className="h-3.5 w-3.5" />
                Request
              </button>
              
              {/* Urgent - managers only */}
              {canSendUrgent && (
                <button type="button" onClick={() => setType("urgent")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${type === "urgent" ? "bg-red-600 text-[#8E939D]" : "bg-slate-800 text-slate-400 hover:text-[#8E939D]"}`}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Urgent
                </button>
              )}
              
              {/* Broadcast - GM only */}
              {canBroadcast && (
                <button type="button" onClick={() => { setType("broadcast"); setTargetDept("") }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${type === "broadcast" ? "bg-purple-600 text-[#8E939D]" : "bg-slate-800 text-slate-400 hover:text-[#8E939D]"}`}>
                  <Radio className="h-3.5 w-3.5" />
                  Broadcast
                </button>
              )}
            </div>

            {type !== "broadcast" ? (
              <select value={targetDept} onChange={(e) => setTargetDept(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 text-[#8E939D] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500">
                <option value="">→ All departments</option>
                {DEPT_OPTIONS.filter((d) => d !== deptCode).map((d) => (
                  <option key={d} value={d}>{DEPT_NAMES[d]}</option>
                ))}
              </select>
            ) : (
              <div className="flex-1 flex items-center px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm">
                <Radio className="h-4 w-4 mr-2" />
                Broadcasting to all departments
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(e as any) }}
              placeholder={
                type === "urgent" ? "Describe the urgent situation..." :
                type === "request" ? "Describe your request..." :
                type === "broadcast" ? "Write your announcement to all departments..." :
                "Type a message..."
              }
              className={`flex-1 px-4 py-3 rounded-xl text-sm text-[#8E939D] placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-colors
                ${type === "urgent"    ? "bg-red-950/40 border border-red-500/30 focus:border-red-500 focus:ring-red-500/30" :
                  type === "broadcast" ? "bg-purple-950/40 border border-purple-500/30 focus:border-purple-500 focus:ring-purple-500/30" :
                                         "bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-blue-500/30"}`}
              disabled={sending}
            />
            <button type="submit" disabled={!content.trim() || sending}
              className={`px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-40
                ${type === "urgent"    ? "bg-red-600 hover:bg-red-500 text-[#8E939D]" :
                  type === "broadcast" ? "bg-purple-600 hover:bg-purple-500 text-[#8E939D]" :
                                          "bg-blue-600 hover:bg-blue-500 text-[#8E939D]"}`}>
              <Send className="h-4 w-4" />
              {type === "broadcast" ? "Broadcast" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}