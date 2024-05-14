import { z } from 'zod'

export const ChallengeRequestSchema = z.object({ phoneNumberInput: z.string() })

export const ChallengeResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  challenge: z.string(),
  created_at: z.string(),
  expires_at: z.string(),
})

export const VerifyChallengeRequestSchema = z.object({
  userId: z.string(),
  challengeId: z.string(),
  signature: z.string(),
})

export const VerifyChallengeResponseSchema = z.object({
  jwt: z.string(),
})
