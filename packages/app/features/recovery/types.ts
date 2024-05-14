import type { z } from 'zod'
import type { ChallengeResponseSchema, VerifyChallengeResponseSchema } from './schemas'

export type ChallengeResponse = z.infer<typeof ChallengeResponseSchema>

export type VerifyChallengeResponse = z.infer<typeof VerifyChallengeResponseSchema>
