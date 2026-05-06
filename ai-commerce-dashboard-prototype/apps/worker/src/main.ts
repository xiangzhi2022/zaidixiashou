import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { QueueNames } from './queues.js';

const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

const workers = Object.values(QueueNames).map(
  (queueName) =>
    new Worker(
      queueName,
      async (job) => {
        console.log(
          JSON.stringify({
            event: 'worker.smoke.processed',
            queueName,
            jobId: job.id,
            jobName: job.name
          })
        );
        return { ok: true };
      },
      { connection }
    )
);

async function shutdown(): Promise<void> {
  await Promise.all(workers.map((worker) => worker.close()));
  await connection.quit();
}

process.on('SIGINT', () => void shutdown().then(() => process.exit(0)));
process.on('SIGTERM', () => void shutdown().then(() => process.exit(0)));

console.log(
  JSON.stringify({
    event: 'worker.started',
    queues: Object.values(QueueNames)
  })
);
