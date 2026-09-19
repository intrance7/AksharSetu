"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Loader2 } from "lucide-react"

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  sender: {
    name: string
    image: string
  }
}

export function ChatWindow({ requestId, currentUserId, receiverId }: { requestId: string, currentUserId: string, receiverId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?requestId=${requestId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch and polling
  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [requestId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const optimisticMessage = {
      id: "temp-" + Date.now(),
      content: newMessage,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      sender: { name: "You", image: "" } // Image doesn't matter for self messages in UI currently
    }
    
    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage("")

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: optimisticMessage.content,
          requestId,
          receiverId
        })
      })

      if (!res.ok) throw new Error("Failed to send message")
      
      // We will rely on the next polling cycle to sync the real message ID, 
      // or we can replace it immediately here. Let polling handle it for simplicity.
      fetchMessages() 
    } catch (err) {
      console.error(err)
      // Revert optimistic update on failure
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F5F5F7] overflow-hidden">
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-[#1D1D1F]/20" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-[#1D1D1F]/40 font-medium">
            No messages yet. Send a message to start coordinating!
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === currentUserId
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                  isMe 
                    ? "bg-[#0066cc] text-white rounded-br-sm" 
                    : "bg-white text-[#1D1D1F] rounded-bl-sm border border-[#1D1D1F]/5 shadow-sm"
                }`}>
                  <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                </div>
                <span className="text-[10px] font-bold text-[#1D1D1F]/40 mt-1 uppercase tracking-wider px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-[#1D1D1F]/5">
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-[#F5F5F7] border border-[#1D1D1F]/10 rounded-full px-6 py-3 text-sm font-medium text-[#1D1D1F] outline-none focus:border-[#0066cc] transition-colors placeholder:text-[#1D1D1F]/30"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white flex items-center justify-center shrink-0 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
      
    </div>
  )
}
