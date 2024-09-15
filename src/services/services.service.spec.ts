import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from '@prisma/client';

// Mock do PrismaService
const mockPrismaService = {
  service: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ServicesService', () => {
  let service: ServicesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a new service', async () => {
      const createServiceDto: CreateServiceDto = { name: 'Service 1' };
      const createdService: Service = { id: '1', name: 'Service 1' };

      jest.spyOn(prisma.service, 'create').mockResolvedValue(createdService);

      expect(await service.create(createServiceDto)).toEqual(createdService);
    });
  });

  describe('findAll', () => {
    it('should return an array of services', async () => {
      const services: Service[] = [
        { id: '1', name: 'Service 1' },
        { id: '2', name: 'Service 2' },
      ];

      jest.spyOn(prisma.service, 'findMany').mockResolvedValue(services);

      expect(await service.findAll()).toEqual(services);
    });
  });

  describe('findOne', () => {
    it('should return a single service by id', async () => {
      const serviceId = '1';
      const serviceObj: Service = { id: serviceId, name: 'Service 1' };

      jest.spyOn(prisma.service, 'findUnique').mockResolvedValue(serviceObj);

      expect(await service.findOne(serviceId)).toEqual(serviceObj);
    });

    it('should return null if service not found', async () => {
      const serviceId = 'nonexistent';
      jest.spyOn(prisma.service, 'findUnique').mockResolvedValue(null);

      expect(await service.findOne(serviceId)).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a service by id', async () => {
      const serviceId = '1';
      const updateServiceDto: UpdateServiceDto = { name: 'Updated Service' };
      const updatedService: Service = {
        id: serviceId,
        name: 'Updated Service',
      };

      jest.spyOn(prisma.service, 'update').mockResolvedValue(updatedService);

      expect(await service.update(serviceId, updateServiceDto)).toEqual(
        updatedService,
      );
    });

    it('should throw an error if service not found', async () => {
      const serviceId = 'nonexistent';
      const updateServiceDto: UpdateServiceDto = { name: 'Updated Service' };
      jest
        .spyOn(prisma.service, 'update')
        .mockRejectedValue(new Error('Not Found'));

      await expect(service.update(serviceId, updateServiceDto)).rejects.toThrow(
        'Not Found',
      );
    });
  });

  describe('remove', () => {
    it('should remove a service by id', async () => {
      const serviceId = '1';
      const removedService: Service = { id: serviceId, name: 'Service 1' };

      jest.spyOn(prisma.service, 'delete').mockResolvedValue(removedService);

      expect(await service.remove(serviceId)).toEqual(removedService);
    });

    it('should throw an error if service not found', async () => {
      const serviceId = 'nonexistent';
      jest
        .spyOn(prisma.service, 'delete')
        .mockRejectedValue(new Error('Not Found'));

      await expect(service.remove(serviceId)).rejects.toThrow('Not Found');
    });
  });
});
