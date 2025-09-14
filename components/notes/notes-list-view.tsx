"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth/auth-provider"
import { Search, Plus, FileText, Calendar } from "lucide-react"

export interface Note {
  id: string
  title: string
  content: string
  snippet: string
  updatedAt: Date
}

interface NotesListViewProps {
  notes: Note[]
  onSelectNote: (note: Note) => void
  onNewNote: () => void
  isLoading?: boolean
  error?: string | null
}

export function NotesListView({ 
  notes, 
  onSelectNote, 
  onNewNote, 
  isLoading = false, 
  error = null 
}: NotesListViewProps) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes

    const query = searchQuery.toLowerCase()
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.snippet.toLowerCase().includes(query),
    )
  }, [notes, searchQuery])

  const canCreateNote = user?.plan === "pro" || notes.length < 3

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-balance">Notes</h1>
            {/* <p className="text-sm text-muted-foreground mt-1">
              {isLoading ? 
                "Loading notes..." : 
                `${notes.length} ${notes.length === 1 ? "note" : "notes"}
                ${user?.plan === "free" && ` • ${3 - notes.length} remaining`}`
              }
            </p> */}
          </div>

          <Button onClick={onNewNote} disabled={!canCreateNote || isLoading} className="gap-2">
            <Plus className="w-4 h-4" />
            New Note
          </Button>
        </div>

        {/* Search */}
        

        {/* Free Plan Warning */}
        {user?.plan === "free" && notes.length >= 3 && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <p className="text-yellow-400 text-sm">Free plan limit reached. Upgrade to Pro for unlimited notes.</p>
          </div>
        )}
      </div>
      

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">

        <div className="relative rounded-md mx-6 my-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* Loading State */}
        {isLoading && (
          <div className="p-6 flex items-center justify-center h-40">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading notes...</p>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {!isLoading && error && (
          <div className="p-6 flex items-center justify-center h-40">
            <div className="text-center">
              <div className="rounded-full h-8 w-8 bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500">!</span>
              </div>
              <p className="text-red-500 mb-2">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          </div>
        )}
        
        {/* Content */}
        {!isLoading && !error && filteredNotes.length === 0 ? (
          <EmptyState
            hasNotes={notes.length > 0}
            searchQuery={searchQuery}
            onNewNote={canCreateNote ? onNewNote : undefined}
          />
        ) : !isLoading && !error && (
          <div className="p-6 space-y-3">
            {filteredNotes.map((note) => (
              <NoteCard key={note.id} note={note} onClick={() => onSelectNote(note)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface NoteCardProps {
  note: Note
  onClick: () => void
}

function NoteCard({ note, onClick }: NoteCardProps) {
  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  return (
    <div
      onClick={onClick}
      className="group p-4 bg-card border border-border rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:border-accent hover:shadow-sm"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <h3 className="font-medium text-card-foreground truncate group-hover:text-accent-foreground transition-colors">
            {note.title || "Untitled Note"}
          </h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 ml-2">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(note.updatedAt)}</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-2">{note.snippet}</p>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {note.content.length} {note.content.length === 1 ? "character" : "characters"}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 bg-primary rounded-full" />
        </div>
      </div>
    </div>
  )
}

interface EmptyStateProps {
  hasNotes: boolean
  searchQuery: string
  onNewNote?: () => void
}

function EmptyState({ hasNotes, searchQuery, onNewNote }: EmptyStateProps) {
  if (searchQuery && hasNotes) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No notes found</h3>
          <p className="text-muted-foreground text-balance">
            No notes match your search for "{searchQuery}". Try a different search term.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No notes yet</h3>
        <p className="text-muted-foreground text-balance mb-6">
          Create your first note to start capturing your thoughts and ideas.
        </p>
        {onNewNote && (
          <Button onClick={onNewNote} className="gap-2">
            <Plus className="w-4 h-4" />
            Create your first note
          </Button>
        )}
      </div>
    </div>
  )
}
