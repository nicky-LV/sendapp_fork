// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.snaplet/snaplet.d.ts" />
// This config was generated by Snaplet make sure to check it over before using it.
import {
  copycat,
  // faker
} from '@snaplet/copycat'
import { defineConfig } from 'snaplet'
// import { tagName } from '@my/snaplet'

if (!process.env.SNAPLET_HASH_KEY) {
  throw new Error('SNAPLET_HASH_KEY is required')
}

copycat.setHashKey(process.env.SNAPLET_HASH_KEY)

export default defineConfig({
  select: {
    auth: {
      audit_log_entries: false,
      flow_state: false,
      identities: false,
      instances: false,
      mfa_amr_claims: false,
      mfa_challenges: false,
      mfa_factors: false,
      refresh_tokens: false,
      saml_providers: false,
      saml_relay_states: false,
      sessions: false,
      sso_domains: false,
      sso_providers: false,
    },
    dbdev: false,
    extensions: false,
    graphql: false,
    graphql_public: false,
    pgsodium: false,
    pgsodium_masks: false,
    pgtle: false,
    realtime: false,
    vault: false,
    net: false,
    shovel: false,
    // @ts-expect-error pgtap is only defined in the test environment but we want to ensure to always ignore it
    pgtap: false,
  },
  transform: {
    auth: {
      users: ({ row }) => {
        let phone: string
        if (row.phone !== null) {
          phone = `1${copycat.phoneNumber(row.phone.slice(1), {
            length: {
              min: 11,
              max: 14, // max 15 including prefix
            },
          })}`
          // supabase does not store the + in the phone number
          phone = phone.replace('+', '')
        } else {
          phone = copycat.phoneNumber(row.phone)
        }

        return {
          email: copycat.email(row.email, {
            limit: 255,
          }),
          phone,
          password: false,
        }
      },
    },
    storage: {
      buckets: ({ row }) => {
        return {}
      },
      objects: ({ row }) => {
        return {}
      },
    },

    public: {
      profiles: ({ row }) => {
        return {
          name: copycat.fullName(row.name),
          about: copycat.sentence(row.about),
          referral_code: copycat.scramble(row.referral_code),
        }
      },
      send_account_transfers: ({ row }) => {
        return {}
      },
      send_account_created: ({ row }) => {
        return {}
      },
      send_token_transfers: ({ row }) => {
        return {}
      },
      tags: ({ row }) => {
        return {
          // name: tagName(copycat.username(row.name)),
        }
      },
      distribution_verifications: ({ row }) => {
        if (row.metadata === null) {
          return {}
        }

        const { metadata } = row as { metadata: { [key: string]: string } }

        // if (metadata.tag !== undefined) {
        //   metadata.tag = tagName(copycat.username(metadata.tag))
        // }

        return {
          metadata: {
            ...metadata,
          },
        }
      },
      referrals: ({ row }) => {
        return {
          // tag: tagName(row.tag),
        }
      },
      tag_receipts: ({ row }) => {
        return {
          // tag_name: tagName(row.tag_name),
        }
      },
      tag_reservations: ({ row }) => {
        return {
          // tag_name: tagName(row.tag_name),
        }
      },
    },
  },
})
