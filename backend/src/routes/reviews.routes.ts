import { Router } from 'express';
import { getRoomReviews, createReview, updateReview, deleteReview, getMyReview } from '../controllers/reviews.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:roomId/me', authenticate, getMyReview);
router.get('/:roomId',    getRoomReviews);
router.post('/', authenticate, createReview);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
