"use client"

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui'
import Link from 'next/link'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'Only users with @aes.ac.in email addresses can access this application.',
          suggestion: 'Please sign in with your official AES email account.'
        }
      case 'Configuration':
        return {
          title: 'Configuration Error',
          message: 'There was an issue with the authentication configuration.',
          suggestion: 'Please contact the system administrator.'
        }
      case 'Verification':
        return {
          title: 'Verification Error',
          message: 'Unable to verify your email address.',
          suggestion: 'Please try signing in again.'
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.732 14.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-amber-900">Empathy Interview Bot</h2>
          <p className="mt-2 text-sm text-amber-700">
            Authentication Error
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8 border border-orange-200">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-red-900 mb-2">{errorInfo.title}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {errorInfo.message}
              </p>
              <p className="text-sm text-gray-800 font-medium">
                {errorInfo.suggestion}
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong> This application is restricted to users with official AES email addresses ending in <strong>@aes.ac.in</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <Link href="/auth/signin">
                <Button className="w-full bg-orange-600 text-white hover:bg-orange-700">
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
