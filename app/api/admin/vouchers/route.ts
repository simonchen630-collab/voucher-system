import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const vouchers = await prisma.voucher.findMany({
      orderBy: { createdAt: 'desc' }, // 按建立時間由新到舊排序
    });
    return NextResponse.json({ success: true, vouchers });
  } catch (error) {
    return NextResponse.json({ success: false, message: '無法取得資料' }, { status: 500 });
  }
}