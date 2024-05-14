import { useCallback } from 'react'
import type { ChallengeResponse } from 'app/features/recovery/types'
import { api } from 'app/utils/api'
import type { TRPCError } from '@trpc/server'

export const useChallengeQuery = () => {
  const challengeMutation = api.challenge.getChallenge.useMutation()

  const challenge = useCallback(
    async (phoneNumber: string): Promise<ChallengeResponse | TRPCError> => {
      return await challengeMutation
        .mutateAsync({ phoneNumberInput: phoneNumber })
        .then((challengeResponse) => {
          return challengeResponse
        })
    },
    [challengeMutation]
  )

  return challenge
}
