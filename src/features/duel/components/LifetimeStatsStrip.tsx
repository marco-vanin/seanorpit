import type { LifetimeStats } from '@/lib/stats'

/**
 * The home lifetime-stats strip: parties played · average accuracy · record
 * streak, in three divided cells. Split out of HomeScreen; identical markup.
 */
export function LifetimeStatsStrip({ stats }: { stats: LifetimeStats }) {
  return (
    <div className="mx-auto mb-[44px] flex max-w-[460px] overflow-hidden rounded-[16px] border border-hairline bg-nav-bg">
      <LifetimeStat value={stats.games} label="Parties" />
      <LifetimeStat
        value={`${stats.accuracy}%`}
        label="Précision moy."
        color="var(--slot-a)"
        divider
      />
      <LifetimeStat value={stats.recordStreak} label="Record série" color="var(--gold)" divider />
    </div>
  )
}

function LifetimeStat({
  value,
  label,
  color,
  divider,
}: {
  value: string | number
  label: string
  color?: string
  divider?: boolean
}) {
  return (
    <div className={`flex-1 px-2 py-4 text-center ${divider ? 'border-l border-hairline' : ''}`}>
      <div className="text-[24px] font-bold" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="mt-[3px] font-mono text-[10px] tracking-[1px] text-muted uppercase">
        {label}
      </div>
    </div>
  )
}
