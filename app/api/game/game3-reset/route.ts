import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    const { data: gameState, error: fetchError } = await supabase
      .from('game_state')
      .select('*')
      .eq('id', 1)
      .single()

    if (fetchError || !gameState) {
      return NextResponse.json(
        { error: 'Game state not found' },
        { status: 404 }
      )
    }

    const { error: updateError } = await supabase
      .from('game_state')
      .update({
        metadata: {
          ...gameState.metadata,
          highest_bid: 0,
          highest_bidder: null
        }
      })
      .eq('id', 1)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Auction reset successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
