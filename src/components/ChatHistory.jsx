import { useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

const FADE_HEIGHT = 80

export default function ChatHistory({ messages, loading }) {
  const endRef = useRef(null)
  const scrollRef = useRef(null)
  const msgRefs = useRef([])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const updateFade = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    const { scrollTop } = container

    msgRefs.current.forEach((el) => {
      if (!el) return
      const offsetTop = el.offsetTop - container.offsetTop
      const msgBottom = offsetTop + el.offsetHeight
      const viewTop = scrollTop
      const fadeZone = scrollTop + FADE_HEIGHT

      if (msgBottom <= viewTop) {
        el.style.opacity = "0"
      } else if (offsetTop < fadeZone) {
        const ratio = (msgBottom - viewTop) / (FADE_HEIGHT + el.offsetHeight)
        el.style.opacity = String(Math.max(0, Math.min(1, ratio)))
      } else {
        el.style.opacity = "1"
      }
    })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", updateFade, { passive: true })
    updateFade()
    return () => el.removeEventListener("scroll", updateFade)
  }, [updateFade])

  useEffect(() => {
    updateFade()
  }, [messages, loading, updateFade])

  if (messages.length === 0 && !loading) return null

  return (
    <div className="fixed inset-x-0 bottom-20 z-10 px-3 sm:bottom-24 sm:pl-16 sm:pr-4">
      <div
        ref={scrollRef}
        className="chat-fade relative mx-auto flex max-h-[45vh] w-full max-w-2xl flex-col gap-2 overflow-y-auto rounded-2xl p-1 scrollbar-hide"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            ref={(el) => { msgRefs.current[i] = el }}
            className={cn(
              "shrink-0 whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed transition-opacity duration-150",
              m.sender === "user"
                ? "bubble-user self-end max-w-[80%] rounded-br-sm"
                : "bubble-bot self-start max-w-[80%] rounded-bl-sm"
            )}
          >
            {m.text}
          </div>
        ))}

        {loading && (
          <div className="bubble-bot flex items-center gap-1 self-start rounded-2xl rounded-bl-sm px-4 py-3">
            <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
            <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
            <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  )
}
