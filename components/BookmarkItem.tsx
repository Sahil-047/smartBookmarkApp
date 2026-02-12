'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bookmark } from '@/types/database.types'

interface BookmarkItemProps {
  bookmark: Bookmark
  onDelete?: (bookmarkId: string) => void
}

export default function BookmarkItem({ bookmark, onDelete }: BookmarkItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClient()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this bookmark?')) {
      return
    }

    setIsDeleting(true)

    try {
      // Delete bookmark - realtime subscription will automatically update the list
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmark.id)

      if (error) {
        console.error('Error deleting bookmark:', error)
        alert('Failed to delete bookmark')
        setIsDeleting(false)
      } else {
        // Success - update UI immediately via callback, realtime will also update
        if (onDelete) {
          onDelete(bookmark.id)
        }
        console.log('Bookmark deleted successfully')
      }
      // On success, both the callback and realtime subscription will update the UI
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('An unexpected error occurred')
      setIsDeleting(false)
    }
  }

  // Extract domain from URL for display
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  return (
    <div className="group border border-gray-200 rounded-xl p-4 bg-white hover:border-gray-400 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-0"
        >
          <h3 className="font-medium text-black mb-1 truncate group-hover:text-gray-900">
            {bookmark.title}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {getDomain(bookmark.url)}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(bookmark.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
        </a>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete bookmark"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  )
}
