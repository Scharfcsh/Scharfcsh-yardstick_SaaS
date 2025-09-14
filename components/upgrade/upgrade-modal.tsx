"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/components/auth/auth-provider"
import { Crown, Check, X, Loader2 } from "lucide-react"
import { AuthService } from "@/lib/auth"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  onUpgradeSuccess: () => void
}

export function UpgradeModal({ isOpen, onClose, onUpgradeSuccess }: UpgradeModalProps) {
  const { user,upgradePlan } = useAuth()
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    if (!user) return

    // Check if user is admin
    if (user.role !== "admin") {
      setError("Only administrators can upgrade the plan for this organization.")
      return
    }

    setIsUpgrading(true)
    setError(null)

    try {
      // const authService = AuthService.getInstance();
      // Use the upgradePlan method from AuthService
      upgradePlan();
      
      // Call the success handler from the parent component
      onUpgradeSuccess();
      onClose();
    } catch (err) {
      console.error('Upgrade error:', err);
      setError(typeof err === 'object' && err !== null && 'message' in err 
        ? (err as Error).message 
        : "Failed to upgrade. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  }

  const features = [
    { name: "Unlimited notes", free: "3 notes", pro: "Unlimited" },
    { name: "Advanced search", free: false, pro: true },
    { name: "Export to PDF", free: false, pro: true },
    { name: "Collaboration", free: false, pro: true },
    { name: "Priority support", free: false, pro: true },
    { name: "Custom themes", free: false, pro: true },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>Unlock unlimited notes and advanced features for your team.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Pricing */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">$9</div>
              <div className="text-sm text-muted-foreground">per month</div>
            </div>
          </div>

          {/* Features Comparison */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">What's included:</h4>
            {features.map((feature, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">{feature.name}</span>
                <div className="flex items-center gap-4">
                  <div className="text-xs text-muted-foreground w-16 text-center">
                    {typeof feature.free === "boolean" ? (
                      feature.free ? (
                        <Check className="w-4 h-4 text-green-400 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      feature.free
                    )}
                  </div>
                  <div className="text-xs text-yellow-400 w-16 text-center font-medium">
                    {typeof feature.pro === "boolean" ? (
                      feature.pro ? (
                        <Check className="w-4 h-4 text-yellow-400 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      feature.pro
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Admin Only Notice */}
          {user?.role !== "admin" && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <p className="text-yellow-400 text-sm">
                Only administrators can upgrade the plan for {user?.tenantName}.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUpgrading}>
            Cancel
          </Button>
          <Button onClick={handleUpgrade} disabled={isUpgrading || user?.role !== "admin"} className="gap-2">
            {isUpgrading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Upgrading...
              </>
            ) : (
              <>
                <Crown className="w-4 h-4" />
                Upgrade Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
