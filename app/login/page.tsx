import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GoogleSignInButton from '@/components/GoogleSignInButton'

export default async function LoginPage() {
  const supabase = await createClient()
  
  // If user is already logged in, redirect to home
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-semibold text-black mb-3">Smart Bookmarks</h1>
          <p className="text-gray-600 text-lg">A clean space for your links</p>
        </div>
        
        <GoogleSignInButton />
        
        <p className="text-sm text-gray-500 text-center mt-8">
          Sign in to access your personal bookmark collection
        </p>
      </div>
    </div>
  )
}
