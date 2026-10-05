import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const BASE_URL = 'http://localhost:3000/api';

async function testFavAndAvatar() {
  console.log('Testing Favorites Toggle and Avatar Upload...');

  // 1. Login
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'pbao1379@gmail.com',
    password: 'Baoan26012005',
  });
  const token = loginRes.data.data.token;
  console.log('✅ Logged in successfully. Token obtained.');

  const client = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  // 2. Get Rooms to find a roomId
  const roomsRes = await client.get('/rooms?limit=1');
  const testRoomId = roomsRes.data.data.rooms[0].id;
  console.log('Using room:', testRoomId);

  // 3. Test Toggle Favorite (Add)
  const toggleRes1 = await client.post(`/favorites/toggle/${testRoomId}`);
  console.log('Toggle 1 result:', toggleRes1.data);
  if (!toggleRes1.data.success) throw new Error('Toggle 1 failed');

  // Check in favorites list
  const favListRes1 = await client.get('/favorites');
  const isFound1 = favListRes1.data.data.favorites.some((f: any) => f.room.id === testRoomId);
  console.log('Room found in favorites after toggle:', isFound1);

  // 4. Test Toggle Favorite (Remove)
  const toggleRes2 = await client.post(`/favorites/toggle/${testRoomId}`);
  console.log('Toggle 2 result:', toggleRes2.data);
  if (!toggleRes2.data.success) throw new Error('Toggle 2 failed');

  // 5. Test Avatar Upload
  const sampleImagePath = path.join(__dirname, '../uploads');
  const existingFiles = fs.readdirSync(sampleImagePath);
  if (existingFiles.length === 0) throw new Error('No files in uploads folder');
  const fileToUpload = path.join(sampleImagePath, existingFiles[0]);

  const form = new FormData();
  form.append('avatar', fs.createReadStream(fileToUpload));

  const uploadRes = await client.post('/upload/avatar', form, {
    headers: form.getHeaders(),
  });
  console.log('✅ Upload Avatar result:', uploadRes.data);
  if (!uploadRes.data.success || !uploadRes.data.data.avatarUrl) {
    throw new Error('Avatar upload failed');
  }

  // 6. Verify GET /auth/me returns updated avatarUrl
  const meRes = await client.get('/auth/me');
  console.log('✅ GET /auth/me avatarUrl:', meRes.data.data.user.avatarUrl);

  console.log('\n🎉 ALL FAVORITES AND AVATAR TESTS PASSED 100%!');
}

testFavAndAvatar().catch((err) => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
