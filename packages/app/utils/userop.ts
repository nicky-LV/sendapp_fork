import { signWithPasskey } from '@daimo/expo-passkeys'
import {
  sendAccountAbi,
  sendVerifierAbi,
  sendVerifierProxyAddress,
  entryPointAddress,
  iEntryPointAbi,
  iEntryPointSimulationsAbi,
  sendTokenAbi,
  tokenPaymasterAddress,
  usdcAddress,
} from '@my/wagmi'

import {
  http,
  type Hex,
  bytesToHex,
  concat,
  createTestClient,
  encodeAbiParameters,
  encodeFunctionData,
  getAbiItem,
  getContract,
  hexToBytes,
  numberToBytes,
  isHex,
  publicActions,
  maxUint256,
} from 'viem'
import { parseAndNormalizeSig, parseSignResponse } from './passkeys'
import { baseMainnetClient } from './viem'
import { assert } from './assert'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { getAccountNonce } from 'permissionless'

export const testClient = createTestClient({
  chain: baseMainnetClient.chain,
  transport: http(baseMainnetClient.transport.url),
  mode: 'anvil',
}).extend(publicActions)

export const entrypoint = getContract({
  abi: iEntryPointAbi,
  address: entryPointAddress[baseMainnetClient.chain.id],
  client: baseMainnetClient,
})

export const entrypointSimulations = getContract({
  abi: iEntryPointSimulationsAbi,
  address: entryPointAddress[baseMainnetClient.chain.id],
  client: baseMainnetClient,
})

export const sendVerifierAddress = sendVerifierProxyAddress[845337] // TODO: use chain id

export const verifier = getContract({
  abi: sendVerifierAbi,
  client: baseMainnetClient,
  address: sendVerifierAddress,
})

/**
 * Verifies a signature against a challenge and public key onchain. Signature is encoded where the first byte is the
 * key-slot and the rest is the encoded signature struct.
 *
 * @param challenge - The challenge to verify the signature against
 * @param signature - The signature to verify
 * @param publicKey - The public key to verify the signature against
 * @returns A promise that resolves to a boolean indicating whether the signature is valid
 *
 * @see signChallenge
 */
export async function verifySignature(
  challenge: Hex,
  signature: Hex,
  publicKey: [Hex, Hex]
): Promise<boolean> {
  const x = BigInt(publicKey[0])
  const y = BigInt(publicKey[1])
  return await verifier.read.verifySignature([challenge, signature, x, y])
}

export const USEROP_VERSION = 1
export const USEROP_KEY_SLOT = 0
export const USEROP_SALT = 0n

export function getSendAccountCreateArgs(publicKey: [Hex, Hex]): readonly [
  number,
  readonly [`0x${string}`, `0x${string}`],
  readonly {
    dest: `0x${string}`
    value: bigint
    data: `0x${string}`
  }[],
  bigint,
] {
  const initCalls = [
    // approve USDC to paymaster
    {
      dest: usdcAddress[baseMainnetClient.chain.id],
      value: 0n,
      data: encodeFunctionData({
        abi: sendTokenAbi,
        functionName: 'approve',
        args: [tokenPaymasterAddress[baseMainnetClient.chain.id], maxUint256],
      }),
    },
  ]

  return [
    USEROP_KEY_SLOT, // key slot
    publicKey, // public key
    initCalls, // init calls
    USEROP_SALT, // salt
  ]
}

/**
 * Generates a SendAccount challenge from a user operation hash.
 */
export function generateChallenge({
  userOpHash,
  version = USEROP_VERSION,
  validUntil,
}: { userOpHash: Hex; version?: number; validUntil: number }): {
  challenge: Hex
  versionBytes: Uint8Array
  validUntilBytes: Uint8Array
} {
  const opHash = hexToBytes(userOpHash)
  const versionBytes = numberToBytes(version, { size: 1 })
  const validUntilBytes = numberToBytes(validUntil, { size: 6 })
  // 1 byte version + 6 bytes validUntil + 32 bytes opHash
  const challenge = bytesToHex(concat([versionBytes, validUntilBytes, opHash]))
  assert(isHex(challenge) && challenge.length === 80, 'Invalid challenge')
  return {
    challenge,
    versionBytes,
    validUntilBytes,
  }
}

/**
 * Signs a challenge using the user's passkey and returns the signature in a format that matches the ABI of a signature
 * struct for the SendVerifier contract.
 */
export async function signChallenge(challenge: Hex) {
  assert(isHex(challenge) && challenge.length === 80, 'Invalid challenge')
  const challengeBytes = hexToBytes(challenge)
  const challengeB64 = Buffer.from(challengeBytes).toString('base64')
  const sign = await signWithPasskey({
    domain: window.location.hostname,
    challengeB64,
  })
  const signResult = parseSignResponse(sign)
  const clientDataJSON = signResult.clientDataJSON
  const authenticatorData = bytesToHex(signResult.rawAuthenticatorData)
  const challengeLocation = BigInt(clientDataJSON.indexOf('"challenge":'))
  const responseTypeLocation = BigInt(clientDataJSON.indexOf('"type":'))
  const { r, s } = parseAndNormalizeSig(signResult.derSig)
  const webauthnSig = {
    authenticatorData,
    clientDataJSON,
    challengeLocation,
    responseTypeLocation,
    r,
    s,
  }

  const encodedWebAuthnSig = encodeAbiParameters(
    getAbiItem({
      abi: sendAccountAbi,
      name: 'signatureStruct',
    }).inputs,
    [webauthnSig]
  )
  assert(isHex(encodedWebAuthnSig), 'Invalid encodedWebAuthnSig')
  return {
    keySlot: signResult.keySlot,
    accountName: signResult.accountName,
    encodedWebAuthnSig,
  }
}

/**
 * Signs a user operation hash and returns the signature in a format for the SendVerifier contract.
 */
export async function signUserOp({
  userOpHash,
  version,
  validUntil,
}: {
  userOpHash: Hex
  version?: number
  validUntil?: number
}) {
  version = version ?? USEROP_VERSION
  validUntil = validUntil ?? Math.floor((Date.now() + 1000 * 120) / 1000) // default 120 seconds (2 minutes)
  assert(version === USEROP_VERSION, 'version must be 1')
  assert(typeof validUntil === 'number', 'validUntil must be a number')
  assert(
    validUntil === 0 || validUntil > Math.floor(Date.now() / 1000), // 0 means valid forever
    'validUntil must be in the future'
  )
  const { challenge, versionBytes, validUntilBytes } = generateChallenge({
    userOpHash,
    version,
    validUntil,
  })
  const { encodedWebAuthnSig, keySlot } = await signChallenge(challenge)
  const signature = concat([
    versionBytes,
    validUntilBytes,
    numberToBytes(keySlot, { size: 1 }),
    hexToBytes(encodedWebAuthnSig),
  ])
  return bytesToHex(signature)
}

export function useAccountNonce({ sender }): UseQueryResult<bigint, Error> {
  return useQuery({
    queryKey: ['accountNonce', sender],
    queryFn: async () => {
      const nonce = await getAccountNonce(baseMainnetClient, {
        sender,
        entryPoint: entryPointAddress[baseMainnetClient.chain.id],
      })
      return nonce
    },
  })
}
