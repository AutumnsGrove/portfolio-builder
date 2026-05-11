# Analytics Tracking Guide

This document defines **where** and **when** to track each analytics event.

## Funnel Events (User Behavior)

### 1. `signup`
**When:** User completes account creation via BetterAuth  
**Where:** Astro middleware or BetterAuth `onUserCreated` hook (after first Google sign-in)  
**Code:**
```typescript
// After inserting new user into DB
await trackEvent(env.DB, 'signup', {
  userId: user.id,
});
```

---

### 2. `started_build`
**When:** User sends their first chat message to the Guide Agent  
**Where:** `worker/api/chat.ts` (on first message in a new site)  
**Check first:** Use `hasTriggeredEvent()` to avoid duplicate tracking  
**Code:**
```typescript
const hasStarted = await hasTriggeredEvent(env.DB, 'started_build', userId);
if (!hasStarted) {
  await trackEvent(env.DB, 'started_build', {
    userId,
    siteId,
  });
}
```

---

### 3. `first_block_added`
**When:** User (or AI) adds the first block to any zone  
**Where:** AI tool handler `agents/tools/blocks/add_block/handler.ts`  
**Check first:** Use `hasTriggeredEvent()` to track only the FIRST block ever  
**Code:**
```typescript
// After successful block insert
const hasAddedBlock = await hasTriggeredEvent(env.DB, 'first_block_added', userId);
if (!hasAddedBlock) {
  await trackEvent(env.DB, 'first_block_added', {
    userId,
    siteId,
    metadata: { blockType: block.type },
  });
}
```

---

### 4. `first_publish`
**When:** User publishes their site for the first time  
**Where:** AI tool handler `agents/tools/publish/publish_site/handler.ts`  
**Check first:** Use `hasTriggeredEvent()`  
**Code:**
```typescript
// After successful R2 upload + hosted_sites row
const hasPublished = await hasTriggeredEvent(env.DB, 'first_publish', userId);
if (!hasPublished) {
  await trackEvent(env.DB, 'first_publish', {
    userId,
    siteId,
    metadata: { siteSlug: site.slug },
  });
}
```

---

### 5. `returned_after_publish`
**When:** User logs back in after their first publish  
**Where:** Astro middleware (on subsequent logins, after session validation)  
**Logic:** Check if user has published AND hasn't triggered this event yet  
**Code:**
```typescript
// After login, check if they've published before
const hasPublished = await hasTriggeredEvent(env.DB, 'first_publish', userId);
const hasReturned = await hasTriggeredEvent(env.DB, 'returned_after_publish', userId);

if (hasPublished && !hasReturned) {
  // Calculate days since first publish
  const firstPublishEvent = await db
    .prepare('SELECT timestamp FROM analytics_events WHERE event = ? AND user_id = ? ORDER BY timestamp ASC LIMIT 1')
    .bind('first_publish', userId)
    .first<{ timestamp: number }>();
  
  const daysSince = Math.floor((Date.now() - firstPublishEvent.timestamp) / (1000 * 60 * 60 * 24));
  
  await trackEvent(env.DB, 'returned_after_publish', {
    userId,
    metadata: { daysSincePublish: daysSince },
  });
}
```

---

### 6. `session_abandoned`
**When:** User hasn't interacted with the chat for 30+ minutes during an active session  
**Where:** Background job (if implemented) OR client-side on visibility change  
**Implementation:** v1 may skip this — it's harder to detect. Track in v2 if needed.

---

## Agent Metrics (AI Performance)

### Track after every AI turn
**Where:** `agents/guide/handler.ts` (after Guide Agent responds)  
**Code:**
```typescript
// After AI completes a turn
await trackAgentMetrics(env.DB, {
  conversationId: conversation.id,
  turnCount: conversation.messages.length,
  toolCallCount: toolCallsMadeThisTurn.length,
  toolFailures: toolCallsMadeThisTurn.filter(t => t.error).length,
  replyLatencyMs: Date.now() - turnStartTime,
  tokensIn: aiResponse.usage.input_tokens,
  tokensOut: aiResponse.usage.output_tokens,
  costUsd: calculateCost(aiResponse.usage, modelName),
});
```

**Cost calculation helper:**
```typescript
function calculateCost(
  usage: { input_tokens: number; output_tokens: number },
  model: string
): string {
  // OpenRouter pricing (example for Claude Sonnet)
  const pricePerMInput = 3.00 / 1_000_000;   // $3/M input tokens
  const pricePerMOutput = 15.00 / 1_000_000; // $15/M output tokens
  
  const cost = 
    (usage.input_tokens * pricePerMInput) +
    (usage.output_tokens * pricePerMOutput);
  
  return cost.toFixed(6); // e.g., "0.000420"
}
```

---

## Local Development

All events are tracked in your local D1 database during development.

**To see your events:**
```bash
# Query local events
pnpm exec wrangler d1 execute portfolio-builder-db --local \
  --command "SELECT * FROM analytics_events ORDER BY timestamp DESC LIMIT 10"

# Query agent metrics
pnpm exec wrangler d1 execute portfolio-builder-db --local \
  --command "SELECT * FROM agent_metrics ORDER BY timestamp DESC LIMIT 10"
```

**To reset local analytics (clear test data):**
```bash
pnpm exec wrangler d1 execute portfolio-builder-db --local \
  --command "DELETE FROM analytics_events"
  
pnpm exec wrangler d1 execute portfolio-builder-db --local \
  --command "DELETE FROM agent_metrics"
```

---

## Querying for V1 Acceptance Criteria

### Criterion #1: Core loop works end-to-end
```sql
-- Funnel conversion rates
WITH user_funnel AS (
  SELECT 
    user_id,
    MAX(CASE WHEN event = 'signup' THEN 1 ELSE 0 END) as signed_up,
    MAX(CASE WHEN event = 'started_build' THEN 1 ELSE 0 END) as started,
    MAX(CASE WHEN event = 'first_block_added' THEN 1 ELSE 0 END) as added_block,
    MAX(CASE WHEN event = 'first_publish' THEN 1 ELSE 0 END) as published,
    MAX(CASE WHEN event = 'returned_after_publish' THEN 1 ELSE 0 END) as returned
  FROM analytics_events
  GROUP BY user_id
)
SELECT
  SUM(signed_up) as total_signups,
  SUM(started) as started_building,
  SUM(added_block) as added_first_block,
  SUM(published) as published,
  SUM(returned) as returned_after_publish,
  ROUND(SUM(started) * 100.0 / SUM(signed_up), 2) as signup_to_start_rate,
  ROUND(SUM(published) * 100.0 / SUM(signed_up), 2) as signup_to_publish_rate
FROM user_funnel;
```

### Criterion #6: Cost economics are knowable
```sql
-- Average AI cost per published portfolio
SELECT 
  COUNT(DISTINCT am.conversation_id) as total_sessions,
  SUM(CAST(am.cost_usd AS REAL)) as total_cost,
  AVG(CAST(am.cost_usd AS REAL)) as avg_cost_per_turn,
  SUM(CAST(am.cost_usd AS REAL)) / 
    (SELECT COUNT(*) FROM analytics_events WHERE event = 'first_publish') 
    as avg_cost_per_published_portfolio
FROM agent_metrics am;
```

---

## Dashboard Queries (For /admin/analytics route)

### Today's activity
```sql
SELECT 
  event,
  COUNT(*) as count
FROM analytics_events
WHERE timestamp > strftime('%s', 'now', '-1 day') * 1000
GROUP BY event
ORDER BY count DESC;
```

### Recent events (last 50)
```sql
SELECT 
  event,
  user_id,
  site_id,
  metadata,
  datetime(timestamp/1000, 'unixepoch') as time
FROM analytics_events
ORDER BY timestamp DESC
LIMIT 50;
```
