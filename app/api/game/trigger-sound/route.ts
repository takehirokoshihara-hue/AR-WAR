import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { sound_event } = await request.json()

    if (!sound_event) {
      return NextResponse.json(
        { error: 'Invalid sound event' },
        { status: 400 }
      )
    }

    // game_stateのmetadataにsound_eventと一意のIDを保存
    const { data: currentState, error: fetchError } = await supabase
      .from('game_state')
      .select('metadata')
      .eq('id', 1)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const { error } = await supabase
      .from('game_state')
      .update({
        metadata: {
          ...currentState.metadata,
          sound_event,
          sound_trigger_id: Date.now() // 一意のIDで再生を識別
        }
      })
      .eq('id', 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, sound_event })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
