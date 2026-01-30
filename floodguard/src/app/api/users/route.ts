import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/users';

/**
 * GET /api/users
 * Verifies Prisma client connection by returning users from the database.
 * Run npm run dev and open http://localhost:3000/api/users to test.
 */
export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
