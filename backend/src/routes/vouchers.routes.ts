import { Router } from 'express';
import {
  createVoucher,
  getAllVouchers,
  updateVoucher,
  deleteVoucher,
  applyVoucher,
} from '../controllers/vouchers.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// ── KHÁCH HÀNG / USER ENDPOINTS ──────────────────
// Áp dụng voucher khi đặt phòng
router.post('/apply', authenticate, applyVoucher);

// ── QUẢN TRỊ VIÊN / ADMIN ENDPOINTS ──────────────
// Quản lý vouchers
router.use(authenticate, requireAdmin);

router.post('/', createVoucher);
router.get('/', getAllVouchers);
router.put('/:id', updateVoucher);
router.delete('/:id', deleteVoucher);

export default router;
