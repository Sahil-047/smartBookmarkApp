'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AddBookmarkForm() {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Validate URL format
      try {
        new URL(url)
      } catch {
        setError('Please enter a valid URL')
        setIsLoading(false)
        return
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('You must be logged in to add bookmarks')
        setIsLoading(false)
        return
      }

      // Insert bookmark - realtime subscription will automatically update the list
      const { error: insertError } = await supabase
        .from('bookmarks')
        .insert({
          title,
          url,
          user_id: user.id,
        })

      if (insertError) {
        console.error('Error adding bookmark:', insertError)
        setError('Failed to add bookmark. Please try again.')
      } else {
        // Clear form on success
        setTitle('')
        setUrl('')
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="bookmark-form-container rounded-xl p-6 mb-8 bg-white hover:shadow-md transition-all"
      style={{ outline: 'none' }}
    >
      <form 
        onSubmit={handleSubmit} 
        className="space-y-4"
        style={{ outline: 'none' }}
        onFocus={(e) => {
          e.currentTarget.style.outline = 'none';
          e.currentTarget.closest('div')?.setAttribute('style', 'outline: none');
        }}
      >
        <div>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
            className="w-full px-0 py-2 border-0 border-b border-gray-300 outline-none text-lg font-medium placeholder-gray-400 bg-transparent text-black"
            style={{ outline: 'none', boxShadow: 'none' }}
          />
        </div>

        <div>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste link..."
            required
            className="w-full px-0 py-2 border-0 border-b border-gray-300 outline-none placeholder-gray-400 bg-transparent text-black"
            style={{ outline: 'none', boxShadow: 'none' }}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-black text-white py-2 px-6 rounded hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isLoading ? 'Adding...' : 'Add bookmark'}
          </button>
        </div>
      </form>
    </div>
  )
}
