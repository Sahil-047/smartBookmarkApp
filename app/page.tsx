import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BookmarksList from '@/components/BookmarksList'
import AddBookmarkForm from '@/components/AddBookmarkForm'
import Header from '@/components/Header'

export default async function Home() {
  const supabase = await createClient()
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch initial bookmarks for this user
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-white">
      <Header user={user} />
      
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-5xl font-semibold text-black mb-3">Bookmarks</h1>
          <p className="text-gray-600 text-lg">Your personal collection of links</p>
        </div>

        <AddBookmarkForm />
        
        <BookmarksList initialBookmarks={bookmarks || []} userId={user.id} />
      </main>
    </div>
  )
}
