"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Trash2, Clock, Type, Hash } from "lucide-react"
import type { Note } from "./notes-list-view"

interface NoteEditorProps {
  note: Note | null
  onBack: () => void
  onSave: (note: Note) => void
  onDelete: (noteId: string) => void
}

export function NoteEditor({ note, onBack, onSave, onDelete }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "")
  const [content, setContent] = useState(note?.content || "")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(note?.updatedAt || null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)

  // Auto-save functionality
  const autoSave = useCallback(
    async (currentTitle: string, currentContent: string) => {
      if (!note || (!currentTitle.trim() && !currentContent.trim())) return

      setIsAutoSaving(true)

      // Simulate save delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      const updatedNote = {
        ...note,
        title: currentTitle || "Untitled Note",
        content: currentContent,
        snippet: currentContent.slice(0, 100) + (currentContent.length > 100 ? "..." : ""),
        updatedAt: new Date(),
      }

      onSave(updatedNote)
      setHasUnsavedChanges(false)
      setLastSaved(new Date())
      setIsAutoSaving(false)
    },
    [note, onSave],
  )

  // Auto-save timer
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const timer = setTimeout(() => {
      autoSave(title, content)
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer)
  }, [title, content, hasUnsavedChanges, autoSave])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    setHasUnsavedChanges(true)
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasUnsavedChanges(true)
  }

  const handleManualSave = () => {
    autoSave(title, content)
  }

  const handleDelete = () => {
    if (!note) return
    if (window.confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
      onDelete(note.id)
    }
  }

  const getWordCount = () => {
    return content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  const getCharacterCount = () => {
    return content.length
  }

  const formatLastSaved = () => {
    if (!lastSaved) return ""
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - lastSaved.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    return lastSaved.toLocaleDateString()
  }

  if (!note) return null

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Notes
          </Button>

          <div className="flex items-center gap-4">
            {/* Save Status */}
            <div className="flex items-center gap-2 text-sm">
              {isAutoSaving ? (
                <>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  <span className="text-yellow-400">Saving...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                  <span className="text-yellow-400">Unsaved changes</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-green-400">Saved</span>
                </>
              )}
              {lastSaved && <span className="text-muted-foreground">• {formatLastSaved()}</span>}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button onClick={handleManualSave} size="sm" className="gap-2">
                <Save className="w-4 h-4" />
                Save
              </Button>

              <Button onClick={handleDelete} variant="destructive" size="sm" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Title Input */}
        <div className="flex-shrink-0 p-6 pb-0">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Note title..."
            className="w-full text-3xl font-bold bg-transparent border-none outline-none text-foreground placeholder-muted-foreground"
          />
        </div>

        {/* Content Editor */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 p-6 pt-4">
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start writing your note..."
              className="w-full h-full bg-transparent border-none outline-none text-foreground placeholder-muted-foreground resize-none font-mono text-sm leading-relaxed"
              style={{ minHeight: "100%" }}
            />
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex-shrink-0 p-6 pt-0 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Type className="w-3 h-3" />
                <span>{getWordCount()} words</span>
              </div>
              <div className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                <span>{getCharacterCount()} characters</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Created {note.updatedAt.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
