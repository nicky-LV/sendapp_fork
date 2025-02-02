import { faker } from '@faker-js/faker'
import type { Page } from '@playwright/test'
import debug from 'debug'
import { getAuthSessionFromContext } from './fixtures/auth'
import { expect, test as checkoutTest } from './fixtures/checkout'
import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { devices, mergeTests } from '@playwright/test'
import { userOnboarded } from '@my/snaplet/models'
import { assert } from 'app/utils/assert'

let log: debug.Debugger

const test = mergeTests(checkoutTest, snapletTest)

const debugAuthSession = async (page: Page) => {
  const { decoded } = await getAuthSessionFromContext(page.context())
  log?.('user authenticated', `id=${decoded.sub}`, `session=${decoded.session_id}`)
}

const pricingText = [
  '6+ characters',
  '0.002 ETH',
  '5 characters',
  '0.005 ETH',
  '4 characters',
  '0.01 ETH',
  '1-3 characters',
  '0.02 ETH',
]

test.beforeEach(async ({ checkoutPage }) => {
  log = debug(`test:account-sendtag-checkout:logged-in:${test.info().parallelIndex}`)
  log('beforeEach', `url=${checkoutPage.page.url()}`)
  await debugAuthSession(checkoutPage.page)
})

test('can visit checkout page', async ({ page, checkoutPage }) => {
  await checkoutPage.openPricingTooltip()
  await expect(checkoutPage.pricingTooltip).toBeVisible()
  for (const text of pricingText) {
    await expect(checkoutPage.pricingTooltip).toContainText(text)
  }
  // check pricing dialog
  await page.setViewportSize(devices['Pixel 5'].viewport)
  await checkoutPage.openPricingDialog()
  for (const text of pricingText) {
    await expect(checkoutPage.pricingDialog).toContainText(text)
  }
  await checkoutPage.pricingDialog.getByLabel('Dialog Close').click()
  await expect(checkoutPage.pricingDialog).toBeHidden()
})

test('can add a pending tag', async ({ checkoutPage }) => {
  const tagName = `${faker.lorem.word()}_${test.info().parallelIndex}`
  await checkoutPage.addPendingTag(tagName)
  await expect(checkoutPage.page.getByLabel(`Pending Sendtag ${tagName}`)).toBeVisible()
})

test('cannot add an invalid tag name', async ({ checkoutPage }) => {
  await checkoutPage.fillTagName('invalid tag!')
  await checkoutPage.submitTagButton.click()
  // Assuming there's an error message displayed for invalid tags
  expect(checkoutPage.page.getByText('Only English alphabet, numbers, and underscore')).toBeTruthy()
})

test('can confirm a tag', async ({ checkoutPage, supabase }) => {
  // test.setTimeout(60_000) // 60 seconds
  const tagName = `${faker.lorem.word()}_${test.info().parallelIndex}`
  await checkoutPage.addPendingTag(tagName)
  await expect(checkoutPage.page.getByLabel(`Pending Sendtag ${tagName}`)).toBeVisible()
  await checkoutPage.confirmTags(expect)
  await expect(checkoutPage.page.getByLabel(`Pending Sendtag ${tagName}`)).toBeHidden()

  const { data: tags, error } = await supabase.from('tags').select('*').eq('name', tagName)
  expect(error).toBeFalsy()
  expect(tags).toHaveLength(1)

  await expect(checkoutPage.page).toHaveTitle('Send | Sendtag')
  await expect(checkoutPage.page.getByRole('heading', { name: tagName })).toBeVisible()
})

test('can refer a tag', async ({ seed, checkoutPage, supabase, pg }) => {
  const plan = await seed.users([userOnboarded])
  const profile = plan.profiles[0]
  assert(!!profile, 'profile not found')
  await checkoutPage.page.goto(`/?referral=${profile.referralCode}`)
  await checkoutPage.goto()
  const tagName = `${faker.lorem.word()}_${test.info().parallelIndex}`
  await checkoutPage.addPendingTag(tagName)
  await expect(checkoutPage.page.getByLabel(`Pending Sendtag ${tagName}`)).toBeVisible()
  await checkoutPage.confirmTags(expect)
  await expect(checkoutPage.page.getByLabel(`Pending Sendtag ${tagName}`)).toBeHidden()

  const { data: tags, error } = await supabase.from('tags').select('*').eq('name', tagName)
  expect(error).toBeFalsy()
  expect(tags).toHaveLength(1)

  await expect(checkoutPage.page).toHaveTitle('Send | Sendtag')
  await expect(checkoutPage.page.getByRole('heading', { name: tagName })).toBeVisible()

  const { rows } = await pg.query(
    'select count(*) as count from referrals where referrer_id = $1',
    [profile.id]
  )
  expect(rows[0]?.count).toBe('1')
})

test('cannot confirm a tag without paying', async ({ checkoutPage, supabase }) => {
  const tagName = `${faker.lorem.word()}_${test.info().parallelIndex}`
  await checkoutPage.addPendingTag(tagName)
  await expect(checkoutPage.page.getByLabel(`Pending Sendtag ${tagName}`)).toBeVisible()
  await checkoutPage.page.pause()
  const { data, error } = await supabase.rpc('confirm_tags', {
    tag_names: [tagName],
    receipt_hash: '0x',
    referral_code_input: '',
  })
  log?.('cannot confirm a tag without paying', data, error)
  expect(error).toBeTruthy()
  expect(error?.code).toBe('42501')
  expect(error?.message).toBe('permission denied for function confirm_tags')
  expect(data).toBeFalsy()
})

test('cannot add more than 5 tags', async ({ checkoutPage, supabase }) => {
  const tagNames = Array.from({ length: 5 }, () => ({
    name: `${faker.lorem.word()}_${test.info().parallelIndex}`,
  }))
  await supabase
    .from('tags')
    .insert(tagNames)
    .then(({ error }) => {
      expect(error).toBeFalsy()
    })
  checkoutPage.page.reload()
  for (const { name } of tagNames) {
    await expect(checkoutPage.page.getByLabel(`Pending Sendtag ${name}`)).toBeVisible()
  }
  await expect(checkoutPage.submitTagButton).toBeHidden()
  const { error } = await supabase.from('tags').insert({ name: faker.lorem.word() })
  expect(error).toBeTruthy()
  expect(error?.message).toBe('User can have at most 5 tags')
  expect(error?.code).toBe('P0001')
})
