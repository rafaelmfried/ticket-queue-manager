import { Test, TestingModule } from '@nestjs/testing';
import { AttendantsService } from './attendants.service';

describe('AttendantsService', () => {
  let service: AttendantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendantsService],
    }).compile();

    service = module.get<AttendantsService>(AttendantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
