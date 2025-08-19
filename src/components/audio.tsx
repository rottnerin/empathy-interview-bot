"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from './ui'
import { Mic, Square, Volume2 } from 'lucide-react'

export function Recorder({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop())
    }
  }, [])

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : ''
    const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    mediaRecorder.onstop = async () => {
      const type = mimeType || 'audio/webm'
      const blob = new Blob(chunksRef.current, { type })
      const file = new File([blob], 'input.webm', { type })
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/chat/stt', { method: 'POST', body: formData })
      const json = await res.json()
      if (json.text) onTranscript(json.text)
    }

    mediaRecorder.start()
    setRecording(true)
  }

  function stop() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="flex items-center gap-2">
      {recording ? (
        <Button onClick={stop} variant="secondary" aria-label="Stop recording"><Square className="h-4 w-4 mr-2"/>Stop</Button>
      ) : (
        <Button onClick={start} aria-label="Start recording"><Mic className="h-4 w-4 mr-2"/>Record</Button>
      )}
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
