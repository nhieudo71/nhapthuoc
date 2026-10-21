// ======================== MODULE TRA CỨU MÃ HÓA ĐƠN ========================

// Danh sách 14 nhà cung cấp hóa đơn điện tử lớn nhất tại Việt Nam
const INVOICE_PROVIDERS = [
  {
    id: 'gdt',
    name: 'Tổng Cục Thuế (HĐĐT Toàn Quốc)',
    badge: 'Toàn quốc',
    icon: '🏛️',
    lookupUrl: 'https://hoadondientu.gdt.gov.vn',
    guide: 'Tra cứu mọi hóa đơn hợp pháp trên cổng Tổng cục Thuế bằng MST bên bán, Ký hiệu và Số HĐ.',
    fields: ['sellerTax', 'code', 'invoiceNum']
  },
  {
    id: 'vnpt',
    name: 'VNPT-Invoice (Tập đoàn VNPT)',
    badge: 'Phổ biến nhất',
    icon: '🌐',
    lookupUrl: 'https://tracuuhddt.vnpt-invoice.com.vn',
    guide: 'Nhập Mã tra cứu / Fkey được in ở góc dưới hoặc bên phải hóa đơn VNPT.',
    fields: ['code']
  },
  {
    id: 'viettel',
    name: 'Viettel S-Invoice (Tập đoàn Viettel)',
    badge: 'Phổ biến nhất',
    icon: '📶',
    lookupUrl: 'https://business-sinvoice.viettel.vn/tra-cuu-hoa-don',
    guide: 'Nhập Mã số thuế bên bán và Mã số bí mật (in trên hóa đơn Viettel).',
    fields: ['sellerTax', 'code']
  },
  {
    id: 'misa',
    name: 'MISA meInvoice (Công ty MISA)',
    badge: 'Phổ biến',
    icon: '📊',
    lookupUrl: 'https://www.meinvoice.vn/tra-cuu',
    guide: 'Nhập Mã tra cứu hóa đơn in ở chân trang hóa đơn MISA.',
    fields: ['code']
  },
  {
    id: 'bkav',
    name: 'BKAV eHoadon (Tập đoàn BKAV)',
    badge: 'Phổ biến',
    icon: '🛡️',
    lookupUrl: 'https://van.ehoadon.vn/TraCuuHoaDon',
    guide: 'Nhập Mã tra cứu hóa đơn gồm chữ và số in trên hóa đơn BKAV.',
    fields: ['code']
  },
  {
    id: 'easyinvoice',
    name: 'EasyInvoice (Softdreams)',
    badge: 'Dược/Bán buôn',
    icon: '⚡',
    lookupUrl: 'https://tracuu.easyinvoice.vn',
    guide: 'Nhập Mã tra cứu hóa đơn EasyInvoice từ bên bán dược phẩm cung cấp.',
    fields: ['code']
  },
  {
    id: 'thaison',
    name: 'Thái Sơn E-Invoice',
    badge: 'Doanh nghiệp',
    icon: '📑',
    lookupUrl: 'https://einvoice.vn/tra-cuu',
    guide: 'Nhập Mã nhận hóa đơn hoặc Mã số bí mật.',
    fields: ['code']
  },
  {
    id: 'cyberbill',
    name: 'CyberBill',
    badge: 'Thương mại',
    icon: '💻',
    lookupUrl: 'https://tracuu.cyberbill.vn',
    guide: 'Nhập Mã tra cứu trên hóa đơn CyberBill.',
    fields: ['code']
  },
  {
    id: 'matbao',
    name: 'Mắt Bão CyberInvoice',
    badge: 'Thương mại',
    icon: '👁️',
    lookupUrl: 'https://cyberinvoice.vn/tra-cuu-hoa-don',
    guide: 'Nhập Mã tra cứu hóa đơn của Mắt Bão.',
    fields: ['code']
  },
  {
    id: 'fpt',
    name: 'FPT.eInvoice (Tập đoàn FPT)',
    badge: 'Doanh nghiệp',
    icon: '🏢',
    lookupUrl: 'https://einvoice.fpt.com.vn/tra-cuu',
    guide: 'Nhập Mã tra cứu hoặc Số hóa đơn FPT.',
    fields: ['code']
  },
  {
    id: 'minvoice',
    name: 'M-Invoice',
    badge: 'Dược/DN',
    icon: '🧾',
    lookupUrl: 'https://tracuu.minvoice.vn',
    guide: 'Nhập Mã bảo mật / Mã tra cứu M-Invoice.',
    fields: ['code']
  },
  {
    id: 'mobifone',
    name: 'MobiFone Invoice',
    badge: 'Viễn thông',
    icon: '📱',
    lookupUrl: 'https://hoadon.mobifone.vn/tra-cuu-hoa-don',
    guide: 'Nhập Mã tra cứu in trên hóa đơn MobiFone.',
    fields: ['code']
  },
  {
    id: 'vnpay',
    name: 'VNPAY Invoice',
    badge: 'Tài chính',
    icon: '💳',
    lookupUrl: 'https://hoadondientu.vnpay.vn',
    guide: 'Nhập Mã tra cứu trên hóa đơn VNPAY.',
    fields: ['code']
  },
  {
    id: 'viinvoice',
    name: 'Vi-Invoice',
    badge: 'Doanh nghiệp',
    icon: '📋',
    lookupUrl: 'https://vi-invoice.vn/tra-cuu',
    guide: 'Nhập Mã tra cứu hóa đơn Vi-Invoice.',
    fields: ['code']
  }
];

// Lịch sử tra cứu gần đây lưu trong LocalStorage
function getLookupHistory() {
  return DB.get('lookup_history', []);
}

function saveToLookupHistory(code, providerId, sellerTax = '') {
  if (!code) return;
  let history = getLookupHistory();
  // Loại bỏ trùng
  history = history.filter(h => h.code !== code || h.providerId !== providerId);
  history.unshift({
    code,
    providerId,
    sellerTax,
    time: new Date().toISOString()
  });
  // Giữ tối đa 15 mã gần nhất
  if (history.length > 15) history = history.slice(0, 15);
  DB.set('lookup_history', history);
}

function clearLookupHistory() {
  DB.set('lookup_history', []);
  renderLookupHistory();
  toast('Đã xóa lịch sử tra cứu!', 'info');
}

// Khởi tạo và render module Tra Cứu Hóa Đơn
function renderLookupPage() {
  initProviderSelect('lookup-page-provider');
  renderProviderCards();
  renderLookupHistory();
}

// Render các thẻ chọn nhanh nhà cung cấp
function renderProviderCards() {
  const container = document.getElementById('provider-cards-grid');
  if (!container) return;
  const currentSelected = document.getElementById('lookup-page-provider')?.value || 'vnpt';

  container.innerHTML = INVOICE_PROVIDERS.map(p => {
    const isSelected = p.id === currentSelected;
    return `
      <div class="lookup-provider-card ${isSelected ? 'border-[var(--accent2)] bg-[var(--accent-light)]' : ''}" onclick="selectLookupProvider('${p.id}')">
        <div class="flex items-center justify-between mb-1">
          <span style="font-size:20px">${p.icon}</span>
          <span class="lookup-provider-badge">${p.badge}</span>
        </div>
        <div style="font-weight:700;font-size:14px;color:var(--text)">${esc(p.name)}</div>
        <div style="font-size:11.5px;color:var(--text3);margin-top:2px" class="truncate">${p.lookupUrl.replace('https://', '')}</div>
      </div>
    `;
  }).join('');
}

// Chọn nhà cung cấp từ thẻ
function selectLookupProvider(id) {
  const select = document.getElementById('lookup-page-provider');
  if (select) {
    select.value = id;
    onLookupProviderChange();
  }
}

// Đổi nhà cung cấp trong dropdown
function onLookupProviderChange() {
  const select = document.getElementById('lookup-page-provider');
  if (!select) return;
  const p = INVOICE_PROVIDERS.find(x => x.id === select.value) || INVOICE_PROVIDERS[0];
  
  const guideEl = document.getElementById('lookup-page-guide');
  if (guideEl) guideEl.textContent = p.guide;

  const mstGroup = document.getElementById('lookup-page-mst-group');
  if (mstGroup) {
    mstGroup.style.display = p.fields.includes('sellerTax') ? '' : 'none';
  }

  renderProviderCards();
}

// Khởi tạo dropdown nhà cung cấp
function initProviderSelect(selectId = 'lookup-page-provider') {
  const select = document.getElementById(selectId);
  if (!select) return;
  const currentVal = select.value || 'vnpt';
  select.innerHTML = INVOICE_PROVIDERS.map(p => 
    `<option value="${p.id}" ${p.id === currentVal ? 'selected' : ''}>${p.icon} ${p.name} [${p.badge}]</option>`
  ).join('');
  onLookupProviderChange();
}

// Render lịch sử các lần tra cứu gần đây
function renderLookupHistory() {
  const container = document.getElementById('lookup-history-list');
  if (!container) return;
  const history = getLookupHistory();

  if (!history.length) {
    container.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:8px 0">Chưa có mã hóa đơn nào được tra cứu gần đây.</div>';
    return;
  }

  container.innerHTML = history.map((item, idx) => {
    const p = INVOICE_PROVIDERS.find(x => x.id === item.providerId) || { name: item.providerId, icon: '📄' };
    const dateStr = item.time ? new Date(item.time).toLocaleDateString('vi-VN') : '';
    return `
      <div class="flex items-center justify-between p-2.5 rounded-[var(--radius)] bg-[var(--bg3)] hover:bg-[var(--bg4)] border border-[var(--border)] transition-all cursor-pointer" onclick="useHistoryItem('${esc(item.code)}', '${item.providerId}', '${esc(item.sellerTax || '')}')">
        <div class="flex items-center gap-2 min-w-0">
          <span>${p.icon}</span>
          <div class="min-w-0">
            <div style="font-weight:700;font-size:14px;color:var(--text)" class="truncate font-mono">${esc(item.code)}</div>
            <div style="font-size:11.5px;color:var(--text3)">${esc(p.name)} ${item.sellerTax ? `· MST: ${esc(item.sellerTax)}` : ''} · ${dateStr}</div>
          </div>
        </div>
        <button class="btn btn-outline btn-xs" onclick="event.stopPropagation();useHistoryItem('${esc(item.code)}', '${item.providerId}', '${esc(item.sellerTax || '')}')">
          Nạp lại ➔
        </button>
      </div>
    `;
  }).join('');
}

// Nhấn vào một mục trong lịch sử để điền vào form và nạp luôn
function useHistoryItem(code, providerId, sellerTax = '') {
  const codeInp = document.getElementById('lookup-page-code');
  if (codeInp) codeInp.value = code;
  const provSel = document.getElementById('lookup-page-provider');
  if (provSel) {
    provSel.value = providerId;
    onLookupProviderChange();
  }
  const taxInp = document.getElementById('lookup-page-mst');
  if (taxInp && sellerTax) taxInp.value = sellerTax;

  executeLookupAndLoad();
}

// ======================== THỰC THI TRA CỨU VÀ TẢI VÀO APP ========================
async function executeLookupAndLoad() {
  const codeInput = document.getElementById('lookup-page-code');
  const rawCode = (codeInput?.value || '').trim();
  const sellerTax = document.getElementById('lookup-page-mst')?.value?.trim() || '';
  const select = document.getElementById('lookup-page-provider');
  const p = INVOICE_PROVIDERS.find(x => x.id === (select?.value || 'vnpt')) || INVOICE_PROVIDERS[0];

  if (!rawCode) {
    toast('Vui lòng nhập mã hóa đơn hoặc mã tra cứu!', 'error');
    if (codeInput) codeInput.focus();
    return;
  }

  // Lưu vào lịch sử tra cứu
  saveToLookupHistory(rawCode, p.id, sellerTax);
  renderLookupHistory();

  showProgress(true, `Đang xử lý mã hóa đơn ${rawCode} từ ${p.name}...`, 40);

  // 1. Nếu dán trực tiếp XML
  if (rawCode.startsWith('<?xml') || rawCode.includes('<HDon>') || rawCode.includes('<Invoice>')) {
    try {
      showProgress(true, 'Đang đọc dữ liệu XML hóa đơn...', 70);
      const blob = new Blob([rawCode], { type: 'application/xml' });
      const file = new File([blob], 'invoice_paste.xml', { type: 'application/xml' });
      await parseXmlInvoice(file);
      showProgress(false);
      showPage('import');
      scrollToInvoiceSection();
      return;
    } catch (e) {
      showProgress(false);
      toast('Lỗi đọc XML: ' + e.message, 'error');
      return;
    }
  }

  // 2. Nếu là URL link tra cứu
  if (rawCode.startsWith('http://') || rawCode.startsWith('https://')) {
    try {
      showProgress(true, 'Đang tải hóa đơn từ đường link...', 50);
      let content = null;
      try {
        const directResp = await fetch(rawCode);
        if (directResp.ok) content = await directResp.text();
      } catch (corsErr) {
        try {
          const proxyResp = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(rawCode)}`);
          if (proxyResp.ok) content = await proxyResp.text();
        } catch (e2) {}
      }

      if (content && (content.includes('<HDon>') || content.includes('<Invoice>') || content.includes('<?xml'))) {
        const blob = new Blob([content], { type: 'application/xml' });
        const file = new File([blob], 'invoice_url.xml', { type: 'application/xml' });
        await parseXmlInvoice(file);
        showProgress(false);
        showPage('import');
        scrollToInvoiceSection();
        return;
      }
    } catch (err) {
      console.warn('Lỗi tải URL:', err);
    }
  }

  // 3. Xử lý Mã hóa đơn / Số hóa đơn
  showProgress(true, 'Đang chuẩn bị phiếu nhập cho hóa đơn...', 80);
  await sleep(200);

  let invoiceNum = rawCode;
  let itemsToLoad = [];
  let foundFromOldRecord = false;

  // Tìm trong lịch sử phiếu nhập (records)
  const existingRecord = records.find(r => 
    (r.invoiceNum && normalize(r.invoiceNum) === normalize(rawCode)) ||
    (r.code && normalize(r.code) === normalize(rawCode))
  );

  if (existingRecord && existingRecord.items && existingRecord.items.length) {
    itemsToLoad = existingRecord.items.map(it => ({ ...it }));
    foundFromOldRecord = true;
    if (existingRecord.invoiceNum) invoiceNum = existingRecord.invoiceNum;
  } else {
    // Khởi tạo dòng hàng mẫu
    itemsToLoad = [{
      name: '',
      code: '',
      unit: '',
      lot: '',
      expiry: '',
      qty: 1,
      price: 0,
      sellprice: 0,
      vat: 5,
      discount: 0,
      matched: false,
      matchSrc: ''
    }];
  }

  // Gắn nhà cung cấp
  let matchedSupplier = '';
  if (sellerTax) {
    const supByTax = suppliers.find(s => s.code === sellerTax || (s.note && s.note.includes(sellerTax)));
    if (supByTax) matchedSupplier = supByTax.code || supByTax.name;
  }
  if (!matchedSupplier) {
    const supByName = suppliers.find(s => normalize(s.name).includes(normalize(p.name)) || normalize(s.code).includes(normalize(p.id)));
    matchedSupplier = supByName ? (supByName.code || supByName.name) : p.name;
  }

  // Chuyển sang màn hình Nhập hóa đơn và nạp thông tin
  showPage('import');
  initImportView(itemsToLoad, {
    invoiceNumber: invoiceNum,
    invoiceDate: fmtDateInput(new Date()),
    supplierName: matchedSupplier
  });

  showProgress(false);
  scrollToInvoiceSection();

  if (foundFromOldRecord) {
    toast(`✅ Đã dò thấy hóa đơn "${invoiceNum}" trong lịch sử và nạp lại ${itemsToLoad.length} sản phẩm!`, 'success');
  } else {
    toast(`✅ Đã mở phiếu nhập cho hóa đơn "${invoiceNum}" (${p.name})! Vui lòng nhập hoặc kiểm tra danh sách sản phẩm.`, 'success');
  }
}

// Mở trang tra cứu chính thức của NCC trong tab mới
function openCurrentProviderUrl() {
  const select = document.getElementById('lookup-page-provider');
  const codeInput = document.getElementById('lookup-page-code');
  const p = INVOICE_PROVIDERS.find(x => x.id === (select?.value || 'vnpt')) || INVOICE_PROVIDERS[0];
  
  const code = (codeInput?.value || '').trim();
  let url = p.lookupUrl;

  if (code) {
    if (p.id === 'misa') url = `https://www.meinvoice.vn/tra-cuu/?code=${encodeURIComponent(code)}`;
    else if (p.id === 'vnpt') url = `${p.lookupUrl}?code=${encodeURIComponent(code)}`;
    else if (p.id === 'bkav') url = `${p.lookupUrl}?code=${encodeURIComponent(code)}`;
  }
  
  window.open(url, '_blank');
  toast(`Đang mở cổng tra cứu của ${p.name}...`, 'info');
}

// Tương thích ngược với nút gọi từ trang import
function loadInvoiceFromLookup() {
  const codeInput = document.getElementById('lookup-code-input');
  if (codeInput && codeInput.value.trim()) {
    const codeInp = document.getElementById('lookup-page-code');
    if (codeInp) codeInp.value = codeInput.value.trim();
  }
  executeLookupAndLoad();
}

function openProviderLookupUrl() {
  openCurrentProviderUrl();
}

function scrollToInvoiceSection() {
  setTimeout(() => {
    const section = document.getElementById('invoice-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 120);
}
