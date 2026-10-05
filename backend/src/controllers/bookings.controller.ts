import { NextFunction, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { sendBookingConfirmationEmail } from '../services/email.service';
import { createNotification } from '../utils/notification.helper';
import { isWeekendBooking } from '../utils/date.helper';
import type { BookingQueryInput, CreateBookingInput, UpdateBookingStatusInput } from '../validators/bookings.validator';

// ══════════════════════════════════════════════
// BOOKINGS CONTROLLER
// ══════════════════════════════════════════════

const TAX_RATE = 0.10; // 10% thuế phí dịch vụ

/** Tính số đêm giữa 2 ngày */
function calcNights(checkIn: Date, checkOut: Date): number {
  return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
}

// Định nghĩa Custom Error Class để xử lý lỗi xác thực đặt phòng bên trong transaction
class BookingValidationError extends Error {
  code: string;
  data: any;
  statusCode: number;

  constructor(message: string, code: string, data: any, statusCode: number = 409) {
    super(message);
    this.name = 'BookingValidationError';
    this.code = code;
    this.data = data;
    this.statusCode = statusCode;
  }
}

/**
 * POST /api/bookings
 * Tạo đơn đặt phòng mới (server tính giá — tránh gian lận)
 */
export async function createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const {
      roomId,
      checkInDate,
      checkOutDate,
      guestsCount,
      roomsCount,
      specialRequest,
      discount,
      paymentMethod,
      useWeekendDiscount,
    }: CreateBookingInput = req.body;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Chạy trong Interactive Transaction để đảm bảo tính nhất quán và conccurency control
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Thực hiện khóa dòng (Row locking) trên phòng để ngăn các request khác đọc/ghi đồng thời trong cùng thời điểm
      const rooms: any[] = await tx.$queryRaw`
        SELECT id, name, status, pricePerNight, capacityAdults, quantity 
        FROM Rooms WITH (UPDLOCK, HOLDLOCK) 
        WHERE id = ${roomId}
      `;

      const room = rooms[0];

      if (!room) {
        throw new BookingValidationError('Không tìm thấy phòng', 'ROOM_NOT_FOUND', null, 404);
      }

      // 2. Tính tổng số phòng đã được đặt (các trạng thái active) trong khoảng ngày checkIn - checkOut
      const bookedResult = await tx.booking.aggregate({
        where: {
          roomId,
          status: { in: ['PENDING', 'CONFIRMED', 'AWAITING_PAYMENT', 'AWAITING_CONFIRMATION'] },
          checkInDate: { lt: checkOut },
          checkOutDate: { gt: checkIn },
        },
        _sum: { roomsCount: true },
      });

      const totalBooked = bookedResult._sum.roomsCount || 0;
      const availableRooms = room.quantity - totalBooked;

      // 3. Nếu số phòng yêu cầu vượt quá số phòng còn trống
      if (roomsCount > availableRooms) {
        if (availableRooms <= 0) {
          throw new BookingValidationError(
            `Phòng "${room.name}" đã hết trong khoảng ngày ${checkInDate} đến ${checkOutDate}. Vui lòng chọn ngày khác hoặc loại phòng khác.`,
            'ROOM_SOLD_OUT',
            {
              roomId,
              roomName: room.name,
              totalQuantity: room.quantity,
              bookedCount: totalBooked,
              availableRooms: 0,
              requestedDate: { checkIn: checkInDate, checkOut: checkOutDate },
            },
            409
          );
        } else {
          throw new BookingValidationError(
            `Phòng "${room.name}" chỉ còn ${availableRooms} phòng trống trong khoảng ngày ${checkInDate} đến ${checkOutDate}. Bạn yêu cầu ${roomsCount} phòng. Vui lòng giảm số lượng hoặc chọn ngày khác.`,
            'INSUFFICIENT_ROOMS',
            {
              roomId,
              roomName: room.name,
              totalQuantity: room.quantity,
              bookedCount: totalBooked,
              availableRooms,
              requestedRooms: roomsCount,
              requestedDate: { checkIn: checkInDate, checkOut: checkOutDate },
            },
            409
          );
        }
      }

      // 4. Tính tiền (server-side)
      const nightCount = calcNights(checkIn, checkOut);
      const pricePerNight = Number(room.pricePerNight);
      const rawSubtotal = pricePerNight * nightCount * roomsCount;

      let finalDiscount = 0;
      let finalVoucherCode: string | null = null;

      // ── Kiểm tra ưu đãi cuối tuần (giảm 30%) hoặc dùng voucher riêng ──
      const isWeekend = isWeekendBooking(checkIn, checkOut);
      const useWeekend = isWeekend && (!req.body.voucherCode && useWeekendDiscount !== false);

      if (useWeekend) {
        finalDiscount = 0.30;
      } else if (req.body.voucherCode) {
        const voucher = await tx.voucher.findUnique({
          where: { code: req.body.voucherCode.toUpperCase().trim() },
        });

        if (!voucher || !voucher.isActive) {
          throw new BookingValidationError('Mã giảm giá không tồn tại hoặc đã bị ngừng kích hoạt.', 'INVALID_VOUCHER', null, 400);
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const start = new Date(voucher.startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(voucher.endDate);
        end.setHours(23, 59, 59, 999);

        if (now < start || now > end) {
          throw new BookingValidationError('Mã giảm giá đã hết hạn hoặc chưa đến ngày bắt đầu sử dụng.', 'VOUCHER_EXPIRED', null, 400);
        }

        finalDiscount = Number(voucher.discount);
        finalVoucherCode = voucher.code;
      } else if (discount) {
        finalDiscount = Number(discount);
      }

      const discountAmount = finalDiscount ? rawSubtotal * finalDiscount : 0;
      const subtotal = rawSubtotal - discountAmount;
      const taxAmount = subtotal * TAX_RATE;
      const totalPrice = subtotal + taxAmount;

      // 5. Tạo booking
      return tx.booking.create({
        data: {
          userId,
          roomId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          nightCount,
          guestsCount,
          roomsCount,
          specialRequest: specialRequest || null,
          pricePerNight: room.pricePerNight,
          subtotal,
          taxRate: TAX_RATE,
          taxAmount,
          totalPrice,
          status: 'AWAITING_PAYMENT',
          paymentStatus: 'UNPAID',
          paymentMethod: paymentMethod || null,
          voucherCode: finalVoucherCode,
          discountAmount,
        },
        include: {
          room: { select: { name: true, location: true } },
          user: { select: { name: true, email: true } },
        },
      });
    });

    res.status(201).json({
      success: true,
      message: 'Đặt phòng thành công! Vui lòng tiến hành thanh toán.',
      data: { booking },
    });
  } catch (error) {
    if (error instanceof BookingValidationError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
        data: error.data,
      });
      return;
    }
    next(error);
  }
}

/**
 * GET /api/bookings/my-bookings
 * Lịch sử đặt phòng của user đang đăng nhập
 */
export async function getMyBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { page, limit, status }: BookingQueryInput = req.query as any;

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = { userId };
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
        include: {
          room: {
            select: {
              id: true,
              name: true,
              location: true,
              type: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: { total, page: pageNumber, limit: limitNumber, totalPages: Math.ceil(total / limitNumber) },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/bookings [Admin]
 * Lấy tất cả bookings với filter theo status
 */
export async function getAllBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, status, userId }: BookingQueryInput = req.query as any;

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          room: { select: { id: true, name: true, type: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: { total, page: pageNumber, limit: limitNumber, totalPages: Math.ceil(total / limitNumber) },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/bookings/:id/status [Admin]
 * Admin duyệt/từ chối/hoàn thành booking
 */
export async function updateBookingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status }: UpdateBookingStatusInput = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        room: { select: { name: true } },
      },
    });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Không tìm thấy booking' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id },
        data: {
          status,
          ...(status === 'CONFIRMED' ? { paymentStatus: 'PAID' } : {}),
        },
      });

      // ĐỒNG BỘ TRẠNG THÁI PHÒNG
      if (status === 'CONFIRMED') {
        await tx.room.update({
          where: { id: booking.roomId },
          data: { status: 'BOOKED' },
        });

        await tx.payment.updateMany({
          where: { bookingId: id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        });
      } else if (status === 'CANCELLED' || status === 'COMPLETED') {
        // Trả phòng về lại trạng thái Available
        await tx.room.update({
          where: { id: booking.roomId },
          data: { status: 'AVAILABLE' },
        });
      }

      return b;
    });

    // Gửi email xác nhận nếu booking được duyệt
    if (status === 'CONFIRMED') {
      sendBookingConfirmationEmail(
        booking.user.email,
        booking.user.name,
        {
          id: booking.id,
          roomName: booking.room.name,
          checkIn: booking.checkInDate.toLocaleDateString('vi-VN'),
          checkOut: booking.checkOutDate.toLocaleDateString('vi-VN'),
          totalPrice: Number(booking.totalPrice).toLocaleString('vi-VN'),
          guests: booking.guestsCount,
        }
      ).catch(console.error);
    }

    // ── GỬI THÔNG BÁO TRONG ỨNG DỤNG ──
    try {
      let notifTitle = '';
      let notifMessage = '';

      if (status === 'CONFIRMED') {
        notifTitle = 'Đơn đặt phòng đã được xác nhận! ✅';
        notifMessage = `Phòng "${booking.room.name}" của bạn đã được xác nhận thành công. Hẹn gặp bạn vào ngày ${booking.checkInDate.toLocaleDateString('vi-VN')}.`;
      } else if (status === 'CANCELLED') {
        notifTitle = 'Đơn đặt phòng bị hủy ❌';
        notifMessage = `Rất tiếc, đơn đặt phòng "${booking.room.name}" của bạn đã bị hủy. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.`;
      } else if (status === 'COMPLETED') {
        notifTitle = 'Chuyến đi hoàn tất 🏨';
        notifMessage = `Cảm ơn bạn đã sử dụng dịch vụ tại LuxStay. Chúc bạn có những trải nghiệm tuyệt vời!`;
      }

      if (notifTitle) {
        await createNotification(booking.userId, notifTitle, notifMessage, 'BOOKING');
      }
    } catch (notifError) {
      console.error('Lỗi khi gửi thông báo (không làm gián đoạn booking):', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái booking thành công',
      data: { booking: updated },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/bookings/:id/cancel
 * User tự hủy booking (chỉ khi status = PENDING)
 */
export async function cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Không tìm thấy booking' });
      return;
    }

    // Chỉ chủ booking mới được hủy
    if (booking.userId !== userId) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền hủy booking này' });
      return;
    }

    const cancellableStatuses = ['PENDING', 'AWAITING_PAYMENT', 'AWAITING_CONFIRMATION'];
    if (!cancellableStatuses.includes(booking.status)) {
      res.status(400).json({
        success: false,
        message: 'Chỉ có thể hủy booking khi chưa được xác nhận hoàn tất',
      });
      return;
    }

    await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.status(200).json({ success: true, message: 'Hủy đặt phòng thành công' });
  } catch (error) {
    next(error);
  }
}
