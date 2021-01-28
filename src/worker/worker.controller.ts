import { Controller, Post } from '@nestjs/common';
import { WorkerThreadManagerService } from './worker-thread-manager.service';

@Controller('worker')
export class WorkerController {
  constructor(readonly workerManagerService: WorkerThreadManagerService) {}

  @Post()
  public async queueWorkload() {
    this.workerManagerService.queueWorkload({
      foo: 'bar',
    });
  }
}
