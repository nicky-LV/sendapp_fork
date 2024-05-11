import {
  Button,
  ButtonIcon,
  ButtonText,
  Paragraph,
  Spinner,
  Tooltip,
  YStack,
  useMedia,
  type ButtonProps,
} from '@my/ui'

import {
  baseMainnetClient,
  sendAccountAbi,
  sendRevenueSafeAddress,
  tokenPaymasterAddress,
} from '@my/wagmi'
import { AlertTriangle, CheckCircle } from '@tamagui/lucide-icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { TRPCClientError } from '@trpc/client'
import { api } from 'app/utils/api'
import { assert } from 'app/utils/assert'
import { pgBase16ToHex } from 'app/utils/pgBase16ToHex'
import { useSendAccount } from 'app/utils/send-accounts/useSendAccounts'
import { usePendingTags } from 'app/utils/tags'
import { useReceipts } from 'app/utils/useReceipts'
import { useUser } from 'app/utils/useUser'
import { defaultUserOp, sendUserOpTransfer } from 'app/utils/useUserOpTransferMutation'
import { useAccountNonce } from 'app/utils/userop'
import type { UserOperation } from 'permissionless'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { checksumAddress, encodeFunctionData } from 'viem'
import {
  useBalance,
  useBlockNumber,
  useEstimateFeesPerGas,
  usePublicClient,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { getPriceInWei, useSenderSafeReceivedEvents } from '../checkout-utils'

export function ConfirmButton({
  onConfirmed,
}: {
  onConfirmed: () => void
}) {
  const media = useMedia()
  const { updateProfile } = useUser()
  const { data: sendAccount } = useSendAccount()
  //Connect
  const chainId = baseMainnetClient.chain.id
  const pendingTags = usePendingTags()
  const publicClient = usePublicClient()
  const { data: ethBalance } = useBalance({
    address: sendAccount?.address,
    chainId: baseMainnetClient.chain.id,
  })
  const weiAmount = useMemo(() => getPriceInWei(pendingTags ?? []), [pendingTags])
  const canAffordTags = ethBalance && ethBalance.value >= weiAmount
  const [submitting, setSubmitting] = useState(false)
  const confirm = api.tag.confirm.useMutation()
  const { receipts, refetch: refetchReceipts, isLoading: isLoadingReceipts } = useReceipts()
  const receiptHashes = useMemo(() => receipts?.map((r) => r.hash) ?? [], [receipts])
  const [sentTx, setSentTx] = useState<`0x${string}`>()
  const { data: sendRevenuesSafeReceives, error: sendRevenuesSafeReceivesError } =
    useSenderSafeReceivedEvents()

  const { data: block } = useBlockNumber()
  const lookupSafeReceivedEvent = useCallback(async () => {
    const address = sendAccount?.address
    if (!address) return
    if (isLoadingReceipts) return
    if (receipts === undefined) return
    if (!publicClient) return

    const event = sendRevenuesSafeReceives
      ?.filter((e) => {
        assert(!!e.tx_hash, 'tx_hash is required')
        assert(e.tx_hash.startsWith('\\x'), 'Hex string must start with \\x')
        assert(!!e.sender, 'sender is required')
        assert(e.sender.startsWith('\\x'), 'Hex string must start with \\x')
        const sender = pgBase16ToHex(e.sender as `\\x${string}`)
        const hash = pgBase16ToHex(e.tx_hash as `\\x${string}`)
        const isPurchase =
          checksumAddress(sender) === checksumAddress(address) &&
          e.v &&
          BigInt(e.v) === weiAmount &&
          !receiptHashes.includes(hash)
        return isPurchase
      })
      .shift()

    // check it against the receipts
    if (event?.tx_hash) {
      submitTxToDb(pgBase16ToHex(event.tx_hash as `\\x${string}`))
    }
  }, [
    receipts,
    publicClient,
    sendAccount,
    weiAmount,
    isLoadingReceipts,
    receiptHashes,
    sendRevenuesSafeReceives,
  ])

  useEffect(() => {
    if (block) {
      lookupSafeReceivedEvent()
    }
  }, [block, lookupSafeReceivedEvent])

  const {
    data: txReceipt,
    isLoading: txWaitLoading,
    error: txWaitError,
  } = useWaitForTransactionReceipt({
    hash: sentTx,
    confirmations: 2,
  })

  const [error, setError] = useState<string>()
  const [confirmed, setConfirmed] = useState(false)

  const [attempts, setAttempts] = useState(0)
  const {
    data: nonce,
    error: nonceError,
    isLoading: isLoadingNonce,
  } = useAccountNonce({ sender: sendAccount?.address })
  const {
    data: feesPerGas,
    error: gasFeesError,
    isLoading: isLoadingGasFees,
  } = useEstimateFeesPerGas({
    chainId: baseMainnetClient.chain.id,
  })
  const { maxFeePerGas, maxPriorityFeePerGas } = feesPerGas ?? {}
  const {
    data: userOp,
    error: userOpError,
    isLoading: isLoadingUserOp,
  } = useQuery({
    queryKey: [
      'sendTransaction',
      chainId,
      sendAccount?.address,
      String(nonce),
      sendAccount,
      String(maxFeePerGas),
      String(maxPriorityFeePerGas),
      String(weiAmount),
    ],
    enabled:
      !!sendAccount &&
      nonce !== undefined &&
      maxFeePerGas !== undefined &&
      maxPriorityFeePerGas !== undefined,
    queryFn: async () => {
      assert(!!sendAccount, 'No send account found')
      assert(nonce !== undefined, 'No nonce found')
      assert(maxFeePerGas !== undefined, 'No max fee per gas found')
      assert(maxPriorityFeePerGas !== undefined, 'No max priority fee per gas found')
      const callData = encodeFunctionData({
        abi: sendAccountAbi,
        functionName: 'executeBatch',
        args: [
          [
            {
              dest: sendRevenueSafeAddress[chainId as keyof typeof sendRevenueSafeAddress],
              value: weiAmount,
              data: '0x',
            },
          ],
        ],
      })
      const paymaster = tokenPaymasterAddress[chainId]
      const userOp: UserOperation<'v0.7'> = {
        ...defaultUserOp,
        maxFeePerGas,
        maxPriorityFeePerGas,
        sender: sendAccount?.address,
        nonce,
        callData,
        paymaster,
        paymasterData: '0x',
        signature: '0x',
      }
      return userOp
    },
  })
  const { mutateAsync: sendUserOp, isPending: sendTransactionIsPending } = useMutation({
    mutationFn: sendUserOpTransfer,
    onSuccess: (userOpReceipt) => {
      if (userOpReceipt.success) {
        setSentTx(userOpReceipt.receipt.transactionHash)
      } else {
        setError(`Something went wrong: ${userOpReceipt.receipt.transactionHash}`)
      }
    },
  })

  async function handleCheckoutTx() {
    try {
      assert(!!userOp, 'User op is required')
      await sendUserOp({ userOp })
    } catch (e) {
      setError(e.message)
    }
  }

  function submitTxToDb(tx: string) {
    setAttempts((a) => a + 1)
    setSubmitting(true)
    confirm
      .mutateAsync({ transaction: tx })
      .then(async () => {
        setConfirmed(true)
        setSubmitting(false)
        await updateProfile().then(() => {
          refetchReceipts()
        })
        onConfirmed()
      })
      .catch((err) => {
        if (err instanceof TRPCClientError) {
          // handle transaction too new error
          if (
            [
              'Transaction too new.',
              'The Transaction may not be processed on a block yet.',
              `Transaction with hash "${tx}" could not be found`,
            ].some((s) => err.message.includes(s)) &&
            attempts < 10
          ) {
            // try again
            setTimeout(() => {
              submitTxToDb(tx)
            }, 1000)
            return
          }

          setError(err.message)
          return
        }
        console.error(err)
        setError('Something went wrong')
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  useEffect(() => {
    if (txReceipt) submitTxToDb(txReceipt.transactionHash)
  }, [txReceipt])

  useEffect(() => {
    if (txWaitError) {
      setError(txWaitError.message)
    }
  }, [txWaitError])

  if (sendRevenuesSafeReceivesError?.message) {
    return (
      <ConfirmButtonError>
        <YStack gap="$2" ai="center">
          <Paragraph $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
            {sendRevenuesSafeReceivesError?.message}
          </Paragraph>
        </YStack>
      </ConfirmButtonError>
    )
  }

  if (error && !(submitting || sendTransactionIsPending || txWaitLoading)) {
    return (
      <ConfirmButtonError
        buttonText={'Retry'}
        onPress={() => {
          setError(undefined)
          switch (true) {
            case !txReceipt || txWaitError !== null:
              handleCheckoutTx()
              break
            default:
              submitTxToDb(txReceipt?.transactionHash)
              break
          }
        }}
      >
        <YStack gap="$2" ai="center">
          <Paragraph $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
            {error}
          </Paragraph>
        </YStack>
      </ConfirmButtonError>
    )
  }

  if (pendingTags?.length === 0 && !confirmed) {
    return (
      <Tooltip open={true} placement={media.gtMd ? 'right' : 'bottom'}>
        <Tooltip.Content
          enterStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
          scale={1}
          x={0}
          y={0}
          opacity={1}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          boc={'$red500'}
          borderWidth={1}
          $theme-dark={{ bc: '$black' }}
          $theme-light={{ bc: '$white' }}
        >
          <Tooltip.Arrow borderColor={'$red500'} bw={4} />
          <Paragraph $theme-dark={{ col: '$white' }} $theme-light={{ col: '$black' }}>
            You have no Send Tags to confirm. Please add some Send Tags.
          </Paragraph>
        </Tooltip.Content>
      </Tooltip>
    )
  }

  return (
    <Button
      disabled={(pendingTags ?? []).length === 0 || !canAffordTags}
      disabledStyle={{
        bc: '$gray5Light',
        pointerEvents: 'none',
        opacity: 0.5,
      }}
      pointerEvents={submitting || txWaitLoading || sendTransactionIsPending ? 'none' : 'auto'}
      gap="$1.5"
      onPress={handleCheckoutTx}
      br={12}
      f={1}
    >
      {(() => {
        switch (true) {
          case !canAffordTags && (!txWaitLoading || !submitting):
            return <ButtonText>Insufficient funds</ButtonText>
          case sendTransactionIsPending:
            return (
              <>
                <Spinner color="$color11" />
                <ButtonText p="$2">Requesting...</ButtonText>
              </>
            )
          case txWaitLoading:
            return (
              <>
                <Spinner color="$color11" />
                <ButtonText p="$2">Processing...</ButtonText>
              </>
            )
          case submitting:
            return (
              <>
                <Spinner color="$color11" />
                <ButtonText p="$2">Registering...</ButtonText>
              </>
            )
          default:
            return (
              <>
                <ButtonIcon>
                  <CheckCircle />
                </ButtonIcon>
                <ButtonText p="$2">Confirm</ButtonText>
              </>
            )
        }
      })()}
    </Button>
  )
}

//@todo this error tooltip can be used in other places. Abstact it up the tree
const ConfirmButtonError = ({
  children,
  onPress,
  buttonText,
  ...props
}: ButtonProps & { buttonText?: string }) => {
  const media = useMedia()
  return (
    <Tooltip open={true} placement={media.gtMd ? 'right' : 'bottom'}>
      <Tooltip.Content
        enterStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
        exitStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
        scale={1}
        x={0}
        y={0}
        opacity={1}
        animation={[
          'quick',
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
        boc={'$red500'}
        borderWidth={1}
        maw={300}
        $theme-dark={{ bc: '$black' }}
        $theme-light={{ bc: '$gray4Light' }}
      >
        <Tooltip.Arrow borderColor={'$red500'} bw={4} />
        {children}
      </Tooltip.Content>
      <Tooltip.Trigger>
        <Button gap="$1.5" onPress={onPress} br={12} f={1} {...props}>
          <ButtonText gap="$1.5">{buttonText || 'Error'}</ButtonText>
          <ButtonIcon>
            <AlertTriangle color={'$red500'} />
          </ButtonIcon>
        </Button>
      </Tooltip.Trigger>
    </Tooltip>
  )
}
