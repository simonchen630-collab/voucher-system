import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { csvData } = body;

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return NextResponse.json({ success: false, message: '沒有收到有效的資料內容' }, { status: 400 });
    }

    let successCount = 0;

    for (const row of csvData) {
      if (!row.giftCode) continue;

      // 使用 upsert：若禮券序號已存在則更新，不存在則直接新增
      await prisma.voucher.upsert({
        where: { giftCode: row.giftCode },
        update: {
          shippingCode: row.shippingCode,
          amount: row.amount,
        },
        create: {
          giftCode: row.giftCode,
          shippingCode: row.shippingCode,
          amount: row.amount,
          isExchanged: false,
        },
      });
      successCount++;
    }

    return NextResponse.json({
      success: true,
      message: `匯入完成！成功寫入/更新 ${successCount} 筆禮券資料。`,
    });
  } catch (error) {
    console.error('CSV 匯入錯誤:', error);
    return NextResponse.json({ success: false, message: '系統發生異常，匯入失敗' }, { status: 500 });
  }
}