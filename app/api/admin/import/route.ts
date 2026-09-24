import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

      const giftCodeStr = String(row.giftCode).trim();
      const shippingCodeStr = row.shippingCode ? String(row.shippingCode).trim() : '';
      const amountVal = row.amount ? Number(row.amount) : 100;

      // 檢查該禮券序號是否已存在
      const existing = await prisma.voucher.findFirst({
        where: { giftCode: giftCodeStr },
      });

      if (existing) {
        await prisma.voucher.update({
          where: { id: existing.id },
          data: {
            shippingCode: shippingCodeStr,
            amount: amountVal,
          },
        });
      } else {
        await prisma.voucher.create({
          data: {
            giftCode: giftCodeStr,
            shippingCode: shippingCodeStr,
            amount: amountVal,
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
  } catch (error: any) {
    console.error('CSV 匯入詳細錯誤:', error);
    return NextResponse.json({ 
      success: false, 
      message: `系統發生異常，匯入失敗: ${error.message || '未知錯誤'}` 
    }, { status: 500 });
  }
}