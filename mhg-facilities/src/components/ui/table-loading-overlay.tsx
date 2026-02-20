'use client'

import { Loader2 } from 'lucide-react'

interface TableLoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
}

export function TableLoadingOverlay({ isLoading, children }: TableLoadingOverlayProps) {
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  )
}
