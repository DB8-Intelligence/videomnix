// src/app/api/crm/deals/[id]/activity/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canUseSocialFeature } from '@/lib/plans'
import type { DealActivityInsert, DealActivityType, Json } from '@/types/supabase'

type Params = { params: { id: string } }

// POST /api/crm/deals/[id]/activity — registrar atividade manual
export async function POST(req: NextRequest, { params }: Params) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const check = await canUseSocialFeature(user.id, 'crm')
  if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 })

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const body = await req.json() as {
    type: DealActivityType
    content?: string
    metadata?: Json
  }

  const VALID_TYPES: DealActivityType[] = [
    'note','email','whatsapp','call','meeting',
    'stage_change','file','contract','payment'
  ]
  if (!VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: 'Tipo de atividade inválido' }, { status: 400 })
  }

  const activity: DealActivityInsert = {
    deal_id:  params.id,
    user_id:  profile.id,
    type:     body.type,
    content:  body.content ?? null,
    metadata: body.metadata ?? {},
  }

  const { data, error } = await supabase
    .from('deal_activities')
    .insert(activity)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Atualizar updated_at do deal
  await supabase
    .from('deals')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', params.id)

  return NextResponse.json({ activity: data }, { status: 201 })
}
