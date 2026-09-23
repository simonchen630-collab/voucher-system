import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { giftCode, memberPhone } = body;

    if (!giftCode || !memberPhone) {
      return NextResponse.json({ success: false, message: '請輸入完整的禮券序號與會員電話' }, { status: 400 });
    }

    // 1. 查詢資料庫中是否有這組序號
    const voucher = await prisma.voucher.findUnique({
      where: { giftCode: giftCode }
    });

    if (!voucher) {
      return NextResponse.json({ success: false, message: '無效的禮券序號，請檢查是否輸入正確' }, { status: 404 });
    }

    // 2. 如果已經兌換過，不再阻擋，改為「僅供查詢」模式，直接回傳對應的運費券與提示
    if (voucher.isExchanged) {
      return NextResponse.json({
        success: true,
        isAlreadyExchanged: true, // 標記這張是之前換過的
        shippingCode: voucher.shippingCode,
        message: '此組禮券序號之前已經兌換過了，以下為您的運費券序號：'
      });
    }

    // 3. 尚未兌換：更新為已兌換，並寫入會員電話與兌換時間
    const updatedVoucher = await prisma.voucher.update({
      where: { id: voucher.id },
      data: {
        isExchanged: true,
        memberPhone: memberPhone,
        exchangedAt: new Date(),
      }
    });

    // 4. 回傳全新產生的運費券序號
    return NextResponse.json({
      success: true,
      isAlreadyExchanged: false,
      shippingCode: updatedVoucher.shippingCode
    });

  } catch (error) {
    console.error('兌換 API 發生錯誤:', error);
    return NextResponse.json({ success: false, message: '系統發生異常，請稍後再試' }, { status: 500 });
  }
}