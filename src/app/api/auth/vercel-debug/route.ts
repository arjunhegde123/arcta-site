import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';

// Create a Prisma client with explicit database URL
let dbUrl = process.env.DATABASE_URL || 
          process.env.POSTGRES_PRISMA_URL || 
          process.env.POSTGRES_URL;

// Fix protocol if needed
if (dbUrl && dbUrl.startsWith('postgres://')) {
  dbUrl = dbUrl.replace(/^postgres:\/\//, 'postgresql://');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

// Define types for better TypeScript support
interface DbTestResult {
  success: boolean;
  error: string | null;
  count: number | null;
}

interface DbUrlInfo {
  set: boolean;
  protocol?: string;
  hasSSL?: boolean;
  isPgBouncer?: boolean;
  host?: string;
  masked?: string;
}

export async function GET(): Promise<NextResponse> {
  try {
    // Check runtime environment
    const isVercel = process.env.VERCEL === '1';
    const nodeEnv = process.env.NODE_ENV || 'unknown';
    const region = process.env.VERCEL_REGION || 'unknown';
    
    // Check database connection basics
    let dbTest: DbTestResult = { success: false, error: null, count: null };
    try {
      const count = await prisma.user.count();
      dbTest = {
        success: true,
        error: null,
        count
      };
    } catch (err: any) {
      dbTest = {
        success: false,
        error: err.message,
        count: null
      };
    }
    
    // Check database URL configuration (masked)
    let dbUrlInfo: DbUrlInfo = { set: false };
    if (process.env.DATABASE_URL) {
      const url = process.env.DATABASE_URL;
      const maskedUrl = url.replace(/:([^@]*)@/, ':****@');
      dbUrlInfo = {
        set: true,
        protocol: url.split(':')[0],
        hasSSL: url.includes('sslmode='),
        isPgBouncer: maskedUrl.includes('-pooler'),
        host: maskedUrl.split('@')[1]?.split('/')[0] || 'unknown',
        masked: `${maskedUrl.substring(0, 15)}...${maskedUrl.substring(maskedUrl.indexOf('@'))}`,
      };
    }
    
    // Check auth configuration
    const authConfig = {
      nextAuthUrl: process.env.NEXTAUTH_URL || 'not set',
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'set' : 'not set',
      baseUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'unknown'
    };
    
    return NextResponse.json({
      environment: {
        isVercel,
        nodeEnv,
        region,
        timestamp: new Date().toISOString()
      },
      database: dbTest,
      configuration: {
        database: dbUrlInfo,
        auth: authConfig
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: true,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    }, { status: 500 });
  }
} 