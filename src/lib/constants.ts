// Priority stores for MVP
export const PRIORITY_STORES = [
  {
    name: 'Aldi',
    slug: 'aldi',
    logo_url: '/stores/aldi.svg',
    website: 'https://www.aldi.us',
  },
  {
    name: 'Lidl',
    slug: 'lidl',
    logo_url: '/stores/lidl.svg',
    website: 'https://www.lidl.com',
  },
  {
    name: 'Harris Teeter',
    slug: 'harris-teeter',
    logo_url: '/stores/harris-teeter.svg',
    website: 'https://www.harristeeter.com',
  },
  {
    name: 'Safeway',
    slug: 'safeway',
    logo_url: '/stores/safeway.svg',
    website: 'https://www.safeway.com',
  },
] as const

// Deal categories
export const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Produce', value: 'produce' },
  { label: 'Meat', value: 'meat' },
  { label: 'Dairy', value: 'dairy' },
  { label: 'Pantry', value: 'pantry' },
  { label: 'Frozen', value: 'frozen' },
  { label: 'Bakery', value: 'bakery' },
  { label: 'Beverages', value: 'beverages' },
  { label: 'Snacks', value: 'snacks' },
  { label: 'Household', value: 'household' },
  { label: 'Other', value: 'other' },
] as const

export type Category = (typeof CATEGORIES)[number]['value']

// Local storage keys
export const STORAGE_KEYS = {
  ZIP_CODE: 'gg_zip_code',
  SELECTED_STORES: 'gg_selected_stores',
  WATCH_LIST: 'gg_watch_list',
  ONBOARDING_COMPLETE: 'gg_onboarding_complete',
} as const
