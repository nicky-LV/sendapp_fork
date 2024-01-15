import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { testMainnetClient } from '../viem'

import { mergeTests, test as base } from '@playwright/test'
import { Web3ProviderBackend, injectHeadlessWeb3Provider } from 'headless-web3-provider'
import { Account, parseEther } from 'viem'

if (!process.env.NEXT_PUBLIC_MAINNET_CHAIN_ID) {
  throw new Error('NEXT_PUBLIC_MAINNET_CHAIN_ID is not set')
}

const NEXT_PUBLIC_MAINNET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_MAINNET_CHAIN_ID)

type InjectWeb3Provider = (privateKeys?: string[]) => Promise<Web3ProviderBackend>

export const test = base.extend<{
  signers: [string, ...string[]]
  accounts: Account[]
  injectWeb3Provider: InjectWeb3Provider
}>({
  // eslint-disable-next-line no-empty-pattern
  // biome-ignore lint/correctness/noEmptyPattern: playwright requires this
  signers: async ({}, use) => {
    const privateKey = generatePrivateKey()
    await use([privateKey])
  },
  accounts: async ({ signers }, use) => {
    const accounts = signers.map((k) => privateKeyToAccount(k as `0x${string}`))
    // set balance for accounts
    for (const account of accounts) {
      await testMainnetClient.setBalance({
        address: account.address as `0x${string}`,
        value: parseEther('10000'),
      })
    }
    await use(accounts)
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- accounts funds the wallet
  injectWeb3Provider: async ({ page, accounts, signers }, use) => {
    await use((privateKeys = signers) =>
      injectHeadlessWeb3Provider(
        page,
        privateKeys,
        NEXT_PUBLIC_MAINNET_CHAIN_ID,
        'http://127.0.0.1:8545'
      )
    )
  },
})

export const { expect } = test
