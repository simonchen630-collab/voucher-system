import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// 建立 Prisma 單例連線，避免建置或執行時重複初始化
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: '缺少刪除 ID' }, { status: 400 });
    }

    await prisma.voucher.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, message: '刪除成功' });
  } catch (error: any) {
    console.error('刪除詳細錯誤:', error);
    return NextResponse.json({ 
      success: false, 
      message: `刪除失敗: ${error.message || '未知錯誤'}` 
    }, { status: 500 });
  }
}