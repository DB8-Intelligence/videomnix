// src/app/api/crm/brands/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAddBrand, canUseSocialFeature } from '@/lib/plans'
import type { BrandInsert } from '@/types/supabase'

// GET /api/crm/brands — lista marcas do usuário
export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const check = await canUseSocialFeature(user.id, 'crm')
  if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('q')

  let query = supabase
    .from('brands')
    .select('*')
    .order('updated_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ brands: data })
}

// POST /api/crm/brands — criar marca
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const check = await canAddBrand(user.id)
  if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 })

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const body = await req.json() as Partial<BrandInsert>

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Nome da marca é obrigatório' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('brands')
    .insert({ ...body, user_id: profile.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ brand: data }, { status: 201 })
}
