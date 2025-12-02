import { Linking, Platform, Alert } from 'react-native';
import { Sale } from '../types';

/**
 * Share to WhatsApp using deep linking
 * This is crucial for Israeli market where WhatsApp is the primary messaging app
 */
export const shareToWhatsApp = async (sale: Sale) => {
  try {
    const message = formatSaleMessage(sale);
    const encodedMessage = encodeURIComponent(message);
    
    // WhatsApp URL scheme
    const whatsappURL = Platform.select({
      ios: `whatsapp://send?text=${encodedMessage}`,
      android: `whatsapp://send?text=${encodedMessage}`,
    });

    if (!whatsappURL) {
      throw new Error('Platform not supported');
    }

    // Check if WhatsApp is installed
    const canOpen = await Linking.canOpenURL(whatsappURL);
    
    if (canOpen) {
      await Linking.openURL(whatsappURL);
      return true;
    } else {
      // WhatsApp not installed, offer to open in browser
      Alert.alert(
        'WhatsApp Not Installed',
        'WhatsApp is not installed. Would you like to share via web?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Web',
            onPress: () => shareToWhatsAppWeb(message),
          },
        ]
      );
      return false;
    }
  } catch (error) {
    console.error('Error sharing to WhatsApp:', error);
    Alert.alert('Error', 'Failed to share to WhatsApp');
    return false;
  }
};

/**
 * Share to WhatsApp Web (fallback for users without the app)
 */
const shareToWhatsAppWeb = async (message: string) => {
  try {
    const encodedMessage = encodeURIComponent(message);
    const webURL = `https://web.whatsapp.com/send?text=${encodedMessage}`;
    
    const canOpen = await Linking.canOpenURL(webURL);
    if (canOpen) {
      await Linking.openURL(webURL);
    } else {
      Alert.alert('Error', 'Cannot open WhatsApp Web');
    }
  } catch (error) {
    console.error('Error opening WhatsApp Web:', error);
  }
};

/**
 * Format sale data into a shareable message
 * Optimized for Israeli messaging style with emojis
 */
export const formatSaleMessage = (sale: Sale): string => {
  const storeName = sale.store?.name || 'Store';
  const discount = sale.discountPercentage ? `${sale.discountPercentage}% OFF` : '';
  const price = sale.salePrice ? `₪${sale.salePrice}` : '';
  const originalPrice = sale.originalPrice ? `(was ₪${sale.originalPrice})` : '';
  const distance = sale.distance ? `${(sale.distance / 1000).toFixed(1)}km away` : '';

  // Build message with emojis (popular in Israel)
  let message = `🔥 ${sale.title}\n\n`;
  
  if (discount) {
    message += `💰 ${discount}\n`;
  }
  
  if (price) {
    message += `💵 ${price} ${originalPrice}\n`;
  }
  
  message += `🏪 ${storeName}\n`;
  
  if (distance) {
    message += `📍 ${distance}\n`;
  }
  
  message += `\nFound on MySellGuid - Your local deals app! 🎁`;
  
  return message;
};

/**
 * Share to Telegram (also popular in Israel)
 */
export const shareToTelegram = async (sale: Sale) => {
  try {
    const message = formatSaleMessage(sale);
    const encodedMessage = encodeURIComponent(message);
    
    const telegramURL = `tg://msg?text=${encodedMessage}`;
    
    const canOpen = await Linking.canOpenURL(telegramURL);
    
    if (canOpen) {
      await Linking.openURL(telegramURL);
      return true;
    } else {
      Alert.alert('Telegram Not Installed', 'Telegram is not installed on this device');
      return false;
    }
  } catch (error) {
    console.error('Error sharing to Telegram:', error);
    Alert.alert('Error', 'Failed to share to Telegram');
    return false;
  }
};

/**
 * Generic share with options for multiple platforms
 */
export const shareWithOptions = async (sale: Sale) => {
  Alert.alert(
    'Share Deal',
    'Choose how to share this deal',
    [
      {
        text: 'WhatsApp',
        onPress: () => shareToWhatsApp(sale),
      },
      {
        text: 'Telegram',
        onPress: () => shareToTelegram(sale),
      },
      {
        text: 'More Options',
        onPress: () => {
          // Use native share sheet
          const { Share } = require('react-native');
          Share.share({
            message: formatSaleMessage(sale),
            title: sale.title,
          });
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ],
    { cancelable: true }
  );
};

