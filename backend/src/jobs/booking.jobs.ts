import cron from 'node-cron';
import prisma from '../lib/prisma';

/**
 * Initialize all scheduled jobs
 */
export function initJobs() {
  // Chạy mỗi giờ một lần vào phút thứ 0 (0 * * * *)
  cron.schedule('0 * * * *', async () => {
    console.log('[Job] Đang kiểm tra và tự động giải phóng phòng...');
    await autoCheckOut();
  });

  // Chạy quét mỗi 1 phút để tự động hủy đơn đặt phòng hết hạn thanh toán (Hold Timeout)
  cron.schedule('*/1 * * * *', async () => {
    console.log('[Job] Đang quét các đơn chờ thanh toán hết hạn...');
    await autoCancelUnpaidBookings();
  });

  // Chạy test mỗi 5 phút trong môi trường dev (tùy chọn)
  if (process.env.NODE_ENV === 'development') {
    cron.schedule('*/5 * * * *', async () => {
      console.log('[Job-Dev] Quét nhanh trạng thái booking...');
      await autoCheckOut();
    });
  }
}

/**
 * Tự động chuyển CONFIRMED -> COMPLETED nếu đã quá ngày checkout
 * và giải phóng Room về AVAILABLE nếu không có đơn nào khác đang ở trong phòng đó.
 */
async function autoCheckOut() {
  try {
    const now = new Date();

    // 1. Tìm các booking hết hạn
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        checkOutDate: { lt: now }
      },
      include: {
        room: true
      }
    });

    if (expiredBookings.length === 0) return;

    console.log(`[Job] Tìm thấy ${expiredBookings.length} booking cần hoàn tất.`);

    // 2. Cập nhật booking sang COMPLETED trong 1 transaction
    await prisma.$transaction(async (tx) => {
      const bookingIds = expiredBookings.map(b => b.id);
      
      await tx.booking.updateMany({
        where: { id: { in: bookingIds } },
        data: { status: 'COMPLETED' }
      });

      // 3. Xử lý trạng thái phòng
      const affectedRoomIds = Array.from(new Set(expiredBookings.map(b => b.roomId)));

      for (const roomId of affectedRoomIds) {
        // Kiểm tra xem phòng này có đơn nào khác đang trong thời gian ở không
        const activeBooking = await tx.booking.findFirst({
          where: {
            roomId,
            status: 'CONFIRMED',
            checkInDate: { lte: now },
            checkOutDate: { gte: now }
          }
        });

        // Nếu không có ai đang ở, giải phóng phòng
        if (!activeBooking) {
          await tx.room.update({
            where: { id: roomId },
            data: { status: 'AVAILABLE' }
          });
          console.log(`[Job] Giải phóng phòng ID: ${roomId}`);
        }
      }
    });

    console.log('[Job] Hoàn tất quét checkout tự động.');
  } catch (error) {
    console.error('[Job Error] Lỗi khi xử lý checkout tự động:', error);
  }
}

/**
 * Tự động hủy các booking ở trạng thái AWAITING_PAYMENT nếu đã quá thời gian chờ thanh toán (hold time)
 */
async function autoCancelUnpaidBookings() {
  try {
    const now = new Date();
    // Ở môi trường development: giữ phòng 2 phút. Production: giữ phòng 10 phút.
    const holdTimeMinutes = process.env.NODE_ENV === 'development' ? 2 : 10;
    const holdThreshold = new Date(now.getTime() - holdTimeMinutes * 60 * 1000);

    // 1. Tìm các booking chờ thanh toán đã quá hạn
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: 'AWAITING_PAYMENT',
        createdAt: { lt: holdThreshold }
      },
      select: { id: true, roomId: true }
    });

    if (expiredBookings.length === 0) return;

    console.log(`[Job] Tìm thấy ${expiredBookings.length} đơn đặt phòng chờ thanh toán đã quá hạn.`);

    // 2. Cập nhật trạng thái các booking này sang CANCELLED
    await prisma.booking.updateMany({
      where: {
        id: { in: expiredBookings.map(b => b.id) }
      },
      data: {
        status: 'CANCELLED'
      }
    });

    console.log(`[Job] Đã tự động hủy thành công ${expiredBookings.length} đơn đặt phòng quá hạn thanh toán.`);
  } catch (error) {
    console.error('[Job Error] Lỗi khi tự động hủy đơn chờ thanh toán:', error);
  }
}
