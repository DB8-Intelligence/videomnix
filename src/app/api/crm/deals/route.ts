// src/app/api/crm/deals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canUseSocialFeature } from '@/lib/plans'
import type { DealInsert } from '@/types/supabase'

// GET /api/crm/deals — lista deals (kanban completo ou filtrado por stage)
export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const check = await canUseSocialFeature(user.id, 'crm')
  if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const stage = searchParams.get('stage')
  const brand_id = searchParams.get('brand_id')

  let query = supabase
    .from('deals')
    .select(`
      *,
      brand:brands (
        id, name, logo_url, category
      )
    `)
    .order('updated_at', { ascending: false })

  if (stage) query = query.eq('stage', stage)
  if (brand_id) query = query.eq('brand_id', brand_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Agrupar por stage para o kanban se não tiver filtro
  if (!stage) {
    const kanban = {
      prospecting: [] as typeof data,
      contacted:   [] as typeof data,
      negotiating: [] as typeof data,
      contract:    [] as typeof data,
      production:  [] as typeof data,
      published:   [] as typeof data,
      paid:        [] as typeof data,
      lost:        [] as typeof data,
    }
    for (const deal of (data ?? [])) {
      const s = deal.stage as keyof typeof kanban
      if (kanban[s]) kanban[s].push(deal)
    }
    return NextResponse.json({ kanban })
  }

  return NextResponse.json({ deals: data })
}

// POST /api/crm/deals — criar deal
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const check = await canUseSocialFeature(user.id, 'crm')
  if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 })

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const body = await req.json() as Partial<DealInsert>

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Título do deal é obrigatório' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('deals')
    .insert({ ...body, user_id: profile.id })
    .select(`*, brand:brands(id, name, logo_url)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deal: data }, { status: 201 })
}
