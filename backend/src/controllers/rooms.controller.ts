import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import type { CreateRoomInput, UpdateRoomInput, RoomQueryInput } from '../validators/rooms.validator';

// ══════════════════════════════════════════════
// ROOMS CONTROLLER
// ══════════════════════════════════════════════

/**
 * GET /api/rooms
 * Lấy danh sách phòng (có filter + phân trang)
 */
export async function getRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, type, location, minPrice, maxPrice, checkIn, checkOut }: RoomQueryInput = req.query as any;

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {
      status: { not: 'MAINTENANCE' },
    };

    if (type) where.type = type;
    if (location) where.location = { contains: location };
    if (minPrice || maxPrice) {
      where.pricePerNight = {
        ...(minPrice ? { gte: minPrice } : {}),
        ...(maxPrice ? { lte: maxPrice } : {}),
      };
    }

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: [{ avgRating: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          name: true,
          type: true,
          pricePerNight: true,
          location: true,
          status: true,
          avgRating: true,
          reviewCount: true,
          capacityAdults: true,
          capacityChildren: true,
          quantity: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true },
          },
        },
      }),
      prisma.room.count({ where }),
    ]);

    // ── Tính số phòng trống theo khoảng ngày ──────────────
    let roomsWithAvailability = rooms as any[];

    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      // Lấy tổng số phòng đã đặt (PENDING/CONFIRMED/AWAITING_PAYMENT/AWAITING_CONFIRMATION) cho từng room trong khoảng ngày
      const bookedCounts = await prisma.booking.groupBy({
        by: ['roomId'],
        where: {
          roomId: { in: rooms.map((r) => r.id) },
          status: { in: ['PENDING', 'CONFIRMED', 'AWAITING_PAYMENT', 'AWAITING_CONFIRMATION'] },
          checkInDate: { lt: checkOutDate },
          checkOutDate: { gt: checkInDate },
        },
        _sum: { roomsCount: true },
      });

      const bookedMap = new Map(
        bookedCounts.map((b) => [b.roomId, b._sum.roomsCount || 0])
      );

      roomsWithAvailability = rooms.map((room) => {
        const booked = bookedMap.get(room.id) || 0;
        const availableRooms = room.quantity - booked;
        return {
          ...room,
          availableRooms: Math.max(0, availableRooms),
          isAvailable: availableRooms > 0,
        };
      });

      // Lọc bỏ các phòng đã hết (availableRooms <= 0) nhưng vẫn giữ lại nếu muốn hiển thị "Hết phòng"
      // Không lọc ở đây — để frontend quyết định hiển thị trạng thái "Hết phòng"
    } else {
      // Nếu không có khoảng ngày, trả quantity gốc
      roomsWithAvailability = rooms.map((room) => ({
        ...room,
        availableRooms: room.quantity,
        isAvailable: true,
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        rooms: roomsWithAvailability,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/rooms/:id
 * Lấy chi tiết 1 phòng (kèm ảnh, tiện nghi, reviews)
 */
export async function getRoomById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    // Tính số phòng đang được đặt (active bookings)
    const bookedCount = await prisma.booking.aggregate({
      where: {
        roomId: id,
        status: { in: ['PENDING', 'CONFIRMED', 'AWAITING_PAYMENT', 'AWAITING_CONFIRMATION'] },
        checkOutDate: { gt: new Date() },
      },
      _sum: { roomsCount: true },
    });
    const currentBooked = bookedCount._sum.roomsCount || 0;

    if (!room) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
      return;
    }

    // Parse amenities JSON
    const amenities = room.amenities ? JSON.parse(room.amenities) : [];

    res.status(200).json({
      success: true,
      data: {
        room: {
          ...room,
          amenities,
          availableRooms: Math.max(0, (room?.quantity || 1) - currentBooked),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/rooms [Admin]
 * Tạo phòng mới
 */
export async function createRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { amenities, imageUrls, ...roomData }: CreateRoomInput = req.body;

    const room = await prisma.room.create({
      data: {
        ...roomData,
        pricePerNight: roomData.pricePerNight,
        amenities: amenities ? JSON.stringify(amenities) : null,
        images: imageUrls
          ? {
              create: imageUrls.map((url, idx) => ({
                url,
                isPrimary: idx === 0,
                order: idx,
              })),
            }
          : undefined,
      },
      include: { images: true },
    });

    res.status(201).json({
      success: true,
      message: 'Tạo phòng thành công',
      data: { room },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/rooms/:id [Admin]
 * Cập nhật thông tin phòng
 */
export async function updateRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { amenities, imageUrls, ...updateData }: UpdateRoomInput = req.body;

    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
      return;
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        ...updateData,
        ...(amenities !== undefined ? { amenities: JSON.stringify(amenities) } : {}),
        ...(imageUrls !== undefined
          ? {
              images: {
                deleteMany: {},
                create: imageUrls.map((url, idx) => ({
                  url,
                  isPrimary: idx === 0,
                  order: idx,
                })),
              },
            }
          : {}),
      },
      include: { images: true },
    });

    res.status(200).json({ success: true, message: 'Cập nhật phòng thành công', data: { room } });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/rooms/:id [Admin]
 * Xóa phòng (chỉ khi không có booking active)
 */
export async function deleteRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    // Kiểm tra có booking active không
    const activeBooking = await prisma.booking.findFirst({
      where: {
        roomId: id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (activeBooking) {
      res.status(400).json({
        success: false,
        message: 'Không thể xóa phòng đang có booking đang hoạt động',
      });
      return;
    }

    await prisma.room.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Xóa phòng thành công' });
  } catch (error) {
    next(error);
  }
}
