/**
 * Kiểm tra xem dải ngày lưu trú (check-in -> check-out) có bất kỳ đêm nào rơi vào cuối tuần (Thứ 7 hoặc Chủ Nhật) không.
 */
export function isWeekendBooking(checkInDate: Date | string, checkOutDate: Date | string): boolean {
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const current = new Date(start);
  while (current < end) {
    const day = current.getDay(); // 0: Chủ Nhật, 6: Thứ Bảy
    if (day === 0 || day === 6) {
      return true;
    }
    current.setDate(current.getDate() + 1);
  }
  return false;
}
