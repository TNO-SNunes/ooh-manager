'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useRef, useTransition } from 'react'
import { Input } from '@/components/ui/input'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function monthOptions() {
  return MESES.map((m, i) => ({ value: String(i + 1), label: m }))
}

function yearOptions() {
  const now = new Date().getFullYear()
  return [now - 1, now, now + 1, now + 2].map(y => ({ value: String(y), label: String(y) }))
}

export interface FiltrosMapaProps {
  mesInicio: number
  anoInicio: number
  mesFim: number
  anoFim: number
}

export function FiltrosMapa({ mesInicio, anoInicio, mesFim, anoFim }: FiltrosMapaProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const push = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) params.set(k, v)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [pathname, router, searchParams])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">De</span>
      <select
        className="h-8 rounded-md border px-2 text-sm"
        value={mesInicio}
        onChange={e => push({ mesInicio: e.target.value })}
        disabled={isPending}
      >
        {monthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select
        className="h-8 rounded-md border px-2 text-sm"
        value={anoInicio}
        onChange={e => push({ anoInicio: e.target.value })}
        disabled={isPending}
      >
        {yearOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <span className="text-sm text-muted-foreground">até</span>
      <select
        className="h-8 rounded-md border px-2 text-sm"
        value={mesFim}
        onChange={e => push({ mesFim: e.target.value })}
        disabled={isPending}
      >
        {monthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select
        className="h-8 rounded-md border px-2 text-sm"
        value={anoFim}
        onChange={e => push({ anoFim: e.target.value })}
        disabled={isPending}
      >
        {yearOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <Input
        placeholder="Buscar ponto…"
        defaultValue={searchParams.get('q') ?? ''}
        className="h-8 w-48"
        onChange={e => {
          const value = e.target.value
          if (debounceRef.current) clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => push({ q: value }), 400)
        }}
        disabled={isPending}
      />
    </div>
  )
}
