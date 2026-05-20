import React, { createContext, useState, useContext } from 'react';

const translations = {
  English: {
    inventory: 'Inventory',
    distributors: 'Distributors',
    nearbyShops: 'Nearby Shops',
    businessOwners: 'Business Owners',
    newInvoice: 'New Invoice',
    inventoryManagement: 'Inventory Management',
    distributorManagement: 'Distributor Management',
    businessOwnerPortal: 'Business Owner Portal',
    storeManager: 'Store Manager',
    email: 'EMAIL',
    role: 'ROLE',
    memberSince: 'MEMBER SINCE',
    theme: 'THEME',
    language: 'LANGUAGE',
    logout: 'Logout',
    totalProducts: 'Total Products',
    totalItemsInStock: 'Total Items in Stock',
    totalInventoryValue: 'Total Inventory Value',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    administrator: 'Administrator',
    addNewProduct: 'Add New Product',
    editProduct: 'Edit Product',
    productName: 'Product Name',
    category: 'Category',
    description: 'Description',
    imageLabel: 'Image (URL or Local File)',
    upload: 'Upload',
    quantity: 'Quantity',
    price: 'Price (₹)',
    currentInventory: 'Current Inventory',
    searchItems: 'Search items...',
    allCategories: 'All Categories',
    allStatuses: 'All Statuses',
    image: 'Image',
    product: 'Product',
    status: 'Status',
    qty: 'Qty',
    actions: 'Actions',
    inStock: 'In Stock',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    cancelEdit: 'Cancel Edit',
    updateProduct: 'Update Product',
    addProduct: 'Add Product',
    // Categories
    'Produce': 'Produce',
    'Dairy & Eggs': 'Dairy & Eggs',
    'Meat & Seafood': 'Meat & Seafood',
    'Bakery': 'Bakery',
    'Pantry': 'Pantry',
    'Beverages': 'Beverages',
    'Snacks': 'Snacks',
    'Other': 'Other',
    'Uncategorized': 'Uncategorized',
    // Messages
    'noItemsMatch': 'No items match your search/filter criteria.',
    'noItemsInInventory': 'No items in inventory. Add some products to get started!',
    confirmDelete: 'Confirm Delete',
    deleteWarning: 'Are you sure you want to delete this item? This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete',
    approvals: 'Approvals',
    // Common Products (Demo)
    'Organic Apples': 'Organic Apples',
    'Fresh and organic': 'Fresh and organic'
  },
  Kannada: {
    inventory: 'ದಾಸ್ತಾನು',
    distributors: 'ವಿತರಕರು',
    nearbyShops: 'ಹತ್ತಿರದ ಅಂಗಡಿಗಳು',
    businessOwners: 'ವ್ಯಾಪಾರ ಮಾಲೀಕರು',
    newInvoice: 'ಹೊಸ ಸರಕುಪಟ್ಟಿ',
    inventoryManagement: 'ದಾಸ್ತಾನು ನಿರ್ವಹಣೆ',
    distributorManagement: 'ವಿತರಕರ ನಿರ್ವಹಣೆ',
    businessOwnerPortal: 'ವ್ಯಾಪಾರ ಮಾಲೀಕರ ಪೋರ್ಟಲ್',
    storeManager: 'ಸ್ಟೋರ್ ಮ್ಯಾನೇಜರ್',
    email: 'ಇಮೇಲ್',
    role: 'ಪಾತ್ರ',
    memberSince: 'ಸದಸ್ಯರಾಗಿದ್ದು',
    theme: 'ಥೀಮ್',
    language: 'ಭಾಷೆ',
    logout: 'ಲಾಗ್ ಔಟ್',
    totalProducts: 'ಒಟ್ಟು ಉತ್ಪನ್ನಗಳು',
    totalItemsInStock: 'ಸ್ಟಾಕ್‌ನಲ್ಲಿರುವ ಒಟ್ಟು ವಸ್ತುಗಳು',
    totalInventoryValue: 'ಒಟ್ಟು ದಾಸ್ತಾನು ಮೌಲ್ಯ',
    darkMode: 'ಡಾರ್ಕ್ ಮೋಡ್',
    lightMode: 'ಲೈಟ್ ಮೋಡ್',
    administrator: 'ಆಡಳಿತಗಾರ',
    addNewProduct: 'ಹೊಸ ಉತ್ಪನ್ನವನ್ನು ಸೇರಿಸಿ',
    editProduct: 'ಉತ್ಪನ್ನವನ್ನು ಸಂಪಾದಿಸಿ',
    productName: 'ಉತ್ಪನ್ನದ ಹೆಸರು',
    category: 'ವರ್ಗ',
    description: 'ವಿವರಣೆ',
    imageLabel: 'ಚಿತ್ರ (URL ಅಥವಾ ಸ್ಥಳೀಯ ಫೈಲ್)',
    upload: 'ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    quantity: 'ಪ್ರಮಾಣ',
    price: 'ಬೆಲೆ (₹)',
    currentInventory: 'ಪ್ರಸ್ತುತ ದಾಸ್ತಾನು',
    searchItems: 'ಐಟಂಗಳನ್ನು ಹುಡುಕಿ...',
    allCategories: 'ಎಲ್ಲಾ ವರ್ಗಗಳು',
    allStatuses: 'ಎಲ್ಲಾ ಸ್ಥಿತಿಗಳು',
    image: 'ಚಿತ್ರ',
    product: 'ಉತ್ಪನ್ನ',
    status: 'ಸ್ಥಿತಿ',
    qty: 'ಪ್ರಮಾಣ',
    actions: 'ಕ್ರಿಯೆಗಳು',
    inStock: 'ಸ್ಟಾಕ್ ನಲ್ಲಿದೆ',
    lowStock: 'ಕಡಿಮೆ ಸ್ಟಾಕ್',
    outOfStock: 'ಸ್ಟಾಕ್ ಖಾಲಿಯಾಗಿದೆ',
    cancelEdit: 'ರದ್ದುಮಾಡು',
    updateProduct: 'ನವೀಕರಿಸಿ',
    addProduct: 'ಸೇರಿಸಿ',
    // Categories
    'Produce': 'ತಾಜಾ ಉತ್ಪನ್ನಗಳು',
    'Dairy & Eggs': 'ಹೈನುಗಾರಿಕೆ ಮತ್ತು ಮೊಟ್ಟೆಗಳು',
    'Meat & Seafood': 'ಮಾಂಸ ಮತ್ತು ಸಮುದ್ರಾಹಾರ',
    'Bakery': 'ಬೇಕರಿ',
    'Pantry': 'ದಿನಸಿ',
    'Beverages': 'ಪಾನೀಯಗಳು',
    'Snacks': 'ತಿಂಡಿಗಳು',
    'Other': 'ಇತರೆ',
    'Uncategorized': 'ವರ್ಗೀಕರಿಸಲಾಗಿಲ್ಲ',
    // Messages
    'noItemsMatch': 'ನಿಮ್ಮ ಹುಡುಕಾಟ/ಫಿಲ್ಟರ್‌ಗೆ ಯಾವುದೇ ಐಟಂಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.',
    'noItemsInInventory': 'ದಾಸ್ತಾನಿನಲ್ಲಿ ಯಾವುದೇ ಐಟಂಗಳಿಲ್ಲ. ಪ್ರಾರಂಭಿಸಲು ಕೆಲವು ಉತ್ಪನ್ನಗಳನ್ನು ಸೇರಿಸಿ!',
    confirmDelete: 'ಅಳಿಸುವುದನ್ನು ಖಚಿತಪಡಿಸಿ',
    deleteWarning: 'ಈ ಐಟಂ ಅನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ? ಈ ಕ್ರಿಯೆಯನ್ನು ಹಿಂಪಡೆಯಲು ಸಾಧ್ಯವಿಲ್ಲ.',
    cancel: 'ರದ್ದುಮಾಡಿ',
    delete: 'ಅಳಿಸಿ',
    approvals: 'ಅನುಮೋದನೆಗಳು',
    // Common Products
    'Organic Apples': 'ಸಾವಯವ ಸೇಬುಗಳು',
    'Fresh and organic': 'ತಾಜಾ ಮತ್ತು ಸಾವಯವ'
  },
  Tamil: {
    inventory: 'சரக்கு',
    distributors: 'விநியோகஸ்தர்கள்',
    nearbyShops: 'அருகிலுள்ள கடைகள்',
    businessOwners: 'வணிக உரிமையாளர்கள்',
    newInvoice: 'புதிய விலைப்பட்டியல்',
    inventoryManagement: 'சரக்கு மேலாண்மை',
    distributorManagement: 'விநியோகஸ்தர் மேலாண்மை',
    businessOwnerPortal: 'வணிக உரிமையாளர் போர்டல்',
    storeManager: 'கடை மேலாளர்',
    email: 'மின்னஞ்சல்',
    role: 'பங்கு',
    memberSince: 'உறுப்பினர் முதல்',
    theme: 'தீம்',
    language: 'மொழி',
    logout: 'வெளியேறு',
    totalProducts: 'மொத்த தயாரிப்புகள்',
    totalItemsInStock: 'கையிருப்பில் உள்ள மொத்த பொருட்கள்',
    totalInventoryValue: 'மொத்த இருப்பு மதிப்பு',
    darkMode: 'இருண்ட பயன்முறை',
    lightMode: 'ஒளி பயன்முறை',
    administrator: 'நிர்வாகி',
    addNewProduct: 'புதிய தயாரிப்பைச் சேர்',
    editProduct: 'தயாரிப்பைத் திருத்து',
    productName: 'தயாரிப்பு பெயர்',
    category: 'வகை',
    description: 'விளக்கம்',
    imageLabel: 'படம் (URL அல்லது கோப்பு)',
    upload: 'பதிவேற்றவும்',
    quantity: 'அளவு',
    price: 'விலை (₹)',
    currentInventory: 'தற்போதைய இருப்பு',
    searchItems: 'பொருட்களைத் தேடு...',
    allCategories: 'அனைத்து பிரிவுகள்',
    allStatuses: 'அனைத்து நிலைகள்',
    image: 'படம்',
    product: 'தயாரிப்பு',
    status: 'நிலை',
    qty: 'அளவு',
    actions: 'செயல்கள்',
    inStock: 'கையிருப்பில் உள்ளது',
    lowStock: 'குறைந்த இருப்பு',
    outOfStock: 'கையிருப்பு இல்லை',
    cancelEdit: 'ரத்து செய்',
    updateProduct: 'புதுப்பிக்கவும்',
    addProduct: 'சேர்க்கவும்',
    // Categories
    'Produce': 'காய்கறிகள் & பழங்கள்',
    'Dairy & Eggs': 'பால் மற்றும் முட்டை',
    'Meat & Seafood': 'இறைச்சி மற்றும் மீன்',
    'Bakery': 'பேக்கரி',
    'Pantry': 'மளிகை பொருட்கள்',
    'Beverages': 'பானங்கள்',
    'Snacks': 'தின்பண்டங்கள்',
    'Other': 'மற்றவை',
    'Uncategorized': 'வகைப்படுத்தப்படாதவை',
    // Messages
    'noItemsMatch': 'உங்கள் தேடலுக்கு எந்த பொருட்களும் பொருந்தவில்லை.',
    'noItemsInInventory': 'இருப்பில் பொருட்கள் இல்லை. தொடங்க சிலவற்றைச் சேர்க்கவும்!',
    confirmDelete: 'நீக்குவதை உறுதிப்படுத்து',
    deleteWarning: 'இந்த உருப்படியை நிச்சயமாக நீக்க விரும்புகிறீர்களா? இந்தச் செயலைத் திரும்பப் பெற முடியாது.',
    cancel: 'ரத்துசெய்',
    delete: 'நீக்கு',
    approvals: 'அங்கீகாரங்கள்',
    // Common Products
    'Organic Apples': 'ஆர்கானிக் ஆப்பிள்கள்',
    'Fresh and organic': 'புதிய மற்றும் ஆர்கானிக்'
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('appLanguage') || 'English';
  });

  const t = (key) => {
    return translations[language]?.[key] || translations['English'][key] || key;
  };

  const toggleLanguage = () => {
    const langs = ['English', 'Kannada', 'Tamil'];
    const currentIndex = langs.indexOf(language);
    const newLang = langs[(currentIndex + 1) % langs.length];
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
