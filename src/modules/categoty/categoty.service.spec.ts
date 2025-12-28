import { Test, TestingModule } from '@nestjs/testing';
import { CategotyService } from './categoty.service';

describe('CategotyService', () => {
  let service: CategotyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategotyService],
    }).compile();

    service = module.get<CategotyService>(CategotyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
