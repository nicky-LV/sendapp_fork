import { makeConfig } from '@indexsupply/shovel-config'
import type { Source, Integration } from '@indexsupply/shovel-config'
import {
  sendAccountCreatedIntegration,
  sendAccountTransfersIntegration,
  // sendAccountTransactionsIntegration,
  sendTokenTransfersIntegration,
  sendRevenuesSafeReceives,
  sendAccountSigningKeyAdded,
} from './integrations'

// baseSrcBlockHeaders is to be used for integrations that require block headers
const baseSrcBlockHeaders: Source = {
  name: 'base_block_headers',
  url: '$BASE_RPC_URL',
  chain_id: '$BASE_CHAIN_ID',
  batch_size: 100,
  concurrency: 1,
}

// baseSrcLogs is to be used for integrations that require logs
const baseSrcLogs: Source = {
  name: 'base_logs',
  url: '$BASE_RPC_URL',
  chain_id: '$BASE_CHAIN_ID',
  batch_size: 2000,
  concurrency: 2,
}

export const sources: Source[] = [baseSrcBlockHeaders, baseSrcLogs]

export const integrations: Integration[] = [
  {
    ...sendAccountCreatedIntegration,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendAccountTransfersIntegration,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendTokenTransfersIntegration,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendRevenuesSafeReceives,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendAccountSigningKeyAdded,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  // @todo split this into two integrations, one for Receive and one for UserOperationEvent
  // {
  //   ...sendAccountTransactionsIntegration,
  //   sources: [{ name: baseSrcBlockHeaders.name, start: '$BASE_BLOCK_START' }],
  // },
]

const c = makeConfig({
  pg_url: '$DATABASE_URL',
  sources,
  integrations,
  dashboard: {
    root_password: '$DASHBOARD_ROOT_PASSWORD',
  },
})

export const config = c
