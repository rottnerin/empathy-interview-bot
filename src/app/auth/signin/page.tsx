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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/edtech-summit.png"
            alt="International Schools edTech Summit"
            className="mx-auto w-72 max-w-full rounded-lg shadow-md mb-6"
          />
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
