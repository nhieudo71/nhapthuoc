// ======================== PACK CONVERSION ========================

const UNIT_ABBR = { h: 'Hộp', t: 'Thùng', v: 'Vỉ', c: 'Chai', tuyp: 'Tuýp', tp: 'Tuýp', o: 'Ống', g: 'Gói', l: 'Lọ', vi: 'Viên' };
const RETAIL_UNIT_ABBR = { v: 'Viên', vi: 'Viên', c: 'Chai', tuyp: 'Tuýp', tp: 'Tuýp', o: 'Ống', g: 'Gói', l: 'Lọ' };

function expandUnitAbbr(code, isRetail) {
  if (!code) return code;
  const k = code.trim().toLowerCase();
  const table = isRetail ? RETAIL_UNIT_ABBR : UNIT_ABBR;
  return table[k] || code.trim().toUpperCase();
}

function parsePackFromName(name) {
  if (!name) return null;
  const str = String(name);
  const chainM = str.match(/\b([A-Za-zÀ-ỹ]{1,4})\s*\/\s*(\d+)\s*([A-Za-zÀ-ỹ]{1,4})\s*\/\s*(\d+)\s*([A-Za-zÀ-ỹ]{1,4})\b/);
  if (chainM) {
    const size = (parseFloat(chainM[2]) || 1) * (parseFloat(chainM[4]) || 1);
    return { unitBig: expandUnitAbbr(chainM[1]), unitSmall: expandUnitAbbr(chainM[5], true), size };
  }
  const groups = [...str.matchAll(/\b([A-Za-zÀ-ỹ]{1,4})\s*\/\s*(\d+)\b/g)];
  if (groups.length >= 2) {
    const last = groups[groups.length - 1];
    return { unitBig: expandUnitAbbr(last[1]), unitSmall: 'Viên', size: parseFloat(last[2]) || 1 };
  }
  if (groups.length === 1) {
    return { unitBig: expandUnitAbbr(groups[0][1]), unitSmall: '', size: parseFloat(groups[0][2]) || 1 };
  }
  return null;
}

let packConvertIdx = -1;

function openPackConvert(i) {
  packConvertIdx = i;
  const it = currentItems[i];
  const nameEl = document.getElementById('pack-item-name');
  if (nameEl) nameEl.textContent = it.name || '(Chưa đặt tên)';
  const guess = (!it.packConverted) ? parsePackFromName(it.name) : null;
  
  const unitBigEl = document.getElementById('pack-unit-big');
  const unitSmallEl = document.getElementById('pack-unit-small');
  const sizeEl = document.getElementById('pack-size');
  const qtyBigEl = document.getElementById('pack-qty-big');
  const priceBigEl = document.getElementById('pack-price-big');
  const markupEl = document.getElementById('pack-markup');

  if (unitBigEl) unitBigEl.value = it.packOrigUnit || (guess ? guess.unitBig : 'Hộp');
  if (unitSmallEl) unitSmallEl.value = it.packConverted ? (it.unit || '') : ((guess && guess.unitSmall) ? guess.unitSmall : (it.unit || ''));
  if (sizeEl) sizeEl.value = it.packSize || (guess ? guess.size : '');
  if (qtyBigEl) qtyBigEl.value = it.packConverted ? (it.packOrigQty != null ? it.packOrigQty : '') : (it.qty || '');
  if (priceBigEl) priceBigEl.value = it.packConverted ? (it.packOrigPrice != null ? it.packOrigPrice : '') : (it.price || '');
  if (markupEl) markupEl.value = (it.packMarkup != null ? it.packMarkup : 15);

  ['pack-size', 'pack-qty-big', 'pack-price-big', 'pack-unit-big', 'pack-unit-small', 'pack-markup'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.oninput = updatePackPreview;
  });

  const hint = document.getElementById('pack-guess-hint');
  if (hint) {
    if (guess) {
      hint.textContent = `🔎 Tự nhận diện từ tên thuốc: ${guess.unitBig} = ${fmtNum(guess.size)} ${guess.unitSmall || 'đơn vị nhỏ'}. Vui lòng kiểm tra lại trước khi áp dụng.`;
    } else {
      hint.textContent = '';
    }
  }

  updatePackPreview();
  openModal('modal-pack');
}

function updatePackPreview() {
  const size = parseFloat(document.getElementById('pack-size')?.value) || 0;
  const qtyBig = parseFloat(document.getElementById('pack-qty-big')?.value) || 0;
  const priceBig = parseFloat(document.getElementById('pack-price-big')?.value) || 0;
  const markup = parseFloat(document.getElementById('pack-markup')?.value);
  const markupPct = isNaN(markup) ? 15 : markup;
  const unitBig = document.getElementById('pack-unit-big')?.value || 'đơn vị lớn';
  const unitSmall = document.getElementById('pack-unit-small')?.value || 'đơn vị nhỏ';

  const lblBig = document.getElementById('pack-unit-big-lbl');
  const lblSmall = document.getElementById('pack-unit-small-lbl');
  if (lblBig) lblBig.textContent = unitBig;
  if (lblSmall) lblSmall.textContent = unitSmall;

  const box = document.getElementById('pack-preview');
  if (!box) return;

  if (size <= 0) {
    box.innerHTML = '<span style="color:var(--text3)">Nhập quy cách đóng gói để xem kết quả tính toán.</span>';
    return;
  }
  const qtySmall = qtyBig * size;
  const priceSmall = priceBig / size;
  const sellPrice = roundTo100(priceSmall * (1 + markupPct / 100));

  box.innerHTML = `Số lượng nhập kho: <strong>${fmtNum(qtySmall)} ${esc(unitSmall)}</strong><br>`
    + `Đơn giá nhập (đã quy đổi): <strong>${fmtNum(priceSmall)}</strong> đ/${esc(unitSmall)}<br>`
    + `Giá bán (+${fmtNum(markupPct)}%, làm tròn trăm): <strong style="color:var(--accent2)">${fmtNum(sellPrice)}</strong> đ/${esc(unitSmall)}`;
}

function roundTo100(n) {
  return Math.round(n / 100) * 100;
}

function applyPackConvert() {
  if (packConvertIdx < 0) return;
  const size = parseFloat(document.getElementById('pack-size')?.value) || 0;
  if (size <= 0) {
    toast('Vui lòng nhập quy cách đóng gói hợp lệ (lớn hơn 0)', 'error');
    return;
  }
  const qtyBig = parseFloat(document.getElementById('pack-qty-big')?.value) || 0;
  const priceBig = parseFloat(document.getElementById('pack-price-big')?.value) || 0;
  const markup = parseFloat(document.getElementById('pack-markup')?.value);
  const markupPct = isNaN(markup) ? 15 : markup;
  const unitBig = document.getElementById('pack-unit-big')?.value.trim() || 'Hộp';
  const unitSmall = document.getElementById('pack-unit-small')?.value.trim() || 'Viên';
  
  const it = currentItems[packConvertIdx];
  it.qty = qtyBig * size;
  it.price = Math.round((priceBig / size) * 100) / 100;
  it.sellprice = roundTo100(it.price * (1 + markupPct / 100));
  it.unit = unitSmall;
  it.packConverted = true;
  it.packSize = size;
  it.packOrigUnit = unitBig;
  it.packOrigQty = qtyBig;
  it.packOrigPrice = priceBig;
  it.packMarkup = markupPct;

  renderItemsTable();
  closeModal('modal-pack');
  toast('Đã quy đổi sang ' + unitSmall + ' và tính lại giá bán (+' + fmtNum(markupPct) + '%)!', 'success');
}

