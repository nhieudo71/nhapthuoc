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

// Mở trang tra cứu chính thức của nhà cung cấp
function openProviderLookupUrl() {
  const select = document.getElementById('lookup-provider-select');
  const codeInput = document.getElementById('lookup-code-input');
  const p = INVOICE_PROVIDERS.find(x => x.id === (select?.value || 'vnpt')) || INVOICE_PROVIDERS[0];
  
  const code = (codeInput?.value || '').trim();
  let url = p.lookupUrl;

  // Một số nhà cung cấp cho phép ghép mã trực tiếp vào URL query
  if (code) {
    if (p.id === 'misa') url = `https://www.meinvoice.vn/tra-cuu/?code=${encodeURIComponent(code)}`;
    else if (p.id === 'vnpt') url = `${p.lookupUrl}?code=${encodeURIComponent(code)}`;
    else if (p.id === 'bkav') url = `${p.lookupUrl}?code=${encodeURIComponent(code)}`;
  }
  
  window.open(url, '_blank');
  toast(`Đang mở cổng tra cứu của ${p.name}... Tải file XML/PDF từ cổng rồi kéo thả vào app!`, 'info');
}

// Xử lý nạp dữ liệu XML hoặc URL hóa đơn vào app
async function loadInvoiceFromLookup() {
  const code = document.getElementById('lookup-code-input')?.value?.trim();
  const select = document.getElementById('lookup-provider-select');
  const p = INVOICE_PROVIDERS.find(x => x.id === (select?.value || 'vnpt')) || INVOICE_PROVIDERS[0];
  
  if (!code) {
    toast('Vui lòng nhập mã tra cứu hóa đơn', 'error');
    return;
  }

  // Nếu người dùng dán trực tiếp chuỗi XML vào ô
  if (code.startsWith('<?xml') || code.includes('<HDon>') || code.includes('<Invoice>')) {
    try {
      const blob = new Blob([code], { type: 'application/xml' });
      const file = new File([blob], 'invoice_paste.xml', { type: 'application/xml' });
      await parseXmlInvoice(file);
      return;
    } catch (e) {
      toast('Lỗi phân tích XML dán: ' + e.message, 'error');
    }
  }

  // Nếu người dùng nhập URL tải trực tiếp file xml/pdf
  if (code.startsWith('http://') || code.startsWith('https://')) {
    try {
      showProgress(true, 'Đang tải hóa đơn từ đường link...');
      const resp = await fetch(code);
      if (!resp.ok) throw new Error('Không thể tải từ URL (mã lỗi ' + resp.status + ')');
      const blob = await resp.blob();
      const ext = code.includes('.xml') ? 'xml' : code.includes('.pdf') ? 'pdf' : 'xml';
      const file = new File([blob], 'invoice_downloaded.' + ext);
      await handleFileUpload(file);
      return;
    } catch (e) {
      showProgress(false);
      toast('Không thể tải trực tiếp (do chính sách bảo mật CORS). Nhấn "Mở cổng tra cứu", tải file XML về máy rồi kéo vào đây!', 'warning');
      return;
    }
  }

  // Hướng dẫn người dùng mở cổng tra cứu để lấy file chuẩn gốc
  toast(`Đang mở trang tra cứu ${p.name} cho mã: ${code}. Vui lòng tải file XML/PDF hóa đơn và kéo thả vào app!`, 'info');
  openProviderLookupUrl();
}

