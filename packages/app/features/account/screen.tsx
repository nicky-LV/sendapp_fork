import {
  Avatar,
  Container,
  Link,
  type LinkProps,
  Paragraph,
  Separator,
  XStack,
  YStack,
  Button,
  useToastController,
  TooltipSimple,
  useMedia,
  useThemeName,
  Theme,
  H3,
  Stack,
} from '@my/ui'
import {
  IconAccount,
  IconCopy,
  IconDollar,
  IconGear,
  IconPlus,
  IconShare,
} from 'app/components/icons'
import { getReferralHref } from 'app/utils/getReferralLink'
import { useUser } from 'app/utils/useUser'
import * as Clipboard from 'expo-clipboard'
import * as Sharing from 'expo-sharing'
import { useNav } from 'app/routers/params'
import type React from 'react'
import { type ElementType, useEffect, useState } from 'react'
import { useThemeSetting } from '@tamagui/next-theme'
import { useConfirmedTags } from 'app/utils/tags'

export function AccountScreen() {
  const media = useMedia()
  const toast = useToastController()
  const { profile } = useUser()
  const name = profile?.name
  const send_id = profile?.send_id
  const avatar_url = profile?.avatar_url
  const tags = useConfirmedTags()
  const sendTags = useConfirmedTags()?.reduce((prev, tag) => `${prev} @${tag.name}`, '')
  const refCode = profile?.referral_code ?? ''
  const referralHref = getReferralHref(refCode)
  const [, setNavParam] = useNav()
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    const canShare = async () => {
      const canShare = await Sharing.isAvailableAsync()
      setCanShare(canShare)
    }
    canShare()
  }, [])

  const shareOrCopyOnPress = async () => {
    if (canShare) {
      return await Sharing.shareAsync(referralHref)
    }

    await Clipboard.setStringAsync(referralHref)
      .then(() => toast.show('Copied your referral link to the clipboard'))
      .catch(() =>
        toast.show('Something went wrong', {
          message: 'We were unable to copy your referral link to the clipboard',
          customData: {
            theme: 'error',
          },
        })
      )
  }

  const facts = [
    { label: 'Send ID', value: send_id },
    { label: 'Sendtags', value: sendTags },
    {
      label: 'Referral Code',
      value: (
        <TooltipSimple label={canShare ? 'Share' : 'Copy'}>
          <Button
            accessibilityLabel={canShare ? 'Share' : 'Copy'}
            f={1}
            fd="row"
            unstyled
            onPress={shareOrCopyOnPress}
            color="$color12"
            iconAfter={
              canShare ? (
                <Theme name="accent">
                  <IconShare color="$color1" size="$1" $platform-web={{ cursor: 'pointer' }} />
                </Theme>
              ) : (
                <Theme name="accent">
                  <IconCopy color="$color1" size="$1" $platform-web={{ cursor: 'pointer' }} />
                </Theme>
              )
            }
          >
            <Button.Text>{refCode}</Button.Text>
          </Button>
        </TooltipSimple>
      ),
    },
  ]

  return (
    <>
      <Container>
        <YStack w={'100%'} ai={'center'} gap={'$6'} pb="$6">
          <XStack w={'100%'} ai={'center'} jc={'space-between'} $md={{ jc: 'center' }} zIndex={4}>
            <XStack ai={'center'} jc={'center'} gap={'$5'} $md={{ flexDirection: 'column' }}>
              <Avatar $gtMd={{ size: 133.5 }} size={'$10'} borderRadius={'$3'}>
                <Avatar.Image
                  $gtMd={{ w: 133.5, h: 133.5 }}
                  w={'$10'}
                  h="$10"
                  accessibilityLabel=""
                  src={avatar_url ?? ''}
                />
                <Avatar.Fallback f={1} jc={'center'} ai={'center'} backgroundColor={'$decay'}>
                  <IconAccount size="$6" color="$olive" />
                </Avatar.Fallback>
              </Avatar>
              <YStack gap={'$2'} $md={{ ai: 'center' }}>
                <Paragraph fontSize={'$9'} fontWeight={'700'} color={'$color12'}>
                  {name ? name : '---'}
                </Paragraph>
                {tags?.[0] ? (
                  <Paragraph fontFamily={'$mono'} opacity={0.6}>
                    @{tags[0].name}
                  </Paragraph>
                ) : null}
              </YStack>
            </XStack>
            <XStack gap={'$5'} $md={{ display: 'none' }}>
              <BorderedLink href={'/account/sendtag'} Icon={IconPlus}>
                Sendtags
              </BorderedLink>
              <BorderedLink href={'/account/rewards'} Icon={IconDollar}>
                Rewards
              </BorderedLink>
              <BorderedLink
                href="/account/settings/edit-profile"
                Icon={IconGear}
                // on smaller screens, we don't want to navigate to the settings screen but open bottom sheet
                {...(media.lg
                  ? {
                      onPress: (e) => {
                        if (media.lg) {
                          e.preventDefault()
                          setNavParam('settings', { webBehavior: 'replace' })
                        }
                      },
                    }
                  : {})}
              >
                Settings
              </BorderedLink>
            </XStack>
          </XStack>
          <Separator w={'100%'} />
          <ProfileFacts facts={facts} />
          <Separator w={'100%'} />
          <YStack w="100%" gap="$5" f={1}>
            {tags?.length === 0 ? <NoTagsMessage /> : null}
            <BottomButtonRow />
          </YStack>
        </YStack>
      </Container>
    </>
  )
}

const BorderedLink = ({
  Icon,
  children,
  ...props
}: { Icon?: ElementType; children: React.ReactNode } & LinkProps) => {
  const themeName = useThemeName()
  const { resolvedTheme } = useThemeSetting()
  const iconColor = (resolvedTheme ?? themeName)?.startsWith('dark') ? '$color10' : '$color1'
  return (
    <Link
      borderWidth={1}
      color={iconColor}
      theme="accent"
      borderRadius={'$4'}
      p={'$3'}
      px="$4"
      {...props}
    >
      <XStack gap={'$1.5'} ai={'center'}>
        {Icon && <Icon color={iconColor} />}
        <Paragraph color={iconColor} textTransform="uppercase">
          {children}
        </Paragraph>
      </XStack>
    </Link>
  )
}

const ProfileFacts = ({ facts }: { facts: { label: string; value?: React.ReactNode }[] }) => {
  return (
    <>
      <XStack w={'100%'} $md={{ jc: 'center' }} $sm={{ display: 'none' }}>
        <YStack gap={'$5'} w={'$12'}>
          {facts.map((fact) => (
            <Paragraph key={fact.label} fontSize={'$5'} fontWeight={'500'}>
              {fact.label}
            </Paragraph>
          ))}
        </YStack>
        <YStack gap={'$5'}>
          {facts.map((fact) => (
            <Paragraph key={fact.label} color={'$color12'} fontSize={'$5'} fontWeight={'700'}>
              {fact.value ? fact.value : `No ${fact.label.toLowerCase()}`}
            </Paragraph>
          ))}
        </YStack>
      </XStack>
      <YStack w={'100%'} gap={'$6'} $gtSm={{ display: 'none' }}>
        {facts.map((fact) => (
          <YStack key={fact.label} gap={'$2'}>
            <Paragraph fontSize={'$5'} fontWeight={'500'}>
              {fact.label}
            </Paragraph>
            <Paragraph color={'$color12'} fontSize={'$5'} fontWeight={'500'}>
              {fact.value ? fact.value : `No ${fact.label.toLowerCase()}`}
            </Paragraph>
          </YStack>
        ))}
      </YStack>
    </>
  )
}

const NoTagsMessage = () => {
  return (
    <>
      <H3 fontSize={'$9'} fontWeight={'700'} color={'$color12'}>
        Register your Sendtag Today!
      </H3>

      <YStack w="100%" gap="$2.5" my="auto">
        <Paragraph fontSize={'$6'} fontWeight={'700'} color={'$color12'} fontFamily={'$mono'}>
          By registering a Sendtag, you can:
        </Paragraph>
        <YStack>
          <Paragraph fontSize={'$4'} fontWeight={'500'} color={'$color12'} fontFamily={'$mono'}>
            1. Qualify for Send it Rewards based on your token balance
          </Paragraph>
          <Paragraph fontSize={'$4'} fontWeight={'500'} color={'$color12'} fontFamily={'$mono'}>
            2. Send and receive funds using your personalized, easy-to-remember Sendtag
          </Paragraph>
          <Paragraph fontSize={'$4'} fontWeight={'500'} color={'$color12'} fontFamily={'$mono'}>
            3. Claim your preferred Sendtag before someone else does
          </Paragraph>
        </YStack>
        <Paragraph fontSize={'$4'} fontWeight={'500'} color={'$color12'} fontFamily={'$mono'}>
          Join us in shaping the Future of Finance.
        </Paragraph>
      </YStack>
    </>
  )
}

const BottomButtonRow = () => {
  const tags = useConfirmedTags()
  const media = useMedia()

  if (media.gtMd && (tags === undefined || tags.length === 0))
    return (
      <Stack f={1} jc="center" $md={{ display: 'none' }}>
        <Link
          href={'/account/sendtag/checkout'}
          theme="accent"
          borderRadius={'$4'}
          p={'$3.5'}
          px="$6"
          maw={301}
          bg="$primary"
        >
          <XStack gap={'$1.5'} ai={'center'} jc="center">
            <IconPlus col={'$black'} />
            <Paragraph textTransform="uppercase" col={'$black'}>
              SENDTAGS
            </Paragraph>
          </XStack>
        </Link>
      </Stack>
    )

  return (
    <XStack gap={'$5'} f={1} display="flex" jc="center" $gtMd={{ display: 'none' }}>
      <BorderedLink href={'/account/sendtag'} Icon={IconPlus}>
        Sendtags
      </BorderedLink>
      <BorderedLink href={'/account/rewards'} Icon={IconDollar}>
        Rewards
      </BorderedLink>
    </XStack>
  )
}
