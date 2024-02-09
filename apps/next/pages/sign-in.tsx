import { SignInScreen } from 'app/features/auth/sign-in-screen'
import Head from 'next/head'
import { guestOnlyGetSSP } from 'utils/guestOnly'
import { NextPageWithLayout } from './_app'
import { AuthLayout } from 'app/features/auth/layout.web'
import { InferGetServerSidePropsType } from 'next'
import { getPlaiceholderImage } from 'app/utils/getPlaiceholderImage'

export const Page: NextPageWithLayout<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  images,
}) => {
  return (
    <>
      <Head>
        <title>Send | Sign In</title>
        <meta
          name="description"
          content="Infrastructure for Merchants and Stablecoin Transactions"
          key="desc"
        />
      </Head>
      <SignInScreen images={images} />
    </>
  )
}

export const getServerSideProps = guestOnlyGetSSP(async () => {
  const remoteImagePath = 'https://github.com/0xsend/assets/blob/main/app_images'
  const remoteImageQueryParams = '?raw=true'
  const images = [
    await getPlaiceholderImage(`${remoteImagePath}/auth_image_1.jpg${remoteImageQueryParams}`),
    await getPlaiceholderImage(`${remoteImagePath}/auth_image_2.jpg${remoteImageQueryParams}`),
    await getPlaiceholderImage(`${remoteImagePath}/auth_image_3.jpg${remoteImageQueryParams}`),
  ]
  return {
    props: {
      images,
    },
  }
})

Page.getLayout = (children) => <AuthLayout>{children}</AuthLayout>

export default Page
