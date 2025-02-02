import type { Tables } from '@my/supabase/database.types'
import {
  Container,
  H3,
  Label,
  ListItem,
  Paragraph,
  Spinner,
  Stack,
  YStack,
  Button,
  ButtonText,
} from '@my/ui'

import { useUser } from 'app/utils/useUser'
import { maxNumSendTags } from './checkout/checkout-utils'

import { IconPlus } from 'app/components/icons'
import { useRouter } from 'solito/router'

export function SendTagScreen() {
  const { tags, isLoading } = useUser()
  const confirmedTags = tags?.filter((tag) => tag.status === 'confirmed')

  const allTags: (Tables<'tags'> | undefined)[] =
    confirmedTags === undefined
      ? new Array(maxNumSendTags).fill(undefined)
      : [...confirmedTags, ...Array.from({ length: maxNumSendTags - confirmedTags.length })]

  if (isLoading)
    return (
      <Stack w="100%" h="100%" jc={'center'} ai={'center'}>
        <Spinner color="$primary" size="large" />
      </Stack>
    )

  return (
    <Container>
      <YStack
        f={1}
        $lg={{ gap: '$2', ai: 'center' }}
        $theme-dark={{ btc: '$gray7Dark' }}
        $theme-light={{ btc: '$gray4Light' }}
      >
        <YStack gap="$2" $gtSm={{ py: '$6', gap: '$6' }}>
          <Label fontFamily={'$mono'} fontSize={'$5'} $theme-dark={{ col: '$olive' }}>
            REGISTERED SENDTAGS [
            <Paragraph fontFamily={'$mono'} fontSize={'$5'} $theme-dark={{ col: '$primary' }}>
              {`${confirmedTags?.length || 0} / ${maxNumSendTags}`}
            </Paragraph>
            ]
          </Label>
        </YStack>
        <SendtagList allTags={allTags} confirmedTags={confirmedTags} />
      </YStack>
    </Container>
  )
}

function SendtagList({
  allTags,
}: {
  allTags: (Tables<'tags'> | undefined)[]

  confirmedTags?: Tables<'tags'>[]
}) {
  const nextTagIndex = allTags?.findIndex((tag) => tag === undefined)

  return (
    <YStack gap="$5">
      {allTags.map((tag, i) =>
        i === nextTagIndex ? (
          <AddTagButton key="%add_tag_button" />
        ) : (
          <TagItem key={tag?.name || `%no_tag_name_${i}`} tag={tag} />
        )
      )}
    </YStack>
  )
}

function AddTagButton() {
  const { push } = useRouter()
  return (
    <Button
      onPress={() =>
        push({
          pathname: '/account/sendtag/checkout',
        })
      }
      w={200}
      h={54}
      br={12}
      bc={'$primary'}
      p={0}
      display="flex"
      jc="center"
      ai="center"
      icon={<IconPlus color={'black'} />}
    >
      <ButtonText fontSize={'$4'} fontWeight={'500'} fontFamily={'$mono'} theme="accent">
        New Tag
      </ButtonText>
    </Button>
  )
}

function TagItem({ tag }: { tag?: Tables<'tags'> }) {
  if (tag === undefined)
    return (
      <ListItem
        key={tag}
        w={200}
        h={54}
        br={8}
        borderWidth={1}
        borderStyle="dashed"
        $theme-dark={{ borderColor: '$decay' }}
        $theme-light={{ borderColor: '$gray4Dark' }}
      />
    )

  return (
    <ListItem
      h={54}
      br={12}
      w="fit-content"
      $theme-dark={{ bc: '$darkest' }}
      $theme-light={{ bc: '$gray4Light' }}
    >
      <H3 fontSize={32} fontWeight={'500'} fontFamily={'$mono'} $theme-dark={{ col: '$primary' }}>
        {tag.name}
      </H3>
    </ListItem>
  )
}
