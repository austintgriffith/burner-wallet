import React from 'react';

import Decimal from 'decimal.js';

export const decimalToText = (value, decimals = 4) => {
  if (value && value.toDP) {
    // toDP is a function of Decimal.js, it rounds the Decimal object to decimals places with rounding mode entered
    // rounding mode = 1 => round down
    return value.toDP(decimals, 1).toString();
  }

  let decimalValue;
  try {
    decimalValue = Decimal(value);
  } catch (e) {
    console.warn(
      'Invalid prop given to <DecimalValue />: Using 0 as fallback. Please fix this, it causes massive performance issues'
    );
    decimalValue = Decimal(0);
  }

  return decimalValue.toDP(decimals, 1).toString();
};

const DecimalValue = ({ value, decimals = 4, className }) => {
  const text = decimalToText(value, decimals);
  return <span className={className}>{text}</span>;
};

export default DecimalValue;
