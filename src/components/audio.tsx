"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from './ui'
import { Mic, Square, Volume2 } from 'lucide-react'

export function Recorder({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'transcribing'>('idle')
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop())
    }
  }, [])

  async function start() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Safari can't record webm, so fall back to mp4
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(t => MediaRecorder.isTypeSupported(t)) ?? ''
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mediaRecorder.onstop = async () => {
        // Release the microphone so the browser's recording indicator turns off
        stream.getTracks().forEach(t => t.stop())

        const type = mediaRecorder.mimeType || mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type })
        if (blob.size < 1000) {
          setError("Didn't catch that. Hold on a bit longer and try again.")
          setStatus('idle')
          return
        }

        setStatus('transcribing')
        try {
          const file = new File([blob], `input.${type.includes('mp4') ? 'mp4' : 'webm'}`, { type })
          const formData = new FormData()
          formData.append('file', file)
          const res = await fetch('/api/chat/stt', { method: 'POST', body: formData })
          const json = await res.json()
          if (!res.ok) throw new Error(json.error || 'Transcription failed')
          if (json.text) onTranscript(json.text)
          else setError("Couldn't make out any words. Try again.")
        } catch (err) {
          console.error(err)
          setError('Transcription failed. Please try again.')
        } finally {
          setStatus('idle')
        }
      }

      mediaRecorder.start()
      setStatus('recording')
    } catch (err) {
      console.error(err)
      const blocked = err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError')
      setError(blocked ? 'Microphone is blocked. Allow it in your browser settings.' : 'Could not start the microphone.')
      setStatus('idle')
    }
  }

  function stop() {
    mediaRecorderRef.current?.stop()
  }

  return (
    <div className="flex items-center gap-2">
      {status === 'recording' ? (
        <Button onClick={stop} variant="secondary" aria-label="Stop recording"><Square className="h-4 w-4 mr-2"/>Stop</Button>
      ) : status === 'transcribing' ? (
        <Button disabled aria-label="Transcribing"><Mic className="h-4 w-4 mr-2"/>Transcribing...</Button>
      ) : (
        <Button onClick={start} aria-label="Start recording"><Mic className="h-4 w-4 mr-2"/>Record</Button>
      )}
      {error && <span className="text-xs text-red-400 max-w-[180px] leading-tight">{error}</span>}
    </div>
  )
}

export function Speaker({ url, onStop }: { url?: string; onStop?: () => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (url && audioRef.current) {
      audioRef.current.src = url
      audioRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }, [url])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      setIsPlaying(false)
      onStop?.()
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handlePlay = () => {
      setIsPlaying(true)
    }

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('play', handlePlay)

    return () => {
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('play', handlePlay)
    }
  }, [onStop])

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      onStop?.()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Volume2 className="h-4 w-4"/>
      <audio ref={audioRef} />
      {isPlaying && url && (
        <Button onClick={stopAudio} variant="ghost" className="text-sm px-2 py-1 h-7">
          <Square className="h-3 w-3 mr-1"/>Stop
        </Button>
      )}
    </div>
  )
}
