import { Test, TestingModule } from '@nestjs/testing';
import { CategotyController } from './categoty.controller';
import { CategotyService } from './categoty.service';

describe('CategotyController', () => {
  let controller: CategotyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategotyController],
      providers: [CategotyService],
    }).compile();

    controller = module.get<CategotyController>(CategotyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
