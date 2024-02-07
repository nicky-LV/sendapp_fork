import { IconProps, themed } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import { ColorTokens } from '@my/ui/types'

const Support = (props: IconProps) => {
  const { size, color, ...rest } = props
  return (
    <Svg
      width={size ?? 18}
      height={size ?? 20}
      color={color as ColorTokens | undefined}
      viewBox="0 0 18 20"
      fill="none"
      {...rest}
    >
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 9.40002C2.5858 9.40002 2.25 9.73583 2.25 10.15V12.85C2.25 13.2642 2.5858 13.6 3 13.6C3.4142 13.6 3.75 13.2642 3.75 12.85V10.15C3.75 9.73583 3.4142 9.40002 3 9.40002ZM0.75 10.15C0.75 8.9074 1.75737 7.90002 3 7.90002C4.24263 7.90002 5.25 8.9074 5.25 10.15V12.85C5.25 14.0927 4.24263 15.1 3 15.1C1.75737 15.1 0.75 14.0927 0.75 12.85V10.15Z"
        fill="currentColor"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15 9.40002C14.5858 9.40002 14.25 9.73583 14.25 10.15V12.85C14.25 13.2642 14.5858 13.6 15 13.6C15.4142 13.6 15.75 13.2642 15.75 12.85V10.15C15.75 9.73583 15.4142 9.40002 15 9.40002ZM12.75 10.15C12.75 8.9074 13.7574 7.90002 15 7.90002C16.2426 7.90002 17.25 8.9074 17.25 10.15V12.85C17.25 14.0927 16.2426 15.1 15 15.1C13.7574 15.1 12.75 14.0927 12.75 12.85V10.15Z"
        fill="currentColor"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1.90002C5.27208 1.90002 2.25 4.9221 2.25 8.65002V10.15C2.25 10.5642 1.91421 10.9 1.5 10.9C1.08579 10.9 0.75 10.5642 0.75 10.15V8.65002C0.75 4.09367 4.44365 0.400024 9 0.400024C13.5564 0.400024 17.25 4.09367 17.25 8.65002V10.15C17.25 10.5642 16.9142 10.9 16.5 10.9C16.0858 10.9 15.75 10.5642 15.75 10.15V8.65002C15.75 4.9221 12.7279 1.90002 9 1.90002Z"
        fill="currentColor"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.5 12.1C16.9142 12.1 17.25 12.4358 17.25 12.85V14.35C17.25 16.4211 15.5711 18.1 13.5 18.1H10.5C10.0858 18.1 9.75 17.7642 9.75 17.35C9.75 16.9358 10.0858 16.6 10.5 16.6H13.5C14.7426 16.6 15.75 15.5926 15.75 14.35V12.85C15.75 12.4358 16.0858 12.1 16.5 12.1Z"
        fill="currentColor"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 16.6C8.58579 16.6 8.25 16.9358 8.25 17.35C8.25 17.7642 8.58579 18.1 9 18.1C9.41421 18.1 9.75 17.7642 9.75 17.35C9.75 16.9358 9.41421 16.6 9 16.6ZM6.75 17.35C6.75 16.1073 7.75736 15.1 9 15.1C10.2426 15.1 11.25 16.1073 11.25 17.35C11.25 18.5926 10.2426 19.6 9 19.6C7.75736 19.6 6.75 18.5926 6.75 17.35Z"
        fill="currentColor"
      />
    </Svg>
  )
}
const IconSupport = memo(themed(Support))
export { IconSupport }
