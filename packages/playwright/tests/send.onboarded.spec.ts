import { mergeTests } from '@playwright/test'
import { test as sendAccountTest, expect } from '@my/playwright/fixtures/send-accounts'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { debug, type Debugger } from 'debug'
import { assert } from 'app/utils/assert'
import { userOnboarded } from '@my/snaplet/src/models'
import { ProfilePage } from './fixtures/profiles'
import { erc20Abi, formatUnits, zeroAddress } from 'viem'
import { testBaseClient, usdcAddress } from './fixtures/viem'

const test = mergeTests(sendAccountTest, snapletTest)

let log: Debugger

test.beforeAll(async () => {
  log = debug(`test:send:logged-in:${test.info().workerIndex}`)
})

test('can send ETH to user on profile', async ({ page, seed }) => {
  const plan = await seed.users([userOnboarded])
  const tag = plan.tags[0]
  const profile = plan.profiles[0]
  assert(!!tag?.name, 'tag not found')
  assert(!!profile?.name, 'profile name not found')
  assert(!!profile?.about, 'profile about not found')
  const profilePage = new ProfilePage(page, {
    name: profile.name,
    about: profile.about,
  })
  await profilePage.visit(tag.name, expect)
  await expect(profilePage.sendButton).toBeVisible()
  await profilePage.sendButton.click()

  // @todo create send form fixture
  const sendDialog = page.getByTestId('sendDialogContainer')
  await expect(sendDialog).toBeVisible()
  const amountInput = sendDialog.getByLabel('Amount')
  await expect(amountInput).toBeVisible()
  await amountInput.fill('0.01')
  const sendDialogButton = sendDialog.getByRole('button', { name: 'Send' })
  expect(sendDialogButton).toBeVisible()
  await sendDialogButton.click()
  await expect(sendDialog.getByText(/Sent user op [0-9a-f]+/).first()).toBeVisible({
    timeout: 20000,
  })
  await expect(sendDialog.getByRole('link', { name: 'View on Otterscan' })).toBeVisible()
})

test('can send USDC to user on profile', async ({ page, seed }) => {
  const plan = await seed.users([userOnboarded])
  const tag = plan.tags[0]
  const profile = plan.profiles[0]
  assert(!!tag?.name, 'tag not found')
  assert(!!profile?.name, 'profile name not found')
  assert(!!profile?.about, 'profile about not found')
  const profilePage = new ProfilePage(page, {
    name: profile.name,
    about: profile.about,
  })
  await profilePage.visit(tag.name, expect)
  await expect(profilePage.sendButton).toBeVisible()
  await profilePage.sendButton.click()

  // @todo create send form fixture
  const sendDialog = page.getByTestId('sendDialogContainer')
  await expect(sendDialog).toBeVisible()
  const amountInput = sendDialog.getByLabel('Amount')
  await expect(amountInput).toBeVisible()
  await amountInput.fill('5')
  const tokenSelect = sendDialog.getByRole('combobox') // @todo when tamagui supports this , { name: 'Token' })
  await expect(tokenSelect).toBeVisible()
  await tokenSelect.selectOption('USDC')
  const sendDialogButton = sendDialog.getByRole('button', { name: 'Send' })
  expect(sendDialogButton).toBeVisible()
  await sendDialogButton.click()
  await expect(sendDialog.getByText(/Sent user op [0-9a-f]+/).first()).toBeVisible({
    timeout: 20000,
  })
  await expect(sendDialog.getByRole('link', { name: 'View on Otterscan' })).toBeVisible()
})

test('can send USDC to user on profile using paymaster', async ({
  page,
  seed,
  supabase,
  setEthBalance,
}) => {
  const { data: sendAccount, error } = await supabase.from('send_accounts').select('*').single()
  if (error) {
    log('error fetching send account', error)
    throw error
  }
  assert(!!sendAccount, 'no send account found')
  assert(sendAccount.address !== zeroAddress, 'send account address is zero')

  await setEthBalance({ address: sendAccount.address, value: 0n }) // set balance to 0 ETH

  const plan = await seed.users([userOnboarded])
  const tag = plan.tags[0]
  const profile = plan.profiles[0]
  assert(!!tag?.name, 'tag not found')
  assert(!!profile?.name, 'profile name not found')
  assert(!!profile?.about, 'profile about not found')
  const profilePage = new ProfilePage(page, {
    name: profile.name,
    about: profile.about,
  })
  await profilePage.visit(tag.name, expect)
  await expect(profilePage.sendButton).toBeVisible()
  await profilePage.sendButton.click()

  // @todo create send form fixture
  const sendDialog = page.getByTestId('sendDialogContainer')
  await expect(sendDialog).toBeVisible()
  const amountInput = sendDialog.getByLabel('Amount')
  await expect(amountInput).toBeVisible()
  await amountInput.fill('5')
  const tokenSelect = sendDialog.getByRole('combobox') // @todo when tamagui supports this , { name: 'Token' })
  await expect(tokenSelect).toBeVisible()
  await tokenSelect.selectOption('USDC')
  const sendDialogButton = sendDialog.getByRole('button', { name: 'Send' })
  expect(sendDialogButton).toBeVisible()
  const usdcBalBefore = await testBaseClient.readContract({
    address: usdcAddress[testBaseClient.chain.id],
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [sendAccount.address],
  })
  await sendDialogButton.click()
  await expect(sendDialog.getByText(/Sent user op [0-9a-f]+/).first()).toBeVisible({
    timeout: 20000,
  })
  await expect(sendDialog.getByRole('link', { name: 'View on Otterscan' })).toBeVisible()

  const usdcBalAfter = await testBaseClient.readContract({
    address: usdcAddress[testBaseClient.chain.id],
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [sendAccount.address],
  })
  expect(Number(formatUnits(usdcBalBefore, 6)) - Number(formatUnits(usdcBalAfter, 6))).toBeCloseTo(
    5,
    0
  ) // allow for ¢10 for gas
})
