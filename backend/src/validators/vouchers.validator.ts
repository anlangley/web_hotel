import { z } from 'zod';

export const createVoucherSchema = z.object({
  code: z
    .string({ message: 'Mã voucher là bắt buộc' })
    .min(3, 'Mã voucher phải có ít nhất 3 ký tự')
    .max(50, 'Mã voucher không được quá 50 ký tự')
    .toUpperCase(),
  discount: z
    .number({ message: 'Mức giảm giá là bắt buộc' })
    .min(0.01, 'Mức giảm giá tối thiểu là 1% (0.01)')
    .max(0.90, 'Mức giảm giá tối đa là 90% (0.90)'),
  startDate: z
    .string({ message: 'Ngày bắt đầu là bắt buộc' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu phải có định dạng YYYY-MM-DD'),
  endDate: z
    .string({ message: 'Ngày kết thúc là bắt buộc' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày kết thúc phải có định dạng YYYY-MM-DD'),
  isActive: z.boolean().optional().default(true),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  },
  {
    message: 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu',
    path: ['endDate'],
  }
);

export const applyVoucherSchema = z.object({
  code: z.string({ message: 'Mã voucher là bắt buộc' }).trim().toUpperCase(),
  checkInDate: z
    .string({ message: 'Ngày nhận phòng là bắt buộc' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày nhận phòng phải là YYYY-MM-DD'),
  checkOutDate: z
    .string({ message: 'Ngày trả phòng là bắt buộc' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày trả phòng phải là YYYY-MM-DD'),
});

export type CreateVoucherInput = z.infer<typeof createVoucherSchema>;
export type ApplyVoucherInput = z.infer<typeof applyVoucherSchema>;
