import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('repository should be defined', () => {
    expect(repository).toBeDefined();
  });

  // TODO: Add proper tests with complete User mock data
  // describe('create', () => {
  //   it('should successfully create a new user', async () => {
  //     const userDto = { email: 'test@example.com', password: 'password' };
  //     const expectedUser = { id: 1, ...userDto };
  //
  //     jest.spyOn(repository, 'save').mockResolvedValue(expectedUser as User);
  //
  //     expect(await service.create(userDto as any)).toEqual(expectedUser);
  //   });
  // });
});
