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

// Đọc dữ liệu đơn lẻ từ IndexedDB
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

// Ghi dữ liệu đơn lẻ vào IndexedDB — Lắng nghe tx.oncomplete để đảm bảo dữ liệu ghi 100% xuống đĩa
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

// ======================== GIẢI PHÁP CHUYÊN DỤNG CHO DƯỢC QUỐC GIA (CHUNKED STORAGE) ========================
// Lưu 52.000 thuốc chia thành các gói nhỏ (mỗi gói 2.000 thuốc) để LevelDB không bị nghẽn/vượt hạn mức single-object
const NAT_CHUNK_SIZE = 2000;

async function idbSaveNationalChunked(nationalArray) {
  const db = await ensureDb();
  if (!db) return false;

  const total = nationalArray.length;
  const numChunks = Math.ceil(total / NAT_CHUNK_SIZE);

  try {
    // 1. Lưu metadata: số lượng phần và tổng số bản ghi
    await idbSetItem('national_meta', {
      total,
      numChunks,
      updatedAt: new Date().toISOString()
    });

    // 2. Lưu từng chunk vào IndexedDB trong các transaction độc lập để giải phóng RAM ngay lập tức
    for (let c = 0; c < numChunks; c++) {
      const start = c * NAT_CHUNK_SIZE;
      const end = Math.min(start + NAT_CHUNK_SIZE, total);
      const chunkData = nationalArray.slice(start, end);
      const chunkKey = `nat_chunk_${c}`;

      await new Promise((resolve, reject) => {
        const tx = db.transaction([IDB_STORE], 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
        store.put(chunkData, chunkKey);
      });
      // Nhả event loop để UI không bị đơ
      await new Promise(r => setTimeout(r, 0));
    }

    // 3. Xóa các chunk cũ thừa (nếu lần lưu trước có nhiều chunk hơn)
    let extra = numChunks;
    while (true) {
      const extraKey = `nat_chunk_${extra}`;
      const existing = await idbGetItem(extraKey);
      if (existing === undefined) break;
      await idbDeleteItem(extraKey);
      extra++;
    }

    console.log(`✅ Đã lưu ${total.toLocaleString('vi-VN')} thuốc quốc gia thành công thành ${numChunks} gói độc lập vào IndexedDB!`);
    return true;
  } catch (err) {
    console.error('Lỗi khi lưu national theo chunks:', err);
    return false;
  }
}

// Nạp lại toàn bộ 52.000 thuốc từ các chunk
async function idbLoadNationalChunked() {
  const db = await ensureDb();
  if (!db) return null;

  try {
    // Kiểm tra metadata
    const meta = await idbGetItem('national_meta');
    if (meta && meta.numChunks > 0) {
      const result = [];
      for (let c = 0; c < meta.numChunks; c++) {
        const chunkData = await idbGetItem(`nat_chunk_${c}`);
        if (Array.isArray(chunkData)) {
          for (let i = 0; i < chunkData.length; i++) {
            result.push(chunkData[i]);
          }
        }
      }
      if (result.length > 0) {
        console.log(`✅ Đã nạp thành công ${result.length.toLocaleString('vi-VN')} thuốc DQG từ ${meta.numChunks} gói Chunk IndexedDB!`);
        return result;
      }
    }

    // Dự phòng: Nếu là dữ liệu phiên bản cũ chưa chunk
    const legacy = await idbGetItem('national');
    if (Array.isArray(legacy) && legacy.length > 0) {
      // Tự động chuyển đổi sang dạng chunk cho các lần sau
      idbSaveNationalChunked(legacy).catch(() => {});
      return legacy;
    }

    return null;
  } catch (err) {
    console.error('Lỗi khi đọc national theo chunks:', err);
    return null;
  }
}

// Xóa toàn bộ dữ liệu DQG
async function idbClearNational() {
  const meta = await idbGetItem('national_meta');
  if (meta && meta.numChunks > 0) {
    for (let c = 0; c < meta.numChunks; c++) {
      await idbDeleteItem(`nat_chunk_${c}`);
    }
  }
  await idbDeleteItem('national_meta');
  await idbDeleteItem('national');
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

    // 2. Dự phòng ghi vào LocalStorage (chỉ các mục nhỏ, TUYỆT ĐỐI không ghi national 52.000 dòng để tránh tràn 5MB)
    if (k !== 'national') {
      try {
        localStorage.setItem('pi_' + k, JSON.stringify(v));
      } catch (lsErr) {}
    }

    // 3. Ghi bền vững vào IndexedDB
    if (k === 'national') {
      // Dùng giải pháp Chunked Storage tối ưu cho 52.000 thuốc
      const success = await idbSaveNationalChunked(v);
      return success;
    } else {
      const success = await idbSetItem(k, v);
      return success;
    }
  },

  // Nạp toàn bộ dữ liệu từ IndexedDB lúc mở app / refresh trang
  initAndMigrate: async () => {
    if (DB.readyPromise) return DB.readyPromise;

    DB.readyPromise = (async () => {
      await ensureDb();

      // 1. Nạp danh mục Dược Quốc Gia theo cơ chế Chunked Storage
      const natLoaded = await idbLoadNationalChunked();
      if (Array.isArray(natLoaded) && natLoaded.length > 0) {
        national = natLoaded;
        memoryCache['national'] = natLoaded;
      }

      // 2. Nạp các khóa dữ liệu còn lại
      const keys = ['catalog', 'suppliers', 'records', 'settings', 'apikey', 'pricelist', 'lookup_history'];
      
      for (const k of keys) {
        const idbVal = await idbGetItem(k);
        if (idbVal !== undefined && idbVal !== null) {
          memoryCache[k] = idbVal;
          if (k === 'catalog') catalog = idbVal;
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

      console.log(`✅ IndexedDB đã sẵn sàng! Đã nạp ${national.length.toLocaleString('vi-VN')} thuốc DQG, ${records.length} phiếu nhập, ${priceList.length} giá thuốc.`);
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
