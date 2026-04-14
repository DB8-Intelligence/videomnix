// src/app/api/crm/deals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canUseSocialFeature } from '@/lib/plans'
import type { DealUpdate, DealStage } from '@/types/supabase'

type Params = { params: { id: string } }

// GET /api/crm/deals/[id] — deal com brand + atividades
export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const check = await canUseSocialFeature(user.id, 'crm')
  if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 })

  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      brand:brands (*),
      activities:deal_activities (
        id, type, content, metadata, created_at
      )
    `)
    .eq('id', params.id)
    .order('created_at', { referencedTable: 'deal_activities', ascending: false })
    .single()

  if (error || !data) return NextResponse.json({ error: 'Deal não encontrado' }, { status: 404 })

  return NextResponse.json({ deal: data })
}

// PATCH /api/crm/deals/[id] — atualizar deal
// Se stage mudar → registrar atividade de stage_change automaticamente
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const check = await canUseSocialFeature(user.id, 'crm')
  if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 })

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const body = await req.json() as DealUpdate & { stage?: DealStage } & Record<string, unknown>

  // Buscar stage atual para registrar mudança
  const { data: current } = await supabase
    .from('deals')
    .select('stage')
    .eq('id', params.id)
    .single()

  delete body.user_id
  delete body.id

  const { data, error } = await supabase
    .from('deals')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select(`*, brand:brands(id, name, logo_url)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Registrar atividade automática quando stage muda
  if (body.stage && current && body.stage !== current.stage) {
    await supabase.from('deal_activities').insert({
      deal_id: params.id,
      user_id: profile.id,
      type: 'stage_change',
      content: `Movido de "${current.stage}" para "${body.stage}"`,
      metadata: { from_stage: current.stage, to_stage: body.stage },
    })
  }

  return NextResponse.json({ deal: data })
}
