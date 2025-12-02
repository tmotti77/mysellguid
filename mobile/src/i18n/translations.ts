export const translations = {
  en: {
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'Confirm',
    back: 'Back',
    
    // Auth
    welcome: 'Welcome to MySellGuid',
    welcomeSubtitle: 'Discover amazing sales near you',
    email: 'Email',
    password: 'Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    
    // Discover
    discoverTitle: 'Discover Sales',
    searchPlaceholder: 'Search sales...',
    nearbyDeals: 'sales nearby',
    noSalesFound: 'No sales found nearby',
    tryIncreasingRadius: 'Try increasing the search radius',
    locationRequired: 'Location access required',
    enableLocation: 'Enable Location',
    findingSales: 'Finding sales near you...',
    
    // Categories
    all: 'All',
    fashion: 'Fashion',
    clothing: 'Clothing',
    electronics: 'Electronics',
    home: 'Home',
    homeGoods: 'Home Goods',
    beauty: 'Beauty',
    sports: 'Sports',
    food: 'Food',
    other: 'Other',
    
    // Sale Details
    originalPrice: 'Original Price',
    salePrice: 'Sale Price',
    discount: 'Discount',
    validUntil: 'Valid Until',
    share: 'Share',
    saveForLater: 'Save for Later',
    viewStore: 'View Store',
    getDirections: 'Get Directions',
    
    // Profile
    profile: 'Profile',
    settings: 'Settings',
    savedSales: 'Saved Sales',
    preferences: 'Preferences',
    language: 'Language',
    notifications: 'Notifications',
    
    // Errors
    errorOccurred: 'An error occurred',
    tryAgain: 'Try Again',
    networkError: 'Network error. Please check your connection.',
    loginError: 'Invalid email or password',
    registrationError: 'Registration failed. Please try again.',
  },
  
  he: {
    // Common
    loading: 'טוען...',
    error: 'שגיאה',
    success: 'הצלחה',
    cancel: 'ביטול',
    save: 'שמירה',
    delete: 'מחיקה',
    edit: 'עריכה',
    confirm: 'אישור',
    back: 'חזרה',
    
    // Auth
    welcome: 'ברוכים הבאים למייסלגיד',
    welcomeSubtitle: 'גלו מבצעים מדהימים ליד שלכם',
    email: 'אימייל',
    password: 'סיסמה',
    firstName: 'שם פרטי',
    lastName: 'שם משפחה',
    login: 'התחברות',
    register: 'הרשמה',
    logout: 'התנתקות',
    alreadyHaveAccount: 'כבר יש לך חשבון?',
    dontHaveAccount: 'אין לך חשבון?',
    
    // Discover
    discoverTitle: 'גלה מבצעים',
    searchPlaceholder: 'חפש מבצעים...',
    nearbyDeals: 'מבצעים בקרבתך',
    noSalesFound: 'לא נמצאו מבצעים בקרבת מקום',
    tryIncreasingRadius: 'נסה להגדיל את רדיוס החיפוש',
    locationRequired: 'נדרשת גישה למיקום',
    enableLocation: 'הפעל מיקום',
    findingSales: 'מחפש מבצעים בקרבתך...',
    
    // Categories
    all: 'הכל',
    fashion: 'אופנה',
    clothing: 'ביגוד',
    electronics: 'אלקטרוניקה',
    home: 'בית',
    homeGoods: 'מוצרי בית',
    beauty: 'יופי',
    sports: 'ספורט',
    food: 'אוכל',
    other: 'אחר',
    
    // Sale Details
    originalPrice: 'מחיר מקורי',
    salePrice: 'מחיר מבצע',
    discount: 'הנחה',
    validUntil: 'בתוקף עד',
    share: 'שתף',
    saveForLater: 'שמור למועד מאוחר',
    viewStore: 'צפה בחנות',
    getDirections: 'קבל הוראות ניווט',
    
    // Profile
    profile: 'פרופיל',
    settings: 'הגדרות',
    savedSales: 'מבצעים שמורים',
    preferences: 'העדפות',
    language: 'שפה',
    notifications: 'התראות',
    
    // Errors
    errorOccurred: 'אירעה שגיאה',
    tryAgain: 'נסה שוב',
    networkError: 'שגיאת רשת. אנא בדוק את החיבור שלך.',
    loginError: 'אימייל או סיסמה שגויים',
    registrationError: 'ההרשמה נכשלה. אנא נסה שוב.',
  },
};

export type TranslationKey = keyof typeof translations.en;
export type LanguageCode = keyof typeof translations;

