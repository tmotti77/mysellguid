import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { Bookmark } from './entities/bookmark.entity';
import { Sale } from '../sales/entities/sale.entity';

describe('BookmarksService', () => {
  let service: BookmarksService;

  const mockBookmark = {
    id: '123',
    userId: 'user-1',
    saleId: 'sale-1',
    createdAt: new Date(),
  };

  const mockSale = {
    id: 'sale-1',
    title: 'Test Sale',
    images: 'img1.jpg,img2.jpg',
    store: { id: 'store-1', name: 'Test Store' },
  };

  const mockBookmarkRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    query: jest.fn(),
  };

  const mockSaleRepository = {
    findOne: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        { provide: getRepositoryToken(Bookmark), useValue: mockBookmarkRepository },
        { provide: getRepositoryToken(Sale), useValue: mockSaleRepository },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addBookmark', () => {
    it('should add a bookmark', async () => {
      mockSaleRepository.findOne.mockResolvedValue(mockSale);
      mockBookmarkRepository.findOne.mockResolvedValue(null);
      mockBookmarkRepository.query.mockResolvedValue([mockBookmark]);

      const result = await service.addBookmark('user-1', 'sale-1');

      expect(result).toEqual(mockBookmark);
      expect(mockSaleRepository.increment).toHaveBeenCalled();
    });

    it('should throw ConflictException if bookmark already exists', async () => {
      mockSaleRepository.findOne.mockResolvedValue(mockSale);
      mockBookmarkRepository.findOne.mockResolvedValue(mockBookmark);

      await expect(service.addBookmark('user-1', 'sale-1')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if sale not found', async () => {
      mockSaleRepository.findOne.mockResolvedValue(null);

      await expect(service.addBookmark('user-1', 'sale-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeBookmark', () => {
    it('should remove a bookmark', async () => {
      mockBookmarkRepository.findOne.mockResolvedValue(mockBookmark);
      mockBookmarkRepository.remove.mockResolvedValue(mockBookmark);

      await service.removeBookmark('user-1', 'sale-1');

      expect(mockBookmarkRepository.remove).toHaveBeenCalledWith(mockBookmark);
      expect(mockSaleRepository.decrement).toHaveBeenCalled();
    });

    it('should throw NotFoundException if bookmark not found', async () => {
      mockBookmarkRepository.findOne.mockResolvedValue(null);

      await expect(service.removeBookmark('user-1', 'sale-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('isBookmarked', () => {
    it('should return true if bookmark exists', async () => {
      mockBookmarkRepository.count.mockResolvedValue(1);

      const result = await service.isBookmarked('user-1', 'sale-1');

      expect(result).toBe(true);
    });

    it('should return false if bookmark does not exist', async () => {
      mockBookmarkRepository.count.mockResolvedValue(0);

      const result = await service.isBookmarked('user-1', 'sale-1');

      expect(result).toBe(false);
    });
  });

  describe('getUserBookmarks', () => {
    it('should return all bookmarks for a user', async () => {
      const bookmarksWithSales = [{ ...mockBookmark, sale: mockSale }];
      mockBookmarkRepository.find.mockResolvedValue(bookmarksWithSales);

      const result = await service.getUserBookmarks('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].images).toEqual(['img1.jpg', 'img2.jpg']);
    });
  });
});
