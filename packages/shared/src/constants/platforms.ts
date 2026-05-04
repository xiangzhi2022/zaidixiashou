export const Platforms = {
  AMAZON: 'AMAZON',
  EBAY: 'EBAY',
  SHOPIFY: 'SHOPIFY',
  TIKTOK_SHOP: 'TIKTOK_SHOP',
  XIAOHONGSHU: 'XIAOHONGSHU',
  DOUYIN: 'DOUYIN',
  TIKTOK: 'TIKTOK',
  INSTAGRAM: 'INSTAGRAM',
  X_TWITTER: 'X_TWITTER',
  MERCADOLIBRE: 'MERCADOLIBRE'
} as const;

export type Platform = (typeof Platforms)[keyof typeof Platforms];

export const platformLabels: Record<Platform, string> = {
  AMAZON: 'Amazon',
  EBAY: 'eBay',
  SHOPIFY: 'Shopify',
  TIKTOK_SHOP: 'TikTok Shop',
  XIAOHONGSHU: '小红书',
  DOUYIN: '抖音',
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
  X_TWITTER: 'X / Twitter',
  MERCADOLIBRE: 'MercadoLibre'
};

