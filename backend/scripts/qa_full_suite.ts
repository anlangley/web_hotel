import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000/api';

interface TestResult {
  suite: string;
  name: string;
  status: 'PASS' | 'FAIL';
  durationMs: number;
  details?: any;
  error?: string;
}

const results: TestResult[] = [];

async function recordTest(suite: string, name: string, fn: () => Promise<any>) {
  const start = Date.now();
  try {
    const res = await fn();
    const durationMs = Date.now() - start;
    results.push({ suite, name, status: 'PASS', durationMs, details: res });
    console.log(`  ✅ [PASS] ${suite} -> ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    const msg = err.response?.data?.message || err.response?.data || err.message;
    results.push({ suite, name, status: 'FAIL', durationMs, error: typeof msg === 'object' ? JSON.stringify(msg) : msg });
    console.log(`  ❌ [FAIL] ${suite} -> ${name} (${durationMs}ms) - Error:`, msg);
  }
}

async function runQaBackendSuite() {
  console.log('========================================================');
  console.log('🔍 SENIOR QA AUTOMATED BACKEND INTEGRATION & LOGIC SUITE');
  console.log('Account Under Test: pbao1379@gmail.com | Role: ADMIN');
  console.log('Target API: ' + BASE_URL);
  console.log('========================================================\n');

  let adminToken = '';
  let userToken = '';
  let testRoomId = '';
  let testBookingId = '';
  let createdVoucherId = '';

  // ────────────────────────────────────────────────────────
  // SUITE 1: AUTHENTICATION & ACCESS CONTROL
  // ────────────────────────────────────────────────────────
  console.log('📦 SUITE 1: Authentication & Access Control');

  await recordTest('AUTH', 'TC-AUTH-01: Login with invalid password returns 401', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'pbao1379@gmail.com',
        password: 'WrongPassword999',
      });
      throw new Error('Expected 401 but request succeeded');
    } catch (err: any) {
      if (err.response?.status === 401) {
        return { status: 401, message: err.response.data.message };
      }
      throw err;
    }
  });

  await recordTest('AUTH', 'TC-AUTH-02: Login with non-existent email returns 401', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'nonexistent_qa_user_404@example.com',
        password: 'SomePassword123',
      });
      throw new Error('Expected 401 but request succeeded');
    } catch (err: any) {
      if (err.response?.status === 401) {
        return { status: 401, message: err.response.data.message };
      }
      throw err;
    }
  });

  await recordTest('AUTH', 'TC-AUTH-03: Login with pbao1379@gmail.com / Baoan26012005 returns 200 & ADMIN role', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'pbao1379@gmail.com',
      password: 'Baoan26012005',
    });
    if (!res.data.success || !res.data.data.token) {
      throw new Error('Failed to retrieve token');
    }
    if (res.data.data.user.role !== 'ADMIN') {
      throw new Error(`Expected ADMIN role, got: ${res.data.data.user.role}`);
    }
    adminToken = res.data.data.token;
    return { tokenPrefix: adminToken.substring(0, 15) + '...', user: res.data.data.user };
  });

  const adminClient = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  await recordTest('AUTH', 'TC-AUTH-04: GET /auth/me returns valid admin profile', async () => {
    const res = await adminClient.get('/auth/me');
    if (res.data.data.user.email !== 'pbao1379@gmail.com') {
      throw new Error('Email mismatch in /auth/me');
    }
    return res.data.data.user;
  });

  await recordTest('AUTH', 'TC-AUTH-05: GET /auth/profile/stats returns profile metrics', async () => {
    const res = await adminClient.get('/auth/profile/stats');
    if (typeof res.data.data.totalBookings !== 'number') {
      throw new Error('Invalid profile stats format');
    }
    return res.data.data;
  });

  await recordTest('AUTH', 'TC-AUTH-06: Access protected endpoint without token returns 401', async () => {
    try {
      await axios.get(`${BASE_URL}/auth/me`);
      throw new Error('Expected 401');
    } catch (err: any) {
      if (err.response?.status === 401) return { status: 401 };
      throw err;
    }
  });

  await recordTest('AUTH', 'TC-AUTH-07: Access protected endpoint with invalid token returns 401', async () => {
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: 'Bearer this_is_an_invalid_token' },
      });
      throw new Error('Expected 401');
    } catch (err: any) {
      if (err.response?.status === 401) return { status: 401 };
      throw err;
    }
  });

  // ────────────────────────────────────────────────────────
  // SUITE 2: RBAC (ROLE-BASED ACCESS CONTROL)
  // ────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 2: RBAC (Role-Based Access Control)');

  await recordTest('RBAC', 'TC-RBAC-01: Admin can access /api/admin/stats', async () => {
    const res = await adminClient.get('/admin/stats');
    if (!res.data.success) throw new Error('Admin stats failed');
    return res.data.data;
  });

  await recordTest('RBAC', 'TC-RBAC-02: Normal USER is forbidden (403) from /api/admin/stats', async () => {
    const testNormalUser = await prisma.user.findFirst({
      where: { role: 'USER', isEmailVerified: true },
    });
    if (!testNormalUser) throw new Error('No verified normal user found in DB');

    const { signToken } = require('../src/middlewares/auth.middleware');
    userToken = signToken({
      userId: testNormalUser.id,
      email: testNormalUser.email,
      role: 'USER',
    });

    try {
      await axios.get(`${BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      throw new Error('Expected 403 Forbidden for normal user accessing admin');
    } catch (err: any) {
      if (err.response?.status === 403) {
        return { status: 403, message: err.response.data.message };
      }
      throw err;
    }
  });

  // ────────────────────────────────────────────────────────
  // SUITE 3: ROOMS CATALOG & SEARCH LOGIC
  // ────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 3: Rooms Catalog & Search Logic');

  await recordTest('ROOMS', 'TC-ROOM-01: GET /rooms returns room list with pagination', async () => {
    const res = await axios.get(`${BASE_URL}/rooms?page=1&limit=5`);
    if (!res.data.success || !Array.isArray(res.data.data.rooms)) {
      throw new Error('Invalid rooms response structure');
    }
    testRoomId = res.data.data.rooms[0].id;
    return {
      total: res.data.data.pagination.total,
      retrieved: res.data.data.rooms.length,
      sampleRoom: res.data.data.rooms[0].name,
    };
  });

  await recordTest('ROOMS', 'TC-ROOM-02: GET /rooms with check-in & check-out calculates availability', async () => {
    const res = await axios.get(`${BASE_URL}/rooms?checkIn=2026-11-01&checkOut=2026-11-05`);
    const room = res.data.data.rooms[0];
    if (typeof room.availableRooms !== 'number') {
      throw new Error('availableRooms field missing with date filter');
    }
    return {
      roomName: room.name,
      quantity: room.quantity,
      availableRooms: room.availableRooms,
      isAvailable: room.isAvailable,
    };
  });

  await recordTest('ROOMS', 'TC-ROOM-03: GET /rooms/:id returns room details with parsed amenities', async () => {
    const res = await axios.get(`${BASE_URL}/rooms/${testRoomId}`);
    if (!res.data.success || !res.data.data.room) {
      throw new Error('Room detail fetch failed');
    }
    const r = res.data.data.room;
    if (!Array.isArray(r.amenities)) {
      throw new Error('Amenities should be parsed as array');
    }
    return {
      name: r.name,
      type: r.type,
      pricePerNight: r.pricePerNight,
      amenitiesCount: r.amenities.length,
    };
  });

  await recordTest('ROOMS', 'TC-ROOM-04: GET /rooms/:id with non-existent UUID returns 404', async () => {
    try {
      await axios.get(`${BASE_URL}/rooms/00000000-0000-0000-0000-000000000000`);
      throw new Error('Expected 404');
    } catch (err: any) {
      if (err.response?.status === 404) return { status: 404, message: err.response.data.message };
      throw err;
    }
  });

  // ────────────────────────────────────────────────────────
  // SUITE 4: BOOKING BUSINESS LOGIC & VALIDATION
  // ────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 4: Booking Engine & Business Logic');

  await recordTest('BOOKING', 'TC-BOOK-01: Create booking with checkOut <= checkIn is rejected (400)', async () => {
    try {
      await adminClient.post('/bookings', {
        roomId: testRoomId,
        checkInDate: '2026-11-10',
        checkOutDate: '2026-11-09',
        guestsCount: 2,
        roomsCount: 1,
      });
      throw new Error('Expected validation error for invalid date order');
    } catch (err: any) {
      if (err.response?.status === 400) return { status: 400, errors: err.response.data.errors };
      throw err;
    }
  });

  await recordTest('BOOKING', 'TC-BOOK-02: Create booking with expired voucher is rejected (400)', async () => {
    try {
      await adminClient.post('/bookings', {
        roomId: testRoomId,
        checkInDate: '2026-11-10',
        checkOutDate: '2026-11-12',
        guestsCount: 2,
        roomsCount: 1,
        voucherCode: 'SUMMER24', // Expired June 2026
      });
      throw new Error('Expected 400 for expired voucher');
    } catch (err: any) {
      if (err.response?.status === 400) return { status: 400, message: err.response.data.message };
      throw err;
    }
  });

  await recordTest('BOOKING', 'TC-BOOK-03: Create booking with excessive roomsCount (> quantity) is rejected (409)', async () => {
    // Pick room with quantity 1
    const singleRoom = await prisma.room.findFirst({ where: { quantity: 1 } }) || { id: testRoomId, quantity: 1 };
    
    // We book all available
    try {
      // Attempting to book with roomsCount = 5 when only 1 is available
      await adminClient.post('/bookings', {
        roomId: singleRoom.id,
        checkInDate: '2026-11-15',
        checkOutDate: '2026-11-17',
        guestsCount: 2,
        roomsCount: 5,
      });
      throw new Error('Expected 409 Conflict for insufficient room quantity');
    } catch (err: any) {
      if (err.response?.status === 409) return { status: 409, message: err.response.data.message };
      throw err;
    }
  });

  await recordTest('BOOKING', 'TC-BOOK-04: Create valid booking & verify financial calculations', async () => {
    // Generate random future dates to prevent collision with previously created bookings
    const randomOffsetDays = 60 + Math.floor(Math.random() * 100);
    const d1 = new Date(Date.now() + randomOffsetDays * 86400000);
    const d2 = new Date(Date.now() + (randomOffsetDays + 2) * 86400000);
    const checkIn = d1.toISOString().split('T')[0];
    const checkOut = d2.toISOString().split('T')[0];
    const roomsCount = 1;

    // Room info
    const room = await prisma.room.findUnique({ where: { id: testRoomId } });
    const pricePerNight = Number(room!.pricePerNight);
    const expectedSubtotal = pricePerNight * 2 * roomsCount;
    const expectedTax = expectedSubtotal * 0.10;
    const expectedTotal = expectedSubtotal + expectedTax;

    const res = await adminClient.post('/bookings', {
      roomId: testRoomId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      guestsCount: 2,
      roomsCount,
      specialRequest: 'QA Automated Test Booking - High Floor please',
      paymentMethod: 'VIETQR',
      useWeekendDiscount: false,
    });

    if (!res.data.success || !res.data.data.booking) {
      throw new Error('Booking creation failed: ' + JSON.stringify(res.data));
    }

    const b = res.data.data.booking;
    testBookingId = b.id;

    if (b.nightCount !== 2) throw new Error(`Expected 2 nights, got ${b.nightCount}`);
    if (Math.abs(Number(b.subtotal) - expectedSubtotal) > 0.01) {
      throw new Error(`Subtotal mismatch: expected ${expectedSubtotal}, got ${b.subtotal}`);
    }
    if (Math.abs(Number(b.taxAmount) - expectedTax) > 0.01) {
      throw new Error(`Tax mismatch: expected ${expectedTax}, got ${b.taxAmount}`);
    }
    if (Math.abs(Number(b.totalPrice) - expectedTotal) > 0.01) {
      throw new Error(`Total mismatch: expected ${expectedTotal}, got ${b.totalPrice}`);
    }

    return {
      bookingId: b.id,
      nights: b.nightCount,
      subtotal: b.subtotal,
      tax: b.taxAmount,
      totalPrice: b.totalPrice,
      status: b.status,
    };
  });

  await recordTest('BOOKING', 'TC-BOOK-05: GET /bookings/my-bookings returns user bookings', async () => {
    const res = await adminClient.get('/bookings/my-bookings');
    if (!res.data.success || !Array.isArray(res.data.data.bookings)) {
      throw new Error('Failed to retrieve my bookings');
    }
    const found = res.data.data.bookings.some((b: any) => b.id === testBookingId);
    if (!found) throw new Error('Newly created booking not found in my-bookings');
    return { count: res.data.data.bookings.length, foundBooking: true };
  });

  await recordTest('BOOKING', 'TC-BOOK-06: PUT /bookings/:id/cancel cancels active booking', async () => {
    const res = await adminClient.put(`/bookings/${testBookingId}/cancel`);
    if (!res.data.success) throw new Error('Cancel booking failed');
    const updated = await prisma.booking.findUnique({ where: { id: testBookingId } });
    if (updated?.status !== 'CANCELLED') {
      throw new Error(`Expected status CANCELLED, got: ${updated?.status}`);
    }
    return { status: updated?.status, message: res.data.message };
  });

  // ────────────────────────────────────────────────────────
  // SUITE 5: FAVORITES ENGINE
  // ────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 5: Favorites Engine');

  await recordTest('FAVORITES', 'TC-FAV-01: Add room to favorites', async () => {
    const res = await adminClient.post(`/favorites/${testRoomId}`);
    return res.data;
  });

  await recordTest('FAVORITES', 'TC-FAV-02: Check favorite status returns true', async () => {
    const res = await adminClient.get(`/favorites/check/${testRoomId}`);
    if (res.data.data.isFavorited !== true) throw new Error('Expected isFavorited to be true');
    return res.data.data;
  });

  await recordTest('FAVORITES', 'TC-FAV-03: GET /favorites contains favorited room', async () => {
    const res = await adminClient.get('/favorites');
    const hasFav = res.data.data.favorites.some((f: any) => f.roomId === testRoomId);
    if (!hasFav) throw new Error('Favorited room not in favorites list');
    return { count: res.data.data.favorites.length, hasFav };
  });

  await recordTest('FAVORITES', 'TC-FAV-04: Remove room from favorites', async () => {
    const res = await adminClient.delete(`/favorites/${testRoomId}`);
    return res.data;
  });

  await recordTest('FAVORITES', 'TC-FAV-05: Check favorite status returns false after removal', async () => {
    const res = await adminClient.get(`/favorites/check/${testRoomId}`);
    if (res.data.data.isFavorited !== false) throw new Error('Expected isFavorited to be false');
    return res.data.data;
  });

  // ────────────────────────────────────────────────────────
  // SUITE 6: NOTIFICATIONS ENGINE
  // ────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 6: Notifications Engine');

  await recordTest('NOTIFICATIONS', 'TC-NOTIF-01: GET /notifications returns notification list', async () => {
    const res = await adminClient.get('/notifications');
    if (!res.data.success || !Array.isArray(res.data.data.notifications)) {
      throw new Error('Invalid notifications response');
    }
    return { total: res.data.data.pagination.total, count: res.data.data.notifications.length };
  });

  await recordTest('NOTIFICATIONS', 'TC-NOTIF-02: Mark all notifications as read', async () => {
    const res = await adminClient.patch('/notifications/read-all');
    const unread = await adminClient.get('/notifications/unread-count');
    if (unread.data.data.count !== 0) {
      throw new Error(`Expected 0 unread notifications, got ${unread.data.data.count}`);
    }
    return { message: res.data.message, unreadCount: 0 };
  });

  // ────────────────────────────────────────────────────────
  // SUITE 7: VOUCHER CREATION & APPLICATION RULES
  // ────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 7: Voucher Engine');

  await recordTest('VOUCHER', 'TC-VOUCH-01: Admin creates new valid voucher (20% off) at POST /vouchers', async () => {
    const code = `QA${Date.now().toString().slice(-4)}`;

    const res = await adminClient.post('/vouchers', {
      code,
      discount: 0.20,
      startDate: '2026-10-01',
      endDate: '2026-12-31',
      isActive: true,
    });

    if (!res.data.success || !res.data.data.voucher) {
      throw new Error('Voucher creation failed: ' + JSON.stringify(res.data));
    }
    createdVoucherId = res.data.data.voucher.id;
    return { voucherId: createdVoucherId, code, discount: res.data.data.voucher.discount };
  });

  await recordTest('VOUCHER', 'TC-VOUCH-02: User applies newly created active voucher via POST /vouchers/apply', async () => {
    const voucher = await prisma.voucher.findUnique({ where: { id: createdVoucherId } });
    const res = await adminClient.post('/vouchers/apply', {
      code: voucher!.code,
      checkInDate: '2026-11-20',
      checkOutDate: '2026-11-22',
    });
    if (!res.data.success || Number(res.data.data.discount) !== 0.20) {
      throw new Error('Voucher application failed or discount mismatch');
    }
    return res.data;
  });

  await recordTest('VOUCHER', 'TC-VOUCH-03: Admin deletes test voucher via DELETE /vouchers/:id', async () => {
    const res = await adminClient.delete(`/vouchers/${createdVoucherId}`);
    return res.data;
  });

  // ────────────────────────────────────────────────────────
  // SUITE 8: ADMIN OPERATIONS
  // ────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 8: Admin Management Operations');

  await recordTest('ADMIN', 'TC-ADM-01: GET /admin/users returns paginated user list', async () => {
    const res = await adminClient.get('/admin/users?page=1&limit=5');
    if (!res.data.success || !Array.isArray(res.data.data.users)) {
      throw new Error('Failed to retrieve user list');
    }
    return {
      total: res.data.data.pagination.total,
      usersCount: res.data.data.users.length,
      firstUser: res.data.data.users[0].email,
    };
  });

  await recordTest('ADMIN', 'TC-ADM-02: GET /bookings (Admin all bookings) returns full list', async () => {
    const res = await adminClient.get('/bookings?page=1&limit=5');
    if (!res.data.success || !Array.isArray(res.data.data.bookings)) {
      throw new Error('Admin get all bookings failed');
    }
    return {
      total: res.data.data.pagination.total,
      bookingsCount: res.data.data.bookings.length,
    };
  });

  await recordTest('ADMIN', 'TC-ADM-03: Prevent admin from demoting own role', async () => {
    const myId = (await adminClient.get('/auth/me')).data.data.user.id;
    try {
      await adminClient.patch(`/admin/users/${myId}/role`, { role: 'USER' });
      throw new Error('Expected 400 when admin attempts self-demotion');
    } catch (err: any) {
      if (err.response?.status === 400) return { status: 400, message: err.response.data.message };
      throw err;
    }
  });

  // ────────────────────────────────────────────────────────
  // SUITE 9: REVIEWS INTEGRITY
  // ────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 9: Reviews Integrity');

  await recordTest('REVIEWS', 'TC-REV-01: User cannot review without COMPLETED booking (403)', async () => {
    const anotherRoom = await prisma.room.findFirst({
      where: { id: { not: testRoomId } },
    });
    try {
      await adminClient.post('/reviews', {
        roomId: anotherRoom!.id,
        rating: 5,
        comment: 'Phòng rất đẹp và sạch sẽ, tôi rất thích!',
      });
      throw new Error('Expected 403 when reviewing without completed stay');
    } catch (err: any) {
      if (err.response?.status === 403) return { status: 403, message: err.response.data.message };
      throw err;
    }
  });

  // ────────────────────────────────────────────────────────
  // SUMMARY REPORT
  // ────────────────────────────────────────────────────────
  console.log('\n========================================================');
  console.log('📊 TEST EXECUTION SUMMARY:');
  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('========================================================\n');

  await prisma.$disconnect();
  return { total, passed, failed, results };
}

runQaBackendSuite()
  .then((res) => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('FATAL TEST RUNNER ERROR:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
