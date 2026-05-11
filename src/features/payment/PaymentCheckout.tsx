import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import type { RootDrawerParamList } from '../../app/navigation/types';
import { useAppStore } from '../../app/store';
import { InlineMessage } from '../../shared/components/feedback';
import CustomButton from '../../shared/components/molecules/button';
import { Card, CardHeader, CardTitle } from '../../shared/components/molecules/card';
import { getErrorMessage, logError } from '../../shared/lib/errors';
import { authApi } from '../auth/api/authApi';
import { paymentApi } from './api/paymentApi';
import type { QPayDeeplink, QPayPayment } from './types';

const FEATURES = ['Бүх видео хичээл', 'Mock шалгалтууд', 'Толь бичиг', 'Хичээлийн материал'];

const paymentMethods = [
  { id: 'qpay', label: 'QPay', icon: 'qr-code-outline' },
  { id: 'khan', label: 'Хаан банк', icon: 'card-outline' },
  { id: 'golomt', label: 'Голомт банк', icon: 'card-outline' },
  { id: 'khas', label: 'Хасбанк', icon: 'card-outline' },
] as const;

type RouteProps = RouteProp<RootDrawerParamList, 'PaymentCheckout'>;
type StatusVariant = 'error' | 'info' | 'success';

const methodLinkKeywords: Record<string, string[]> = {
  qpay: ['qpay'],
  khan: ['khan'],
  golomt: ['golomt', 'socialpay'],
  khas: ['khas'],
};

const findPreferredDeeplink = (methodId: string, deeplinks: QPayDeeplink[]): QPayDeeplink | null => {
  const keywords = methodLinkKeywords[methodId] ?? [];

  const match = deeplinks.find((item) => {
    const haystack = `${item.name ?? ''} ${item.description ?? ''} ${item.link ?? ''}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  });

  return match ?? deeplinks[0] ?? null;
};

const getStatusMeta = (status?: QPayPayment['status']) => {
  switch (status) {
    case 'completed':
      return { label: 'Төлөгдсөн', backgroundColor: '#DCFCE7', textColor: '#166534' };
    case 'failed':
      return { label: 'Амжилтгүй', backgroundColor: '#FEE2E2', textColor: '#B91C1C' };
    case 'pending':
    default:
      return { label: 'Хүлээгдэж байна', backgroundColor: '#DBEAFE', textColor: '#1D4ED8' };
  }
};

const PaymentCheckout = () => {
  const navigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();
  const route = useRoute<RouteProps>();
  const { planTitle, planPrice, planMonths } = route.params;

  const { updateUser } = useAppStore();
  const [selectedMethod, setSelectedMethod] = useState<(typeof paymentMethods)[number]['id']>('qpay');
  const [payment, setPayment] = useState<QPayPayment | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusVariant, setStatusVariant] = useState<StatusVariant>('info');

  const selectedMethodLabel = useMemo(
    () => paymentMethods.find((method) => method.id === selectedMethod)?.label ?? 'QPay',
    [selectedMethod],
  );

  const preferredDeeplink = useMemo(
    () => findPreferredDeeplink(selectedMethod, payment?.deeplinks ?? []),
    [payment?.deeplinks, selectedMethod],
  );

  const paymentStatus = useMemo(() => getStatusMeta(payment?.status), [payment?.status]);

  const updateStatus = (message: string | null, variant: StatusVariant = 'info') => {
    setStatusMessage(message);
    setStatusVariant(variant);
  };

  const openExternalLink = async (url: string, fallbackUrl?: string) => {
    try {
      const canOpenPrimary = await Linking.canOpenURL(url);

      if (canOpenPrimary) {
        await Linking.openURL(url);
        return true;
      }

      if (fallbackUrl) {
        const canOpenFallback = await Linking.canOpenURL(fallbackUrl);

        if (canOpenFallback) {
          await Linking.openURL(fallbackUrl);
          updateStatus('Сонгосон банкны апп олдсонгүй. QPay холбоосоор үргэлжлүүллээ.', 'info');
          return true;
        }
      }

      updateStatus(
        'Сонгосон банкны апп энэ төхөөрөмж дээр байхгүй байна. QR кодоор төлөх эсвэл QPay холбоос ашиглана уу.',
        'info',
      );
      return false;
    } catch (error) {
      logError('Open payment link error', error);
      updateStatus('Төлбөрийн холбоос нээж чадсангүй. QR кодоор төлөөд дараа нь төлбөрөө шалгана уу.', 'error');
      return false;
    }
  };

  const openPreferredPaymentLink = async (url: string) => {
    const fallbackUrl = payment?.shortUrl ?? undefined;
    return openExternalLink(url, fallbackUrl);
  };

  const syncProfile = async () => {
    const response = await authApi.getProfile();

    if (response.success && response.user) {
      updateUser(response.user);
    }
  };

  const handleCreateInvoice = async () => {
    setIsCreating(true);
    updateStatus(null);

    try {
      const response = await paymentApi.createQPayPayment(planMonths);

      if (!response.success || !response.payment) {
        updateStatus(getErrorMessage(response, 'Төлбөрийн QR код үүсгэж чадсангүй.'), 'error');
        return;
      }

      setPayment(response.payment);
      updateStatus('QR код үүслээ. Төлбөрөө хийсний дараа "Төлбөр шалгах" товчийг дарна уу.', 'info');
    } catch (error) {
      logError('Create payment error', error);
      updateStatus(getErrorMessage(error, 'Төлбөрийн QR код үүсгэж чадсангүй.'), 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCheckPayment = async () => {
    if (!payment) {
      updateStatus('Эхлээд QR код үүсгэнэ үү.', 'error');
      return;
    }

    setIsChecking(true);
    updateStatus(null);

    try {
      const response = await paymentApi.checkQPayPayment(payment.id);

      if (!response.success || !response.payment) {
        updateStatus(getErrorMessage(response, 'Төлбөрийн төлөв шалгаж чадсангүй.'), 'error');
        return;
      }

      setPayment(response.payment);

      if (response.payment.status === 'completed') {
        await syncProfile();
        updateStatus(response.message ?? `${planMonths} сарын багц амжилттай идэвхжлээ.`, 'success');
        setTimeout(() => {
          navigation.navigate('Home');
        }, 900);
        return;
      }

      if (response.payment.status === 'failed') {
        updateStatus('Төлбөр амжилтгүй төлөвтэй байна. Дахин төлөөд шалгана уу.', 'error');
        return;
      }

      updateStatus(
        response.message ?? 'Төлбөр хүлээгдэж байна. Хэдэн хоромын дараа дахин шалгана уу.',
        'info',
      );
    } catch (error) {
      logError('Check payment error', error);
      updateStatus(getErrorMessage(error, 'Төлбөрийн төлөв шалгаж чадсангүй.'), 'error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSimulateSuccess = async () => {
    if (!payment) {
      updateStatus('Эхлээд QR код үүсгэнэ үү.', 'error');
      return;
    }

    setIsSimulating(true);
    updateStatus(null);

    try {
      const response = await paymentApi.simulateQPayPaymentSuccess(payment.id);

      if (!response.success || !response.payment) {
        updateStatus(getErrorMessage(response, 'Тест төлбөрийг амжилттай болгож чадсангүй.'), 'error');
        return;
      }

      setPayment(response.payment);
      await syncProfile();
      updateStatus(
        response.message ?? `${planMonths} сарын багц тестээр амжилттай идэвхжлээ.`,
        'success',
      );

      setTimeout(() => {
        navigation.navigate('Home');
      }, 900);
    } catch (error) {
      logError('Simulate payment success error', error);
      updateStatus(getErrorMessage(error, 'Тест төлбөрийг амжилттай болгож чадсангүй.'), 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const qrImageUri = payment?.qrImageBase64 ? `data:image/png;base64,${payment.qrImageBase64}` : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Төлбөр төлөх</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Таны сонгосон багц</Text>
        <Card style={styles.planCard}>
          <CardHeader>
            <View>
              <Text style={styles.planTitle}>{planTitle}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{planPrice}</Text>
                <Text style={styles.pricePeriod}>/{planTitle}</Text>
              </View>
            </View>
          </CardHeader>
          <CardTitle>
            {FEATURES.map((feature) => (
              <View key={feature} style={styles.featureItem}>
                <Icon name="checkmark-circle" size={16} color="#22c55e" style={styles.featureIcon} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </CardTitle>
        </Card>

        <Text style={styles.sectionLabel}>Төлбөрийн хэлбэр</Text>
        <Card style={styles.methodCard}>
          {paymentMethods.map((method, index) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodRow,
                index < paymentMethods.length - 1 && styles.methodRowBorder,
              ]}
              onPress={() => setSelectedMethod(method.id)}
              activeOpacity={0.7}
            >
              <View style={styles.methodLeft}>
                <Icon name={method.icon} size={20} color="#555" style={styles.methodIcon} />
                <Text style={styles.methodLabel}>{method.label}</Text>
              </View>
              <View
                style={[
                  styles.radio,
                  selectedMethod === method.id && styles.radioSelected,
                ]}
              >
                {selectedMethod === method.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        <InlineMessage message={statusMessage} variant={statusVariant} containerStyle={styles.message} />

        <InlineMessage
          message="QR код үүсгэсний дараа QR-ээр төлөх эсвэл доорх холбоосоор банкны апп нээж болно."
          variant="info"
          containerStyle={styles.message}
        />

        <CustomButton
          title={isCreating ? 'QR код бэлдэж байна...' : payment ? 'QR код дахин үүсгэх' : 'QR код үүсгэх'}
          onPress={handleCreateInvoice}
          requiredStatus="registered"
          style={styles.confirmButton}
        />

        {payment ? (
          <Card style={styles.qrCard}>
            <View style={styles.qrHeader}>
              <View>
                <Text style={styles.qrTitle}>QPay төлбөр</Text>
                <Text style={styles.qrSubtitle}>Сонгосон арга: {selectedMethodLabel}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: paymentStatus.backgroundColor }]}>
                <Text style={[styles.statusText, { color: paymentStatus.textColor }]}>
                  {paymentStatus.label}
                </Text>
              </View>
            </View>

            {qrImageUri ? (
              <Image source={{ uri: qrImageUri }} style={styles.qrImage} resizeMode="contain" />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Icon name="qr-code-outline" size={32} color="#155DFC" />
                <Text style={styles.qrPlaceholderText}>
                  QR зураг ирээгүй байна. Доорх холбоосоор төлнө үү.
                </Text>
              </View>
            )}

            <View style={styles.paymentMeta}>
              <Text style={styles.metaText}>Дүн: {planPrice}</Text>
              <Text style={styles.metaText}>Хугацаа: {planMonths} сар</Text>
              {payment.senderInvoiceNo ? (
                <Text style={styles.metaText}>Invoice No: {payment.senderInvoiceNo}</Text>
              ) : null}
            </View>

            {preferredDeeplink?.link ? (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => {
                  openPreferredPaymentLink(preferredDeeplink.link!);
                }}
              >
                <Icon name="open-outline" size={18} color="#155DFC" />
                <Text style={styles.linkButtonText}>{selectedMethodLabel} апп нээх</Text>
              </TouchableOpacity>
            ) : null}

            {payment.shortUrl ? (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => {
                  openExternalLink(payment.shortUrl!);
                }}
              >
                <Icon name="link-outline" size={18} color="#155DFC" />
                <Text style={styles.linkButtonText}>QPay холбоос нээх</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.checkButton, isChecking && styles.buttonDisabled]}
              onPress={handleCheckPayment}
              disabled={isChecking}
            >
              {isChecking ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="refresh-outline" size={18} color="#fff" />
                  <Text style={styles.checkButtonText}>Төлбөр шалгах</Text>
                </>
              )}
            </TouchableOpacity>

            {__DEV__ ? (
              <TouchableOpacity
                style={[styles.devButton, isSimulating && styles.buttonDisabled]}
                onPress={handleSimulateSuccess}
                disabled={isSimulating}
              >
                {isSimulating ? (
                  <ActivityIndicator size="small" color="#155DFC" />
                ) : (
                  <>
                    <Icon name="flask-outline" size={18} color="#155DFC" />
                    <Text style={styles.devButtonText}>Тестээр premium болгох</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 32,
  },
  body: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planCard: {
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: '600',
    color: '#155DFC',
  },
  pricePeriod: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  methodCard: {
    marginBottom: 4,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  methodRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    marginRight: 12,
  },
  methodLabel: {
    fontSize: 15,
    color: '#111827',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#155DFC',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#155DFC',
  },
  message: {
    marginTop: 16,
    marginBottom: 4,
  },
  confirmButton: {
    marginTop: 20,
  },
  qrCard: {
    marginTop: 20,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  qrSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  qrImage: {
    width: '100%',
    height: 240,
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  qrPlaceholder: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  qrPlaceholderText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: '#1D4ED8',
    textAlign: 'center',
  },
  paymentMeta: {
    marginTop: 16,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#4B5563',
  },
  linkButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#EFF6FF',
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#155DFC',
  },
  checkButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: '#155DFC',
  },
  checkButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  devButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  devButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#155DFC',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default PaymentCheckout;
