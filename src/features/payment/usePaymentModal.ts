import { useState } from 'react';

export const usePaymentModal = () => {
  const [showPayment, setShowPayment] = useState(false);

  const openPayment = () => {
    setShowPayment(true);
  };

  const closePayment = () => {
    setShowPayment(false);
  };

  return {
    showPayment,
    openPayment,
    closePayment,
  };
};
