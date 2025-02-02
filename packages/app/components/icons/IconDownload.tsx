import { type IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import type { ColorTokens } from '@my/ui'

const Download = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 24}
      height={size ?? 24}
      color={color as ColorTokens | undefined}
      viewBox="0 0 24 24"
      fill="none"
      {...rest}
    >
      <Path
        d="M4.20001 10.8001V18.4801C4.20001 18.9893 4.4023 19.4777 4.76237 19.8377C5.12244 20.1978 5.6108 20.4001 6.12001 20.4001H17.64C18.1492 20.4001 18.6376 20.1978 18.9977 19.8377C19.3577 19.4777 19.56 18.9893 19.56 18.4801V10.8001M15.72 7.4401L11.88 3.6001M11.88 3.6001L8.04001 7.4401M11.88 3.6001V13.6801"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
const IconDownlod = memo(themed(Download))
export { IconDownlod }
