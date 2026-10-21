// ======================== DATA & INDEXEDDB STORAGE (TỐI ĐA 5GB) ========================

const IDB_NAME = 'PharmImport_IndexedDB';
const IDB_VERSION = 1;
const IDB_STORE = 'app_data';

let idbDatabase = null;
let idbOpenPromise = null;
const memoryCache = {};

// Tự động mở IndexedDB ngay khi tải file script
function openIndexedDB() {
  if (idbOpenPromise) return idbOpenPromise;

  idbOpenPromise = new Promise((resolve) => {
    if (!window.indexedDB) {
      console.warn('Trình duyệt không hỗ trợ IndexedDB. Sử dụng LocalStorage dự phòng.');
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };

      request.onsuccess = (event) => {
        idbDatabase = event.target.result;
        // Bật Persistent Storage để trình duyệt không tự xóa khi thiếu bộ nhớ
        if (navigator.storage && navigator.storage.persist) {
          navigator.storage.persist().then(p => {
            if (p) console.log('✅ IndexedDB đã bật chế độ lưu trữ bền vững (Persistent Storage).');
          }).catch(() => {});
        }
        resolve(idbDatabase);
      };

      request.onerror = (event) => {
        console.error('Lỗi mở IndexedDB:', event.target.error);
        resolve(null);
      };
    } catch (e) {
      console.error('Lỗi ngoại lệ khi mở IndexedDB:', e);
      resolve(null);
    }
  });

  return idbOpenPromise;
}

// Bắt đầu mở DB ngay lập tức
openIndexedDB();

// Đảm bảo DB luôn sẵn sàng trước khi đọc/ghi
async function ensureDb() {
  if (idbDatabase) return idbDatabase;
  return await openIndexedDB();
}

// Đọc dữ liệu từ IndexedDB
function idbGetItem(key) {
  return new Promise(async (resolve) => {
    const db = await ensureDb();
    if (!db) {
      resolve(undefined);
      return;
    }
    try {
      const tx = db.transaction([IDB_STORE], 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    } catch (e) {
      console.error('Lỗi đọc idbGetItem:', e);
      resolve(undefined);
    }
  });
}

// Ghi dữ liệu vào IndexedDB — Lắng nghe tx.oncomplete để đảm bảo dữ liệu ghi 100% xuống đĩa
function idbSetItem(key, value) {
  return new Promise(async (resolve) => {
    const db = await ensureDb();
    if (!db) {
      resolve(false);
      return;
    }
    try {
      const tx = db.transaction([IDB_STORE], 'readwrite');
      const store = tx.objectStore(IDB_STORE);

      // Quan trọng: Chỉ resolve khi transaction đã COMMIT THÀNH CÔNG xuống ổ đĩa
      tx.oncomplete = () => {
        resolve(true);
      };
      tx.onerror = (e) => {
        console.error(`Lỗi transaction IndexedDB khi lưu "${key}":`, tx.error || e);
        resolve(false);
      };
      tx.onabort = (e) => {
        console.error(`Transaction IndexedDB bị abort khi lưu "${key}":`, tx.error || e);
        resolve(false);
      };

      store.put(value, key);
    } catch (e) {
      console.error(`Lỗi ngoại lệ ghi idbSetItem cho "${key}":`, e);
      resolve(false);
    }
  });
}

// Xóa dữ liệu trong IndexedDB
function idbDeleteItem(key) {
  return new Promise(async (resolve) => {
    const db = await ensureDb();
    if (!db) {
      resolve(false);
      return;
    }
    try {
      const tx = db.transaction([IDB_STORE], 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      store.delete(key);
    } catch (e) {
      resolve(false);
    }
  });
}

// Xóa toàn bộ store trong IndexedDB
function idbClearStore() {
  return new Promise(async (resolve) => {
    const db = await ensureDb();
    if (!db) {
      resolve(false);
      return;
    }
    try {
      const tx = db.transaction([IDB_STORE], 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      store.clear();
    } catch (e) {
      resolve(false);
    }
  });
}

// ======================== UNIFIED STORAGE DB INTERFACE ========================
// Đồng bộ 3 lớp: Cache RAM tức thì + IndexedDB (lưu trữ 5GB) + LocalStorage dự phòng
const DB = {
  isReady: false,
  readyPromise: null,

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

  // set trả về Promise để các tác vụ lớn (như import 52.000 thuốc) có thể await đảm bảo ghi xong
  set: async (k, v) => {
    // 1. Cập nhật ngay vào RAM Cache để UI dùng lập tức
    memoryCache[k] = v;

    // 2. Dự phòng ghi vào LocalStorage (chỉ các mục nhỏ, không ghi national 52.000 dòng để tránh tràn 5MB)
    if (k !== 'national') {
      try {
        localStorage.setItem('pi_' + k, JSON.stringify(v));
      } catch (lsErr) {}
    }

    // 3. Ghi bền vững vào IndexedDB (lắng nghe tx.oncomplete)
    const success = await idbSetItem(k, v);
    return success;
  },

  // Nạp toàn bộ dữ liệu từ IndexedDB lúc mở app / refresh trang
  initAndMigrate: async () => {
    if (DB.readyPromise) return DB.readyPromise;

    DB.readyPromise = (async () => {
      await ensureDb();
      const keys = ['catalog', 'national', 'suppliers', 'records', 'settings', 'apikey', 'pricelist', 'lookup_history'];
      
      for (const k of keys) {
        const idbVal = await idbGetItem(k);
        if (idbVal !== undefined && idbVal !== null) {
          // Nạp dữ liệu từ IndexedDB vào RAM Cache và các biến toàn cục
          memoryCache[k] = idbVal;
          if (k === 'catalog') catalog = idbVal;
          if (k === 'national') national = idbVal;
          if (k === 'suppliers') suppliers = idbVal;
          if (k === 'records') records = idbVal;
          if (k === 'pricelist') priceList = idbVal;
          if (k === 'settings') settings = idbVal;
          if (k === 'apikey') apiKey = idbVal;
        } else {
          // Chưa có trong IndexedDB -> Tự động chuyển giao từ LocalStorage sang
          try {
            const lsItem = localStorage.getItem('pi_' + k);
            if (lsItem !== null) {
              const parsed = JSON.parse(lsItem);
              memoryCache[k] = parsed;
              if (k === 'catalog') catalog = parsed;
              if (k === 'national') national = parsed;
              if (k === 'suppliers') suppliers = parsed;
              if (k === 'records') records = parsed;
              if (k === 'pricelist') priceList = parsed;
              if (k === 'settings') settings = parsed;
              if (k === 'apikey') apiKey = parsed;
              await idbSetItem(k, parsed);
            }
          } catch (migErr) {}
        }
      }

      DB.isReady = true;

      // Cập nhật lại giao diện ngay sau khi nạp xong dữ liệu từ IndexedDB
      if (typeof updateRecordCount === 'function') updateRecordCount();
      const countPriceEl = document.getElementById('price-count');
      if (countPriceEl) countPriceEl.textContent = priceList.length;
      const countCatEl = document.getElementById('cat-count');
      if (countCatEl) countCatEl.textContent = catalog.length;
      const countNatEl = document.getElementById('nat-count');
      if (countNatEl) countNatEl.textContent = national.length.toLocaleString('vi-VN');

      // Nếu người dùng đang ở tab national, render lại danh sách ngay lập tức!
      const natPageEl = document.getElementById('page-national');
      if (natPageEl && natPageEl.classList.contains('active') && typeof renderNational === 'function') {
        renderNational();
      }
      const pricePageEl = document.getElementById('page-pricelist');
      if (pricePageEl && pricePageEl.classList.contains('active') && typeof renderPriceList === 'function') {
        renderPriceList();
      }
      const catPageEl = document.getElementById('page-catalog');
      if (catPageEl && catPageEl.classList.contains('active') && typeof renderCatalog === 'function') {
        renderCatalog();
      }
      const recPageEl = document.getElementById('page-records');
      if (recPageEl && recPageEl.classList.contains('active') && typeof renderRecords === 'function') {
        renderRecords();
        renderStats();
      }

      console.log(`✅ IndexedDB đã sẵn sàng! Đã nạp ${national.length} thuốc DQG, ${records.length} phiếu nhập, ${priceList.length} giá thuốc.`);
      return true;
    })();

    return DB.readyPromise;
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
