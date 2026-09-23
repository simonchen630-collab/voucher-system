import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { csvData } = body; // 接收前端解析後的陣列資料

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return NextResponse.json({ success: false, message: '沒有收到有效的資料內容' }, { status: 400 });
    }

    let successCount = 0;
    let duplicateCount = 0;

    // 逐筆寫入資料庫，略過重複的禮券序號
    for (const row of csvData) {
      const { giftCode, shippingCode, amount } = row;
      if (!giftCode || !shippingCode) continue;

      try {
        await prisma.voucher.create({
          data: {
            giftCode: String(giftCode).trim(),
            shippingCode: String(shippingCode).trim(),
            amount: Number(amount) || 100,
          },
        });
        successCount++;
      } catch (err) {
        // 如果 giftCode 重複（資料庫有設定 unique），Prisma 會拋出錯誤，我們直接當作略過重複筆數
        duplicateCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `匯入完成！成功新增 ${successCount} 筆，略過重複序號 ${duplicateCount} 筆。`,
    });
  } catch (error) {
    console.error('CSV 匯入發生錯誤:', error);
    return NextResponse.json({ success: false, message: '系統發生異常，匯入失敗' }, { status: 500 });
  }
}