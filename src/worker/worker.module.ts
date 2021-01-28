import { Module } from '@nestjs/common';
import { WorkerThreadManagerService } from './worker-thread-manager.service';
import { WorkerController } from './worker.controller';

@Module({
  providers: [WorkerThreadManagerService],
  controllers: [WorkerController],
})
export class WorkerModule {}
