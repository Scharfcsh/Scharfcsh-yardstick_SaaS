"use client"

import { useState, useEffect } from "react"
import { AuthProvider, useAuth } from "@/components/auth/auth-provider"
import { LoginForm } from "@/components/auth/login-form"
import { Sidebar } from "@/components/sidebar/sidebar"
import { NotesListView, type Note } from "@/components/notes/notes-list-view"
import { NoteEditor } from "@/components/notes/note-editor"
import { UpgradeModal } from "@/components/upgrade/upgrade-modal"
import { AuthService } from "@/lib/auth"
import EditorList from "@/components/notes/EditorList"

// API base URL
// const API_BASE_URL = "https://yardstick-back.vercel.app";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Interface for backend note response
interface BackendNote {
  _id: string
  title: string
  content: string
  tenantId: string
  authorId: string
  createdAt: string
  updatedAt: string
  __v: number
}

function NotesAppContent() {
  const { user, isAuthenticated, isLoading, login, logout, error, upgradePlan } = useAuth()
  const [currentView, setCurrentView] = useState<"notes" | "editor" | "TenantsUsers">("notes")
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [notesError, setNotesError] = useState<string | null>(null)

  // Fetch notes from the API
  const fetchNotes = async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingNotes(true);
    setNotesError(null);
    
    try {
      const authService = AuthService.getInstance();
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      
      const backendNotes: BackendNote[] = await response.json();
      
      // Transform backend notes to match our Note interface
      const transformedNotes: Note[] = backendNotes.map(note => ({
        id: note._id,
        title: note.title,
        content: note.content,
        snippet: note.content.substring(0, 100) + (note.content.length > 100 ? '...' : ''),
        updatedAt: new Date(note.updatedAt)
      }));
      
      setNotes(transformedNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      setNotesError("Failed to load notes. Please try again.");
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Fetch notes when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotes();
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <LoginForm
        onLogin={async ({ email, password }) => {
          await login(email, password)
        }}
        isLoading={isLoading}
        error={error ?? undefined}
      />
    )
  }

  const handleUpgrade = () => {
    setShowUpgradeModal(true)
  }

  const handleUpgradeSuccess = async () => {
    try {
      // await upgradePlan()
      // window.location.reload()
      console.log("Upgrade successful")
    } catch (err) {
      console.error("Upgrade failed:", err)
    }
  }

  const handleNewNote = async () => {
    // Check if user can create new note
    if (user.plan === "free" && notes.length >= 3) {
      setShowUpgradeModal(true)
      return
    }

    try {
      const authService = AuthService.getInstance();
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: "New Note",
          content: ""
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create note');
      }
      
      const newNoteData: BackendNote = await response.json();
      
      const newNote: Note = {
        id: newNoteData._id,
        title: newNoteData.title,
        content: newNoteData.content,
        snippet: "",
        updatedAt: new Date(newNoteData.updatedAt),
      };
      
      setNotes([newNote, ...notes])
      setSelectedNote(newNote)
      setCurrentView("editor")
    } catch (error) {
      console.error("Error creating note:", error);
      // Show error notification if needed
    }
  }

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note)
    setCurrentView("editor")
  }

  const handleSaveNote = async (updatedNote: Note) => {
    try {
      const authService = AuthService.getInstance();
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/notes/${updatedNote.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: updatedNote.title,
          content: updatedNote.content
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update note');
      }
      
      // Update the notes list with the updated note
      setNotes(notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)))
      setSelectedNote(updatedNote)
    } catch (error) {
      console.error("Error updating note:", error);
      // Show error notification if needed
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      const authService = AuthService.getInstance();
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
      
      // Remove the deleted note from the list
      setNotes(notes.filter((n) => n.id !== noteId))
      setCurrentView("notes")
      setSelectedNote(null)
    } catch (error) {
      console.error("Error deleting note:", error);
      // Show error notification if needed
    }
  }

  return (
    <>
      <div className="flex h-screen bg-background text-foreground">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          notesCount={notes.length}
          onUpgrade={handleUpgrade}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {currentView === "notes" ? (
            <NotesListView 
              notes={notes} 
              onSelectNote={handleSelectNote} 
              onNewNote={handleNewNote}
              isLoading={isLoadingNotes}
              error={notesError} 
            />
          ) : currentView === "editor" ? (
            <NoteEditor
              note={selectedNote}
              onBack={() => setCurrentView("notes")}
              onSave={handleSaveNote}
              onDelete={handleDeleteNote}
            />
          ) : (
            <EditorList />
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgradeSuccess={handleUpgradeSuccess}
      />
    </>
  )
}

export default function NotesApp() {
  return (
    <AuthProvider>
      <NotesAppContent />
    </AuthProvider>
  )
}
