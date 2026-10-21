// ======================== BACKUP, RESTORE & SETTINGS ========================

function backupData() {
  const data = {
    catalog,
    national,
    suppliers,
    records,
    settings,
    pricelist: priceList,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `pharmimport_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  toast('Đã xuất file sao lưu dữ liệu!', 'success');
}

function restoreData(input) {
  const file = input.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!confirm(`Phục hồi dữ liệu từ ${data.exportedAt || 'file này'}?\nSẽ ghi đè toàn bộ dữ liệu hiện tại!`)) return;
      catalog = data.catalog || [];
      national = data.national || [];
      suppliers = data.suppliers || [];
      records = data.records || [];
      settings = data.settings || {};
      priceList = data.pricelist || [];

      DB.set('catalog', catalog);
      DB.set('national', national);
      DB.set('suppliers', suppliers);
      DB.set('records', records);
      DB.set('settings', settings);
      DB.set('pricelist', priceList);

      updateRecordCount();
      renderStorageInfo();
      toast('Phục hồi dữ liệu thành công!', 'success');
    } catch (err) {
      toast('File sao lưu không hợp lệ', 'error');
    }
  };
  r.readAsText(file);
  input.value = '';
}

async function clearAllData() {
  if (!prompt('Nhập "XOA" để xác nhận xóa toàn bộ dữ liệu:')?.includes('XOA')) return;
  catalog = [];
  national = [];
  suppliers = [];
  records = [];
  priceList = [];
  ['catalog', 'national', 'suppliers', 'records', 'pricelist', 'lookup_history'].forEach(k => {
    localStorage.removeItem('pi_' + k);
  });
  if (typeof idbClearStore === 'function') {
    await idbClearStore();
  }
  updateRecordCount();
  renderStorageInfo();
  toast('Đã xóa toàn bộ dữ liệu trên IndexedDB và LocalStorage!', 'info');
}

async function renderStorageInfo() {
  let size = 0;
  for (let k in localStorage) {
    if (k.startsWith('pi_')) size += localStorage[k].length;
  }
  
  let usedText = `${(size / 1024).toFixed(1)} KB (LocalStorage)`;
  let quotaText = 'IndexedDB (Tối đa 5GB+)';

  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
      const quotaGB = (estimate.quota / (1024 * 1024 * 1024)).toFixed(1);
      usedText = `${usedMB} MB`;
      quotaText = `${quotaGB} GB khả dụng (IndexedDB)`;
    } catch (e) {}
  }

  const el = document.getElementById('storage-info');
  if (!el) return;
  el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px">
    <div><div class="info-label">Phiếu nhập</div><div class="info-value">${records.length}</div></div>
    <div><div class="info-label">Bảng giá thuốc</div><div class="info-value">${priceList.length}</div></div>
    <div><div class="info-label">Danh mục quầy</div><div class="info-value">${catalog.length}</div></div>
    <div><div class="info-label">Dược quốc gia</div><div class="info-value">${national.length.toLocaleString('vi-VN')}</div></div>
    <div><div class="info-label">Nhà cung cấp</div><div class="info-value">${suppliers.length}</div></div>
    <div><div class="info-label">Đã sử dụng</div><div class="info-value text-mono" style="color:var(--accent2)">${usedText}</div></div>
    <div><div class="info-label">Dung lượng tối đa</div><div class="info-value text-mono" style="color:var(--blue2)">${quotaText}</div></div>
  </div>`;
}

function loadSettings() {
  document.getElementById('s-name').value = settings.name || '';
  document.getElementById('s-shopcode').value = settings.shopcode || '';
  document.getElementById('s-keeper').value = settings.keeper || '';
  document.getElementById('s-supplier').value = settings.supplier || '';
  document.getElementById('s-apikey').value = DB.get('apikey', '') || '';
  const isDark = currentTheme === 'dark';
  const bd = document.getElementById('btn-dark');
  const bl = document.getElementById('btn-light');
  if (bd) bd.className = 'btn ' + (isDark ? 'btn-primary' : 'btn-outline');
  if (bl) bl.className = 'btn ' + (isDark ? 'btn-outline' : 'btn-primary');
}

function saveSettings() {
  settings = {
    name: document.getElementById('s-name')?.value || '',
    shopcode: document.getElementById('s-shopcode')?.value || '',
    keeper: document.getElementById('s-keeper')?.value || '',
    supplier: document.getElementById('s-supplier')?.value || ''
  };
  DB.set('settings', settings);
  toast('Đã lưu cài đặt!', 'success');
}

function saveAPIKey() {
  apiKey = cleanApiKey(document.getElementById('s-apikey')?.value);
  document.getElementById('s-apikey').value = apiKey;
  DB.set('apikey', apiKey);
  const resultBox = document.getElementById('apikey-test-result');
  if (resultBox) resultBox.innerHTML = '';
  toast('Đã lưu API Key!', 'success');
}

async function testAPIKey() {
  const key = cleanApiKey(document.getElementById('s-apikey')?.value) || apiKey || DB.get('apikey', '');
  const box = document.getElementById('apikey-test-result');
  if (!key) {
    if (box) box.innerHTML = '<span style="color:var(--red)">⚠️ Vui lòng nhập API Key trước khi kiểm tra.</span>';
    return;
  }
  const btn = document.getElementById('btn-test-key');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Đang kiểm tra...';
  }
  if (box) box.innerHTML = '<span style="color:var(--text3)">Đang gửi yêu cầu thử đến Gemini...</span>';
  const originalKey = apiKey;
  apiKey = key;
  try {
    await callGeminiAI([{ text: 'ping' }]);
    if (box) box.innerHTML = '<span style="color:var(--accent)">✅ API Key hợp lệ và hoạt động tốt!</span>';
  } catch (e) {
    const msg = e.message || '';
    let hint = '';
    if (/API key not valid|API_KEY_INVALID/i.test(msg)) {
      hint = 'Key không hợp lệ. Kiểm tra: (1) đã copy đủ, không thừa khoảng trắng; (2) key từ Google AI Studio; (3) key chưa bị xóa.';
    } else if (/PERMISSION_DENIED|403/i.test(msg)) {
      hint = 'Key bị giới hạn quyền truy cập theo domain/IP. Kiểm tra lại giới hạn trong AI Studio.';
    } else if (/RESOURCE_EXHAUSTED|quota|429/i.test(msg)) {
      hint = 'Đã hết quota miễn phí. Vui lòng đợi hoặc tạo key từ tài khoản Google khác.';
    } else if (/high demand|overloaded|503|UNAVAILABLE/i.test(msg)) {
      hint = 'Gemini AI đang quá tải tạm thời. Vui lòng thử lại sau.';
    }
    if (box) box.innerHTML = `<span style="color:var(--red)">❌ Lỗi: ${esc(msg)}</span>${hint ? `<div style="margin-top:6px;color:var(--text2)">💡 ${hint}</div>` : ''}`;
  } finally {
    apiKey = originalKey;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '🔍 Kiểm tra Key';
    }
  }
}

