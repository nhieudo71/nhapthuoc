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

// ======================== XEM TRỰC QUAN HÓA ĐƠN ĐIỆN TỬ (XML PREVIEW NHƯ BẢN THỂ HIỆN PDF) ========================
let currentLookupParsedInvoice = null;

function triggerLookupXmlUpload() {
  const input = document.getElementById('lookup-xml-input');
  if (input) input.click();
}

async function handleLookupXmlFile(input) {
  const file = input.files[0];
  if (!file) return;

  try {
    showProgress(true, 'Đang giải mã file XML hóa đơn...', 40);
    const text = await file.text();
    const parsed = parseXmlDataToStructuredInvoice(text);
    currentLookupParsedInvoice = parsed;

    // Lưu vào lịch sử tra cứu
    if (parsed.invoiceNumber) {
      const codeInput = document.getElementById('lookup-page-code');
      if (codeInput) codeInput.value = parsed.invoiceNumber;
      saveToLookupHistory(parsed.invoiceNumber, document.getElementById('lookup-page-provider')?.value || 'vnpt', parsed.seller.tax);
      renderLookupHistory();
    }

    // Hiển thị bản xem trực quan như PDF
    renderVisualInvoicePreview(parsed);
    showProgress(false);
    toast(`Đã tải thành công hóa đơn ${parsed.invoiceNumber || ''}! Bạn có thể xem trực quan trước khi nhập.`, 'success');
  } catch (e) {
    showProgress(false);
    toast('Lỗi phân tích XML: ' + e.message, 'error');
  } finally {
    input.value = '';
  }
}

function renderVisualInvoicePreview(data) {
  const previewCard = document.getElementById('lookup-preview-card');
  const sheet = document.getElementById('lookup-invoice-sheet');
  if (!previewCard || !sheet) return;

  const totalQty = data.items.reduce((s, it) => s + (it.qty || 0), 0);
  const totalAmount = data.totals.withVat || data.items.reduce((s, it) => s + (it.amount || it.qty * it.price), 0);

  sheet.innerHTML = `
    <!-- HEADER HÓA ĐƠN -->
    <div style="border-bottom:2px solid var(--accent2);padding-bottom:14px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-size:22px;font-weight:800;color:var(--accent2);text-transform:uppercase;letter-spacing:0.5px">
            HÓA ĐƠN GIÁ TRỊ GIA TĂNG
          </div>
          <div style="font-size:13px;color:var(--text3);margin-top:2px">
            (Bản thể hiện của hóa đơn điện tử — Khởi tạo từ tệp dữ liệu XML gốc)
          </div>
        </div>
        <div style="text-align:right;background:var(--bg3);padding:8px 14px;border-radius:var(--radius);border:1px solid var(--border)">
          <div style="font-size:13.5px;font-weight:700">Ký hiệu: <span class="font-mono text-[var(--accent2)]">${esc(data.khhd || '—')}</span></div>
          <div style="font-size:15px;font-weight:800">Số HĐ: <span class="font-mono text-[var(--accent2)]">${esc(data.shd || data.invoiceNumber || '—')}</span></div>
          <div style="font-size:12.5px;color:var(--text3)">Ngày: <strong>${esc(data.invoiceDate || '—')}</strong></div>
        </div>
      </div>
    </div>

    <!-- THÔNG TIN BÊN BÁN & BÊN MUA -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;margin-bottom:18px;background:var(--bg3);padding:14px;border-radius:var(--radius);border:1px solid var(--border)">
      <div>
        <div style="font-size:12.5px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:6px">🏢 ĐƠN VỊ BÁN HÀNG (NHÀ CUNG CẤP):</div>
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:4px">${esc(data.seller.name || 'Chưa xác định')}</div>
        <div style="font-size:13.5px;color:var(--text2)">Mã số thuế: <strong class="font-mono text-[var(--text)]">${esc(data.seller.tax || '—')}</strong></div>
        ${data.seller.addr ? `<div style="font-size:13px;color:var(--text3);margin-top:2px">Địa chỉ: ${esc(data.seller.addr)}</div>` : ''}
        ${data.seller.phone ? `<div style="font-size:13px;color:var(--text3)">Điện thoại: ${esc(data.seller.phone)}</div>` : ''}
      </div>

      <div>
        <div style="font-size:12.5px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:6px">🏥 ĐƠN VỊ MUA HÀNG (QUẦY THUỐC):</div>
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:4px">${esc(data.buyer.name || settings.name || 'Quầy thuốc')}</div>
        ${data.buyer.tax ? `<div style="font-size:13.5px;color:var(--text2)">Mã số thuế: <strong class="font-mono text-[var(--text)]">${esc(data.buyer.tax)}</strong></div>` : ''}
        ${data.buyer.addr ? `<div style="font-size:13px;color:var(--text3);margin-top:2px">Địa chỉ: ${esc(data.buyer.addr)}</div>` : ''}
      </div>
    </div>

    <!-- BẢNG CHI TIẾT THUỐC & HÀNG HÓA -->
    <div style="margin-bottom:14px">
      <div style="font-size:14px;font-weight:800;margin-bottom:8px;color:var(--text2)">
        📦 DANH SÁCH CHI TIẾT THUỐC / SẢN PHẨM TRÊN HÓA ĐƠN (${data.items.length} mặt hàng):
      </div>
      <div class="table-wrap" style="max-height:420px;overflow-y:auto">
        <table>
          <thead>
            <tr>
              <th class="row-num">#</th>
              <th>Tên thuốc / Hoạt chất</th>
              <th style="min-width:85px">Số Lô</th>
              <th style="min-width:90px">Hạn Dùng</th>
              <th style="min-width:65px">ĐVT</th>
              <th style="text-align:right">Số lượng</th>
              <th style="text-align:right">Đơn giá</th>
              <th style="text-align:right">VAT%</th>
              <th style="text-align:right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map((it, idx) => `
              <tr>
                <td class="row-num">${idx + 1}</td>
                <td>
                  <strong>${esc(it.name)}</strong>
                  ${it.matched ? `<span class="chip chip-success" style="font-size:11px;margin-left:4px">Đã khớp mã quầy</span>` : ''}
                </td>
                <td><span class="chip ${it.lot ? 'chip-warning' : ''}" style="font-family:monospace">${esc(it.lot || '—')}</span></td>
                <td><span class="chip ${it.expiry ? 'chip-info' : ''}" style="font-family:monospace">${esc(it.expiry || '—')}</span></td>
                <td style="font-size:13.5px">${esc(it.unit || '—')}</td>
                <td style="text-align:right;font-weight:700;font-family:monospace">${fmtNum(it.qty)}</td>
                <td style="text-align:right;font-family:monospace">${fmtNum(it.price)}</td>
                <td style="text-align:right">${it.vat}%</td>
                <td style="text-align:right;font-weight:700;color:var(--accent2);font-family:monospace">${fmtNum(it.amount || it.qty * it.price)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background:var(--bg3);font-weight:800">
              <td colspan="5" style="text-align:right;text-transform:uppercase">Tổng cộng tiền hàng (${fmtNum(totalQty)} sản phẩm):</td>
              <td style="text-align:right;font-family:monospace">${fmtNum(totalQty)}</td>
              <td colspan="2" style="text-align:right">Tổng thanh toán:</td>
              <td style="text-align:right;color:var(--accent2);font-size:16px;font-family:monospace">${fmtNum(totalAmount)} đ</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;

  previewCard.style.display = 'block';
  previewCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeLookupPreview() {
  const previewCard = document.getElementById('lookup-preview-card');
  if (previewCard) previewCard.style.display = 'none';
  currentLookupParsedInvoice = null;
}

function confirmImportFromLookupPreview() {
  if (!currentLookupParsedInvoice) {
    toast('Chưa có dữ liệu hóa đơn để nhập!', 'error');
    return;
  }

  const p = currentLookupParsedInvoice;
  showPage('import');
  initImportView(p.items, {
    invoiceNumber: p.invoiceNumber,
    invoiceDate: p.invoiceDate,
    supplierName: p.seller.name,
    supplierTax: p.seller.tax
  });

  closeLookupPreview();
  scrollToInvoiceSection();
  toast(`✅ Đã nạp thành công hóa đơn "${p.invoiceNumber}" vào phiếu nhập kho!`, 'success');
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
      showProgress(true, 'Đang phân tích dữ liệu XML hóa đơn...', 70);
      const parsed = parseXmlDataToStructuredInvoice(rawCode);
      currentLookupParsedInvoice = parsed;
      renderVisualInvoicePreview(parsed);
      showProgress(false);
      toast(`✅ Đã giải mã XML thành công! Mời bạn kiểm tra bản xem trước trực quan.`, 'success');
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
        const parsed = parseXmlDataToStructuredInvoice(content);
        currentLookupParsedInvoice = parsed;
        renderVisualInvoicePreview(parsed);
        showProgress(false);
        toast(`✅ Đã tải file XML từ URL thành công! Mời bạn xem trực quan trước khi nhập hàng.`, 'success');
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
  toast(`Đang mở cổng tra cứu ${p.name}. Hãy tải file XML về máy rồi nạp vào bước 2 nhé!`, 'info');
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
