import { Injectable, Logger, Scope } from '@nestjs/common';
import * as FastQueue from 'fastq';
import { nanoid } from 'nanoid';
import * as OS from 'os';
import * as path from 'path';
import { Worker } from 'worker_threads';
import { WorkerServiceInstanceData } from './worker.service';

type QueueElement = {
  uid: string;
  data: any;
};

// Ensure single instance
@Injectable({ scope: Scope.DEFAULT })
export class WorkerThreadManagerService {
  private readonly logger = new Logger(WorkerThreadManagerService.name);

  private queue: FastQueue.queue | null = null;
  // Use max 80% cpu
  private MAX_WORKERS = Math.floor(OS.cpus().length * 0.8);

  constructor() {
    this.logger.log(`Initializing with MAX_WORKERS=${this.MAX_WORKERS}`);
    this.logger.debug(`Creating queue with MAX_WORKERS=${this.MAX_WORKERS}`);
    this.queue = FastQueue(this.createWorker(), this.MAX_WORKERS);
    this.queue.empty = () => {
      this.logger.debug(`Worker queue empty`);
    };
    this.queue.saturated = () => {
      this.logger.debug(`Worker queue saturated`);
    };
  }

  private createWorker() {
    return async (el: QueueElement, cb: (err: any, res: any) => unknown) => {
      try {
        await this.spawnWorkerThread(el);
        cb(null, el.uid);
      } catch (error) {
        cb(error, el.uid);
      }
    };
  }

  public queueWorkload(data: any) {
    const uid = nanoid();
    this.queue.push({ uid, data }, (err, res) => {
      if (err) {
        console.error('Error adding to queue', res);
        this.logger.error(
          `Queue item encountered error ${err} ${this.queue.length()} items remaining`,
        );
      } else {
        this.logger.log(
          `Queue item ${res} finished. ${this.queue.length()} items remaining`,
        );
      }
    });
    this.logger.log(
      `Queued item ${uid}. ${this.queue.length()} items in queue`,
    );
  }

  private async spawnWorkerThread({ uid, data }: QueueElement) {
    return new Promise((resolve, reject) => {
      try {
        this.logger.log(`Spawning worker ${uid}`);

        const workerData: WorkerServiceInstanceData = {
          uid,
          data,
        };

        const worker = new Worker(
          path.resolve(__dirname, 'worker.service.js'),
          {
            workerData,
          },
        );

        worker.on('message', (msg) => {
          this.logger.log(`[${uid}] ${msg}`);
        });

        worker.on('error', (error) => {
          this.logger.error(`[${uid}] ${error}`);
        });

        worker.on('exit', (code) => {
          if (code !== 0) {
            this.logger.error(`[${uid}] Exited with code ${code}`);
            reject(code);
          } else {
            this.logger.log(`[${uid}] Finished with code ${code}`);
            resolve(code);
          }
        });
      } catch (error) {
        reject(error);
        console.log('error spawning worker', error);
      }
    });
  }
}
