import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

const mockUsersService = {
  create: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return token', async () => {
      const user = {
        id: 'uuid-1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'member',
        password: 'hashed',
      };
      mockUsersService.create.mockResolvedValue(user);

      const result = await service.register('Test User', 'test@test.com', 'password123');

      expect(result.token).toBe('mock-token');
      expect(result.user.email).toBe('test@test.com');
      expect(mockUsersService.create).toHaveBeenCalledWith(
        'Test User',
        'test@test.com',
        'password123',
      );
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'uuid-1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'member',
        password: hashedPassword,
      });

      const result = await service.login('test@test.com', 'password123');

      expect(result.token).toBe('mock-token');
      expect(result.user.email).toBe('test@test.com');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@test.com',
        password: hashedPassword,
        role: 'member',
      });

      await expect(
        service.login('test@test.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login('nouser@test.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getMe', () => {
    it('should return current user', async () => {
      mockUsersService.findById.mockResolvedValue({
        id: 'uuid-1',
        name: 'Test',
        email: 'test@test.com',
        role: 'member',
      });

      const result = await service.getMe('uuid-1');
      expect(result.email).toBe('test@test.com');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.getMe('bad-id')).rejects.toThrow(UnauthorizedException);
    });
  });
});