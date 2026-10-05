const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3000/api';

async function runTests() {
  console.log('==================================================');
  console.log('🚀 LUXSTAY API QA AUTOMATED INTEGRATION TESTS');
  console.log('==================================================\n');

  let token = '';
  let testRoomId = '';
  let testBookingId = '';
  const testEmail = `qa_tester_${Math.floor(Math.random() * 100000)}@luxstay.vn`;
  const testPassword = 'Password123';

  // 1. REGISTER TEST USER
  try {
    console.log('➡️ [TEST 1] Registering a new test user...');
    const registerRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'QA Tester User',
      email: testEmail,
      phone: '0987654321',
      password: testPassword,
      confirmPassword: testPassword
    });
    console.log('✅ Register SUCCESS:', registerRes.data.message);

    // Bypass verification in DB
    console.log('   - Bypassing email verification in database...');
    await prisma.user.update({
      where: { email: testEmail },
      data: { isEmailVerified: true }
    });
    console.log('   - Email verification bypassed successfully.');
  } catch (error) {
    console.error('❌ Register FAILED:', error.response?.data || error.message);
    await prisma.$disconnect();
    process.exit(1);
  }

  // 2. LOGIN TEST USER
  try {
    console.log('\n➡️ [TEST 2] Logging in...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    token = loginRes.data.data.token;
    console.log('✅ Login SUCCESS. Token retrieved.');
  } catch (error) {
    console.error('❌ Login FAILED:', error.response?.data || error.message);
    await prisma.$disconnect();
    process.exit(1);
  }

  const client = axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${token}` }
  });

  // 3. FETCH PROFILE /STATS
  try {
    console.log('\n➡️ [TEST 3] Fetching user profile and stats...');
    const meRes = await client.get('/auth/me');
    console.log('✅ Fetch Profile SUCCESS:', meRes.data.data.user.name, `(${meRes.data.data.user.email})`);
    
    const statsRes = await client.get('/auth/profile/stats');
    console.log('✅ Fetch Stats SUCCESS:', statsRes.data.data);
  } catch (error) {
    console.error('❌ Fetch Profile/Stats FAILED:', error.response?.data || error.message);
  }

  // 4. FETCH ROOMS
  try {
    console.log('\n➡️ [TEST 4] Fetching room list...');
    const roomsRes = await client.get('/rooms');
    const rooms = roomsRes.data.data.rooms;
    console.log(`✅ Fetch Rooms SUCCESS: Found ${rooms.length} room(s).`);
    if (rooms.length > 0) {
      testRoomId = rooms[0].id;
      console.log(`📌 Selected room for testing: "${rooms[0].name}" (ID: ${testRoomId})`);
      console.log(`   - Giá/đêm: ${rooms[0].pricePerNight} VND`);
      console.log(`   - Số lượng phòng (quantity): ${rooms[0].quantity}`);
      console.log(`   - Phòng trống (availableRooms): ${rooms[0].availableRooms}`);
    } else {
      console.log('⚠️ No rooms found in database. Tests involving room bookings will be skipped.');
    }
  } catch (error) {
    console.error('❌ Fetch Rooms FAILED:', error.response?.data || error.message);
  }

  if (testRoomId) {
    // 5. FAVORITES MANAGEMENT
    try {
      console.log('\n➡️ [TEST 5] Favorites Management...');
      
      // Check if favorited (should be false)
      const checkFavRes = await client.get(`/favorites/check/${testRoomId}`);
      console.log('   - Initial Favorite check (isFavorited):', checkFavRes.data.data.isFavorited ? 'Yes' : 'No');

      // Add to favorites
      await client.post(`/favorites/${testRoomId}`);
      console.log('✅ Add Favorite SUCCESS');

      // Check again (should be true)
      const checkFavRes2 = await client.get(`/favorites/check/${testRoomId}`);
      console.log('   - Second Favorite check (isFavorited):', checkFavRes2.data.data.isFavorited ? 'Yes' : 'No');

      // List favorites
      const listFavRes = await client.get('/favorites');
      console.log('✅ Fetch My Favorites list SUCCESS, total favorited:', listFavRes.data.data.favorites.length);
    } catch (error) {
      console.error('❌ Favorites Management FAILED:', error.response?.data || error.message);
    }

    // 6. CREATE A BOOKING
    try {
      console.log('\n➡️ [TEST 6] Creating a new room booking...');
      
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 20); // 20 days from now (tránh conflict)
      const checkOutDate = new Date();
      checkOutDate.setDate(checkOutDate.getDate() + 22); // 22 days from now

      const checkInStr = checkInDate.toISOString().split('T')[0];
      const checkOutStr = checkOutDate.toISOString().split('T')[0];

      console.log(`📌 Booking dates: ${checkInStr} to ${checkOutStr}`);

      const bookingRes = await client.post('/bookings', {
        roomId: testRoomId,
        checkInDate: checkInStr,
        checkOutDate: checkOutStr,
        guestsCount: 2,
        roomsCount: 1,
        specialRequest: 'QA automated test booking',
        paymentMethod: 'VIETQR'
      });

      testBookingId = bookingRes.data.data.booking.id;
      console.log('✅ Create Booking SUCCESS:', `Booking ID: ${testBookingId}, Total Price: ${bookingRes.data.data.booking.totalPrice} VND`);
    } catch (error) {
      console.error('❌ Create Booking FAILED:', error.response?.data || error.message);
    }

    // 6b. TEST ROOM_SOLD_OUT - Đặt lại cùng ngày (quantity=1 nên phải thông báo hết phòng)
    if (testBookingId) {
      try {
        console.log('\n➡️ [TEST 6b] Kiểm tra thông báo HẾT PHÒNG...');

        const checkInDate = new Date();
        checkInDate.setDate(checkInDate.getDate() + 20);
        const checkOutDate = new Date();
        checkOutDate.setDate(checkOutDate.getDate() + 22);

        const checkInStr = checkInDate.toISOString().split('T')[0];
        const checkOutStr = checkOutDate.toISOString().split('T')[0];

        await client.post('/bookings', {
          roomId: testRoomId,
          checkInDate: checkInStr,
          checkOutDate: checkOutStr,
          guestsCount: 1,
          roomsCount: 1,
          paymentMethod: 'VIETQR'
        });
        // Nếu đến đây nghĩa là không bắn lỗi → FAIL
        console.log('❌ SOLD_OUT CHECK FAILED: Server cho phép đặt phòng khi đáng lẽ đã hết!');
      } catch (error) {
        if (error.response?.data?.code === 'ROOM_SOLD_OUT') {
          console.log('✅ SOLD_OUT CHECK PASS: Server từ chối đúng cách.');
          console.log(`   - Message: ${error.response.data.message}`);
          console.log(`   - Phòng trống: ${error.response.data.data.availableRooms}/${error.response.data.data.totalQuantity}`);
        } else {
          console.error('❌ SOLD_OUT CHECK FAILED (lỗi không mong muốn):', error.response?.data || error.message);
        }
      }
    }

    // 7. INITIATE VIETQR PAYMENT
    if (testBookingId) {
      try {
        console.log('\n➡️ [TEST 7] Initiating VietQR Payment Request...');
        const paymentRes = await client.post('/payments/vietqr/create', {
          bookingId: testBookingId
        });
        console.log('✅ Create VietQR Payment SUCCESS:');
        console.log('   - QR Code URL:', paymentRes.data.data.qrCodeUrl.slice(0, 70) + '...');
        console.log('   - Account Name:', paymentRes.data.data.accountName);
        console.log('   - Bank ID:', paymentRes.data.data.bankId);
        console.log('   - Description:', paymentRes.data.data.description);
      } catch (error) {
        console.error('❌ Initiate VietQR Payment FAILED:', error.response?.data || error.message);
      }

      // 8. CONFIRM PAYMENT
      try {
        console.log('\n➡️ [TEST 8] Confirming payment transfer request...');
        const confirmRes = await client.post('/payments/confirm', {
          bookingId: testBookingId
        });
        console.log('✅ Confirm Payment Request SUCCESS:', confirmRes.data.message);
      } catch (error) {
        console.error('❌ Confirm Payment FAILED:', error.response?.data || error.message);
      }

      // 9. CHECK PAYMENT STATUS
      try {
        console.log('\n➡️ [TEST 9] Checking updated booking/payment status...');
        const statusRes = await client.get(`/payments/status/${testBookingId}`);
        console.log('✅ Get Payment Status SUCCESS:');
        console.log('   - Booking Status:', statusRes.data.data.booking.status);
        console.log('   - Payment Status:', statusRes.data.data.booking.paymentStatus);
        console.log('   - Payment Record Status:', statusRes.data.data.booking.payment?.status);
      } catch (error) {
        console.error('❌ Get Payment Status FAILED:', error.response?.data || error.message);
      }
    }
  }

  // Cleanup test user to keep DB clean
  try {
    console.log('\n➡️ [TEST 10] Cleaning up database (removing test user)...');
    if (testBookingId) {
      await prisma.payment.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.booking.deleteMany({ where: { id: testBookingId } });
    }
    await prisma.favorite.deleteMany({ where: { user: { email: testEmail } } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
    console.log('✅ Cleanup SUCCESS.');
  } catch (error) {
    console.error('⚠️ Cleanup FAILED:', error.message);
  }

  await prisma.$disconnect();
  console.log('\n==================================================');
  console.log('🏁 QA AUTOMATED TESTS COMPLETE');
  console.log('==================================================');
}

runTests();
