import { Paragraph, Spinner, Tooltip, type TooltipProps, XStack, type XStackProps } from '@my/ui'
import { useThemeSetting } from '@tamagui/next-theme'
import { baseMainnet } from '@my/wagmi'
import { IconArrowRight, IconError } from 'app/components/icons'
import formatAmount from 'app/utils/formatAmount'
import { useSendAccounts } from 'app/utils/send-accounts'
import { type UseBalanceReturnType, useBalance } from 'wagmi'
import { createParam } from 'solito'

const { useParam } = createParam<{ token: `0x${string}` | 'eth' }>()

export const TokenBalanceList = ({
  coins,
}: { coins: { label: string; token: `0x${string}` | 'eth'; icon: JSX.Element }[] }) => {
  const [, setToken] = useParam('token')

  const { resolvedTheme } = useThemeSetting()
  const separatorColor = resolvedTheme?.startsWith('dark') ? '#343434' : '#E6E6E6'

  return coins.map((coin, index) => (
    <TokenBalanceItem
      coin={coin}
      key={coin.label}
      jc={'space-between'}
      ai={'center'}
      py={'$3.5'}
      borderColor={separatorColor}
      onPress={() => setToken(coin.token)}
      borderBottomWidth={index !== coins.length - 1 ? 1 : 0}
    />
  ))
}

const TokenBalanceItem = ({
  coin,
  ...props
}: {
  coin: { label: string; token: `0x${string}` | 'eth'; icon: JSX.Element }
} & XStackProps) => {
  const { data: sendAccounts } = useSendAccounts()
  const sendAccount = sendAccounts?.[0]

  const balance = useBalance({
    address: sendAccount?.address,
    token: coin.token === 'eth' ? undefined : coin.token,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  return (
    <XStack {...props}>
      <XStack gap={'$2'} $gtLg={{ gap: '$3.5' }} ai={'center'}>
        {coin.icon}
        <Paragraph
          fontSize={'$5'}
          fontWeight={'500'}
          textTransform={'uppercase'}
          color={'$color12'}
        >
          {coin.label}
        </Paragraph>
      </XStack>
      <XStack gap={'$3.5'} ai={'center'}>
        <TokenBalance balance={balance} />
      </XStack>
    </XStack>
  )
}

const TokenBalance = ({ balance }: { balance: UseBalanceReturnType }) => {
  const { resolvedTheme } = useThemeSetting()
  const iconColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$black'

  if (balance) {
    if (balance.isError) {
      return (
        <>
          <Paragraph fontSize={'$9'} fontWeight={'500'} color={'$color12'}>
            --
          </Paragraph>
          <ErrorTooltip groupId="1" placement="right" Icon={<IconError color={'$redVibrant'} />}>
            Error occurred while fetching balance. {balance.error.message}
          </ErrorTooltip>
        </>
      )
    }
    if (balance.isPending) {
      return <Spinner size={'small'} />
    }
    if (balance?.data?.value === undefined) {
      return <></>
    }
    return (
      <>
        <Paragraph fontFamily={'$mono'} fontSize={'$9'} fontWeight={'500'} color={'$color12'}>
          {formatAmount(
            (Number(balance.data.value) / 10 ** (balance.data?.decimals ?? 0)).toString()
          )}
        </Paragraph>

        <XStack $lg={{ display: 'none' }}>
          <IconArrowRight $group-hover={{ x: 5 }} color={iconColor} />
        </XStack>
      </>
    )
  }
}

const ErrorTooltip = ({ Icon, children, ...props }: TooltipProps & { Icon?: JSX.Element }) => {
  return (
    <Tooltip {...props}>
      <Tooltip.Trigger>{Icon}</Tooltip.Trigger>
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
        bc={'transparent'}
        borderWidth={1}
        borderColor={'$redVibrant'}
      >
        <Paragraph color={'$color12'} fontWeight={'500'}>
          {children}
        </Paragraph>
      </Tooltip.Content>
    </Tooltip>
  )
}
