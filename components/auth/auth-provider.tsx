"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { AuthService, type AuthState } from "@/lib/auth"

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  upgradePlan: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })
  const [error, setError] = useState<string | null>(null)

  const authService = AuthService.getInstance()

  useEffect(() => {
    // Check if user is already authenticated on mount
    const user = authService.getCurrentUser()
    setAuthState({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    })
  }, [])

  const login = async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }))
    setError(null)

    try {
      const user = await authService.login(email, password)
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
      setAuthState((prev) => ({ ...prev, isLoading: false }))
      throw err
    }
  }

  const logout = async () => {
    await authService.logout()
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
    setError(null)
  }

  const upgradePlan = async () => {
    if (!authState.user) return

    try {
      const updatedUser = await authService.upgradePlanApi(authState.user.tenantName)
      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
      }))
    } catch (err) {
      throw err
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        upgradePlan,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
