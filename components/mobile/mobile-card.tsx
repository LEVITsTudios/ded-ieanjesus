// components/mobile/mobile-card.tsx - Card responsivo para móvil
'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MobileCardProps {
  title?: string
  subtitle?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
  clickable?: boolean
  onClick?: () => void
}

export function MobileCard({
  title,
  subtitle,
  icon,
  children,
  className,
  clickable,
  onClick,
}: MobileCardProps) {
  return (
    <Card
      className={cn(
        'p-4 md:p-6 transition-all',
        clickable && 'cursor-pointer hover:shadow-lg hover:scale-105',
        className
      )}
      onClick={onClick}
    >
      {(title || icon) && (
        <div className="flex items-start gap-3 mb-3">
          {icon && <div className="text-2xl flex-shrink-0">{icon}</div>}
          <div className="min-w-0 flex-1">
            {title && <h3 className="font-semibold text-sm md:text-base text-foreground truncate">{title}</h3>}
            {subtitle && (
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="text-sm md:text-base">{children}</div>
    </Card>
  )
}

export function MobileCardGrid({
  children,
  columns = 1,
}: {
  children: ReactNode
  columns?: 1 | 2
}) {
  return (
    <div
      className={cn(
        'grid gap-3 md:gap-4',
        columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
      )}
    >
      {children}
    </div>
  )
}
