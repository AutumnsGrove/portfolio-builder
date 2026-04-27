/**
 * Analytics tracking for v1 validation.
 *
 * Import from here:
 * ```typescript
 * import { trackEvent, trackAgentMetrics } from '@/lib/analytics';
 * ```
 */

export { trackEvent, trackAgentMetrics, hasTriggeredEvent } from "./track";
export type { FunnelEvent, FunnelEventMetadata } from "./track";
