import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body; // 接收前端傳過來的 ID 陣列

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, message: '沒有指定要刪除的項目' }, { status: 400 });
    }

    // 批次從資料庫刪除
    const result = await prisma.voucher.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({
      success: true,
      message: `成功刪除 ${result.count} 筆禮券資料！`,
    });
  } catch (error) {
    console.error('刪除 API 發生錯誤:', error);
    return NextResponse.json({ success: false, message: '系統發生異常，刪除失敗' }, { status: 500 });
  }
}