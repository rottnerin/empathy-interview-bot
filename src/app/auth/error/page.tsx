"use client"

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui'
import Link from 'next/link'
import { Suspense } from 'react'
import { AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'CredentialsSignin':
        return {
          title: 'Sign In Failed',
          message: 'Please check your name and email and try again.',
          suggestion: 'Make sure you have entered valid information.'
        }
      case 'Configuration':
        return {
          title: 'Configuration Error',
          message: 'There was an issue with the authentication configuration.',
          suggestion: 'Please contact the system administrator.'
        }
      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected error occurred during sign in.',
          suggestion: 'Please try again or contact support if the problem persists.'
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-800">Empathy Interview Bot</h2>
          <p className="mt-2 text-sm text-slate-500">
            Authentication Error
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-slate-800 mb-2">{errorInfo.title}</h3>
              <p className="text-sm text-slate-600 mb-4">
                {errorInfo.message}
              </p>
              <p className="text-sm text-slate-500">
                {errorInfo.suggestion}
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <Link href="/auth/signin">
                <Button className="w-full bg-slate-700 text-white hover:bg-slate-800">
                  Try Again
                </Button>
              </Link>

              <Link href="/">
                <Button variant="secondary" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthErrorFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 bg-slate-200 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-slate-400" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-800">Empathy Interview Bot</h2>
          <p className="mt-2 text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<AuthErrorFallback />}>
      <AuthErrorContent />
    </Suspense>
  )
}
