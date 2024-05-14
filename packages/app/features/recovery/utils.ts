import { supabaseAdmin } from 'app/utils/supabase/admin'
import type { ChallengeResponse } from './types'
import type { Debugger } from 'debug'
import type { PostgrestSingleResponse } from '@supabase/postgrest-js'

export const getChallenge = async (
  userId: string,
  challengeId: string
): Promise<PostgrestSingleResponse<ChallengeResponse>> => {
  return await supabaseAdmin
    .from('auth_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('id', challengeId)
    .single()
}

export const getChainAddress = async (userId: string) => {
  return await supabaseAdmin.from('chain_addresses').select('*').eq('user_id', userId).single()
}

export const isChallengeExpired = async (
  challengeId: string,
  logger?: Debugger
): Promise<boolean> => {
  const { data, error } = await supabaseAdmin
    .from('auth_challenges')
    .select('*')
    .eq('challenge_id', challengeId)
    .gt('expires_at', 'now()')
    .limit(1)

  if (error) {
    logger?.(`isChallengeExpired:${error?.message}`)
    return true
  }

  if (data.length === 0) {
    return true
  }
  return false
}
