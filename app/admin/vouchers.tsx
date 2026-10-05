import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, Modal, TextInput, Switch, KeyboardAvoidingView, Platform, ScrollView, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors, Shadows, Radius, Spacing, Gradients } from '../../constants/theme';
import { apiClient } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface Voucher {
  id: string;
  code: string;
  discount: number | string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function AdminVouchersScreen() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(''); // E.g., '10' for 10%
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      const response = await apiClient.get('/vouchers');
      if (response.data?.success) {
        setVouchers(response.data.data.vouchers);
      }
    } catch (error) {
      console.error('Fetch vouchers failed:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách mã giảm giá.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchVouchers();
  };

  const openAddModal = () => {
    setEditingVoucher(null);
    setCode('');
    setDiscountPercent('');
    
    // Set default dates YYYY-MM-DD
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(nextWeek.toISOString().split('T')[0]);
    setIsActive(true);
    setModalVisible(true);
  };

  const openEditModal = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setCode(voucher.code);
    // convert fraction back to percent (e.g. 0.15 -> '15')
    setDiscountPercent((Number(voucher.discount) * 100).toString());
    setStartDate(new Date(voucher.startDate).toISOString().split('T')[0]);
    setEndDate(new Date(voucher.endDate).toISOString().split('T')[0]);
    setIsActive(voucher.isActive);
    setModalVisible(true);
  };

  const handleSaveVoucher = async () => {
    if (!code.trim() || !discountPercent.trim() || !startDate.trim() || !endDate.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    const discountFraction = Number(discountPercent) / 100;
    if (isNaN(discountFraction) || discountFraction <= 0 || discountFraction > 0.9) {
      Alert.alert('Lỗi', 'Mức giảm giá phải là số từ 1% đến 90%.');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      Alert.alert('Lỗi', 'Ngày phải có định dạng YYYY-MM-DD.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      Alert.alert('Lỗi', 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        code: code.trim().toUpperCase(),
        discount: discountFraction,
        startDate,
        endDate,
        isActive,
      };

      if (editingVoucher) {
        // Cập nhật
        const res = await apiClient.put(`/vouchers/${editingVoucher.id}`, payload);
        if (res.data?.success) {
          Alert.alert('Thành công', 'Đã cập nhật thông tin voucher!');
          setModalVisible(false);
          fetchVouchers();
        }
      } else {
        // Tạo mới
        const res = await apiClient.post('/vouchers', payload);
        if (res.data?.success) {
          Alert.alert('Thành công', 'Đã thêm mã giảm giá mới!');
          setModalVisible(false);
          fetchVouchers();
        }
      }
    } catch (error: any) {
      console.error('Save voucher failed:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi lưu voucher.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVoucher = (voucherId: string, voucherCode: string) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa vĩnh viễn voucher "${voucherCode}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiClient.delete(`/vouchers/${voucherId}`);
              if (res.data?.success) {
                Alert.alert('Thành công', 'Đã xóa voucher thành công.');
                fetchVouchers();
              }
            } catch (error: any) {
              console.error('Delete voucher failed:', error);
              Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xóa voucher.');
            }
          }
        }
      ]
    );
  };

  const getVoucherStatus = (v: Voucher) => {
    if (!v.isActive) return { label: 'Đã khóa', color: AppColors.danger, bg: AppColors.dangerLight };
    const now = new Date();
    now.setHours(0,0,0,0);
    const end = new Date(v.endDate);
    if (now > end) return { label: 'Hết hạn', color: AppColors.textSecondary, bg: AppColors.borderLight };
    return { label: 'Hoạt động', color: AppColors.success, bg: AppColors.successLight };
  };

  const stats = {
    total: vouchers.length,
    active: vouchers.filter(v => getVoucherStatus(v).label === 'Hoạt động').length,
    inactive: vouchers.filter(v => getVoucherStatus(v).label !== 'Hoạt động').length,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={AppColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý Vouchers</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftColor: AppColors.primary }]}>
          <Text style={styles.summaryValue}>{stats.total}</Text>
          <Text style={styles.summaryLabel}>Tổng mã</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: AppColors.success }]}>
          <Text style={styles.summaryValue}>{stats.active}</Text>
          <Text style={styles.summaryLabel}>Đang chạy</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: AppColors.danger }]}>
          <Text style={styles.summaryValue}>{stats.inactive}</Text>
          <Text style={styles.summaryLabel}>Hết hạn / Khóa</Text>
        </View>
      </View>

      {/* Voucher List */}
      {isLoading && !isRefreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : (
        <FlatList
          data={vouchers}
          style={{ flex: 1 }}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="pricetags-outline" size={60} color={AppColors.textLight} />
              <Text style={styles.emptyTitle}>Chưa có mã giảm giá nào</Text>
              <Text style={styles.emptyDesc}>Bấm vào nút "+" bên dưới để tạo voucher đầu tiên.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const status = getVoucherStatus(item);
            return (
              <View style={styles.voucherCard}>
                {/* Left Ticket styling */}
                <View style={styles.cardLeft}>
                  <LinearGradient
                    colors={['#FF6B6B', '#FF8E53'] as [string, string]}
                    style={styles.ticketBadge}
                  >
                    <Text style={styles.discountText}>-{Number(item.discount) * 100}%</Text>
                    <Text style={styles.discountSub}>GIẢM GIÁ</Text>
                  </LinearGradient>
                </View>

                {/* Right Info styling */}
                <View style={styles.cardRight}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.voucherCode}>{item.code}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>

                  <View style={styles.dateRow}>
                    <Ionicons name="time-outline" size={13} color={AppColors.textSecondary} />
                    <Text style={styles.dateText}>
                      Hạn: {new Date(item.startDate).toLocaleDateString('vi-VN')} → {new Date(item.endDate).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>

                  {/* Action buttons */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: AppColors.primary + '10' }]}
                      onPress={() => openEditModal(item)}
                    >
                      <Ionicons name="pencil-outline" size={14} color={AppColors.primary} />
                      <Text style={[styles.actionText, { color: AppColors.primary }]}>Sửa</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: AppColors.danger + '10' }]}
                      onPress={() => handleDeleteVoucher(item.id, item.code)}
                    >
                      <Ionicons name="trash-outline" size={14} color={AppColors.danger} />
                      <Text style={[styles.actionText, { color: AppColors.danger }]}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={openAddModal}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Voucher Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingVoucher ? 'Sửa Mã Giảm Giá' : 'Thêm Mã Giảm Giá'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={AppColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {/* Mã Voucher */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mã Voucher *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: LUXSTAY10"
                  autoCapitalize="characters"
                  value={code}
                  onChangeText={setCode}
                />
              </View>

              {/* Phần trăm giảm giá */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phần trăm giảm giá (%) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: 15 (nghĩa là giảm 15%)"
                  keyboardType="numeric"
                  value={discountPercent}
                  onChangeText={setDiscountPercent}
                />
              </View>

              {/* Ngày bắt đầu */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ngày bắt đầu sử dụng (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: 2026-05-25"
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>

              {/* Ngày kết thúc */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ngày kết thúc sử dụng (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: 2026-06-25"
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>

              {/* Switch kích hoạt */}
              <View style={styles.switchGroup}>
                <Text style={styles.switchLabel}>Kích hoạt voucher</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: '#767577', true: AppColors.success + '60' }}
                  thumbColor={isActive ? AppColors.success : '#f4f3f4'}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveVoucher}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={Gradients.button as [string, string]}
                  style={styles.saveBtnGradient}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.saveBtnText}>Lưu cấu hình</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  header: {
    paddingTop: 50, paddingBottom: 16, paddingHorizontal: Spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: AppColors.borderLight,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: AppColors.textPrimary },
  
  summaryRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg, gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: Radius.sm,
    padding: Spacing.md, borderLeftWidth: 3, ...Shadows.small,
  },
  summaryValue: { fontSize: 20, fontWeight: 'bold', color: AppColors.textPrimary },
  summaryLabel: { fontSize: 11, color: AppColors.textSecondary },

  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  
  voucherCard: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: Radius.md, marginBottom: Spacing.md,
    height: 125,
    overflow: 'hidden', ...Shadows.small,
  },
  cardLeft: {
    width: 90, justifyContent: 'center', alignItems: 'center',
  },
  ticketBadge: {
    width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center',
    padding: Spacing.sm,
  },
  discountText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  discountSub: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 2, letterSpacing: 0.5 },

  cardRight: { flex: 1, padding: Spacing.md, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  voucherCode: { fontSize: 16, fontWeight: 'bold', color: AppColors.textPrimary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.xs },
  statusText: { fontSize: 10, fontWeight: '600' },
  
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dateText: { fontSize: 12, color: AppColors.textSecondary },
  
  actionRow: {
    flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: AppColors.borderLight, paddingTop: Spacing.sm,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.xs, gap: 4 },
  actionText: { fontSize: 11, fontWeight: '600' },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: AppColors.accent, justifyContent: 'center',
    alignItems: 'center', ...Shadows.large,
  },

  // Modal styling
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: AppColors.borderLight,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: AppColors.textPrimary },
  closeBtn: { padding: 4 },
  modalScroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 50 },
  
  inputGroup: { gap: Spacing.xs },
  inputLabel: { fontSize: 13, fontWeight: '600', color: AppColors.textSecondary },
  input: {
    borderWidth: 1, borderColor: AppColors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: 15,
    color: AppColors.textPrimary, backgroundColor: '#fdfdfd',
  },
  
  switchGroup: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: AppColors.textPrimary },
  
  saveBtn: { borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.md },
  saveBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 80, paddingHorizontal: 30,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: AppColors.textPrimary, marginTop: Spacing.lg },
  emptyDesc: { fontSize: 13, color: AppColors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, lineHeight: 19 },
});
