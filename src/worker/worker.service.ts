import { Logger } from '@nestjs/common';
import { MessagePort, parentPort, workerData } from 'worker_threads';
import { sleep } from './util/sleep';

export type WorkerServiceInstanceData = {
  uid: string;
  data: any;
};

export class WorkerService {
  private readonly logger: Logger;
  private readonly parentPort: MessagePort;

  constructor(uid: string, parentPort: MessagePort) {
    this.logger = new Logger(`${WorkerService.name}(${uid})`);
    this.logger.log(`Constructing worker ${uid}`);
    this.parentPort = parentPort;
    this.notifyParent('Created');
  }

  public async handleWorkload(data: any) {
    this.logger.log(`Handle workload ${JSON.stringify(data)}`);
    await sleep(10000 * Math.random());
  }

  private notifyParent(message: string) {
    this.parentPort.postMessage(message);
  }
}

const instance = new WorkerService(workerData.uid, parentPort);
instance.handleWorkload(workerData.data);
