import { Test, TestingModule } from '@nestjs/testing';
import { AttendantsController } from './attendants.controller';
import { AttendantsService } from './attendants.service';

describe('AttendantsController', () => {
  let controller: AttendantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendantsController],
      providers: [AttendantsService],
    }).compile();

    controller = module.get<AttendantsController>(AttendantsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
