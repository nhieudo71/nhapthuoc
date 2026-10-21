// ======================== DATA & INDEXEDDB STORAGE (TỐI ĐA 5GB) ========================

const IDB_NAME = 'PharmImport_IndexedDB';
const IDB_VERSION = 1;
const IDB_STORE = 'app_data';

let idbDatabase = null;
const memoryCache = {};

// Khởi tạo IndexedDB Promise-based wrapper
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.warn('Trình duyệt không hỗ trợ IndexedDB. Sử dụng LocalStorage dự phòng.');
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };

    request.onsuccess = (event) => {
      idbDatabase = event.target.result;
      // Yêu cầu quyền lưu trữ bền vững (Persistent Storage) lên đến 5GB+
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then(persistent => {
          if (persistent) console.log('✅ IndexedDB đã bật chế độ lưu trữ bền vững (Persistent Storage).');
        }).catch(() => {});
      }
      resolve(idbDatabase);
    };

    request.onerror = (event) => {
      console.error('Lỗi mở IndexedDB:', event.target.error);
      resolve(null);
    };
  });
}

// Đọc dữ liệu từ IndexedDB
function idbGetItem(key) {
  return new Promise((resolve) => {
    if (!idbDatabase) {
      resolve(undefined);
      return;
    }
    try {
      const tx = idbDatabase.transaction([IDB_STORE], 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    } catch (e) {
      resolve(undefined);
    }
  });
}

// Ghi dữ liệu vào IndexedDB
function idbSetItem(key, value) {
  return new Promise((resolve) => {
    if (!idbDatabase) {
      resolve(false);
      return;
    }
    try {
      const tx = idbDatabase.transaction([IDB_STORE], 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => {
        console.error('Lỗi ghi IndexedDB:', e);
        resolve(false);
      };
    } catch (e) {
      resolve(false);
    }
  });
}

// Xóa dữ liệu trong IndexedDB
function idbDeleteItem(key) {
  return new Promise((resolve) => {
    if (!idbDatabase) {
      resolve(false);
      return;
    }
    try {
      const tx = idbDatabase.transaction([IDB_STORE], 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}

// Xóa toàn bộ store trong IndexedDB
function idbClearStore() {
  return new Promise((resolve) => {
    if (!idbDatabase) {
      resolve(false);
      return;
    }
    try {
      const tx = idbDatabase.transaction([IDB_STORE], 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}

// ======================== UNIFIED STORAGE DB INTERFACE ========================
// Đồng bộ 2 lớp: Cache RAM tức thì + LocalStorage dự phòng + IndexedDB (lưu trữ 5GB)
const DB = {
  get: (k, d) => {
    if (memoryCache[k] !== undefined) return memoryCache[k];
    try {
      const item = localStorage.getItem('pi_' + k);
      const val = item !== null ? JSON.parse(item) : d;
      memoryCache[k] = val;
      return val;
    } catch (e) {
      memoryCache[k] = d;
      return d;
    }
  },
  set: (k, v) => {
    // 1. Cập nhật Cache RAM
    memoryCache[k] = v;

    // 2. Tự động ghi vào IndexedDB (Hỗ trợ dung lượng lớn lên đến 5GB)
    idbSetItem(k, v).catch(err => console.warn('Lỗi ghi IndexedDB cho key:', k, err));

    // 3. Dự phòng ghi vào LocalStorage nếu kích thước nhỏ (tránh lỗi quota)
    try {
      // Đối với national (Dược Quốc Gia) kích thước lớn, ưu tiên IndexedDB để tránh tràn LocalStorage 5MB
      if (k !== 'national') {
        localStorage.setItem('pi_' + k, JSON.stringify(v));
      }
      return true;
    } catch (e) {
      console.info(`Dữ liệu "${k}" lớn đã được lưu an toàn trong IndexedDB.`);
      return true;
    }
  },
  // Nạp toàn bộ dữ liệu từ IndexedDB lúc khởi động ứng dụng
  initAndMigrate: async () => {
    await openIndexedDB();
    if (!idbDatabase) return;

    const keys = ['catalog', 'national', 'suppliers', 'records', 'settings', 'apikey', 'pricelist', 'lookup_history'];
    let needsUiUpdate = false;

    for (const k of keys) {
      const idbVal = await idbGetItem(k);
      if (idbVal !== undefined && idbVal !== null) {
        // Có dữ liệu trong IndexedDB
        memoryCache[k] = idbVal;
        if (k === 'catalog') catalog = idbVal;
        if (k === 'national') national = idbVal;
        if (k === 'suppliers') suppliers = idbVal;
        if (k === 'records') records = idbVal;
        if (k === 'pricelist') priceList = idbVal;
        if (k === 'settings') settings = idbVal;
        if (k === 'apikey') apiKey = idbVal;
        needsUiUpdate = true;
      } else {
        // Chưa có trong IndexedDB -> Tự động chuyển giao (Migrate) từ LocalStorage sang IndexedDB
        try {
          const lsItem = localStorage.getItem('pi_' + k);
          if (lsItem !== null) {
            const parsed = JSON.parse(lsItem);
            await idbSetItem(k, parsed);
            memoryCache[k] = parsed;
            if (k === 'catalog') catalog = parsed;
            if (k === 'national') national = parsed;
            if (k === 'suppliers') suppliers = parsed;
            if (k === 'records') records = parsed;
            if (k === 'pricelist') priceList = parsed;
            if (k === 'settings') settings = parsed;
            if (k === 'apikey') apiKey = parsed;
            needsUiUpdate = true;
          }
        } catch (migErr) {}
      }
    }

    // Cập nhật lại số lượng và thống kê nếu có dữ liệu mới từ IndexedDB
    if (needsUiUpdate) {
      if (typeof updateRecordCount === 'function') updateRecordCount();
      const countPriceEl = document.getElementById('price-count');
      if (countPriceEl) countPriceEl.textContent = priceList.length;
      const countCatEl = document.getElementById('cat-count');
      if (countCatEl) countCatEl.textContent = catalog.length;
      const countNatEl = document.getElementById('nat-count');
      if (countNatEl) countNatEl.textContent = national.length;
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
let priceList = DB.get('pricelist', []);

let currentItems = [];
let currentRecordIdx = -1;
let editingRecordIdx = -1;
