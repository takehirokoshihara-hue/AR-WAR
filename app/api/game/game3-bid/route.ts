import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { team_id, bid_amount } = await request.json()

    if (!team_id || !bid_amount || bid_amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('ar_balance')
      .eq('id', team_id)
      .single()

    if (teamError || !team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    if (team.ar_balance < bid_amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    const { data: gameState, error: gameError } = await supabase
      .from('game_state')
      .select('*')
      .eq('id', 1)
      .single()

    if (gameError || !gameState) {
      return NextResponse.json(
        { error: 'Game state not found' },
        { status: 404 }
      )
    }

    const currentHighestBid = gameState.metadata?.highest_bid || 0

    if (bid_amount <= currentHighestBid) {
      return NextResponse.json(
        { error: `Bid must be higher than ${currentHighestBid}` },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('game_state')
      .update({
        metadata: {
          ...gameState.metadata,
          highest_bid: bid_amount,
          highest_bidder: team_id
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
      bid_amount,
      team_id
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
