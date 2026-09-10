import { useEffect, useRef, useState } from "react"
import { Send, Mic, MicOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ChatBox({ onSend }) {
  const [message, setMessage] = useState("")
  const [recording, setRecording] = useState(false)
  const recognitionRef = useRef(null)
  const sendAudioTimerRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = "pt-BR"
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim()
      if (transcript) {
        setMessage(transcript)
        clearTimeout(sendAudioTimerRef.current)
        sendAudioTimerRef.current = window.setTimeout(() => {
          onSend(transcript)
          setMessage("")
        }, 700)
      }
    }
    recognition.onerror = () => setRecording(false)
    recognition.onend = () => setRecording(false)

    recognitionRef.current = recognition
    return () => {
      clearTimeout(sendAudioTimerRef.current)
      recognition.stop?.()
      recognitionRef.current = null
    }
  }, [onSend])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message.trim()) return
    onSend(message)
    setMessage("")
  }

  const toggleRecording = () => {
    const recognition = recognitionRef.current
    if (!recognition) return

    if (recording) {
      recognition.stop()
      setRecording(false)
      clearTimeout(sendAudioTimerRef.current)
      return
    }

    try {
      recognition.start()
      setRecording(true)
    } catch (error) {
      console.error("Erro ao iniciar reconhecimento de voz:", error)
      setRecording(false)
    }
  }

  return (
    <div
      className="fixed inset-x-0 bottom-3 z-10 px-3 sm:bottom-5 sm:pl-16 sm:pr-4"
    >
      <form
        onSubmit={handleSubmit}
        className="chatbox-glass mx-auto flex w-full max-w-2xl items-center gap-2 rounded-2xl p-2"
      >
        <Input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <Button
          type="button"
          size="icon"
          variant={recording ? "destructive" : "secondary"}
          onClick={toggleRecording}
          className="shrink-0 rounded-xl"
          title={recording ? "Parar gravação" : "Enviar áudio"
        }
        >
          {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button type="submit" size="icon" className="shrink-0 rounded-xl">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
