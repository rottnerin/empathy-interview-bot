"use client"

import { getSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'

export default function SignInPage() {
  const router = useRouter()
  const [name, setName] = useState('')

  useEffect(() => {
    // Check if user is already authenticated
    getSession().then((session) => {
      if (session) {
        router.push('/')
      }
    })
  }, [router])

  const handleEdEventsAccess = () => {
    if (!name.trim()) return
    if (typeof window !== 'undefined') {
      localStorage.setItem('guest_access', 'true')
      // Progress is tracked per name, so students can see improvement across attempts
      localStorage.setItem('student_name', name.trim())
      sessionStorage.removeItem('empathy-session')
      // Every sign-in starts a fresh interview
      sessionStorage.removeItem('empathy-chat-messages')
    }
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-amber-900">Empathy Interview Bot</h2>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 border border-orange-200">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome</h3>
              <p className="text-sm text-gray-600">
                Enter your name to start practicing. Each interview you finish is saved so you can watch yourself improve.
              </p>
            </div>

            <Input
              placeholder="Your first name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleEdEventsAccess() }}
              maxLength={40}
              autoFocus
              className="border-orange-300 text-gray-900"
            />

            <Button
              onClick={handleEdEventsAccess}
              variant="secondary"
              disabled={!name.trim()}
              className="w-full border-orange-300 text-amber-900 hover:bg-orange-50"
            >
              Ed Events
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
