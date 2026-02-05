// components/mobile/mobile-stats.tsx - Stats responsivos para móvil
'use client'

import { Card } from "@/components/ui/card"

interface StatItem {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: string
}

interface MobileStatsProps {
  stats: StatItem[]
}

export function MobileStats({ stats }: MobileStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {stats.map((stat, i) => (
        <Card
          key={i}
          className="p-3 md:p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow"
        >
          {stat.icon && (
            <div className={`text-2xl md:text-3xl mb-2 ${stat.color || 'text-blue-600'}`}>
              {stat.icon}
            </div>
          )}
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            {stat.label}
          </p>
          <p className="text-lg md:text-2xl font-bold mt-1 text-foreground">
            {stat.value}
          </p>
        </Card>
      ))}
    </div>
  )
}
