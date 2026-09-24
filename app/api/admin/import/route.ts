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

      // 檢查該禮券序號是否已存在
      const existing = await prisma.voucher.findFirst({
        where: { giftCode: row.giftCode },
      });

      if (existing) {
        // 若存在則更新對應的運費券與金額
        await prisma.voucher.update({
          where: { id: existing.id },
          data: {
            shippingCode: row.shippingCode,
            amount: row.amount,
          },
        });
      } else {
        // 若不存在則直接新增
        await prisma.voucher.create({
          data: {
            giftCode: row.giftCode,
            shippingCode: row.shippingCode,
            amount: row.amount,
            isExchanged: false,
          },
        });
      }
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