"use client"

import { useEffect, useState, useRef } from 'react'
import jsPDF from 'jspdf'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import Image from 'next/image'
import { Button, Input, Textarea } from '@/components/ui'
import { Recorder, Speaker } from '@/components/audio'
import { Send, Download, Square, ChevronDown, LogOut, User, CheckCircle, AlertCircle, X, Trophy, Target } from 'lucide-react'

type Message = { role: 'user' | 'assistant', content: string }

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [persona, setPersona] = useState<any | null>(null)

  // Persisted messages state from HEAD
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('empathy-chat-messages')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [input, setInput] = useState('')
  const [loadingPersona, setLoadingPersona] = useState(false)
  const [speakingUrl, setSpeakingUrl] = useState<string | undefined>()
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | undefined>()
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)

  // Guest Access state from HEAD
  const [guestAccess, setGuestAccess] = useState(false)
  const [guestReady, setGuestReady] = useState(false)

  const chatContainerRef = useRef<HTMLDivElement>(null)
  const downloadOptionsRef = useRef<HTMLDivElement>(null)

  // Analysis state from My Commit
  const [showConfirmDone, setShowConfirmDone] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<{ strengths: string[], weaknesses: string[], score: number } | null>(null)

  // Persistence Effect from HEAD
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('empathy-chat-messages', JSON.stringify(messages))
    }
  }, [messages])

  // Auth & Guest Logic from HEAD
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

  // Auto-scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages])

  // Download options close
  useEffect(() => {
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

  async function generatePersona(seed?: string, clearChat = false) {
    setLoadingPersona(true)
    try {
      const res = await fetch('/api/persona', { method: 'POST', body: JSON.stringify({ seed }), headers: { 'content-type': 'application/json' } })
      const json = await res.json()
      if (json.error) console.warn('Persona image error:', json.error)
      setPersona(json.persona)
      setImageUrl(json.imageUrl)

      if (clearChat) {
        setMessages([])
        localStorage.removeItem('empathy-chat-messages')
      } else if (messages.length === 0) {
        // If it's a fresh load, maybe clear standard
        setMessages([])
      }

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

  async function finishInterview() {
    setShowConfirmDone(false)
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ history: messages }),
        headers: { 'content-type': 'application/json' }
      })
      const data = await res.json()
      setAnalysis(data)
    } catch (err) {
      console.error(err)
      alert('Failed to analyze interview')
    } finally {
      setIsAnalyzing(false)
    }
  }

  function downloadTranscriptTXT() {
    if (messages.length === 0) {
      alert('No conversation to download yet!')
      return
    }
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
    doc.setFont('helvetica')
    doc.setFontSize(20)
    doc.setTextColor(139, 69, 19)
    doc.text('Empathy Interview Transcript', 20, 30)
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45)
    doc.text(`Persona: ${persona?.name || 'Unknown'} (Age ${persona?.age || 'Unknown'})`, 20, 55)
    doc.setLineWidth(0.5)
    doc.line(20, 65, 190, 65)

    let yPosition = 80
    const pageHeight = doc.internal.pageSize.height
    const lineHeight = 7
    const maxWidth = 170

    messages.forEach((message, index) => {
      const speaker = message.role === 'user' ? 'Student' : (persona?.name || 'Persona')
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = 30
      }
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      if (message.role === 'user') {
        doc.setTextColor(184, 134, 11)
      } else {
        doc.setTextColor(194, 65, 12)
      }
      doc.text(`${speaker}:`, 20, yPosition)
      yPosition += lineHeight
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
      yPosition += 5
    })
    const filename = `empathy-interview-${persona?.name?.replace(/\s+/g, '-').toLowerCase() || 'transcript'}-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
    setShowDownloadOptions(false)
  }

  const canAccess = guestAccess || (status === 'authenticated' && !!session)

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
    <main className="h-screen flex bg-slate-900">
      {/* Left Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-lg font-semibold text-white">Empathy Bot</h1>
          <p className="text-xs text-slate-400">Interview Practice Session</p>
        </div>

        {/* Persona Section */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Circular Profile Image */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-slate-600 bg-slate-700">
              {imageUrl ? (
                <Image src={imageUrl} alt="Persona portrait" fill className="object-cover" priority unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  {loadingPersona ? 'Loading...' : 'No image'}
                </div>
              )}
            </div>
          </div>

          {/* Name and Age */}
          <div className="text-center">
            <div className="text-white font-semibold text-lg">{persona?.name ?? 'Loading...'}</div>
            <div className="text-slate-400 text-sm">Age {persona?.age ?? '—'}</div>
          </div>

          {/* Scenario */}
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-xs font-semibold text-slate-300 uppercase mb-2">Scenario</div>
            <div className="text-sm text-slate-300 leading-relaxed">
              You are interviewing {persona?.name || 'Mateo Alvarez'} to understand their perspectives and feelings. Ask open-ended questions.
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="p-4 space-y-2 border-t border-slate-700">
          <Button
            onClick={() => {}}
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:bg-slate-700"
          >
            <User className="h-4 w-4 mr-2" />
            {guestAccess ? 'Guest User' : session?.user?.name || 'User'}
          </Button>
          <Button
            onClick={() => setShowDownloadOptions(!showDownloadOptions)}
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:bg-slate-700 relative"
          >
            <Download className="h-4 w-4 mr-2" />
            Transcript
          </Button>
          {showDownloadOptions && (
            <div className="absolute bottom-32 left-4 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-10 min-w-[200px]">
              <Button
                onClick={downloadTranscriptTXT}
                variant="ghost"
                className="w-full justify-start text-left text-slate-300 hover:bg-slate-600 rounded-none rounded-t-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Download as TXT
              </Button>
              <Button
                onClick={downloadTranscriptPDF}
                variant="ghost"
                className="w-full justify-start text-left text-slate-300 hover:bg-slate-600 rounded-none rounded-b-lg border-t border-slate-600"
              >
                <Download className="h-4 w-4 mr-2" />
                Download as PDF
              </Button>
            </div>
          )}
          <Button
            onClick={() => setShowConfirmDone(true)}
            variant="ghost"
            className="w-full justify-start text-green-400 hover:bg-slate-700"
            disabled={messages.length === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            I'm Done
          </Button>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start text-red-400 hover:bg-slate-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            End Session
          </Button>
        </div>
      </aside>

      {/* Right Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-900">
        {/* Chat Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 p-6 space-y-4 overflow-y-auto"
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className="flex-shrink-0">
                {m.role === 'assistant' ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-600 bg-slate-700">
                    {imageUrl ? (
                      <Image src={imageUrl} alt="Persona" width={40} height={40} className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">?</div>
                    )}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                    U
                  </div>
                )}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col max-w-[70%]">
                <div className={`px-4 py-3 rounded-2xl ${
                  m.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-slate-200'
                }`}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                </div>
                {m.role === 'assistant' && (
                  <div className="mt-1 ml-2">
                    {speakingMessageIndex === i ? (
                      <Button
                        variant="ghost"
                        onClick={stopSpeaking}
                        className="text-xs px-2 py-1 h-auto text-slate-400 hover:text-slate-200"
                      >
                        <Square className="h-3 w-3 mr-1" />
                        Stop
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => speak(m.content, i)}
                        className="text-xs px-2 py-1 h-auto text-slate-400 hover:text-slate-200"
                      >
                        Play
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <Recorder onTranscript={t => setInput(t)} />
            <div className="flex-1 relative">
              <Input
                placeholder={`Ask ${persona?.name || 'Mateo Alvarez'}...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 pr-10"
              />
              <button
                onClick={() => send(input)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <Speaker url={speakingUrl} onStop={stopSpeaking} />
          </div>
          <div className="mt-2 text-xs text-slate-500 text-center">
            AI may produce inaccurate information that generates credible-sounding but incorrect or nonsensical answers
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmDone && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-600">
            <h3 className="text-xl font-bold text-white mb-2">Finish Interview?</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to end the session? We'll generate an analysis of your empathy interviewing skills.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowConfirmDone(false)}
                variant="ghost"
                className="text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={finishInterview}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Yes, Analyze
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl p-8 shadow-2xl border border-slate-600 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-white">Analyzing your interview...</h3>
            <p className="text-slate-400">Generating feedback on your technique.</p>
          </div>
        </div>
      )}

      {/* Analysis Results Modal */}
      {analysis && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-600 flex flex-col">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-700/50">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Trophy className="h-6 w-6 text-purple-400" />
                Interview Analysis
              </h2>
              <button onClick={() => setAnalysis(null)} className="text-slate-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Score Section */}
              <div className="flex items-center justify-center p-6 bg-slate-700/50 rounded-xl border border-slate-600">
                <div className="text-center">
                  <div className="text-sm font-medium text-purple-400 uppercase tracking-wide">Overall Score</div>
                  <div className="text-5xl font-bold text-white mt-2">{analysis.score}/10</div>
                </div>
              </div>

              {/* Strengths */}
              <div>
                <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5" /> Strengths
                </h3>
                <ul className="space-y-2">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-200 bg-green-900/20 p-3 rounded-lg border border-green-800/30">
                      <span className="text-green-400 font-bold">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses / Improvements */}
              <div>
                <h3 className="text-lg font-semibold text-orange-400 flex items-center gap-2 mb-3">
                  <Target className="h-5 w-5" /> Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {analysis.weaknesses.map((w, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-200 bg-orange-900/20 p-3 rounded-lg border border-orange-800/30">
                      <span className="text-orange-400 font-bold">•</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-700/30 rounded-b-xl flex justify-end">
              <Button
                onClick={() => setAnalysis(null)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
