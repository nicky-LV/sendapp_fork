// TopNav.tsx
import {
  H2,
  Header,
  Paragraph,
  XStack,
  Stack,
  useMedia,
  Button as ButtonOg,
  Container,
  Separator,
  useToastController,
  type ButtonProps,
} from '@my/ui'
import { useNav } from 'app/routers/params'
import { useThemeSetting } from '@tamagui/next-theme'
import { IconArrowLeft, IconGear, IconHamburger, IconQr, IconSendLogo } from 'app/components/icons'
import { usePathname } from 'app/utils/usePathname'
import { useRouter } from 'solito/router'
import { SettingsBottomSheet } from 'app/features/account/settings/SettingsBottomSheet'
import { ReferralLink } from './ReferralLink'

export enum ButtonOption {
  QR = 'QR',
  SETTINGS = 'SETTINGS',
  REFERRAL = 'REFERRAL',
  NONE = 'NONE',
}

interface TopNavProps {
  header: string
  subheader?: string
  showLogo?: boolean
  showReferral?: boolean
  /**
   * Customize the button on the right side of the top nav.
   * @default ButtonOption.QR
   */
  button?: ButtonOption
  /**
   * Hide the subroute button
   * @default false
   */
  noSubroute?: boolean
}

export function TopNav({
  header,
  subheader,
  showLogo = false,
  showReferral = false,
  button = ButtonOption.QR,
  noSubroute = false,
}: TopNavProps) {
  const [nav, setNavParam] = useNav()
  const path = usePathname()
  const parts = path.split('/').filter(Boolean)
  const { push } = useRouter()
  const media = useMedia()
  const toast = useToastController()

  const handleHomeBottomSheet = () => {
    setNavParam(nav ? undefined : 'home', { webBehavior: 'replace' })
  }

  const handleSettingsBottomSheet = () => {
    setNavParam(nav ? undefined : 'settings', { webBehavior: 'replace' })
  }

  const handleBack = () => {
    // always pop to the base path. e.g. /account/settings/edit-profile -> /account
    const newPath = parts.slice(0, 1).join('/')
    push(`/${newPath}`)
  }

  const { resolvedTheme } = useThemeSetting()
  const iconColor = resolvedTheme?.startsWith('dark') ? '$primary' : '$black'

  const isSubRoute = !noSubroute && parts.length > 1

  const renderButton = () => {
    switch (button) {
      case ButtonOption.QR:
        return (
          <Button
            $gtLg={{ display: 'none' }}
            icon={<IconQr size={'$2.5'} color={iconColor} />}
            onPress={() => toast.show('Coming Soon')}
          />
        )
      case ButtonOption.SETTINGS:
        return (
          <Button
            $gtLg={{ display: 'none' }}
            icon={<IconGear size={'$2.5'} color={iconColor} />}
            onPress={handleSettingsBottomSheet}
          />
        )
      case ButtonOption.NONE:
        return null
      default:
        if (__DEV__) throw new Error(`Unknown button option: ${button}`)
        return null
    }
  }

  return (
    <Header w="100%" pb="$6">
      <Stack>
        <Container
          $gtLg={{ jc: 'flex-start', pb: '$2', ai: 'flex-start' }}
          ai="center"
          jc="space-between"
          fd="row"
          $lg={{ py: '$4' }}
        >
          <Stack
            display={isSubRoute || media.lg ? 'flex' : 'none'}
            jc="center"
            $gtLg={{ fd: 'row' }}
          >
            {isSubRoute ? (
              <Button
                onPress={handleBack}
                icon={<IconArrowLeft size={'$2.5'} color={iconColor} />}
              />
            ) : (
              <Button
                $gtLg={{ disabled: true, opacity: 0 }} // We need the button to be there for layout purposes
                onPress={handleHomeBottomSheet}
                icon={<IconHamburger size={'$2.5'} color={iconColor} />}
              />
            )}
          </Stack>
          {showLogo && media.lg ? (
            <XStack>
              <IconSendLogo size={'$2.5'} color={'$color12'} />
            </XStack>
          ) : (
            <H2
              fontWeight={'300'}
              $theme-light={{ col: '$gray10Light' }}
              $theme-dark={{ col: '$gray8Light' }}
              lineHeight={32}
              $gtLg={{ ml: isSubRoute ? '$4' : '$0' }}
              als={'center'}
            >
              {header}
            </H2>
          )}
          {showReferral && media.gtLg && (
            <XStack jc={'center'} ai={'center'} ml="auto">
              <Paragraph>Referral Link</Paragraph> <ReferralLink />
            </XStack>
          )}
          <XStack minWidth={'$4'}>{renderButton()}</XStack>
        </Container>
        <Separator w={'100%'} borderColor="$decay" $gtLg={{ display: 'none' }} />
        {subheader && (
          <Container fd="column">
            <Paragraph
              fontWeight={'400'}
              fontSize={'$5'}
              fontFamily={'$mono'}
              lineHeight={24}
              py="$3"
              $gtSm={{ py: '$6' }}
              $gtLg={{ pl: '$1', pb: '$6', pt: '$0', ...{ ml: isSubRoute ? '$10' : '$1' } }}
              $theme-light={{ col: '$gray10Light' }}
              $theme-dark={{ col: '$gray8Light' }}
            >
              {subheader}
            </Paragraph>
            <Separator w={'100%'} borderColor="$jet" />
          </Container>
        )}
      </Stack>
      <SettingsBottomSheet />
    </Header>
  )
}

function Button(props: ButtonProps) {
  return (
    <ButtonOg
      bc="transparent"
      chromeless
      circular
      jc={'center'}
      ai={'center'}
      hoverStyle={{
        backgroundColor: 'transparent',
        borderColor: '$background',
      }}
      pressStyle={{
        backgroundColor: 'transparent',
      }}
      focusStyle={{
        backgroundColor: 'transparent',
      }}
      theme="accent"
      {...props}
    />
  )
}
