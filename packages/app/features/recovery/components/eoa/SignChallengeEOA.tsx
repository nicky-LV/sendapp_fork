import { useSignMessage, useConnect } from 'wagmi'
import type { SignMessageErrorType } from '@wagmi/core'
import type { SignMessageData, SignMessageVariables } from 'wagmi/query'
import { WagmiProvider } from 'app/provider/wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Button } from '@my/ui'
import { Provider } from 'app/provider'
import { OpenConnectModalWrapper } from 'app/utils/OpenConnectModalWrapper'

interface Props {
  challenge: string
  // https://wagmi.sh/react/api/hooks/useSignMessage#onsuccess
  // TODO: fix unknown type
  onSuccess: (data: SignMessageData, variables: SignMessageVariables, context: unknown) => void
  // https://wagmi.sh/react/api/hooks/useSignMessage#onerror
  // TODO: fix unknown type
  onError: (error: SignMessageErrorType, variables: SignMessageVariables, context: unknown) => void
}

export default function SignChallengeEOA(props: Props) {
  const { signMessage } = useSignMessage()

  return (
    <Provider>
      <OpenConnectModalWrapper>
        <Button
          onPress={() =>
            signMessage(
              {
                message: props.challenge,
              },
              {
                onSuccess: props.onSuccess,
                onError: props.onError,
              }
            )
          }
        >
          TODO: Sign Message
        </Button>
      </OpenConnectModalWrapper>
    </Provider>
  )
}
