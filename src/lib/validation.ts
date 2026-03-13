import { z } from 'zod';

/**
 * Schéma de validation pour les requêtes à l'IA Zenia
 */
export const AiRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(2000),
  })),
  tasks: z.array(z.any()).optional(), // On accepte un tableau de tâches pour le contexte
});

/**
 * Schéma de validation pour les souscriptions aux notifications Push
 */
export const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  })
});

export type AiRequest = z.infer<typeof AiRequestSchema>;
export type PushSubscription = z.infer<typeof PushSubscriptionSchema>;
