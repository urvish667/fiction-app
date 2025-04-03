import { NextRequest } from 'next/server';
import { PATCH } from './route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/auth/db-adapter';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth/db-adapter', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('User Profile API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update user profile with only username required', async () => {
    // Mock session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user123', username: 'testuser' },
    });

    // Mock prisma findUnique to return null (no existing user with same username)
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    // Mock prisma update to return updated user
    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: 'user123',
      username: 'newusername',
      marketingOptIn: true,
    });

    // Create request with minimal data
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        username: 'newusername',
        marketingOptIn: true,
      }),
    });

    // Call the API
    const response = await PATCH(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: 'user123',
      username: 'newusername',
      marketingOptIn: true,
    });

    // Verify prisma calls
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user123' },
      data: expect.objectContaining({
        username: 'newusername',
        marketingOptIn: true,
      }),
      select: expect.objectContaining({
        id: true,
        username: true,
        marketingOptIn: true,
      }),
    });
  });

  it('should handle marketingOptIn toggle', async () => {
    // Mock session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user123', username: 'testuser' },
    });

    // Mock prisma findUnique to return null (no existing user with same username)
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    // Mock prisma update to return updated user
    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: 'user123',
      username: 'testuser',
      marketingOptIn: false,
    });

    // Create request with only marketingOptIn
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        username: 'testuser',
        marketingOptIn: false,
      }),
    });

    // Call the API
    const response = await PATCH(request);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: 'user123',
      username: 'testuser',
      marketingOptIn: false,
    });

    // Verify prisma calls
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user123' },
      data: expect.objectContaining({
        username: 'testuser',
        marketingOptIn: false,
      }),
      select: expect.objectContaining({
        id: true,
        username: true,
        marketingOptIn: true,
      }),
    });
  });
});
