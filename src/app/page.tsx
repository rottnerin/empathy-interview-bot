"use client"

import { useEffect, useState, useRef } from 'react'
import jsPDF from 'jspdf'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import Image from 'next/image'
import { Button, Input, Textarea } from '@/components/ui'
import { Recorder, Speaker } from '@/components/audio'
import { Send, Download, Square, ChevronDown, LogOut, User } from 'lucide-react'

type Message = { role: 'user' | 'assistant', content: string }

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [persona, setPersona] = useState<any | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [input, setInput] = useState('')
  const [loadingPersona, setLoadingPersona] = useState(false)
  const [speakingUrl, setSpeakingUrl] = useState<string | undefined>()
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | undefined>()
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const [guestAccess, setGuestAccess] = useState(false)
  const [guestReady, setGuestReady] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const downloadOptionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setGuestReady(true)
      return
    }

    const hasGuestAccess = localStorage.getItem('guest_access') === 'true'
    setGuestAccess(hasGuestAccess)
    setGuestReady(true)
  }, [])

  useEffect(() => {
    if (!guestReady) return

    // Redirect to sign in if not authenticated and guest access not enabled
    if (status === 'unauthenticated') {
      if (guestAccess) {
        if (!persona && !loadingPersona) {
          void generatePersona()
        }
      } else {
        router.push('/auth/signin')
      }
      return
    }

    if (guestAccess && typeof window !== 'undefined') {
      localStorage.removeItem('guest_access')
      setGuestAccess(false)
    }

    // Verify domain restriction
    if (session && session.user?.email && !session.user.email.endsWith('@aes.ac.in')) {
      signOut({ callbackUrl: '/auth/error?error=AccessDenied' })
      return
    }

    // Generate default persona on first load if authenticated
    if (status === 'authenticated' && !persona && !loadingPersona) {
      void generatePersona()
    }
  }, [status, session, router, guestAccess, guestReady, persona, loadingPersona])

  useEffect(() => {
    // Auto-scroll to bottom when messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages])

  useEffect(() => {
    // Close download options when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (downloadOptionsRef.current && !downloadOptionsRef.current.contains(event.target as Node)) {
        setShowDownloadOptions(false)
      }
    }

    if (showDownloadOptions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDownloadOptions])

  async function generatePersona(seed?: string) {
    setLoadingPersona(true)
    try {
      const res = await fetch('/api/persona', { method: 'POST', body: JSON.stringify({ seed }), headers: { 'content-type': 'application/json' } })
      const json = await res.json()
      if (json.error) console.warn('Persona image error:', json.error)
      setPersona(json.persona)
      setImageUrl(json.imageUrl)
      setMessages([])
      setSpeakingUrl(undefined)
      setSpeakingMessageIndex(undefined)
    } finally {
      setLoadingPersona(false)
    }
  }

  async function send(text: string) {
    if (!text.trim() || !persona) return
    const next = [...messages, { role: 'user', content: text } as Message]
    setMessages(next)
    setInput('')
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ persona, history: next, user: text })
    })
    const json = await res.json()
    const reply = json.text as string
    const updated = [...next, { role: 'assistant', content: reply } as Message]
    setMessages(updated)
  }

  async function speak(text: string, messageIndex?: number) {
    const res = await fetch('/api/tts', { method: 'POST', body: JSON.stringify({ text }), headers: { 'content-type': 'application/json' } })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    setSpeakingUrl(url)
    setSpeakingMessageIndex(messageIndex)
  }

  function stopSpeaking() {
    setSpeakingUrl(undefined)
    setSpeakingMessageIndex(undefined)
  }

  function downloadTranscriptTXT() {
    if (messages.length === 0) {
      alert('No conversation to download yet!')
      return
    }

    // Create a formatted text transcript
    const transcript = messages.map((m, i) => {
      const speaker = m.role === 'user' ? 'Student' : (persona?.name || 'Persona')
      return `${speaker}: ${m.content}`
    }).join('\n\n')

    const header = `Empathy Interview Transcript
Generated: ${new Date().toLocaleString()}
Persona: ${persona?.name || 'Unknown'} (Age ${persona?.age || 'Unknown'})
==================================================

`

    const fullTranscript = header + transcript

    // Create a blob and download it
    const blob = new Blob([fullTranscript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `empathy-interview-${persona?.name?.replace(/\s+/g, '-').toLowerCase() || 'transcript'}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setShowDownloadOptions(false)
  }

  function downloadTranscriptPDF() {
    if (messages.length === 0) {
      alert('No conversation to download yet!')
      return
    }

    const doc = new jsPDF()
    
    // Set up the document
    doc.setFont('helvetica')
    
    // Title
    doc.setFontSize(20)
    doc.setTextColor(139, 69, 19) // Brown color
    doc.text('Empathy Interview Transcript', 20, 30)
    
    // Metadata
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45)
    doc.text(`Persona: ${persona?.name || 'Unknown'} (Age ${persona?.age || 'Unknown'})`, 20, 55)
    
    // Separator line
    doc.setLineWidth(0.5)
    doc.line(20, 65, 190, 65)
    
    // Conversation
    let yPosition = 80
    const pageHeight = doc.internal.pageSize.height
    const lineHeight = 7
    const maxWidth = 170
    
    messages.forEach((message, index) => {
      const speaker = message.role === 'user' ? 'Student' : (persona?.name || 'Persona')
      
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = 30
      }
      
      // Speaker name
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      if (message.role === 'user') {
        doc.setTextColor(184, 134, 11) // Amber color
      } else {
        doc.setTextColor(194, 65, 12) // Orange color
      }
      doc.text(`${speaker}:`, 20, yPosition)
      yPosition += lineHeight
      
      // Message content
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      
      const lines = doc.splitTextToSize(message.content, maxWidth)
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage()
          yPosition = 30
        }
        doc.text(line, 20, yPosition)
        yPosition += lineHeight
      })
      
      yPosition += 5 // Space between messages
    })
    
    // Save the PDF
    const filename = `empathy-interview-${persona?.name?.replace(/\s+/g, '-').toLowerCase() || 'transcript'}-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
    setShowDownloadOptions(false)
  }

  const canAccess = guestAccess || (status === 'authenticated' && !!session)

  // Show loading state while checking authentication
  if (!guestReady || (status === 'loading' && !guestAccess)) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-amber-700">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render main content if not authenticated
  if (!canAccess) {
    return null
  }

  const handleSignOut = async () => {
    if (guestAccess) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('guest_access')
      }
      setGuestAccess(false)
      router.push('/auth/signin')
    } else {
      await signOut({ callbackUrl: '/auth/signin' })
    }
  }

  return (
    <main className="h-screen flex flex-col">
      <header className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-orange-200 flex-shrink-0">
        <h1 className="text-2xl font-semibold text-amber-900">Empathy Interview Bot</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <User className="h-4 w-4" />
            <span>{guestAccess ? 'Guest (AIFE Yokohoma)' : session?.user?.name || session?.user?.email}</span>
          </div>
          <div className="flex items-center gap-2 relative" ref={downloadOptionsRef}>
          <Button 
            onClick={() => setShowDownloadOptions(!showDownloadOptions)} 
            variant="secondary"
            className="relative"
          >
            <Download className="h-4 w-4 mr-2"/>
            Download Transcript
            <ChevronDown className="h-4 w-4 ml-2"/>
          </Button>
          
          {showDownloadOptions && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-orange-200 rounded-lg shadow-lg z-10 min-w-[180px]">
              <Button
                onClick={downloadTranscriptTXT}
                variant="ghost"
                className="w-full justify-start text-left hover:bg-orange-50 rounded-none rounded-t-lg"
              >
                <Download className="h-4 w-4 mr-2"/>
                Download as TXT
              </Button>
              <Button
                onClick={downloadTranscriptPDF}
                variant="ghost"
                className="w-full justify-start text-left hover:bg-orange-50 rounded-none rounded-b-lg border-t border-orange-100"
              >
                <Download className="h-4 w-4 mr-2"/>
                Download as PDF
              </Button>
            </div>
          )}
          </div>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="text-amber-700 hover:bg-orange-100"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {guestAccess ? 'Return to Sign In' : 'Sign Out'}
          </Button>
        </div>
      </header>

      <section className="flex-1 flex flex-col lg:grid lg:grid-cols-[500px_1fr] overflow-hidden">
        <div className="p-4 lg:p-6 flex lg:flex-col space-x-4 lg:space-x-0 lg:space-y-4 border-b lg:border-b-0 lg:border-r border-orange-200 bg-gradient-to-b from-orange-25 to-amber-25 flex-shrink-0">
                     <div className="relative w-80 h-80 lg:w-full lg:aspect-[3/4] overflow-hidden rounded-lg border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg flex-shrink-0">
            {imageUrl ? (
              <Image src={imageUrl} alt="Persona portrait" fill className="object-contain" priority unoptimized/>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs lg:text-sm text-amber-700">{loadingPersona ? 'Generating...' : 'No image'}</div>
            )}
          </div>
          <div className="text-sm bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200 flex-1 lg:flex-none">
            <div className="font-bold text-lg text-amber-900 mb-2">{persona?.name ?? '—'}</div>
            <div className="text-amber-700 mb-3">Age {persona?.age ?? '—'}</div>
            
            {persona && (
              <div className="text-xs text-amber-800 space-y-2 border-t border-orange-200 pt-3">
                <div className="font-medium text-amber-900 mb-2">About Mateo</div>
                
                <div><span className="font-semibold">City:</span> Madrid, Spain</div>
                <div><span className="font-semibold">School:</span> Grade 10 High School Student</div>
                <div><span className="font-semibold">Language:</span> Spanish (native), English</div>
                
                <div className="pt-2">
                  <div className="font-semibold text-amber-900 mb-1">Hobbies:</div>
                  <div className="text-amber-700">
                    Futsal, coding, gaming, YouTube, and hanging out with friends
                  </div>
                </div>
                
                <div className="pt-2">
                  <div className="font-semibold text-amber-900 mb-1">Personality:</div>
                  <div className="text-amber-700">
                    Friendly, quick-witted, athletic, and energetic
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col h-full">
          <div 
            ref={chatContainerRef}
            className="flex-1 p-6 space-y-6 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-white/50 to-orange-50/30 min-h-0"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {m.role === 'user' ? 'Student' : persona?.name || 'Persona'}
                </div>
                <div className={`px-4 py-3 rounded-lg max-w-[85%] shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-amber-600 text-white shadow-amber-200' 
                    : 'bg-orange-50 text-amber-900 border border-orange-200 shadow-orange-100'
                }`}>
                  <div className="text-base leading-relaxed whitespace-pre-wrap">{m.content}</div>
                </div>
                {m.role === 'assistant' && (
                  <div className="mt-2">
                    {speakingMessageIndex === i ? (
                      <Button variant="ghost" onClick={stopSpeaking} className="text-sm px-3 py-1 h-8 text-amber-700">
                        <Square className="h-3 w-3 mr-1"/>Stop TTS
                      </Button>
                    ) : (
                      <Button variant="ghost" onClick={() => speak(m.content, i)} className="text-sm px-3 py-1 h-8">
                        Play
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 flex-shrink-0">
            <div className="space-y-3">
              <Textarea 
                placeholder="Ask your question..." 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => { 
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
                className="min-h-[60px] max-h-[120px] resize-none"
                rows={2}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Recorder onTranscript={t => setInput(t)} />
                  <Speaker url={speakingUrl} onStop={stopSpeaking} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-700">Press Shift+Enter for new line</span>
                  <Button onClick={() => send(input)} aria-label="Send"><Send className="h-4 w-4 mr-2"/>Send</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}




