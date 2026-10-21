// ======================== DATA & STORAGE ========================
const DB = {
  get: (k, d) => {
    try {
      const item = localStorage.getItem('pi_' + k);
      return item !== null ? JSON.parse(item) : d;
    } catch (e) {
      console.warn('Lỗi đọc localStorage:', k, e);
      return d;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem('pi_' + k, JSON.stringify(v));
      return true;
    } catch (e) {
      console.error('Lỗi ghi localStorage:', k, e);
      return false;
    }
  }
};

// Global State
let catalog = DB.get('catalog', []);
let national = DB.get('national', []);
let suppliers = DB.get('suppliers', []);
let records = DB.get('records', []);
let settings = DB.get('settings', { name: '', shopcode: '', keeper: '', supplier: '' });
let apiKey = DB.get('apikey', '');
let priceList = DB.get('pricelist', []); // Bảng giá thuốc: [{stt, name, importPrice, price, note, updatedAt}]

let currentItems = [];
let currentRecordIdx = -1;
let editingRecordIdx = -1;

