import { TRPCError } from '@trpc/server'
import { sha256 } from '@noble/hashes/sha256'
import debug from 'debug'

import { supabaseAdmin } from 'app/utils/supabase/admin'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { formatPhoneNumber } from 'app/utils/formatPhoneNumber'

import { verifyMessage } from 'viem'
import { ChallengeRequestSchema, VerifyChallengeRequestSchema } from 'app/features/recovery/schemas'
import type { ChallengeResponse, VerifyChallengeResponse } from 'app/features/recovery/types'
import { getChainAddress, getChallenge, isChallengeExpired } from 'app/features/recovery/utils'
import { mintAuthenticatedJWTToken } from 'app/utils/jwt'

const logger = debug('api:routers:challenge')

export const challengeRouter = createTRPCRouter({
  getChallenge: publicProcedure.input(ChallengeRequestSchema).mutation(async ({ input }) => {
    // Check the phone number was supplied
    const { phoneNumberInput } = input
    if (!phoneNumberInput) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Phone number is required',
      })
    }

    const phoneNumber: string = formatPhoneNumber(phoneNumberInput)
    try {
      // Retrieve the corresponding user_id to the tag name
      const { data } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('phone', phoneNumber)
        .single()
      const user_id: string = (data?.id as string) || ''
      if (user_id === '') {
        logger('getChallenge:user-not-found')
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User not found',
        })
      }
      // Call the create_challenge function with the user_id and the
      // hex encoded hashed challenge message
      const { data: result } = await supabaseAdmin
        .rpc('upsert_auth_challenges', {
          userid: user_id,
          challenge: challengeUserMessage(user_id, phoneNumber),
        })
        .single()
      // If the result is null throw an error
      if (!result) {
        logger('getChallenge:no-response')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No response from server',
        })
      }
      // Return the JSON result object
      return result as ChallengeResponse
    } catch (error) {
      logger('getChallenge:unknown-error', { error })
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }),
  verifyChallenge: publicProcedure
    .input(VerifyChallengeRequestSchema)
    .mutation(async ({ input }): Promise<VerifyChallengeResponse> => {
      const { userId, challengeId, signature } = input

      // retrieve challenge
      const { data: challengeData, error: getChallengeError } = await getChallenge(
        userId,
        challengeId
      )
      if (getChallengeError) {
        logger('verifyChallenge:invalid_user_or_challenge')
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: getChallengeError.message,
        })
      }

      // validate challenge isn't expired
      if (await isChallengeExpired(challengeData.id, logger)) {
        logger?.('verifyChallenge:challenge-not-found-or-expired')
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Challenge not found or expired. Please try again.',
        })
      }

      // get chain address linked with user id
      const { data: chainAddressData, error: getChainAddressError } = await getChainAddress(userId)
      if (getChainAddressError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: ' ',
          cause: getChainAddressError.message,
        })
      }

      // verify signature with user's chain address
      const challengeVerified = await verifyMessage({
        address: chainAddressData?.address as `0x${string}`,
        message: challengeData.challenge,
        signature: signature as `0x${string}`,
      })

      // handle unauthorized requests
      if (!challengeVerified) {
        logger('verifyChallenge:challenge_failed_verification')
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message:
            'Invalid signature. Ensure that you are signing with the EOA you signed up with. Please try again.',
          cause: `Challenge [${challengeData.challenge}] could not be verified by user [${userId}]`,
        })
      }

      const jwt = mintAuthenticatedJWTToken(userId)
      return {
        jwt,
      }
    }),
})

function challengeUserMessage(user_id: string, pii: string): string {
  return Buffer.from(sha256(`${user_id}: ${generateRandomString(256)} :${pii}`)).toString('hex')
}

const chars =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&@$^%*(){}[]<>:;,.!?-_=+~'

function generateRandomString(length: number): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}
