import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { Sale, SaleStatus } from './entities/sale.entity';
import { UploadService } from '../upload/upload.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('SalesService', () => {
  let service: SalesService;

  const mockSale = {
    id: '123',
    title: 'Test Sale',
    description: 'Test Description',
    category: 'clothing',
    discountPercentage: 50,
    originalPrice: 200,
    salePrice: 100,
    latitude: 32.0853,
    longitude: 34.7818,
    status: SaleStatus.ACTIVE,
    images: ['image1.jpg', 'image2.jpg'],
    store: { id: 'store-1', name: 'Test Store' },
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    increment: jest.fn(),
    query: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getCount: jest.fn(),
      clone: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    })),
  };

  const mockUploadService = {
    deleteImage: jest.fn(),
  };

  const mockNotificationsService = {
    notifyNewSale: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: getRepositoryToken(Sale), useValue: mockRepository },
        { provide: UploadService, useValue: mockUploadService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    module.get<Repository<Sale>>(getRepositoryToken(Sale));
    module.get<UploadService>(UploadService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a sale with location', async () => {
      const saleData = {
        title: 'New Sale',
        description: 'Description',
        latitude: 32.0853,
        longitude: 34.7818,
      };

      mockRepository.create.mockReturnValue(saleData);
      mockRepository.save.mockResolvedValue({ ...saleData, id: '123' });
      mockRepository.findOne.mockResolvedValue({ ...mockSale, ...saleData });

      const result = await service.create(saleData);

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a sale by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockSale);

      const result = await service.findOne('123');

      expect(result).toEqual(mockSale);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
        relations: ['store'],
      });
    });

    it('should throw NotFoundException if sale not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findNearby', () => {
    it('should find sales within radius', async () => {
      const mockResults = [mockSale];
      mockRepository.query.mockResolvedValue(mockResults);

      const result = await service.findNearby({
        latitude: 32.0853,
        longitude: 34.7818,
        radius: 5000,
      });

      expect(result).toEqual(mockResults);
      expect(mockRepository.query).toHaveBeenCalled();
    });

    it('should filter by category', async () => {
      mockRepository.query.mockResolvedValue([mockSale]);

      const result = await service.findNearby({
        latitude: 32.0853,
        longitude: 34.7818,
        radius: 5000,
        category: 'clothing',
      });

      expect(result).toBeDefined();
      const queryCall = mockRepository.query.mock.calls[0];
      expect(queryCall[0]).toContain('category');
    });
  });

  describe('update', () => {
    it('should update a sale', async () => {
      mockRepository.findOne.mockResolvedValue(mockSale);
      mockRepository.save.mockResolvedValue({ ...mockSale, title: 'Updated' });

      const result = await service.update('123', { title: 'Updated' });

      expect(result.title).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should delete a sale and its images', async () => {
      mockRepository.findOne.mockResolvedValue(mockSale);
      mockRepository.remove.mockResolvedValue(mockSale);
      mockUploadService.deleteImage.mockResolvedValue(undefined);

      await service.remove('123');

      expect(mockRepository.remove).toHaveBeenCalled();
      expect(mockUploadService.deleteImage).toHaveBeenCalledTimes(2);
    });
  });

  describe('incrementViews', () => {
    it('should increment view count', async () => {
      mockRepository.increment.mockResolvedValue(undefined);

      await service.incrementViews('123');

      expect(mockRepository.increment).toHaveBeenCalledWith({ id: '123' }, 'views', 1);
    });
  });
});
