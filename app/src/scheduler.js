import { config } from './config.js';
import { processDueChecks, processNoResponses } from './malachi.js';

let timer = null;
let running = false;

export function startScheduler() {
  if (!config.schedulerEnabled || timer) return;

  async function tick() {
    if (running) return;
    running = true;
    try {
      const sent = await processDueChecks();
      const alerts = await processNoResponses({ graceMinutes: config.noResponseGraceMinutes });
      if (sent.length || alerts.length) {
        console.log(`[scheduler] sent=${sent.length} noResponseAlerts=${alerts.length}`);
      }
    } catch (err) {
      console.error('[scheduler] error', err.message);
    } finally {
      running = false;
    }
  }

  timer = setInterval(tick, config.schedulerIntervalMs);
  tick();
  console.log(`[scheduler] enabled interval=${config.schedulerIntervalMs}ms grace=${config.noResponseGraceMinutes}m`);
}

export function stopScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
}
