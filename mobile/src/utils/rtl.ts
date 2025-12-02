import { I18nManager } from 'react-native';

export const isRTL = I18nManager.isRTL;

export const flexDirection = (direction: 'row' | 'row-reverse' | 'column' | 'column-reverse') => {
  if (!isRTL) return direction;
  
  switch (direction) {
    case 'row':
      return 'row-reverse';
    case 'row-reverse':
      return 'row';
    default:
      return direction;
  }
};

export const textAlign = (align: 'left' | 'right' | 'center' | 'justify') => {
  if (!isRTL || align === 'center' || align === 'justify') return align;
  return align === 'left' ? 'right' : 'left';
};

export const marginDirection = (side: 'Left' | 'Right') => {
  if (!isRTL) return side;
  return side === 'Left' ? 'Right' : 'Left';
};

export const paddingDirection = (side: 'Left' | 'Right') => {
  if (!isRTL) return side;
  return side === 'Left' ? 'Right' : 'Left';
};

