// src/app/api/crm/brands/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canUseSocialFeature } from '@/lib/plans'
import type { BrandUpdate } from '@/types/supabase'

type Params = { params: { id: string } }

// GET /api/crm/brands/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const check = await canUseSocialFeature(user.id, 'crm')
  if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 })

  const { data, error } = await supabase
    .from('brands')
    .select(`
      *,
      deals (
        id, title, value, stage, deal_type, deadline, priority, created_at
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Marca não encontrada' }, { status: 404 })

  return NextResponse.json({ brand: data })
}

// PATCH /api/crm/brands/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const check = await canUseSocialFeature(user.id, 'crm')
  if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 })

  const body = await req.json() as BrandUpdate

  // Impedir alteração de campos protegidos
  delete (body as any).user_id
  delete (body as any).id
  delete (body as any).total_deals
  delete (body as any).total_revenue
  delete (body as any).avg_deal_value

  const { data, error } = await supabase
    .from('brands')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ brand: data })
}

// DELETE /api/crm/brands/[id] — arquivar (status: blocked), nunca deletar fisicamente
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const check = await canUseSocialFeature(user.id, 'crm')
  if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 })

  const { error } = await supabase
    .from('brands')
    .update({ status: 'blocked', updated_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
