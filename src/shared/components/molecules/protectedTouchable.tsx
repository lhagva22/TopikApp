import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import type { RootDrawerParamList, RootStackParamList } from '../../../app/navigation/types';
import { useAppStore } from '../../../app/store';
import { LockMessage } from '../feedback';
import type { AccessBlockReason, ProtectedTouchableProps } from './types';

const resolveBlockReason = (
  isGuest: boolean,
  isRegistered: boolean,
): AccessBlockReason | null => {
  if (isGuest) {
    return 'guest';
  }

  if (isRegistered) {
    return 'registered';
  }

  return null;
};

export const ProtectedTouchable: React.FC<ProtectedTouchableProps> = ({
  children,
  onPress,
  onPaymentRequired,
  requiredStatus = 'paid',
  style,
  activeOpacity = 0.7,
}) => {
  const navigation = useNavigation<any>();
  const { isGuestUser, isRegisteredUser, isPaidUser } = useAppStore();
  const [showLockMessage, setShowLockMessage] = useState(false);
  const [blockReason, setBlockReason] = useState<AccessBlockReason>('guest');

  const handleLoginClick = () => {
    const rootNavigation = navigation.getParent?.();
    rootNavigation?.navigate?.('Auth' satisfies keyof RootStackParamList, {
      screen: 'Login',
    });
  };

  const handlePricingClick = () => {
    if (onPaymentRequired) {
      onPaymentRequired();
      return;
    }

    if (navigation.navigate) {
      navigation.navigate('Payment' satisfies keyof RootDrawerParamList);
    }
  };

  const handlePress = () => {
    if (requiredStatus === 'guest') {
      onPress?.();
      return;
    }

    if (requiredStatus === 'registered' && (isRegisteredUser() || isPaidUser())) {
      onPress?.();
      return;
    }

    if (requiredStatus === 'paid' && isPaidUser()) {
      onPress?.();
      return;
    }

    const reason = resolveBlockReason(isGuestUser(), isRegisteredUser());
    if (reason) {
      setBlockReason(reason);
      setShowLockMessage(true);
    }
  };

  return (
    <>
      <TouchableOpacity onPress={handlePress} style={style} activeOpacity={activeOpacity}>
        {children}
      </TouchableOpacity>

      <LockMessage
        visible={showLockMessage}
        reason={blockReason}
        onClose={() => setShowLockMessage(false)}
        onLoginClick={handleLoginClick}
        onPricingClick={handlePricingClick}
      />
    </>
  );
};
