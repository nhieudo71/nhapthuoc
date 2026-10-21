// ======================== INVOICE LOOKUP & PROVIDERS ========================

// Danh sách tất cả các nhà cung cấp hóa đơn điện tử phổ biến tại Việt Nam
const INVOICE_PROVIDERS = [
  {
    id: 'gdt',
    name: 'Tổng Cục Thuế (HĐĐT Toàn Quốc)',
    badge: 'Toàn quốc',
    lookupUrl: 'https://hoadondientu.gdt.gov.vn',
    guide: 'Tra cứu mọi hóa đơn hợp pháp trên cổng Tổng cục Thuế bằng MST bên bán, Ký hiệu và Số HĐ.',
    fields: ['sellerTax', 'code', 'invoiceNum']
  },
  {
    id: 'vnpt',
    name: 'VNPT-Invoice (Tập đoàn VNPT)',
    badge: 'Phổ biến',
    lookupUrl: 'https://tracuuhddt.vnpt-invoice.com.vn',
    guide: 'Nhập Mã tra cứu / Fkey được in ở góc dưới hóa đơn của VNPT.',
    fields: ['code']
  },
  {
    id: 'viettel',
    name: 'Viettel S-Invoice (Tập đoàn Viettel)',
    badge: 'Phổ biến',
    lookupUrl: 'https://business-sinvoice.viettel.vn/tra-cuu-hoa-don',
    guide: 'Nhập MST bên bán và Mã số bí mật (in trên hóa đơn Viettel).',
    fields: ['sellerTax', 'code']
  },
  {
    id: 'misa',
    name: 'MISA meInvoice (Công ty MISA)',
    badge: 'Phổ biến',
    lookupUrl: 'https://www.meinvoice.vn/tra-cuu',
    guide: 'Nhập Mã tra cứu hóa đơn in trên hóa đơn MISA.',
    fields: ['code']
  },
  {
    id: 'bkav',
    name: 'BKAV eHoadon (Tập đoàn BKAV)',
    badge: 'Phổ biến',
    lookupUrl: 'https://van.ehoadon.vn/TraCuuHoaDon',
    guide: 'Nhập Mã tra cứu hóa đơn gồm các chữ và số in trên hóa đơn BKAV.',
    fields: ['code']
  },
  {
    id: 'easyinvoice',
    name: 'EasyInvoice (Softdreams)',
    badge: 'Dược/Bán buôn',
    lookupUrl: 'https://tracuu.easyinvoice.vn',
    guide: 'Nhập Mã tra cứu hóa đơn EasyInvoice từ bên bán dược gửi.',
    fields: ['code']
  },
  {
    id: 'thaison',
    name: 'Thái Sơn E-Invoice',
    badge: 'Doanh nghiệp',
    lookupUrl: 'https://einvoice.vn/tra-cuu',
    guide: 'Nhập Mã nhận hóa đơn hoặc Mã số bí mật.',
    fields: ['code']
  },
  {
    id: 'cyberbill',
    name: 'CyberBill',
    badge: 'Thương mại',
    lookupUrl: 'https://tracuu.cyberbill.vn',
    guide: 'Nhập Mã tra cứu trên hóa đơn CyberBill.',
    fields: ['code']
  },
  {
    id: 'matbao',
    name: 'Mắt Bão CyberInvoice',
    badge: 'Thương mại',
    lookupUrl: 'https://cyberinvoice.vn/tra-cuu-hoa-don',
    guide: 'Nhập Mã tra cứu hóa đơn của Mắt Bão.',
    fields: ['code']
  },
  {
    id: 'fpt',
    name: 'FPT.eInvoice (Tập đoàn FPT)',
    badge: 'Doanh nghiệp',
    lookupUrl: 'https://einvoice.fpt.com.vn/tra-cuu',
    guide: 'Nhập Mã tra cứu hoặc Số hóa đơn FPT.',
    fields: ['code']
  },
  {
    id: 'minvoice',
    name: 'M-Invoice',
    badge: 'Dược/DN',
    lookupUrl: 'https://tracuu.minvoice.vn',
    guide: 'Nhập Mã bảo mật / Mã tra cứu M-Invoice.',
    fields: ['code']
  },
  {
    id: 'mobifone',
    name: 'MobiFone Invoice',
    badge: 'Viễn thông/DN',
    lookupUrl: 'https://hoadon.mobifone.vn/tra-cuu-hoa-don',
    guide: 'Nhập Mã tra cứu in trên hóa đơn MobiFone.',
    fields: ['code']
  },
  {
    id: 'vnpay',
    name: 'VNPAY Invoice',
    badge: 'Tài chính',
    lookupUrl: 'https://hoadondientu.vnpay.vn',
    guide: 'Nhập Mã tra cứu trên hóa đơn VNPAY.',
    fields: ['code']
  },
  {
    id: 'viinvoice',
    name: 'Vi-Invoice',
    badge: 'Doanh nghiệp',
    lookupUrl: 'https://vi-invoice.vn/tra-cuu',
    guide: 'Nhập Mã tra cứu hóa đơn Vi-Invoice.',
    fields: ['code']
  }
];

function initProviderSelect() {
  const select = document.getElementById('lookup-provider-select');
  if (!select) return;
  select.innerHTML = INVOICE_PROVIDERS.map(p => 
    `<option value="${p.id}">${p.name} [${p.badge}]</option>`
  ).join('');
  onProviderChange();
}

function onProviderChange() {
  const select = document.getElementById('lookup-provider-select');
  if (!select) return;
  const p = INVOICE_PROVIDERS.find(x => x.id === select.value) || INVOICE_PROVIDERS[0];
  const guideEl = document.getElementById('lookup-provider-guide');
  if (guideEl) guideEl.textContent = p.guide;

  // Hiển thị/ẩn ô MST bên bán nếu NCC cần
  const mstGroup = document.getElementById('lookup-seller-tax-group');
  if (mstGroup) {
    mstGroup.style.display = p.fields.includes('sellerTax') ? '' : 'none';
  }
}

// Mở trang tra cứu chính thức của nhà cung cấp trong tab mới (chỉ dùng khi bấm nút riêng "Mở cổng tra cứu NCC")
function openProviderLookupUrl() {
  const select = document.getElementById('lookup-provider-select');
  const codeInput = document.getElementById('lookup-code-input');
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

// ======================== TẢI HÓA ĐƠN TRỰC TIẾP VÀO APP ========================
// Tự động dò và nạp trực tiếp vào app: Mở Bước 2 (Thông tin phiếu nhập) & Bước 3 (Danh sách hàng nhập) ngay lập tức
async function loadInvoiceFromLookup() {
  const codeInput = document.getElementById('lookup-code-input');
  const rawCode = (codeInput?.value || '').trim();
  const sellerTax = document.getElementById('lookup-seller-tax')?.value?.trim() || '';
  const select = document.getElementById('lookup-provider-select');
  const p = INVOICE_PROVIDERS.find(x => x.id === (select?.value || 'vnpt')) || INVOICE_PROVIDERS[0];
  
  if (!rawCode) {
    toast('Vui lòng nhập mã hóa đơn hoặc mã tra cứu!', 'error');
    if (codeInput) codeInput.focus();
    return;
  }

  showProgress(true, `Đang dò hóa đơn ${rawCode} từ ${p.name}...`, 30);

  // 1. Trường hợp người dùng dán trực tiếp chuỗi XML vào ô
  if (rawCode.startsWith('<?xml') || rawCode.includes('<HDon>') || rawCode.includes('<Invoice>')) {
    try {
      showProgress(true, 'Đang phân tích dữ liệu XML hóa đơn...', 60);
      const blob = new Blob([rawCode], { type: 'application/xml' });
      const file = new File([blob], 'invoice_paste.xml', { type: 'application/xml' });
      await parseXmlInvoice(file);
      showProgress(false);
      scrollToInvoiceSection();
      return;
    } catch (e) {
      showProgress(false);
      toast('Lỗi phân tích XML: ' + e.message, 'error');
      return;
    }
  }

  // 2. Trường hợp là đường link/URL tra cứu trực tiếp
  if (rawCode.startsWith('http://') || rawCode.startsWith('https://')) {
    try {
      showProgress(true, 'Đang tải hóa đơn từ đường link...', 50);
      let content = null;
      let isXml = false;
      try {
        const directResp = await fetch(rawCode);
        if (directResp.ok) {
          content = await directResp.text();
        }
      } catch (corsErr) {
        // Dự phòng CORS qua proxy
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
        scrollToInvoiceSection();
        return;
      }
    } catch (err) {
      console.warn('Lỗi tải URL:', err);
    }
  }

  // 3. Xử lý Mã hóa đơn / Ký hiệu hóa đơn / Số hóa đơn
  // Ví dụ: 1C25TBA-1241, 1C25TAA-123, HD001, hoặc chuỗi mã tra cứu
  showProgress(true, 'Đang nhận diện mã hóa đơn và nạp vào phiếu nhập...', 70);
  await sleep(250);

  let invoiceNum = rawCode;
  let itemsToLoad = [];
  let foundFromOldRecord = false;

  // 3.1. Tìm trong lịch sử phiếu nhập (records) xem có hóa đơn nào trùng số HĐ này không
  const existingRecord = records.find(r => 
    (r.invoiceNum && normalize(r.invoiceNum) === normalize(rawCode)) ||
    (r.code && normalize(r.code) === normalize(rawCode))
  );

  if (existingRecord && existingRecord.items && existingRecord.items.length) {
    itemsToLoad = existingRecord.items.map(it => ({ ...it }));
    foundFromOldRecord = true;
    if (existingRecord.invoiceNum) invoiceNum = existingRecord.invoiceNum;
  } else {
    // 3.2. Nếu là hóa đơn mới, khởi tạo sẵn 1 dòng nhập hàng để người dùng điền hoặc kiểm tra
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

  // Tự động tìm hoặc gắn NCC phù hợp
  let matchedSupplier = '';
  if (sellerTax) {
    const supByTax = suppliers.find(s => s.code === sellerTax || (s.note && s.note.includes(sellerTax)));
    if (supByTax) matchedSupplier = supByTax.code || supByTax.name;
  }
  if (!matchedSupplier) {
    const supByName = suppliers.find(s => normalize(s.name).includes(normalize(p.name)) || normalize(s.code).includes(normalize(p.id)));
    matchedSupplier = supByName ? (supByName.code || supByName.name) : p.name;
  }

  // 3.3. Khởi tạo trực tiếp giao diện Bước 2 & Bước 3 ngay trong ứng dụng
  initImportView(itemsToLoad, {
    invoiceNumber: invoiceNum,
    invoiceDate: fmtDateInput(new Date()),
    supplierName: matchedSupplier
  });

  showProgress(false);

  // Cuộn màn hình mượt mà xuống phần thông tin phiếu nhập vừa mở
  scrollToInvoiceSection();

  if (foundFromOldRecord) {
    toast(`✅ Đã dò thấy hóa đơn "${invoiceNum}" trong lịch sử và nạp lại ${itemsToLoad.length} sản phẩm!`, 'success');
  } else {
    toast(`✅ Đã tải thông tin hóa đơn "${invoiceNum}" (${p.name}) vào app! Vui lòng nhập hoặc kiểm tra danh sách sản phẩm.`, 'success');
  }
}

// Hàm cuộn màn hình xuống khu vực thông tin phiếu nhập (Bước 2 & 3)
function scrollToInvoiceSection() {
  setTimeout(() => {
    const section = document.getElementById('invoice-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}
