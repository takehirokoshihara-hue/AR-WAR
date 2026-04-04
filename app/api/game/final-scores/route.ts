import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .order('ar_balance', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const finalScores = teams?.map(team => ({
      ...team,
      final_score: team.ar_balance - (team.debt_count * 500000)
    })).sort((a, b) => b.final_score - a.final_score) || []

    return NextResponse.json({ scores: finalScores })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
