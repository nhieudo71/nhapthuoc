// ======================== INVOICE PARSERS ========================

// Tesseract Worker Instance
let tesseractWorker = null;

function cleanApiKey(raw) {
  return String(raw || '').replace(/[\s\u200B-\u200D\uFEFF]/g, '');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// Master File Upload Handler
async function handleFileUpload(file) {
  if (!file) return;
  showProgress(true, 'Đang đọc file...');
  const ext = file.name.split('.').pop().toLowerCase();
  try {
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      await parseExcelInvoice(file);
    } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      await parseImageInvoice(file);
    } else if (ext === 'pdf') {
      await parsePdfInvoice(file);
    } else if (ext === 'xml') {
      await parseXmlInvoice(file);
    } else {
      toast('Định dạng file không hỗ trợ (.xls, .xlsx, .csv, .pdf, .xml, ảnh)', 'error');
      showProgress(false);
    }
  } catch (err) {
    showProgress(false);
    toast('Lỗi xử lý file: ' + err.message, 'error');
  }
}

// ======================== GEMINI API ========================
async function callGeminiAI(parts) {
  const key = cleanApiKey(apiKey || DB.get('apikey', ''));
  if (!key) throw new Error('NO_KEY');
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastErr = null;
  for (let m = 0; m < models.length; m++) {
    const model = models[m];
    const maxRetry = 2;
    for (let attempt = 0; attempt <= maxRetry; attempt++) {
      try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts }] })
        });
        const data = await resp.json();
        if (data.error) {
          const msg = data.error.message || '';
          const isOverloaded = /high demand|overloaded|503|UNAVAILABLE/i.test(msg) || resp.status === 503;
          lastErr = new Error(msg);
          if (isOverloaded) {
            if (attempt < maxRetry) {
              await sleep(1200 * (attempt + 1));
              continue;
            }
            break;
          }
          throw lastErr;
        }
        return data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
      } catch (e) {
        if (e.message === 'NO_KEY') throw e;
        lastErr = e;
        const isOverloaded = /high demand|overloaded|503|UNAVAILABLE|Failed to fetch/i.test(e.message || '');
        if (isOverloaded && attempt < maxRetry) {
          await sleep(1200 * (attempt + 1));
          continue;
        }
        break;
      }
    }
  }
  throw lastErr || new Error('Không thể kết nối tới Gemini AI');
}

// ======================== EXCEL INVOICE ========================
async function parseExcelInvoice(file) {
  const buf = await file.arrayBuffer();
  setProgress(30, 'Phân tích Excel...');
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  let headerRow = -1;
  const colMap = {};
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i].map(c => String(c).toLowerCase());
    if (r.some(c => c.includes('tên') && (c.includes('hàng') || c.includes('thuốc') || c.includes('dịch')))) {
      headerRow = i;
      r.forEach((c, j) => {
        if (c.includes('stt')) colMap.stt = j;
        else if (c.includes('tên')) colMap.name = j;
        else if (c.includes('số lô') || c.includes('lô sx') || c.includes('lô')) colMap.lot = j;
        else if (c.includes('hạn') || c.includes('hsd') || c.includes('date')) colMap.expiry = j;
        else if (c.includes('đơn vị') || c.includes('dvt') || c.includes('unit')) colMap.unit = j;
        else if (c.includes('số lượng') || c.includes('sl') || c.includes('qty')) colMap.qty = j;
        else if ((c.includes('đơn giá') || c.includes('giá') || c.includes('price')) && colMap.price === undefined) colMap.price = j;
        else if (c.includes('thành tiền') || c.includes('total')) colMap.total = j;
        else if (c.includes('thuế') || c.includes('vat')) colMap.vat = j;
        else if (c.includes('chiết khấu') || c.includes('ck')) colMap.discount = j;
      });
      break;
    }
  }
  
  setProgress(60, 'Nhận diện sản phẩm...');
  const items = [];
  const dataStart = headerRow + 1;
  for (let i = dataStart; i < rows.length; i++) {
    const r = rows[i];
    const nameRaw = r[colMap.name ?? 1];
    if (!nameRaw || String(nameRaw).trim() === '') continue;
    const name = String(nameRaw).trim();
    const qty = parseFloat(String(r[colMap.qty ?? 5]).replace(/[.,\s]/g, '').replace(',', '.')) || 0;
    if (qty === 0 && i > dataStart + 1) continue;
    const price = parseFloat(String(r[colMap.price ?? 6]).replace(/\./g, '').replace(',', '.')) || 0;
    const vat = parseFloat(String(r[colMap.vat ?? 8]).replace(',', '.')) || 0;
    const disc = parseFloat(String(r[colMap.discount ?? 9]).replace(',', '.')) || 0;
    let expiry = r[colMap.expiry ?? 3];
    if (expiry instanceof Date) expiry = fmtDateInput(expiry);
    else expiry = String(expiry || '');
    const lot = String(r[colMap.lot ?? 2] || '').trim();
    const unit = String(r[colMap.unit ?? 4] || '').trim();
    const matched = findDrug(name);
    items.push({
      name,
      lot,
      expiry,
      unit: matched?.unit || unit,
      qty,
      price,
      sellprice: matched?.price || 0,
      vat: matched?.vat || vat,
      discount: disc,
      code: matched?.code || '',
      matched: !!(matched?.code),
      matchSrc: matched?._fromNational ? 'nat' : matched ? 'cat' : ''
    });
  }
  setProgress(90, 'Hoàn tất...');
  setTimeout(() => {
    showProgress(false);
    initImportView(items);
  }, 300);
}

// ======================== PDF INVOICE ========================
async function parsePdfInvoice(file) {
  const key = cleanApiKey(apiKey || DB.get('apikey', ''));
  if (!key) {
    toast('Không có Gemini API Key — thử trích xuất văn bản PDF...', 'info');
    await parsePdfText(file);
    return;
  }
  setProgress(20, 'Đang đọc file PDF...');
  const b64 = await fileToBase64(file);
  setProgress(40, 'Đang gửi PDF đến Gemini AI...');
  const catalogContext = catalog.slice(0, 50).map(d => `${d.code}: ${d.name} (${d.unit || ''}, giá bán: ${d.price || 0}, VAT: ${d.vat || 0}%)`).join('\n');
  const prompt = `Bạn là trợ lý nhận dạng hóa đơn dược phẩm. Trích xuất thông tin hóa đơn và toàn bộ sản phẩm từ hóa đơn PDF này.\n${catalogContext ? `\nDanh mục thuốc của quầy:\n${catalogContext}` : ''}\nTrả về JSON hợp lệ (không có markdown backticks):\n{"invoiceNumber":"Số hóa đơn. Nếu có cả Ký hiệu và Số thì ghép dạng KyHieu-So, ví dụ 1C25TAA-123","invoiceDate":"Ngày hóa đơn định dạng DD/MM/YYYY","items":[{"name":"Tên thuốc","lot":"Số lô","expiry":"DD/MM/YYYY","unit":"Đơn vị","qty":0,"price":0,"sellprice":0,"vat":0,"discount":0,"code":"mã hàng nếu biết"}]}`;

  try {
    const txt = await callGeminiAI([{ inline_data: { mime_type: 'application/pdf', data: b64.split(',')[1] } }, { text: prompt }]);
    setProgress(80, 'Nhận kết quả...');
    const clean = txt.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    const items = (parsed.items || []).map(it => ({ ...it, matched: catalog.some(d => d.code === it.code && it.code) }));
    setProgress(100, 'Hoàn tất!');
    setTimeout(() => {
      showProgress(false);
      initImportView(items, { invoiceNumber: parsed.invoiceNumber, invoiceDate: parsed.invoiceDate });
    }, 300);
  } catch (e) {
    showProgress(false);
    if (e.message === 'NO_KEY') {
      toast('Vui lòng nhập Gemini API Key trong Cài đặt', 'error');
      return;
    }
    toast('AI lỗi: ' + e.message + '. Thử trích xuất văn bản...', 'info');
    await parsePdfText(file);
  }
}

// Fallback: Text extraction using PDF.js
async function parsePdfText(file) {
  if (!window.pdfjsLib) {
    setProgress(10, 'Tải thư viện PDF.js...');
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  setProgress(30, 'Đọc nội dung PDF...');
  try {
    const buf = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    let allText = '';
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      const lines = [];
      let lastY = null;
      tc.items.forEach(item => {
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) lines.push('');
        lines.push(item.str);
        lastY = item.transform[5];
      });
      allText += lines.join(' ') + '\n';
    }
    setProgress(60, 'Phân tích văn bản...');
    const items = parsePlainTextInvoice(allText);
    const invoiceInfo = extractInvoiceInfo(allText);
    if (!items.length) {
      toast('PDF không có văn bản trích xuất được (bản scan) — chuyển sang OCR cục bộ...', 'info');
      await parsePdfWithOcr(pdf);
      return;
    }
    setProgress(100, 'Xong!');
    setTimeout(() => {
      showProgress(false);
      initImportView(items, invoiceInfo);
    }, 300);
  } catch (e) {
    showProgress(false);
    toast('Lỗi đọc PDF: ' + e.message, 'error');
  }
}

async function parsePdfWithOcr(pdf) {
  try {
    setProgress(35, 'Tải công cụ OCR (Tesseract.js)...');
    await ensureTesseractLoaded();
    let allText = '';
    const maxPages = Math.min(pdf.numPages, 5);
    for (let p = 1; p <= maxPages; p++) {
      setProgress(35 + Math.round((p - 1) / maxPages * 20), `Đang dựng ảnh trang ${p}/${maxPages}...`);
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      setProgress(55 + Math.round((p - 1) / maxPages * 35), `OCR trang ${p}/${maxPages}...`);
      const text = await runOcrOnImage(canvas.toDataURL('image/png'));
      allText += text + '\n';
    }
    setProgress(92, 'Phân tích văn bản...');
    const items = parsePlainTextInvoice(allText);
    const invoiceInfo = extractInvoiceInfo(allText);
    setProgress(100, 'Xong!');
    setTimeout(() => {
      showProgress(false);
      initImportView(items, invoiceInfo);
    }, 300);
    if (!items.length) toast('OCR không nhận diện được sản phẩm rõ ràng. Vui lòng kiểm tra lại.', 'error');
    else toast('Đã đọc bằng OCR cục bộ (không cần API). Vui lòng kiểm tra lại kết quả.', 'info');
  } catch (e) {
    showProgress(false);
    toast('Lỗi OCR PDF: ' + e.message, 'error');
  }
}

function extractInvoiceInfo(text) {
  const info = { invoiceNumber: '', invoiceDate: '' };
  const serialM = text.match(/(?:ký\s*hiệu|serial)[\s:.#]*([A-Za-z0-9]{6,12})/i);
  const numM = text.match(/(?:số\s*(?:hóa\s*đơn|hđ)|invoice\s*(?:no|number)?)[\s:.#]*(\d{1,10})/i)
    || text.match(/(?:no\.?|№)\s*[:.#]?\s*(\d{4,10})\b/i);
  const serial = serialM ? serialM[1].trim() : '';
  const num = numM ? numM[1].trim() : '';
  info.invoiceNumber = serial && num ? `${serial}-${num}` : (num || serial);
  const dateM = text.match(/(?:ngày\s*(?:hóa\s*đơn|hđ)?)[\s:.#]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i)
    || text.match(/ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i);
  if (dateM) info.invoiceDate = `${dateM[1].padStart(2, '0')}/${dateM[2].padStart(2, '0')}/${dateM[3].length === 2 ? '20' + dateM[3] : dateM[3]}`;
  return info;
}

function parsePlainTextInvoice(text) {
  const items = [];
  const lines = text.split(/\n/).map(l => l.trim()).filter(l => l);
  const rowRe = /^\d+[\.\)]\s+(.+)/;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(rowRe);
    if (!m) continue;
    const raw = m[1];
    const qp = raw.match(/(\d+(?:[.,]\d+)?)\s+(\d[\d.,]+)\s*$/);
    const qty = qp ? parseFloat(qp[1].replace(',', '.')) || 1 : 1;
    const price = qp ? parseFloat(qp[2].replace(/\./g, '').replace(',', '.')) || 0 : 0;
    const name = (qp ? raw.slice(0, raw.lastIndexOf(qp[0])) : raw).trim();
    if (!name || name.length < 2) continue;
    let lot = '', expiry = '';
    const lotM = raw.match(/[Ll]ô[:\s]+([A-Z0-9\-]+)/i) || lines[i + 1]?.match(/[Ll]ô[:\s]+([A-Z0-9\-]+)/i);
    if (lotM) lot = lotM[1];
    const expM = raw.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/) || lines[i + 1]?.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (expM) expiry = expM[1];
    const matched = findDrug(name);
    items.push({
      name,
      lot,
      expiry,
      unit: matched?.unit || '',
      qty,
      price,
      sellprice: matched?.price || 0,
      vat: matched?.vat || 5,
      discount: 0,
      code: matched?.code || '',
      matched: !!matched
    });
  }
  return items;
}

// ======================== OCR WITH TESSERACT ========================
async function ensureTesseractLoaded() {
  if (window.Tesseract) return;
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function getTesseractWorker() {
  await ensureTesseractLoaded();
  if (!tesseractWorker) {
    tesseractWorker = await window.Tesseract.createWorker('vie+eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text' && typeof m.progress === 'number') {
          setProgress(60 + Math.round(m.progress * 30), 'OCR đang nhận diện chữ... ' + Math.round(m.progress * 100) + '%');
        }
      }
    });
  }
  return tesseractWorker;
}

async function runOcrOnImage(source) {
  const worker = await getTesseractWorker();
  const { data } = await worker.recognize(source);
  return data?.text || '';
}

async function parseImageWithOcr(file) {
  setProgress(30, 'Tải công cụ OCR (Tesseract.js)...');
  try {
    const dataUrl = await fileToBase64(file);
    setProgress(50, 'Đang nhận diện chữ trong ảnh...');
    const text = await runOcrOnImage(dataUrl);
    setProgress(92, 'Phân tích văn bản...');
    const items = parsePlainTextInvoice(text);
    const invoiceInfo = extractInvoiceInfo(text);
    setProgress(100, 'Xong!');
    setTimeout(() => {
      showProgress(false);
      initImportView(items, invoiceInfo);
    }, 300);
    if (!items.length) toast('OCR không nhận diện được sản phẩm rõ ràng. Vui lòng kiểm tra và nhập bổ sung.', 'error');
    else toast('Đã đọc bằng OCR cục bộ (không cần API).', 'info');
  } catch (e) {
    showProgress(false);
    toast('Lỗi OCR: ' + e.message, 'error');
  }
}

async function parseImageInvoice(file) {
  const key = cleanApiKey(apiKey || DB.get('apikey', ''));
  if (!key) {
    toast('Không có Gemini API Key — dùng OCR cục bộ (Tesseract.js)...', 'info');
    await parseImageWithOcr(file);
    return;
  }
  setProgress(20, 'Đang mã hóa ảnh...');
  const b64 = await fileToBase64(file);
  setProgress(40, 'Đang gửi ảnh đến Gemini AI...');
  const catalogContext = catalog.slice(0, 50).map(d => `${d.code}: ${d.name} (${d.unit || ''}, giá bán: ${d.price || 0}, VAT: ${d.vat || 0}%)`).join('\n');
  const prompt = `Bạn là trợ lý nhận dạng hóa đơn dược phẩm. Trích xuất thông tin hóa đơn và toàn bộ sản phẩm.\n${catalogContext ? `\nDanh mục:\n${catalogContext}` : ''}\nTrả về JSON hợp lệ (không markdown):\n{"invoiceNumber":"Số hóa đơn. Nếu có cả Ký hiệu và Số thì ghép dạng KyHieu-So, ví dụ 1C25TAA-123","invoiceDate":"Ngày hóa đơn định dạng DD/MM/YYYY","items":[{"name":"","lot":"","expiry":"DD/MM/YYYY","unit":"","qty":0,"price":0,"sellprice":0,"vat":0,"discount":0,"code":""}]}`;

  try {
    const txt = await callGeminiAI([{ inline_data: { mime_type: file.type || 'image/jpeg', data: b64.split(',')[1] } }, { text: prompt }]);
    setProgress(80, 'Nhận kết quả...');
    const clean = txt.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    const items = (parsed.items || []).map(it => ({ ...it, matched: catalog.some(d => d.code === it.code && it.code) }));
    setProgress(100, 'Hoàn tất!');
    setTimeout(() => {
      showProgress(false);
      initImportView(items, { invoiceNumber: parsed.invoiceNumber, invoiceDate: parsed.invoiceDate });
    }, 300);
  } catch (e) {
    showProgress(false);
    if (/high demand|overloaded|503|UNAVAILABLE/i.test(e.message || '')) {
      toast('Gemini AI đang quá tải. Chuyển sang OCR cục bộ (dự phòng)...', 'info');
    } else {
      toast('AI lỗi: ' + e.message + '. Chuyển sang OCR cục bộ...', 'info');
    }
    await parseImageWithOcr(file);
  }
}

// ======================== XML INVOICE PARSER (Thông tư 78 - Chuẩn TCT) ========================
// Hỗ trợ tất cả hóa đơn điện tử XML từ VNPT, Viettel, MISA, BKAV, CyberBill, EasyInvoice, Thái Sơn...
async function parseXmlInvoice(file) {
  setProgress(30, 'Đọc cấu trúc XML hóa đơn điện tử...');
  const text = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'application/xml');

  if (doc.querySelector('parsererror')) {
    throw new Error('File XML không hợp lệ');
  }

  setProgress(50, 'Trích xuất dữ liệu hóa đơn...');

  // 1. Trích xuất thông tin hóa đơn
  const shd = doc.querySelector('SHDon')?.textContent?.trim() || doc.querySelector('InvoiceNumber')?.textContent?.trim() || '';
  const khhd = doc.querySelector('KHHDon')?.textContent?.trim() || doc.querySelector('InvoiceSeries')?.textContent?.trim() || '';
  const nlap = doc.querySelector('NLap')?.textContent?.trim() || doc.querySelector('InvoiceDate')?.textContent?.trim() || '';
  
  let invoiceNumber = shd;
  if (khhd && shd) invoiceNumber = `${khhd}-${shd}`;
  let invoiceDate = '';
  if (nlap) {
    const m = nlap.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) invoiceDate = `${m[3]}/${m[2]}/${m[1]}`;
    else invoiceDate = nlap;
  }

  // Thông tin NCC
  const sellerName = doc.querySelector('NBan Ten')?.textContent?.trim() || doc.querySelector('Seller LegalName')?.textContent?.trim() || '';
  const sellerTax = doc.querySelector('NBan MST')?.textContent?.trim() || doc.querySelector('Seller TaxCode')?.textContent?.trim() || '';

  // 2. Trích xuất danh sách mặt hàng
  const items = [];
  // Tìm các node hàng hóa (chuẩn TT78 thường là HHDVu hoặc Item)
  const itemNodes = doc.querySelectorAll('HHDVu, Item');
  
  itemNodes.forEach(node => {
    const name = node.querySelector('THHDVu, ItemName')?.textContent?.trim();
    if (!name) return;

    const unit = node.querySelector('DVTinh, UnitName')?.textContent?.trim() || '';
    const qty = parseFloat(node.querySelector('SLuong, Quantity')?.textContent?.trim()) || 0;
    const price = parseFloat(node.querySelector('DGia, UnitPrice')?.textContent?.trim()) || 0;
    const disc = parseFloat(node.querySelector('TLCKhau, DiscountRate')?.textContent?.trim()) || 0;
    
    // Thuế suất VAT
    let vatStr = node.querySelector('TSuat, VATRate')?.textContent?.trim() || '5';
    let vat = parseFloat(vatStr.replace('%', '')) || 0;

    // Số lô và hạn dùng nếu có trong các thẻ mở rộng
    let lot = node.querySelector('SoLo, LotNumber, BatchNumber')?.textContent?.trim() || '';
    let expiry = node.querySelector('HanDung, ExpiryDate')?.textContent?.trim() || '';
    
    // Nếu chưa có lô / date trong thẻ riêng, thử tìm trong tên
    if (!lot) {
      const lotM = name.match(/[Ll]ô[:\s]+([A-Za-z0-9\-]+)/i);
      if (lotM) lot = lotM[1];
    }
    if (!expiry) {
      const expM = name.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
      if (expM) expiry = expM[1];
    }

    const matched = findDrug(name);
    items.push({
      name,
      lot,
      expiry,
      unit: matched?.unit || unit,
      qty,
      price,
      sellprice: matched?.price || 0,
      vat: matched?.vat || vat,
      discount: disc,
      code: matched?.code || '',
      matched: !!matched
    });
  });

  setProgress(100, 'Xong!');
  setTimeout(() => {
    showProgress(false);
    initImportView(items, { invoiceNumber, invoiceDate, supplierName: sellerName, supplierTax: sellerTax });
    toast(`Đã đọc ${items.length} thuốc từ file XML hóa đơn điện tử chuẩn TCT!`, 'success');
  }, 300);
}

