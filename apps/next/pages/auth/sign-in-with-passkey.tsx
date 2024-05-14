import SignInWithPasskeyScreen from 'app/features/recovery/components/screen'

interface Props {
  phoneNumber: string
}

export default function SignInWithPassKey(props: Props) {
  return <SignInWithPasskeyScreen phoneNumber={props.phoneNumber} />
}

export async function getServerSideProps(context) {
  const { phoneNumber } = context.query

  return {
    props: {
      // extract the first phone number from query params
      phoneNumber: phoneNumber[0],
    },
  }
}
