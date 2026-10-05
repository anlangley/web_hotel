/**
 * Chuẩn hóa URL hình ảnh
 * Nếu là ảnh upload cục bộ (chứa '/uploads/'), chuẩn hóa về đường dẫn tương đối '/uploads/filename'
 * để Vite dev proxy tự động chuyển hướng về backend (3000) mà không phụ thuộc IP máy/mạng Wi-Fi.
 */
export function normalizeImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.includes('/uploads/')) {
    const parts = url.split('/uploads/');
    const filename = parts[parts.length - 1];
    return `/uploads/${filename}`;
  }
  return url;
}
