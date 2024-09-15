import { Test, TestingModule } from '@nestjs/testing';
import { QueueProcessor } from './queue.processor';

describe('QueueProcessor', () => {
  let processor: QueueProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueProcessor],
    }).compile();

    processor = module.get<QueueProcessor>(QueueProcessor);
  });

  it('should process jobs', async () => {
    const job = { id: 'job1', data: { test: 'data' } };
    const consoleSpy = jest.spyOn(console, 'log');

    await processor.process(job);

    expect(consoleSpy).toHaveBeenCalledWith('Processing job: ', 'job1');
    expect(consoleSpy).toHaveBeenCalledWith({ test: 'data' });
  });
});
