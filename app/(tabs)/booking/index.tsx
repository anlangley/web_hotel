import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppColors, Shadows, Radius, Spacing, Gradients } from '../../../constants/theme';
import { apiClient } from '../../../services/api';

// Cấu hình ngôn ngữ tiếng Việt cho Lịch
LocaleConfig.locales['vi'] = {
  monthNames: ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'],
  monthNamesShort: ['Th.1','Th.2','Th.3','Th.4','Th.5','Th.6','Th.7','Th.8','Th.9','Th.10','Th.11','Th.12'],
  dayNames: ['Chủ Nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'],
  dayNamesShort: ['CN','T2','T3','T4','T5','T6','T7'],
  today: 'Hôm nay'
};
LocaleConfig.defaultLocale = 'vi';

export default function BookingForm() {
  const { roomId, discount } = useLocalSearchParams<{ roomId: string; discount?: string }>();
  const router = useRouter();
  
  const [room, setRoom] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State quản lý dải ngày
  const [startDate, setStartDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });

  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [specialRequest, setSpecialRequest] = useState('');

  // Voucher states
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [useWeekendDiscount, setUseWeekendDiscount] = useState(true);

  useEffect(() => {
    if (roomId) {
      fetchRoomInfo();
    } else {
      setIsLoading(false);
    }
  }, [roomId]);

  const fetchRoomInfo = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/rooms/${roomId}`);
      if (response.data?.success) {
        setRoom(response.data.data.room);
      }
    } catch (error) {
      console.error('Error fetching room info for booking:', error);
      Alert.alert('Lỗi', 'Không thể lấy thông tin phòng. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã giảm giá.');
      return;
    }
    
    if (!startDate || !endDate) {
      Alert.alert('Thông báo', 'Vui lòng chọn ngày nhận/trả phòng trước khi áp dụng voucher.');
      return;
    }

    try {
      setIsApplyingVoucher(true);
      const res = await apiClient.post('/vouchers/apply', {
        code: voucherCodeInput.trim().toUpperCase(),
        checkInDate: startDate,
        checkOutDate: endDate,
      });

      if (res.data?.success) {
        const { code: resCode, discount: resDiscount } = res.data.data;
        setAppliedVoucher({ code: resCode, discount: Number(resDiscount) });
        Alert.alert('Thành công', res.data.message);
      }
    } catch (error: any) {
      console.error('Apply voucher error:', error);
      const errMsg = error.response?.data?.message || 'Không thể áp dụng mã giảm giá này.';
      Alert.alert('Lỗi', errMsg);
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput('');
    Alert.alert('Thông báo', 'Đã gỡ mã giảm giá.');
  };

  const handleBooking = async () => {
    try {
      setIsSubmitting(true);
      
      const finalRoomId = roomId || room?.id;
      if (!finalRoomId) {
        Alert.alert('Lỗi', 'Thiếu mã phòng.');
        setIsSubmitting(false);
        return;
      }

      if (!startDate || !endDate) {
        Alert.alert('Lỗi', 'Vui lòng chọn cả ngày nhận và ngày trả phòng.');
        setIsSubmitting(false);
        return;
      }

      const bookingData = {
        roomId: finalRoomId,
        checkInDate: startDate,
        checkOutDate: endDate,
        guestsCount: guests,
        roomsCount: rooms,
        specialRequest,
        paymentMethod: 'VIETQR',
        roomName: room?.name,
        nightCount: nights,
        totalPrice: total,
        discount: currentDiscount || undefined,
        voucherCode: (!useWeekendDiscount && appliedVoucher) ? appliedVoucher.code : undefined,
        useWeekendDiscount: isWeekendStay && useWeekendDiscount,
      };

      console.log('[Booking Data Prepared]:', JSON.stringify(bookingData, null, 2));

      router.push({
        pathname: '/(tabs)/booking/payment',
        params: { bookingData: JSON.stringify(bookingData) }
      });
    } catch (error: any) {
      console.error('Booking step failed:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi chuẩn bị thông tin đặt phòng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDayPress = (day: any) => {
    const dateString = day.dateString;

    if (!startDate || (startDate && endDate)) {
      // Bắt đầu chọn dải mới
      setStartDate(dateString);
      setEndDate(null);
    } else if (startDate && !endDate) {
      // Đã có start, giờ chọn end
      if (dateString > startDate) {
        setEndDate(dateString);
      } else {
        // Nếu chọn ngày trước start, gán lại làm start mới
        setStartDate(dateString);
      }
    }
  };

  // Tính toán các ngày được đánh dấu trên lịch
  const getMarkedDates = () => {
    const marked: any = {};
    const today = new Date().toISOString().split('T')[0];
    
    // Đánh dấu ngày hôm nay
    marked[today] = { textColor: AppColors.primary, fontWeight: 'bold' };

    if (startDate) {
      marked[startDate] = {
        startingDay: true,
        color: AppColors.primary,
        textColor: '#fff',
        selected: true,
      };
    }

    if (endDate) {
      marked[endDate] = {
        endingDay: true,
        color: AppColors.primary,
        textColor: '#fff',
        selected: true,
      };

      // Tô màu các ngày ở giữa
      let start = new Date(startDate!);
      let end = new Date(endDate);
      let curr = new Date(start);
      curr.setDate(curr.getDate() + 1);

      while (curr < end) {
        const iso = curr.toISOString().split('T')[0];
        marked[iso] = {
          color: AppColors.primary + '20',
          textColor: AppColors.primary,
          selected: true,
        };
        curr.setDate(curr.getDate() + 1);
      }
    }

    return marked;
  };

  // Tính số đêm dựa trên chuỗi ngày YYYY-MM-DD
  const nights = React.useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [startDate, endDate]);

  // Kiểm tra dải ngày lưu trú có ngày cuối tuần không (Thứ 7 / Chủ Nhật)
  const isWeekendStay = React.useMemo(() => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    
    const current = new Date(start);
    while (current < end) {
      const day = current.getDay(); // 0: Chủ Nhật, 6: Thứ Bảy
      if (day === 0 || day === 6) {
        return true;
      }
      current.setDate(current.getDate() + 1);
    }
    return false;
  }, [startDate, endDate]);

  // Tự động cập nhật chế độ giảm giá mặc định khi thay đổi ngày
  useEffect(() => {
    if (isWeekendStay) {
      setUseWeekendDiscount(true);
    } else {
      setUseWeekendDiscount(false);
    }
  }, [isWeekendStay]);

  const roomPrice = room ? Number(room.pricePerNight) : 0;
  const rawSubtotal = roomPrice * nights * rooms;
  
  // Xác định mức giảm giá (Khách chọn 1 trong 2 nếu là cuối tuần)
  const currentDiscount = (isWeekendStay && useWeekendDiscount) 
    ? 0.30 
    : (appliedVoucher ? appliedVoucher.discount : 0);
  const discountAmount = rawSubtotal * currentDiscount;
  const subtotal = rawSubtotal - discountAmount;
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const formatCurrency = (n: number) => Math.round(n || 0).toLocaleString('vi-VN');

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  if (!roomId && !isLoading) {
    return (
      <View style={styles.noRoomContainer}>
        {/* Header */}
        <LinearGradient colors={Gradients.primary as [string, string]} style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Đặt Phòng</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.noRoomContent}>
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: AppColors.primary + '10', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <Ionicons name="calendar" size={60} color={AppColors.primary} />
          </View>
          <Text style={styles.noRoomTitle}>Bạn chưa chọn phòng lưu trú</Text>
          <Text style={styles.noRoomDesc}>
            Vui lòng khám phá các phòng trống tuyệt đẹp của LuxStay và chọn phòng phù hợp trước khi tiến hành đặt phòng nhé!
          </Text>
          <TouchableOpacity
            style={styles.selectRoomBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/rooms')}
          >
            <LinearGradient
              colors={Gradients.button as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.selectRoomGradient}
            >
              <Ionicons name="search" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.selectRoomBtnText}>Khám phá phòng ngay</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={Gradients.primary as [string, string]} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đặt Phòng</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        {/* Room Summary Card */}
        <View style={styles.roomSummary}>
          <Image 
            source={room?.images?.[0]?.url ? { uri: room.images[0].url } : require('../../../assets/images/room1.jpg')} 
            style={styles.roomImage} 
          />
          <View style={styles.roomInfo}>
            <Text style={styles.roomName}>{room?.name || 'Đang tải...'}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={AppColors.textSecondary} />
              <Text style={styles.locationText}>{room?.location}</Text>
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={AppColors.star} />
              <Text style={styles.ratingText}>{room?.avgRating} ({room?.reviewCount} đánh giá)</Text>
            </View>
          </View>
        </View>

        {/* Date Selection - New Calendar View */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Chọn ngày lưu trú</Text>
            <View style={styles.nightBadge}>
              <Text style={styles.nightBadgeText}>{nights} đêm</Text>
            </View>
          </View>
          
          <View style={styles.calendarContainer}>
            <Calendar
              markingType={'period'}
              markedDates={getMarkedDates()}
              onDayPress={onDayPress}
              minDate={new Date().toISOString().split('T')[0]}
              theme={{
                calendarBackground: '#fff',
                textSectionTitleColor: AppColors.textSecondary,
                selectedDayBackgroundColor: AppColors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: AppColors.accent,
                dayTextColor: AppColors.textPrimary,
                textDisabledColor: AppColors.textLight,
                dotColor: AppColors.primary,
                selectedDotColor: '#ffffff',
                arrowColor: AppColors.primary,
                monthTextColor: AppColors.primary,
                indicatorColor: AppColors.primary,
                textDayFontWeight: '400',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12
              }}
            />
          </View>

          {/* Date Summary */}
          <View style={styles.dateSummaryRow}>
            <View style={styles.dateSummaryBox}>
              <Text style={styles.dateSummaryLabel}>NHẬN PHÒNG</Text>
              <Text style={styles.dateSummaryValue}>
                {startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'Chọn ngày'}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={AppColors.textLight} />
            <View style={styles.dateSummaryBox}>
              <Text style={styles.dateSummaryLabel}>TRẢ PHÒNG</Text>
              <Text style={styles.dateSummaryValue}>
                {endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'Chọn ngày'}
              </Text>
            </View>
          </View>
        </View>

        {/* Guests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Số lượng khách & phòng</Text>
          <View style={styles.guestRow}>
            <View style={styles.guestItem}>
              <View>
                <Text style={styles.guestLabel}>Khách</Text>
                <Text style={styles.guestSubLabel}>Người lớn</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setGuests(Math.max(1, guests - 1))}
                >
                  <Ionicons name="remove" size={18} color={AppColors.primary} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{guests}</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setGuests(Math.min(room?.capacityAdults || 10, guests + 1))}
                >
                  <Ionicons name="add" size={18} color={AppColors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.guestDivider} />
            <View style={styles.guestItem}>
              <View>
                <Text style={styles.guestLabel}>Phòng</Text>
                <Text style={styles.guestSubLabel}>Số lượng</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setRooms(Math.max(1, rooms - 1))}
                >
                  <Ionicons name="remove" size={18} color={AppColors.primary} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{rooms}</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setRooms(Math.min(5, rooms + 1))}
                >
                  <Ionicons name="add" size={18} color={AppColors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Special Request */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Yêu cầu đặc biệt</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={3}
            placeholder="VD: Phòng tầng cao, giường phụ cho trẻ em..."
            placeholderTextColor={AppColors.textLight}
            value={specialRequest}
            onChangeText={setSpecialRequest}
          />
        </View>

        {/* Voucher Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ Mã giảm giá (Voucher)</Text>
          <View style={styles.voucherCard}>
            {isWeekendStay && (
              <View style={styles.selectorRow}>
                <TouchableOpacity 
                  style={[styles.selectorOption, useWeekendDiscount && styles.selectorOptionActive]}
                  onPress={() => setUseWeekendDiscount(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={useWeekendDiscount ? "radio-button-on" : "radio-button-off"} 
                    size={18} 
                    color={useWeekendDiscount ? AppColors.primary : AppColors.textSecondary} 
                  />
                  <Text style={[styles.selectorText, useWeekendDiscount && styles.selectorTextActive]}>
                    Ưu đãi cuối tuần (30%)
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.selectorOption, !useWeekendDiscount && styles.selectorOptionActive]}
                  onPress={() => setUseWeekendDiscount(false)}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={!useWeekendDiscount ? "radio-button-on" : "radio-button-off"} 
                    size={18} 
                    color={!useWeekendDiscount ? AppColors.primary : AppColors.textSecondary} 
                  />
                  <Text style={[styles.selectorText, !useWeekendDiscount && styles.selectorTextActive]}>
                    Dùng Voucher riêng
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {(isWeekendStay && useWeekendDiscount) ? (
              <View style={styles.weekendBanner}>
                <Ionicons name="gift" size={22} color={AppColors.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.weekendBannerTitle}>Cuối tuần vàng - Giảm tự động 30%!</Text>
                  <Text style={styles.weekendBannerDesc}>Hệ thống tự động áp dụng ưu đãi giảm 30% cho các đêm thứ Bảy & Chủ Nhật. Không áp dụng đồng thời voucher khác.</Text>
                </View>
              </View>
            ) : (
              <View>
                {appliedVoucher ? (
                  <View style={styles.appliedVoucherRow}>
                    <View style={styles.appliedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={AppColors.success} />
                      <Text style={styles.appliedText}>Đã áp dụng: {appliedVoucher.code} (-{appliedVoucher.discount * 100}%)</Text>
                    </View>
                    <TouchableOpacity style={styles.removeVoucherBtn} onPress={handleRemoveVoucher}>
                      <Text style={styles.removeVoucherText}>Gỡ bỏ</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.voucherInputRow}>
                    <TextInput
                      style={styles.voucherInput}
                      placeholder="Nhập mã voucher (VD: SUMMER20)"
                      placeholderTextColor={AppColors.textLight}
                      value={voucherCodeInput}
                      onChangeText={setVoucherCodeInput}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={styles.applyVoucherBtn}
                      onPress={handleApplyVoucher}
                      disabled={isApplyingVoucher}
                    >
                      {isApplyingVoucher ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.applyVoucherBtnText}>Áp dụng</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={[styles.section, { marginBottom: 150 }]}>
          <Text style={styles.sectionTitle}>💰 Chi tiết giá</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{room?.name} × {nights} đêm</Text>
              <Text style={styles.priceValue}>{formatCurrency(rawSubtotal)}đ</Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: AppColors.success }]}>
                  {isWeekendStay ? 'Ưu đãi cuối tuần (30%)' : `Khuyến mãi (${Math.round(currentDiscount * 100)}%)`}
                </Text>
                <Text style={[styles.priceValue, { color: AppColors.success }]}>-{formatCurrency(discountAmount)}đ</Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Thuế & Phí dịch vụ (10%)</Text>
              <Text style={styles.priceValue}>{formatCurrency(tax)}đ</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}đ</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>Tổng thanh toán</Text>
          <Text style={styles.bottomPrice}>{formatCurrency(total)}đ</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleBooking}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={Gradients.button as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.continueBtn, isSubmitting && { opacity: 0.7 }]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.continueBtnText}>Xác nhận đặt phòng</Text>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },

  roomSummary: {
    flexDirection: 'row', backgroundColor: '#fff',
    margin: Spacing.lg, borderRadius: Radius.lg,
    overflow: 'hidden', ...Shadows.medium,
  },
  roomImage: { width: 110, height: 100 },
  roomInfo: { flex: 1, padding: Spacing.md, justifyContent: 'center' },
  roomName: { fontSize: 15, fontWeight: '700', color: AppColors.textPrimary, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  locationText: { fontSize: 12, color: AppColors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: AppColors.textSecondary },

  section: { marginHorizontal: Spacing.lg, marginTop: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: AppColors.textPrimary },
  
  nightBadge: { backgroundColor: AppColors.primary + '10', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm },
  nightBadgeText: { color: AppColors.primary, fontSize: 12, fontWeight: '600' },

  calendarContainer: {
    backgroundColor: '#fff', borderRadius: Radius.lg,
    overflow: 'hidden', ...Shadows.small, marginBottom: Spacing.md,
    padding: Spacing.xs,
  },

  dateSummaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: Spacing.md, borderRadius: Radius.md, ...Shadows.small },
  dateSummaryBox: { flex: 1, alignItems: 'center' },
  dateSummaryLabel: { fontSize: 10, color: AppColors.textLight, marginBottom: 2, letterSpacing: 0.5 },
  dateSummaryValue: { fontSize: 14, fontWeight: '700', color: AppColors.textPrimary },

  guestRow: { backgroundColor: '#fff', borderRadius: Radius.md, ...Shadows.small },
  guestItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: Spacing.lg,
  },
  guestLabel: { fontSize: 15, fontWeight: '600', color: AppColors.textPrimary },
  guestSubLabel: { fontSize: 12, color: AppColors.textSecondary },
  guestDivider: { height: 1, backgroundColor: AppColors.borderLight, marginHorizontal: Spacing.lg },
  stepper: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: AppColors.background, borderRadius: Radius.sm, padding: 4,
  },
  stepperBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    ...Shadows.small,
  },
  stepperValue: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary, minWidth: 24, textAlign: 'center' },

  textArea: {
    backgroundColor: '#fff', borderRadius: Radius.md, padding: Spacing.lg,
    fontSize: 14, color: AppColors.textPrimary, minHeight: 80,
    textAlignVertical: 'top', ...Shadows.small,
  },

  priceCard: { backgroundColor: '#fff', borderRadius: Radius.md, padding: Spacing.lg, ...Shadows.small },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  priceLabel: { fontSize: 14, color: AppColors.textSecondary },
  priceValue: { fontSize: 14, fontWeight: '600', color: AppColors.textPrimary },
  priceDivider: { height: 1, backgroundColor: AppColors.border, marginVertical: Spacing.sm },
  totalLabel: { fontSize: 16, fontWeight: '700', color: AppColors.textPrimary },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: AppColors.accent },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, paddingBottom: 30,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: AppColors.borderLight,
    ...Shadows.large,
  },
  bottomLabel: { fontSize: 12, color: AppColors.textSecondary },
  bottomPrice: { fontSize: 22, fontWeight: 'bold', color: AppColors.primary },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: Radius.md,
  },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  noRoomContainer: { flex: 1, backgroundColor: AppColors.background },
  noRoomContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, paddingBottom: 100 },
  noRoomTitle: { fontSize: 18, fontWeight: 'bold', color: AppColors.textPrimary, marginBottom: 10, textAlign: 'center' },
  noRoomDesc: { fontSize: 14, color: AppColors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 30 },
  selectRoomBtn: { width: '100%', borderRadius: Radius.md, overflow: 'hidden' },
  selectRoomGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  selectRoomBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  voucherCard: {
    backgroundColor: '#fff', borderRadius: Radius.md, padding: Spacing.md, ...Shadows.small,
  },
  voucherInputRow: {
    flexDirection: 'row', gap: Spacing.md,
  },
  voucherInput: {
    flex: 1, backgroundColor: AppColors.background, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: 14,
    color: AppColors.textPrimary, borderWidth: 1, borderColor: AppColors.borderLight,
  },
  applyVoucherBtn: {
    backgroundColor: AppColors.primary, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: Spacing.xl, borderRadius: Radius.sm,
  },
  applyVoucherBtnText: {
    color: '#fff', fontSize: 14, fontWeight: 'bold',
  },
  appliedVoucherRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  appliedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: AppColors.success + '10', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  appliedText: {
    color: AppColors.success, fontSize: 14, fontWeight: '600',
  },
  removeVoucherBtn: {
    paddingVertical: 8, paddingHorizontal: 12,
  },
  removeVoucherText: {
    color: AppColors.danger, fontSize: 14, fontWeight: '600',
  },
  weekendBanner: {
    flexDirection: 'row', gap: Spacing.md, backgroundColor: AppColors.danger + '10',
    padding: Spacing.md, borderRadius: Radius.sm, alignItems: 'center',
  },
  weekendBannerTitle: {
    fontSize: 14, fontWeight: 'bold', color: AppColors.danger,
  },
  weekendBannerDesc: {
    fontSize: 12, color: AppColors.textSecondary, marginTop: 2, lineHeight: 16,
  },
  selectorRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  selectorOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
    backgroundColor: AppColors.background,
  },
  selectorOptionActive: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + '05',
  },
  selectorText: {
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.textSecondary,
  },
  selectorTextActive: {
    fontWeight: '700',
    color: AppColors.primary,
  },
});
