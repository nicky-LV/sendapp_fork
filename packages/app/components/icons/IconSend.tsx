import { IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { ClipPath, Defs, G, Path, Rect, Svg } from 'react-native-svg'
import { ColorTokens } from '@my/ui/types'

const Send = (props: IconProps) => {
  const { size, color } = props
  return (
    <Svg
      width={size ?? 40}
      height={size ?? 40}
      color={color as ColorTokens | undefined}
      viewBox="0 0 40 40"
      fill="none"
    >
      <G clip-path="url(#clip0_563_1426)">
        <Path
          d="M20 40C31.0864 40 40 31.0864 40 20C40 8.91363 31.0864 0 20 0C8.91363 0 0 8.91363 0 20C0 31.0864 8.91363 40 20 40Z"
          fill="currentColor"
        />
        <Path
          d="M31.6023 14.8906H12.6894H12.6847V16.9734C12.6847 17.39 12.8259 17.6677 12.9625 17.8066C13.245 18.0843 13.5275 18.0843 13.8147 18.0843H27.5108C28.3583 18.0843 29.2058 18.2232 29.7708 18.5009C30.477 18.7786 30.9007 19.0563 31.3198 19.4729C31.7435 19.8895 32.026 20.4449 32.3085 21.0003L32.3085 21.0003C32.4497 21.5558 32.591 22.2501 32.591 22.9444V24.4718C32.591 25.1661 32.4497 25.7215 32.3085 26.277L32.3085 26.277C32.0307 26.8324 31.7435 27.3878 31.3198 27.8044C30.9007 28.3599 30.4723 28.6376 29.7708 28.9153C29.2058 29.193 28.3583 29.3319 27.5108 29.3319H12.0458C9.82178 29.3319 8.01887 27.529 8.01887 25.305H26.5208C27.4027 25.305 28.1176 24.59 28.1176 23.7081C28.1176 22.8262 27.4027 22.1112 26.5208 22.1112H12.5435H11.7703C9.46963 22.1112 7.60455 20.2461 7.60455 17.9454V14.8906H12.6847H12.6894V10.8636H27.5848C29.8072 10.8636 31.6074 12.6681 31.6023 14.8906Z"
          fill="currentColor"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_563_1426">
          <Rect width="40" height="40" fill="currentColor" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}
const IconSend = memo(themed(Send))
export { IconSend }
