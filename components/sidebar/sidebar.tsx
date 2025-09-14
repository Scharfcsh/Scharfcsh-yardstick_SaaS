"use client"

import type React from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { Separator } from "@/components/ui/separator"
import { FileText, Crown, LogOut, Users } from "lucide-react"

interface SidebarProps {
  currentView: "notes" | "editor" | "TenantsUsers"
  onViewChange: (view: "notes" | "editor" | "TenantsUsers") => void
  notesCount: number
  onUpgrade?: () => void
}

export function Sidebar({ currentView, onViewChange, notesCount, onUpgrade }: SidebarProps) {
  const { user, logout } = useAuth()

  if (!user) return null

  const showUpgradeButton = user.plan === "free" && notesCount >= 3

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Tenant Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center">
            <span className="text-sm font-semibold text-sidebar-accent-foreground">
              {user?.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground text-sm">{user.email}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{user.role.toUpperCase()}</span>
              {user.plan === "pro" && <Crown className="w-3 h-3 text-yellow-400" />}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <SidebarButton
            icon={<FileText className="w-4 h-4" />}
            label="Notes"
            isActive={currentView === "notes"}
            onClick={() => onViewChange("notes")}
            badge={notesCount > 0 ? notesCount.toString() : undefined}
          />
          <SidebarButton
            icon={<Users className="w-4 h-4" />}
            label="Editors"
            isActive={currentView === "TenantsUsers"}
            onClick={() => onViewChange("TenantsUsers")}
            // badge={notesCount > 0 ? notesCount.toString() : undefined}
          />

          {showUpgradeButton && (
            <>
              <Separator className="my-3" />
              <SidebarButton
                icon={<Crown className="w-4 h-4" />}
                label="Upgrade to Pro"
                onClick={onUpgrade}
                variant="upgrade"
              />
            </>
          )}
        </div>
      </nav>

      {/* Plan Status */}
      {user.plan === "free" && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="bg-sidebar-accent/30 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-sidebar-foreground">Free Plan</span>
              <span className="text-xs text-muted-foreground">{notesCount}/3</span>
            </div>
            <div className="w-full bg-sidebar-border rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((notesCount / 3) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* User Actions */}
      <div className="p-4 border-t border-sidebar-border">
        <SidebarButton icon={<LogOut className="w-4 h-4" />} label="Logout" onClick={logout} variant="ghost" />
      </div>
    </div>
  )
}

interface SidebarButtonProps {
  icon: React.ReactNode
  label: string
  isActive?: boolean
  onClick?: () => void
  badge?: string
  variant?: "default" | "upgrade" | "ghost"
}

function SidebarButton({ icon, label, isActive = false, onClick, badge, variant = "default" }: SidebarButtonProps) {
  const baseClasses =
    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group"

  const variantClasses = {
    default: isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
    upgrade:
      "text-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-300 border border-yellow-400/20 hover:border-yellow-400/40",
    ghost: "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/30",
  }

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} onClick={onClick}>
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="flex-shrink-0 bg-sidebar-primary text-sidebar-primary-foreground text-xs px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {variant === "upgrade" && <div className="flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />}
    </button>
  )
}
