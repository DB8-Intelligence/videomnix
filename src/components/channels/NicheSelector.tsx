'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { NICHES, type NicheKey } from '@/lib/niche-config'

interface NicheSelectorProps {
  selected: NicheKey | null
  onSelect: (niche: NicheKey) => void
  language: string
}

export function NicheSelector({ selected, onSelect, language }: NicheSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(Object.entries(NICHES) as [NicheKey, (typeof NICHES)[NicheKey]][]).map(
        ([key, niche]) => {
          const rpm = language === 'en-US' ? niche.rpm_en : niche.rpm_br
          return (
            <Card
              key={key}
              className={cn(
                'cursor-pointer transition-all hover:border-primary',
                selected === key && 'border-primary ring-2 ring-primary/20'
              )}
              onClick={() => onSelect(key)}
            >
              <CardContent className="pt-6">
                <div className="text-center">
                  <span className="text-4xl">{niche.emoji}</span>
                  <h3 className="mt-2 font-semibold">{niche.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {niche.description}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    RPM estimado: R${rpm.min}–R${rpm.max}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        }
      )}
    </div>
  )
}
