import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import type { RootDrawerParamList, RootStackParamList } from '../../../app/navigation/types';
import { useAppStore } from '../../../app/store';
import { LockMessage } from '../feedback';
import type { AccessBlockReason, ProtectedTouchableProps } from './types';

export const ProtectedTouchable: React.FC<ProtectedTouchableProps> = ({
  children,
  onPress,
  onPaymentRequired,
  requiredStatus = 'paid',
  style,
  activeOpacity = 0.7,
}) => {
  const navigation = useNavigation<any>();
  const { hasAccess, getAccessBlockReason } = useAppStore();
  const [showLockMessage, setShowLockMessage] = useState(false);
  const [blockReason, setBlockReason] = useState<AccessBlockReason>('guest');

  const handleLoginClick = () => {
    let rootNavigation = navigation;

    while (rootNavigation?.getParent?.()) {
      rootNavigation = rootNavigation.getParent();
    }

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
    if (hasAccess(requiredStatus)) {
      onPress?.();
      return;
    }

    const reason = getAccessBlockReason(requiredStatus);
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
