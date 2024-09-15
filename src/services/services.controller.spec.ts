import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from '@prisma/client';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('ServicesController', () => {
  let app: INestApplication;

  const mockServicesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [{ provide: ServicesService, useValue: mockServicesService }],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  describe('/services (POST)', () => {
    it('should create a new service', async () => {
      const createServiceDto: CreateServiceDto = { name: 'Service 1' };
      const createdService: Service = { id: '1', name: 'Service 1' };

      jest
        .spyOn(mockServicesService, 'create')
        .mockResolvedValue(createdService);

      return request(app.getHttpServer())
        .post('/services')
        .send(createServiceDto)
        .expect(201)
        .expect(createdService);
    });
  });

  describe('/services (GET)', () => {
    it('should return an array of services', async () => {
      const services: Service[] = [
        { id: '1', name: 'Service 1' },
        { id: '2', name: 'Service 2' },
      ];

      jest.spyOn(mockServicesService, 'findAll').mockResolvedValue(services);

      return request(app.getHttpServer())
        .get('/services')
        .expect(200)
        .expect(services);
    });
  });

  describe('/services/:id (GET)', () => {
    it('should return a service by id', async () => {
      const serviceId = '1';
      const service: Service = { id: serviceId, name: 'Service 1' };

      jest.spyOn(mockServicesService, 'findOne').mockResolvedValue(service);

      return request(app.getHttpServer())
        .get(`/services/${serviceId}`)
        .expect(200)
        .expect(service);
    });

    it('should return 404 if service not found', async () => {
      const serviceId = 'nonexistent';
      jest.spyOn(mockServicesService, 'findOne').mockResolvedValue(null);

      return request(app.getHttpServer())
        .get(`/services/${serviceId}`)
        .expect(404);
    });
  });

  describe('/services/:id (PATCH)', () => {
    it('should update a service by id', async () => {
      const serviceId = '1';
      const updateServiceDto: UpdateServiceDto = { name: 'Updated Service' };
      const updatedService: Service = {
        id: serviceId,
        name: 'Updated Service',
      };

      jest
        .spyOn(mockServicesService, 'update')
        .mockResolvedValue(updatedService);

      return request(app.getHttpServer())
        .patch(`/services/${serviceId}`)
        .send(updateServiceDto)
        .expect(200)
        .expect(updatedService);
    });

    it('should return 404 if service not found', async () => {
      const serviceId = 'nonexistent';
      const updateServiceDto: UpdateServiceDto = { name: 'Updated Service' };
      jest
        .spyOn(mockServicesService, 'update')
        .mockRejectedValue(new Error('Not Found'));

      return request(app.getHttpServer())
        .patch(`/services/${serviceId}`)
        .send(updateServiceDto)
        .expect(404);
    });
  });

  describe('/services/:id (DELETE)', () => {
    it('should remove a service by id', async () => {
      const serviceId = '1';
      const removedService: Service = { id: serviceId, name: 'Service 1' };

      jest
        .spyOn(mockServicesService, 'remove')
        .mockResolvedValue(removedService);

      return request(app.getHttpServer())
        .delete(`/services/${serviceId}`)
        .expect(200)
        .expect(removedService);
    });

    it('should return 404 if service not found', async () => {
      const serviceId = 'nonexistent';
      jest
        .spyOn(mockServicesService, 'remove')
        .mockRejectedValue(new Error('Not Found'));

      return request(app.getHttpServer())
        .delete(`/services/${serviceId}`)
        .expect(404);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
