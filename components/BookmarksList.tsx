'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bookmark } from '@/types/database.types'
import BookmarkItem from './BookmarkItem'

interface BookmarksListProps {
  initialBookmarks: Bookmark[]
  userId: string
}

export default function BookmarksList({ initialBookmarks, userId }: BookmarksListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  const supabase = createClient()

  // Function to handle bookmark deletion - updates state immediately
  const handleDeleteBookmark = (bookmarkId: string) => {
    setBookmarks((current) => current.filter((bookmark) => bookmark.id !== bookmarkId))
  }

  useEffect(() => {
    // Set up realtime subscription for this user's bookmarks
    // This is the key feature - when any change happens, all tabs get updated
    const channel = supabase
      .channel('bookmarks-changes', {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`, // Only listen to this user's bookmarks
        },
        (payload) => {
          console.log('Realtime update:', payload)

          if (payload.eventType === 'INSERT') {
            // New bookmark added - add to top of list
            setBookmarks((current) => [payload.new as Bookmark, ...current])
          } else if (payload.eventType === 'DELETE') {
            // Bookmark deleted - remove from list
            setBookmarks((current) => 
              current.filter((bookmark) => bookmark.id !== payload.old.id)
            )
          } else if (payload.eventType === 'UPDATE') {
            // Bookmark updated - replace in list
            setBookmarks((current) =>
              current.map((bookmark) =>
                bookmark.id === payload.new.id ? (payload.new as Bookmark) : bookmark
              )
            )
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to bookmarks changes')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel error - realtime may not be enabled')
        }
      })

    // Clean up subscription when component unmounts
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  if (bookmarks.length === 0) {
    return (
      <div className="border border-gray-200 rounded-xl p-16 text-center bg-white shadow-sm">
        <div className="inline-block mb-4">
          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <p className="text-gray-400 text-base">No bookmarks yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {bookmarks.map((bookmark) => (
        <BookmarkItem 
          key={bookmark.id} 
          bookmark={bookmark} 
          onDelete={handleDeleteBookmark}
        />
      ))}
    </div>
  )
}
