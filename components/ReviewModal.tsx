import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, Shadows, Radius, Spacing, Gradients } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  initialReview?: any;
  onSubmit: (rating: number, comment: string, isEdit: boolean) => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
}

export default function ReviewModal({ visible, onClose, roomId, initialReview, onSubmit, onDelete }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialReview) {
        setRating(initialReview.rating || 5);
        setComment(initialReview.comment || '');
      } else {
        setRating(5);
        setComment('');
      }
    }
  }, [visible, initialReview]);

  const handleSubmit = async () => {
    if (comment.trim().length < 10) {
      Alert.alert('Lỗi', 'Nhận xét cần ít nhất 10 ký tự.');
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit(rating, comment, !!initialReview);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  const handleDelete = () => {
    Alert.alert('Xóa đánh giá', 'Bạn có chắc chắn muốn xóa đánh giá này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          if (onDelete) {
            setIsDeleting(true);
            const success = await onDelete();
            setIsDeleting(false);
            if (success) onClose();
          }
        }
      }
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{initialReview ? 'Sửa Đánh Giá' : 'Viết Đánh Giá'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={AppColors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
            <Text style={styles.label}>Đánh giá của bạn</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={AppColors.star}
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Nhận xét của bạn</Text>
            <TextInput
              style={styles.input}
              placeholder="Chia sẻ trải nghiệm của bạn (ít nhất 10 ký tự)..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
            />
            <Text style={styles.charCount}>{comment.length}/1000 ký tự</Text>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={isSubmitting || isDeleting}
            >
              <LinearGradient
                colors={Gradients.button as [string, string]}
                style={styles.submitBtnGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Gửi Đánh Giá</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {!!initialReview && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                disabled={isSubmitting || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={AppColors.danger} />
                ) : (
                  <Text style={styles.deleteBtnText}>Xóa Đánh Giá</Text>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: AppColors.borderLight,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: AppColors.textPrimary },
  closeBtn: { padding: 4 },
  modalScroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 50 },
  
  label: { fontSize: 16, fontWeight: '600', color: AppColors.textPrimary, textAlign: 'center' },
  
  starsContainer: {
    flexDirection: 'row', justifyContent: 'center', marginVertical: Spacing.sm,
  },
  
  input: {
    borderWidth: 1, borderColor: AppColors.border, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: 15,
    color: AppColors.textPrimary, backgroundColor: '#fcfcfc',
    minHeight: 120,
  },
  charCount: { fontSize: 12, color: AppColors.textSecondary, textAlign: 'right', marginTop: -Spacing.sm },
  
  submitBtn: { borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.md },
  submitBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  deleteBtn: { paddingVertical: 14, alignItems: 'center' },
  deleteBtnText: { color: AppColors.danger, fontSize: 15, fontWeight: '600' },
});
