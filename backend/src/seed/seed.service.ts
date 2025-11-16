import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../modules/users/entities/user.entity';
import { Store, StoreCategory } from '../modules/stores/entities/store.entity';
import { Sale, SaleCategory, SaleStatus, SaleSource } from '../modules/sales/entities/sale.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
  ) {}

  async seed() {
    console.log('🌱 Starting database seed...');

    // Clear existing data in correct order (development only!)
    // Delete in reverse order of foreign key dependencies
    await this.salesRepository.query('DELETE FROM sales');
    await this.storesRepository.query('DELETE FROM stores');
    await this.usersRepository.query('DELETE FROM users');

    // Create test users
    const users = await this.createUsers();
    console.log(`✅ Created ${users.length} users`);

    // Create stores in Tel Aviv
    const stores = await this.createStores(users);
    console.log(`✅ Created ${stores.length} stores`);

    // Create sales
    const sales = await this.createSales(stores);
    console.log(`✅ Created ${sales.length} sales`);

    console.log('🎉 Database seed completed!');
    return { users: users.length, stores: stores.length, sales: sales.length };
  }

  private async createUsers(): Promise<User[]> {
    const usersData = [
      {
        email: 'test@mysellguid.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
        defaultLatitude: 32.0853,
        defaultLongitude: 34.7818,
      },
      {
        email: 'store@mysellguid.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Store',
        lastName: 'Owner',
        role: UserRole.STORE_OWNER,
      },
    ];

    const users = [];
    for (const userData of usersData) {
      const user = this.usersRepository.create(userData);
      users.push(await this.usersRepository.save(user));
    }

    return users;
  }

  private async createStores(users: User[]): Promise<Store[]> {
    const storeOwner = users.find(u => u.role === UserRole.STORE_OWNER);

    const storesData = [
      {
        name: 'Fashion Paradise',
        description: 'Premium clothing and accessories for men and women',
        category: StoreCategory.FASHION,
        address: 'Local Street 123',
        city: 'Ramat Gan',
        country: 'Israel',
        latitude: 32.1544678,
        longitude: 34.9167442,
        phoneNumber: '+972-3-1234567',
        email: 'info@fashionparadise.com',
        isVerified: true,
        rating: 4.5,
        reviewCount: 124,
      },
      {
        name: 'Tech Zone',
        description: 'Latest electronics and gadgets at unbeatable prices',
        category: StoreCategory.ELECTRONICS,
        address: 'Local Street 200',
        city: 'Ramat Gan',
        country: 'Israel',
        latitude: 32.1550,
        longitude: 34.9170,
        phoneNumber: '+972-3-2345678',
        email: 'contact@techzone.com',
        isVerified: true,
        rating: 4.7,
        reviewCount: 89,
      },
      {
        name: 'Home Style',
        description: 'Everything for your home - furniture, decor, and more',
        category: StoreCategory.HOME,
        address: 'Local Street 300',
        city: 'Ramat Gan',
        country: 'Israel',
        latitude: 32.1540,
        longitude: 34.9160,
        phoneNumber: '+972-3-3456789',
        email: 'hello@homestyle.com',
        isVerified: true,
        rating: 4.3,
        reviewCount: 67,
      },
      {
        name: 'Sports World',
        description: 'Athletic wear and equipment for all sports',
        category: StoreCategory.SPORTS,
        address: 'Local Street 400',
        city: 'Ramat Gan',
        country: 'Israel',
        latitude: 32.1548,
        longitude: 34.9175,
        phoneNumber: '+972-3-4567890',
        email: 'info@sportsworld.com',
        isVerified: true,
        rating: 4.6,
        reviewCount: 156,
      },
      {
        name: 'Beauty Corner',
        description: 'Cosmetics, skincare, and beauty products',
        category: StoreCategory.BEAUTY,
        address: 'Local Street 500',
        city: 'Ramat Gan',
        country: 'Israel',
        latitude: 32.1542,
        longitude: 34.9165,
        phoneNumber: '+972-3-5678901',
        email: 'info@beautycorner.com',
        isVerified: true,
        rating: 4.8,
        reviewCount: 203,
      },
    ];

    const stores = [];
    for (const storeData of storesData) {
      // Use raw SQL to insert with PostGIS ST_SetSRID and ST_Point
      const result = await this.storesRepository.query(
        `INSERT INTO stores (name, description, category, address, city, country, latitude, longitude, location, "phoneNumber", email, "isVerified", rating, "reviewCount", "ownerId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ST_SetSRID(ST_Point($9, $10), 4326)::geography, $11, $12, $13, $14, $15, $16)
         RETURNING *`,
        [
          storeData.name,
          storeData.description,
          storeData.category,
          storeData.address,
          storeData.city,
          storeData.country,
          storeData.latitude,
          storeData.longitude,
          storeData.longitude,
          storeData.latitude,
          storeData.phoneNumber,
          storeData.email,
          storeData.isVerified,
          storeData.rating,
          storeData.reviewCount,
          storeOwner.id,
        ],
      );
      stores.push(result[0]);
    }

    return stores;
  }

  private async createSales(stores: Store[]): Promise<Sale[]> {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const salesData = [
      // Fashion Paradise Sales
      {
        title: '50% OFF Everything - End of Season Sale!',
        description: 'Huge clearance sale! All items 50% off. Men\'s and women\'s clothing, shoes, and accessories. Limited time only!',
        category: SaleCategory.CLOTHING,
        discountPercentage: 50,
        originalPrice: 200,
        salePrice: 100,
        startDate: now,
        endDate: nextWeek,
        images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8'],
        storeId: stores[0].id,
        latitude: stores[0].latitude,
        longitude: stores[0].longitude,
        source: SaleSource.STORE_DASHBOARD,
      },
      {
        title: 'Summer Dress Collection - 30% OFF',
        description: 'Beautiful summer dresses in various colors and styles. Perfect for the season!',
        category: SaleCategory.CLOTHING,
        discountPercentage: 30,
        originalPrice: 150,
        salePrice: 105,
        startDate: now,
        endDate: nextMonth,
        images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8'],
        storeId: stores[0].id,
        latitude: stores[0].latitude,
        longitude: stores[0].longitude,
        source: SaleSource.STORE_DASHBOARD,
      },
      // Tech Zone Sales
      {
        title: 'Smartphone Mega Sale - Up to 40% OFF',
        description: 'Latest smartphones at incredible prices! Samsung, iPhone, and more. Limited stock!',
        category: SaleCategory.ELECTRONICS,
        discountPercentage: 40,
        originalPrice: 3000,
        salePrice: 1800,
        startDate: now,
        endDate: nextWeek,
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'],
        storeId: stores[1].id,
        latitude: stores[1].latitude,
        longitude: stores[1].longitude,
        source: SaleSource.STORE_DASHBOARD,
      },
      {
        title: 'Laptops and Tablets - Special Offers',
        description: 'Amazing deals on laptops and tablets. Perfect for work or study!',
        category: SaleCategory.ELECTRONICS,
        discountPercentage: 25,
        originalPrice: 4000,
        salePrice: 3000,
        startDate: now,
        endDate: nextMonth,
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8'],
        storeId: stores[1].id,
        latitude: stores[1].latitude,
        longitude: stores[1].longitude,
        source: SaleSource.STORE_DASHBOARD,
      },
      // Home Style Sales
      {
        title: 'Furniture Clearance - 60% OFF!',
        description: 'Massive furniture clearance! Sofas, beds, tables, and more. Must go!',
        category: SaleCategory.FURNITURE,
        discountPercentage: 60,
        originalPrice: 5000,
        salePrice: 2000,
        startDate: now,
        endDate: nextWeek,
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc'],
        storeId: stores[2].id,
        latitude: stores[2].latitude,
        longitude: stores[2].longitude,
        source: SaleSource.STORE_DASHBOARD,
      },
      {
        title: 'Home Decor Sale - 35% OFF',
        description: 'Beautiful home decor items at great prices. Transform your space!',
        category: SaleCategory.HOME_GOODS,
        discountPercentage: 35,
        originalPrice: 300,
        salePrice: 195,
        startDate: now,
        endDate: nextMonth,
        images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f'],
        storeId: stores[2].id,
        latitude: stores[2].latitude,
        longitude: stores[2].longitude,
        source: SaleSource.STORE_DASHBOARD,
      },
      // Sports World Sales
      {
        title: 'Athletic Shoes - Buy 1 Get 1 50% OFF',
        description: 'Premium athletic shoes from top brands. BOGO 50% off deal!',
        category: SaleCategory.SHOES,
        discountPercentage: 25,
        originalPrice: 400,
        salePrice: 300,
        startDate: now,
        endDate: nextMonth,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff'],
        storeId: stores[3].id,
        latitude: stores[3].latitude,
        longitude: stores[3].longitude,
        source: SaleSource.STORE_DASHBOARD,
      },
      {
        title: 'Gym Equipment Sale - Up to 45% OFF',
        description: 'Everything you need for your home gym at discounted prices!',
        category: SaleCategory.SPORTS,
        discountPercentage: 45,
        originalPrice: 1500,
        salePrice: 825,
        startDate: now,
        endDate: nextWeek,
        images: ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438'],
        storeId: stores[3].id,
        latitude: stores[3].latitude,
        longitude: stores[3].longitude,
        source: SaleSource.STORE_DASHBOARD,
      },
      // Beauty Corner Sales
      {
        title: 'Skincare Week - 40% OFF Premium Brands',
        description: 'Top skincare brands at 40% off. Take care of your skin!',
        category: SaleCategory.BEAUTY,
        discountPercentage: 40,
        originalPrice: 250,
        salePrice: 150,
        startDate: now,
        endDate: nextWeek,
        images: ['https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8'],
        storeId: stores[4].id,
        latitude: stores[4].latitude,
        longitude: stores[4].longitude,
        source: SaleSource.STORE_DASHBOARD,
      },
      {
        title: 'Makeup Sale - 3 for 2 on All Items',
        description: 'Buy 3 makeup products, get the cheapest one free!',
        category: SaleCategory.BEAUTY,
        discountPercentage: 33,
        originalPrice: 180,
        salePrice: 120,
        startDate: now,
        endDate: nextMonth,
        images: ['https://images.unsplash.com/photo-1512496015851-a90fb38ba796'],
        storeId: stores[4].id,
        latitude: stores[4].latitude,
        longitude: stores[4].longitude,
        source: SaleSource.STORE_DASHBOARD,
      },
    ];

    const sales = [];
    for (const saleData of salesData) {
      // Use raw SQL to insert with PostGIS ST_SetSRID and ST_Point
      const result = await this.salesRepository.query(
        `INSERT INTO sales (title, description, category, "discountPercentage", "originalPrice", "salePrice", currency, "startDate", "endDate", images, "storeId", latitude, longitude, location, status, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, ST_SetSRID(ST_Point($14, $15), 4326)::geography, $16, $17)
         RETURNING *`,
        [
          saleData.title,
          saleData.description,
          saleData.category,
          saleData.discountPercentage,
          saleData.originalPrice,
          saleData.salePrice,
          'ILS',
          saleData.startDate,
          saleData.endDate,
          saleData.images,
          saleData.storeId,
          saleData.latitude,
          saleData.longitude,
          saleData.longitude,
          saleData.latitude,
          SaleStatus.ACTIVE,
          saleData.source,
        ],
      );
      sales.push(result[0]);
    }

    return sales;
  }
}
