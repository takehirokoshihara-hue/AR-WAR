import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { phase, metadata } = await request.json()

    if (!phase) {
      return NextResponse.json(
        { error: 'Phase is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('game_state')
      .update({
        phase,
        metadata: metadata || {}
      })
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
