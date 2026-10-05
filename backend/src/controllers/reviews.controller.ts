import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';

// ══════════════════════════════════════════════
// REVIEWS CONTROLLER
// ══════════════════════════════════════════════

const createReviewSchema = z.object({
  roomId: z.string().uuid('ID phòng không hợp lệ'),
  rating: z
    .number()
    .int()
    .min(1, 'Điểm đánh giá tối thiểu là 1')
    .max(5, 'Điểm đánh giá tối đa là 5'),
  comment: z
    .string()
    .min(10, 'Nhận xét cần ít nhất 10 ký tự')
    .max(1000, 'Nhận xét không được quá 1000 ký tự'),
});

/**
 * GET /api/reviews/:roomId
 * Lấy danh sách đánh giá của một phòng
 */
export async function getRoomReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { roomId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      prisma.review.count({ where: { roomId } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/reviews
 * Tạo đánh giá mới — chỉ user đã sử dụng phòng (booking status COMPLETED)
 */
export async function createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const parsed = createReviewSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: parsed.error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
      return;
    }

    const { roomId, rating, comment } = parsed.data;

    // Kiểm tra user đã thực sự ở phòng này
    const completedBooking = await prisma.booking.findFirst({
      where: { userId, roomId, status: 'COMPLETED' },
    });

    if (!completedBooking) {
      res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể đánh giá phòng đã sử dụng dịch vụ',
      });
      return;
    }

    // Kiểm tra đã review chưa
    const existing = await prisma.review.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: 'Bạn đã đánh giá phòng này rồi',
      });
      return;
    }

    // Tạo review và cập nhật avgRating của Room
    const [review] = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: { userId, roomId, rating, comment },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      });

      // Tính lại avgRating
      const stats = await tx.review.aggregate({
        where: { roomId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.room.update({
        where: { id: roomId },
        data: {
          avgRating: stats._avg.rating ?? 0,
          reviewCount: stats._count.rating,
        },
      });

      return [newReview];
    });

    res.status(201).json({
      success: true,
      message: 'Cảm ơn bạn đã đánh giá!',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/reviews/:id
 * Sửa đánh giá (chỉ user chủ của đánh giá mới được sửa)
 */
export async function updateReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    // Zod schema for update (only rating and comment are updatable)
    const updateSchema = z.object({
      rating: z.number().int().min(1).max(5),
      comment: z.string().min(10).max(1000),
    });

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: parsed.error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
      return;
    }

    const { rating, comment } = parsed.data;

    // Verify ownership
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
      return;
    }
    
    if (existing.userId !== userId) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền sửa đánh giá này' });
      return;
    }

    // Update and recalculate
    const [updatedReview] = await prisma.$transaction(async (tx) => {
      const review = await tx.review.update({
        where: { id },
        data: { rating, comment },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      });

      const stats = await tx.review.aggregate({
        where: { roomId: existing.roomId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.room.update({
        where: { id: existing.roomId },
        data: {
          avgRating: stats._avg.rating ?? 0,
          reviewCount: stats._count.rating,
        },
      });

      return [review];
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật đánh giá thành công',
      data: { review: updatedReview },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/reviews/:id
 * Xóa đánh giá
 */
export async function deleteReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
      return;
    }
    
    if (existing.userId !== userId) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền xóa đánh giá này' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });

      const stats = await tx.review.aggregate({
        where: { roomId: existing.roomId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.room.update({
        where: { id: existing.roomId },
        data: {
          avgRating: stats._avg.rating ?? 0,
          reviewCount: stats._count.rating,
        },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Đã xóa đánh giá',
    });
  } catch (error) {
    next(error);
  }
}


/**
 * GET /api/reviews/:roomId/me
 * Lấy đánh giá của user hiện tại cho phòng
 */
export async function getMyReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roomId } = req.params;
    const userId = req.user!.userId;

    const review = await prisma.review.findFirst({
      where: { roomId, userId },
    });

    res.status(200).json({
      success: true,
      data: { review },
    });
  } catch (error) {
    next(error);
  }
}
