'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

export default function Header({ user }: { user: User }) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white text-sm font-medium">
            {user.email?.[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-black">{user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
          </div>
        </div>
        
        <button
          onClick={handleSignOut}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-black hover:bg-gray-100 rounded transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
