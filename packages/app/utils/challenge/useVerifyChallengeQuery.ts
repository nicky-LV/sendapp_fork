import { useCallback } from 'react'
import type { VerifyChallengeResponse } from 'app/features/recovery/types'
import { api } from 'app/utils/api'
import type { TRPCError } from '@trpc/server'

export const useVerifyChallengeQuery = () => {
  const verifyChallengeMutation = api.challenge.verifyChallenge.useMutation()

  const challenge = useCallback(
    async (
      signature: string,
      userId: string,
      challengeId: string
    ): Promise<VerifyChallengeResponse | TRPCError> => {
      return await verifyChallengeMutation
        .mutateAsync({ signature, userId, challengeId })
        .then((challengeResponse) => {
          return challengeResponse
        })
    },
    [verifyChallengeMutation]
  )

  return challenge
}
