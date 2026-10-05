import { NextFunction, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { isWeekendBooking } from '../utils/date.helper';
import { createVoucherSchema, applyVoucherSchema } from '../validators/vouchers.validator';

// ══════════════════════════════════════════════
// VOUCHERS CONTROLLER (Admin & User)
// ══════════════════════════════════════════════

/**
 * POST /api/admin/vouchers
 * [ADMIN] Tạo voucher mới
 */
export async function createVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = createVoucherSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0].message,
      });
      return;
    }

    const { code, discount, startDate, endDate, isActive } = parseResult.data;

    // Kiểm tra trùng mã
    const existing = await prisma.voucher.findUnique({
      where: { code },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: 'Mã voucher này đã tồn tại trên hệ thống',
      });
      return;
    }

    const voucher = await prisma.voucher.create({
      data: {
        code,
        discount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
      },
    });

    // Gửi thông báo cho tất cả người dùng (role = USER)
    try {
      const users = await prisma.user.findMany({
        where: { role: 'USER' },
        select: { id: true },
      });

      if (users.length > 0) {
        const notifications = users.map(user => ({
          userId: user.id,
          title: 'Mã giảm giá mới! 🎁',
          message: `Chúng tôi vừa thêm mã giảm giá mới: ${code}. Nhập mã này để được giảm ${Number(discount) * 100}%!`,
          type: 'PROMOTION',
        }));

        await prisma.notification.createMany({
          data: notifications,
        });
      }
    } catch (notifError) {
      console.error('Lỗi khi gửi thông báo mã giảm giá:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Tạo voucher mới thành công!',
      data: { voucher },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/vouchers
 * [ADMIN] Lấy tất cả voucher để quản lý
 */
export async function getAllVouchers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vouchers = await prisma.voucher.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: { vouchers },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/admin/vouchers/:id
 * [ADMIN] Cập nhật voucher
 */
export async function updateVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const parseResult = createVoucherSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0].message,
      });
      return;
    }

    const existingVoucher = await prisma.voucher.findUnique({ where: { id } });
    if (!existingVoucher) {
      res.status(404).json({ success: false, message: 'Voucher không tồn tại' });
      return;
    }

    const dataToUpdate: any = { ...parseResult.data };
    if (parseResult.data.startDate) dataToUpdate.startDate = new Date(parseResult.data.startDate);
    if (parseResult.data.endDate) dataToUpdate.endDate = new Date(parseResult.data.endDate);

    // Kiểm tra trùng mã nếu đổi mã
    if (parseResult.data.code && parseResult.data.code !== existingVoucher.code) {
      const duplicate = await prisma.voucher.findUnique({ where: { code: parseResult.data.code } });
      if (duplicate) {
        res.status(409).json({ success: false, message: 'Mã voucher này đã được sử dụng' });
        return;
      }
    }

    const updated = await prisma.voucher.update({
      where: { id },
      data: dataToUpdate,
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật voucher thành công',
      data: { voucher: updated },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/admin/vouchers/:id
 * [ADMIN] Xóa hoặc vô hiệu hóa voucher
 */
export async function deleteVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const existingVoucher = await prisma.voucher.findUnique({ where: { id } });
    if (!existingVoucher) {
      res.status(404).json({ success: false, message: 'Voucher không tồn tại' });
      return;
    }

    // Thực hiện xóa hẳn hoặc chuyển isActive = false
    await prisma.voucher.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Xóa voucher thành công',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/vouchers/apply
 * [USER] Áp dụng mã voucher cho lượt đặt phòng
 */
export async function applyVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = applyVoucherSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0].message,
      });
      return;
    }

    const { code, checkInDate, checkOutDate } = parseResult.data;

    // 1. Tìm voucher
    const voucher = await prisma.voucher.findUnique({
      where: { code },
    });

    if (!voucher) {
      res.status(404).json({
        success: false,
        message: 'Mã voucher không hợp lệ hoặc đã hết hạn sử dụng.',
      });
      return;
    }

    // 3. Kiểm tra tính khả dụng
    if (!voucher.isActive) {
      res.status(400).json({
        success: false,
        message: 'Mã voucher này hiện đang bị tạm khóa.',
      });
      return;
    }

    // 4. Kiểm tra thời hạn voucher
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const start = new Date(voucher.startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(voucher.endDate);
    end.setHours(23, 59, 59, 999);

    if (now < start) {
      res.status(400).json({
        success: false,
        message: `Mã voucher này chưa đến thời gian sử dụng (Bắt đầu từ ${start.toLocaleDateString('vi-VN')}).`,
      });
      return;
    }

    if (now > end) {
      res.status(400).json({
        success: false,
        message: 'Mã voucher này đã hết hạn sử dụng.',
      });
      return;
    }

    // Hợp lệ -> Trả về mức giảm giá
    res.status(200).json({
      success: true,
      message: `Áp dụng mã giảm giá thành công! Giảm ${Number(voucher.discount) * 100}% trên tổng tiền phòng.`,
      data: {
        code: voucher.code,
        discount: Number(voucher.discount),
      },
    });
  } catch (error) {
    next(error);
  }
}
