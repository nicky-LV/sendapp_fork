// TODO: lint quotes
import { useCallback, useEffect, useState } from 'react'
import SignChallengeEOA from './eoa/SignChallengeEOA'
import type { SignMessageErrorType } from '@wagmi/core'
import type { SignMessageData, SignMessageVariables } from 'wagmi/query'
import { Stack } from '@my/ui'
import type { ChallengeResponse } from 'app/features/recovery/types'
import { useChallengeQuery } from 'app/utils/challenge/useChallengeQuery'
import { useVerifyChallengeQuery } from 'app/utils/challenge/useVerifyChallengeQuery'

interface Props {
  phoneNumber: string
}

// TODO: move recovery/ dir into signin / auth folder, this is part of sign-in flow

export default function SignInWithPasskeyScreen(props: Props) {
  const [challenge, setChallenge] = useState<ChallengeResponse>()

  const challengeQuery = useChallengeQuery()
  const verifyChallengeQuery = useVerifyChallengeQuery()

  useEffect(() => {
    challengeQuery(props.phoneNumber)
      .then((challengeResponse) => {
        setChallenge(challengeResponse as ChallengeResponse)
      })
      .catch((error) => {
        // TODO: handle TRPClientErrors
        throw error
      })
  }, [props.phoneNumber, challengeQuery])

  const onSignSuccess = useCallback(
    (data: SignMessageData, variables: SignMessageVariables, context: unknown) => {
      if (challenge) {
        verifyChallengeQuery(data, challenge.user_id, challenge.id)
      } else {
        // TODO: handle no challenge
      }
    },
    [challenge, verifyChallengeQuery]
  )

  const onSignError = useCallback(
    (error: SignMessageErrorType, variables: SignMessageVariables, context: unknown) => {
      // TODO: handle failed error
      console.log(error)
    },
    []
  )

  return (
    <Stack>
      {!challenge && 'TODO: handle loading'}
      {challenge && (
        <SignChallengeEOA
          challenge={challenge.challenge}
          onSuccess={onSignSuccess}
          onError={onSignError}
        />
      )}
    </Stack>
  )
}
