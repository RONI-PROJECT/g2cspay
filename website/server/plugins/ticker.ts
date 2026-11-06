// @ts-expect-error — plain JS, no type declarations
import { merchant, config } from '#src/server.js'
// @ts-expect-error — plain JS, no type declarations
import { cycleIfStale } from '#src/services/poller.js'
// @ts-expect-error — plain JS, no type declarations
import { log } from '#src/logger.js'

const logger = log('ticker')

const TICK_MS = 1000

export default defineNitroPlugin(() => {
  if (process.env.BACKGROUND_POLL !== '1' || process.env.VERCEL) return
  let running = false
  setInterval(() => {
    if (running) return
    running = true
    cycleIfStale(merchant, config.pollMinIntervalMs)
      .catch((e: any) => logger.error(e.message))
      .finally(() => { running = false })
  }, TICK_MS)
})
