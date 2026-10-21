// ======================== IMPORT VIEW & VNPT EXPORT ========================

function initImportView(items, invoiceInfo) {
  currentItems = items;
  if (editingRecordIdx >= 0) {
    editingRecordIdx = -1;
    setEditModeUI(false);
  }
  document.getElementById('invoice-section').style.display = '';
  document.getElementById('items-section').style.display = '';
  document.getElementById('btn-save').disabled = false;
  document.getElementById('btn-export').disabled = false;

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('inp-date').value = today;
  document.getElementById('inp-code').value = Date.now().toString().slice(-8);
  document.getElementById('inp-keeper').value = settings.keeper || '';
  document.getElementById('inp-warehouse').value = settings.shopcode || '';
  document.getElementById('inp-supplier').value = settings.supplier || '';

  // Điền tự động số HĐ, ngày HĐ, NCC nếu trích xuất được
  if (invoiceInfo) {
    if (invoiceInfo.invoiceNumber) document.getElementById('inp-invoice-num').value = invoiceInfo.invoiceNumber;
    if (invoiceInfo.invoiceDate) {
      const iso = vnDateToISO(invoiceInfo.invoiceDate);
      if (iso) document.getElementById('inp-invoice-date').value = iso;
    }
    if (invoiceInfo.supplierName && !document.getElementById('inp-supplier').value) {
      document.getElementById('inp-supplier').value = invoiceInfo.supplierName;
    }
  }

  // Tự động kiểm tra giá bán từ Bảng giá thuốc ngay khi mở hóa đơn
  if (priceList && priceList.length) {
    let autoPriced = 0;
    currentItems.forEach((it, idx) => {
      if (!it.sellprice || it.sellprice === 0) {
        const found = priceList.find(p => normalize(p.name) === normalize(it.name));
        if (found && found.price > 0) {
          currentItems[idx].sellprice = found.price;
          autoPriced++;
        }
      }
    });
  }

  renderItemsTable();
  const infoMsg = (invoiceInfo && (invoiceInfo.invoiceNumber || invoiceInfo.invoiceDate)) ? ' (đã tự nhận thông tin hóa đơn)' : '';
  toast('Đọc xong! ' + items.length + ' sản phẩm' + infoMsg, 'success');
}

function renderItemsTable() {
  const tbody = document.getElementById('items-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  let total = 0, hasUnmatched = false;

  currentItems.forEach((it, i) => {
    const amt = (it.qty || 0) * (it.price || 0) * (1 + (it.vat || 0) / 100) * (1 - (it.discount || 0) / 100);
    total += amt;
    if (!it.code) hasUnmatched = true;

    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="row-num">${i + 1}</td>
      <td>
        <div class="autocomplete-wrap">
          <input class="form-input" style="min-width:150px;font-size:12px;padding:6px 8px" value="${esc(it.name)}" onchange="updateItem(${i},'name',this.value)" oninput="showDrugAC(${i},this)">
          <div class="autocomplete-list" id="ac-${i}" style="display:none"></div>
        </div>
        ${it.code && it.matchSrc === 'cat'
          ? `<div class="drug-match" style="font-size:10.5px">✓ <strong>${it.code}</strong> <span style="opacity:.65">(quầy)</span></div>`
          : it.code && it.matchSrc === 'nat'
          ? `<div style="font-size:10.5px;color:var(--blue2);font-weight:600">✓ <strong>${it.code}</strong> <span style="opacity:.65">(DQG)</span></div>`
          : it.code && it.matchSrc === 'ai'
          ? `<div style="font-size:10.5px;color:var(--orange2);font-weight:600">🤖 <strong>${it.code}</strong> <span style="opacity:.65">(AI)</span></div>`
          : it.code
          ? `<div class="drug-match" style="font-size:10.5px">✓ ${it.code}</div>`
          : `<div class="drug-nomatch">⚠ Chưa có mã</div>`}
      </td>
      <td><input class="form-input td-mono" style="width:88px;font-size:12px;padding:6px 8px" value="${esc(it.code)}" onchange="updateItem(${i},'code',this.value)" placeholder="Mã hàng"></td>
      <td class="hide-mobile"><input class="form-input" style="width:66px;font-size:12px;padding:6px 8px" value="${esc(it.unit)}" onchange="updateItem(${i},'unit',this.value)"></td>
      <td class="hide-mobile"><input class="form-input td-mono" style="width:78px;font-size:12px;padding:6px 8px" value="${esc(it.lot)}" onchange="updateItem(${i},'lot',this.value)"></td>
      <td><input class="form-input" style="width:96px;font-size:12px;padding:6px 8px" value="${esc(it.expiry)}" onchange="updateItem(${i},'expiry',this.value)" placeholder="DD/MM/YYYY"></td>
      <td><input class="form-input td-mono" style="width:66px;font-size:12px;padding:6px 8px;text-align:right" type="number" value="${it.qty || 0}" onchange="updateItem(${i},'qty',this.value)" min="0"></td>
      <td><input class="form-input td-mono" style="width:96px;font-size:12px;padding:6px 8px;text-align:right" type="number" value="${it.price || 0}" onchange="updateItem(${i},'price',this.value)" step="0.01"></td>
      <td class="hide-tablet"><input class="form-input td-mono" style="width:88px;font-size:12px;padding:6px 8px;text-align:right;color:var(--accent2);font-weight:700" type="number" value="${it.sellprice || 0}" onchange="updateItem(${i},'sellprice',this.value)" placeholder="Giá bán"></td>
      <td class="hide-mobile"><input class="form-input" style="width:52px;font-size:12px;padding:6px 8px;text-align:right" type="number" value="${it.vat || 0}" onchange="updateItem(${i},'vat',this.value)" min="0"></td>
      <td class="hide-tablet"><input class="form-input" style="width:52px;font-size:12px;padding:6px 8px;text-align:right" type="number" value="${it.discount || 0}" onchange="updateItem(${i},'discount',this.value)" min="0"></td>
      <td class="td-mono" style="text-align:right;color:var(--accent2);font-weight:700;white-space:nowrap" id="amt-${i}">${fmtNum(amt)}</td>
      <td>${it.packConverted ? `<span class="btn btn-outline btn-xs" style="padding:4px 7px;font-size:11px" onclick="openPackConvert(${i})" title="Đã quy đổi: ${it.packOrigUnit || ''} → ${it.unit || ''} (x${it.packSize || 1}), lãi +${it.packMarkup != null ? it.packMarkup : 15}%">✅📦</span>` : `<span class="btn btn-outline btn-xs" style="padding:4px 7px;font-size:11px" onclick="openPackConvert(${i})" title="Quy đổi đơn vị đóng gói">📦</span>`}</td>
      <td><span class="delete-row" onclick="removeRow(${i})">✕</span></td>`;
    tbody.appendChild(tr);
  });

  const totalCell = document.getElementById('total-cell');
  if (totalCell) totalCell.textContent = fmtNum(total);
  const itemsStats = document.getElementById('items-stats');
  if (itemsStats) itemsStats.textContent = `${currentItems.length} dòng`;
  const matchWarning = document.getElementById('match-warning');
  if (matchWarning) matchWarning.style.display = hasUnmatched ? '' : 'none';
  updateRecordCount();
}

function updateItem(i, field, val) {
  if (['qty', 'price', 'sellprice', 'vat', 'discount'].includes(field)) val = parseFloat(val) || 0;
  currentItems[i][field] = val;
  const it = currentItems[i];
  const amt = (it.qty || 0) * (it.price || 0) * (1 + (it.vat || 0) / 100) * (1 - (it.discount || 0) / 100);
  const el = document.getElementById('amt-' + i);
  if (el) el.textContent = fmtNum(amt);
  let total = 0;
  currentItems.forEach(x => total += (x.qty || 0) * (x.price || 0) * (1 + (x.vat || 0) / 100) * (1 - (x.discount || 0) / 100));
  const totalCell = document.getElementById('total-cell');
  if (totalCell) totalCell.textContent = fmtNum(total);
}

function addRow() {
  currentItems.push({
    name: '',
    code: '',
    unit: '',
    lot: '',
    expiry: '',
    qty: 0,
    price: 0,
    sellprice: 0,
    vat: 5,
    discount: 0,
    matched: false,
    matchSrc: ''
  });
  renderItemsTable();
}

function removeRow(i) {
  currentItems.splice(i, 1);
  renderItemsTable();
}

function clearImport() {
  currentItems = [];
  document.getElementById('invoice-section').style.display = 'none';
  document.getElementById('items-section').style.display = 'none';
  document.getElementById('btn-save').disabled = true;
  document.getElementById('btn-export').disabled = true;
  document.getElementById('file-input').value = '';
  showProgress(false);
  if (editingRecordIdx >= 0) {
    editingRecordIdx = -1;
    setEditModeUI(false);
  }
}

function showDrugAC(idx, input) {
  const q = normalize(input.value);
  const ac = document.getElementById('ac-' + idx);
  if (!q || q.length < 2) {
    if (ac) ac.style.display = 'none';
    return;
  }
  const hits = [...catalog, ...national].filter(d => normalize(d.name).includes(q)).slice(0, 8);
  if (!hits.length) {
    if (ac) ac.style.display = 'none';
    return;
  }
  const catSet = new Set(catalog.map(d => d.name));
  ac.innerHTML = hits.map(d => {
    const src = catSet.has(d.name) ? 'cat' : 'nat';
    const srcLabel = src === 'cat'
      ? '<span style="color:var(--accent2);font-size:10px;margin-left:4px">[quầy]</span>'
      : '<span style="color:var(--blue2);font-size:10px;margin-left:4px">[DQG]</span>';
    return `<div class="autocomplete-item" onclick="selectDrugAC(${idx},'${esc(d.name)}','${esc(d.code || '')}','${esc(d.unit || '')}',${d.price || 0},${d.vat || 0},'${src}')">
      <span class="drug-code">${d.code || '—'}</span>${esc(d.name)}${d.unit ? ' (' + esc(d.unit) + ')' : ''}${srcLabel}
    </div>`;
  }).join('');
  ac.style.display = '';

  setTimeout(() => {
    const handler = (e) => {
      if (!ac.contains(e.target)) {
        ac.style.display = 'none';
        document.removeEventListener('click', handler);
      }
    };
    document.addEventListener('click', handler);
  }, 100);
}

function selectDrugAC(idx, name, code, unit, price, vat, src) {
  currentItems[idx].name = name;
  currentItems[idx].code = code;
  if (unit) currentItems[idx].unit = unit;
  if (price) currentItems[idx].sellprice = price;
  if (vat) currentItems[idx].vat = vat;
  currentItems[idx].matched = !!code;
  currentItems[idx].matchSrc = src || '';
  renderItemsTable();
  const ac = document.getElementById('ac-' + idx);
  if (ac) ac.style.display = 'none';
}

function getFormData() {
  return {
    date: document.getElementById('inp-date')?.value || '',
    code: document.getElementById('inp-code')?.value || '',
    invoiceNum: document.getElementById('inp-invoice-num')?.value || '',
    invoiceDate: document.getElementById('inp-invoice-date')?.value || '',
    keeper: document.getElementById('inp-keeper')?.value || '',
    warehouse: document.getElementById('inp-warehouse')?.value || '',
    supplier: document.getElementById('inp-supplier')?.value || '',
    discount: document.getElementById('inp-discount')?.value || '',
    paid: document.getElementById('inp-paid')?.value || '',
    deliverer: document.getElementById('inp-deliverer')?.value || '',
    transport: document.getElementById('inp-transport')?.value || '',
    note: document.getElementById('inp-note')?.value || ''
  };
}

function editRecord(idx) {
  const r = records[idx];
  if (!r) return;
  editingRecordIdx = idx;
  closeModal('modal-record');
  showPage('import');
  currentItems = (r.items || []).map(it => ({ ...it }));

  document.getElementById('invoice-section').style.display = '';
  document.getElementById('items-section').style.display = '';
  document.getElementById('btn-save').disabled = false;
  document.getElementById('btn-export').disabled = false;

  document.getElementById('inp-date').value = r.date || '';
  document.getElementById('inp-code').value = r.code || '';
  document.getElementById('inp-invoice-num').value = r.invoiceNum || '';
  document.getElementById('inp-invoice-date').value = r.invoiceDate || '';
  document.getElementById('inp-keeper').value = r.keeper || '';
  document.getElementById('inp-warehouse').value = r.warehouse || '';
  document.getElementById('inp-supplier').value = r.supplier || '';
  document.getElementById('inp-discount').value = r.discount || '';
  document.getElementById('inp-paid').value = r.paid || '';
  document.getElementById('inp-deliverer').value = r.deliverer || '';
  document.getElementById('inp-transport').value = r.transport || '';
  document.getElementById('inp-note').value = r.note || '';

  renderItemsTable();
  setEditModeUI(true);
  toast('Đang sửa phiếu nhập ' + (r.code || ''), 'info');
}

function cancelEditRecord() {
  editingRecordIdx = -1;
  clearImport();
  setEditModeUI(false);
}

function setEditModeUI(on) {
  const saveBtn = document.getElementById('btn-save');
  if (saveBtn) {
    saveBtn.innerHTML = on ? '💾 <span class="btn-label-sm">Cập nhật</span>' : '💾 <span class="btn-label-sm">Lưu</span>';
  }
  const cancelBtn = document.getElementById('btn-cancel-edit');
  if (cancelBtn) cancelBtn.style.display = on ? '' : 'none';
}

function saveRecord() {
  const form = getFormData();
  if (!form.date || !form.keeper || !form.warehouse) {
    toast('Vui lòng điền đầy đủ thông tin bắt buộc (*)', 'error');
    return;
  }
  if (editingRecordIdx >= 0 && records[editingRecordIdx]) {
    const prevSavedAt = records[editingRecordIdx].savedAt;
    records[editingRecordIdx] = { ...form, items: [...currentItems], savedAt: prevSavedAt, updatedAt: new Date().toISOString() };
    DB.set('records', records);
    updateRecordCount();
    toast('Đã cập nhật phiếu nhập!', 'success');
    editingRecordIdx = -1;
    setEditModeUI(false);
    clearImport();
    showPage('records');
    return;
  }
  const record = { ...form, items: [...currentItems], savedAt: new Date().toISOString() };
  records.unshift(record);
  DB.set('records', records);
  updateRecordCount();
  toast('Đã lưu phiếu nhập!', 'success');
}

function exportVNPT() {
  const form = getFormData();
  const wb = buildVNPTWorkbook(form, currentItems);
  XLSX.writeFile(wb, `phieunhap_${form.code || 'export'}_${form.date || 'today'}.xls`, { bookType: 'xls' });
  toast('Đã xuất file Excel VNPT (.xls)!', 'success');
}

function exportRecordVNPT(idx) {
  const rec = records[idx];
  if (!rec) return;
  const wb = buildVNPTWorkbook(rec, rec.items || []);
  XLSX.writeFile(wb, `phieunhap_${rec.code || idx}_${rec.date || 'export'}.xls`, { bookType: 'xls' });
  toast('Đã xuất file Excel VNPT (.xls)!', 'success');
}

function buildVNPTWorkbook(form, items) {
  const wb = XLSX.utils.book_new();
  const s1H = ['STT', 'Ngày nhập *', 'Mã phiếu nhập *', 'Ngày hóa đơn', 'Số hóa đơn', 'Thủ kho nhập *', 'Mã kho nhập *', 'Chiết khấu (%)', 'Mã nhà cung cấp (***) ', 'Phương tiện vận chuyển', 'Đơn vị vận chuyển', 'Người giao hàng', 'Thực trả NCC (***) ', 'Ghi chú'];
  const s1R = [1, toVNDate(form.date), form.code, toVNDate(form.invoiceDate) || '', form.invoiceNum || '', form.keeper, form.warehouse, form.discount || '', form.supplier || '', form.transport || '', '', form.deliverer || '', form.paid || '', form.note || ''];
  const ws1 = XLSX.utils.aoa_to_sheet([s1H, s1R]);
  ws1['!cols'] = s1H.map((_, i) => ({ wch: [5, 14, 16, 14, 14, 18, 14, 12, 18, 18, 16, 16, 16, 20][i] || 14 }));
  XLSX.utils.book_append_sheet(wb, ws1, 'Thông tin phiếu nhập');

  const s2H = ['STT *', 'Mã phiếu nhập *', 'Mã hàng *', 'Tên hàng ', 'Đơn vị tính ', 'Giá nhập *', 'Giá bán *', 'Số lượng *', 'VAT (%)', 'Chiết khấu (%)', 'Lô SX **', 'Ngày HH **', 'Vị trí'];
  const s2R = items.map((it, i) => [
    i + 1,
    form.code,
    it.code || '',
    it.name,
    it.unit || '',
    parseFloat(it.price) || 0,
    parseInt(it.sellprice) || 0,
    parseInt(it.qty) || 0,
    parseFloat(it.vat) || 0,
    parseFloat(it.discount) || 0,
    it.lot || '',
    convertExpiryDate(it.expiry),
    ''
  ]);
  const ws2 = XLSX.utils.aoa_to_sheet([s2H, ...s2R]);
  ws2['!cols'] = [5, 16, 12, 30, 10, 12, 10, 10, 8, 10, 12, 14, 10].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws2, 'Danh sách hàng nhập');

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['STT', 'Dữ liệu', 'Mô tả'],
    [1, '*', 'Các trường bắt buộc nhập'],
    [2, '**', 'Không bắt buộc: Cần nhập nếu liên thông dược quốc gia'],
    [3, 'Kho nhập', 'Mã cửa hàng có kho cần nhập'],
    [4, 'Nhà cung cấp', 'Nhập mã nhà cung cấp'],
    [5, 'Mã phiếu nhập', 'Hàng nhập map với phiếu nhập qua trường này'],
    [6, 'Giá bán', 'Không nhập số thập phân'],
    [7, 'Giá nhập', 'Chỉ được nhập 2 số thập phân']
  ]), 'Hướng dẫn');

  return wb;
}

function convertExpiryDate(s) {
  if (!s) return '';
  const m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) return `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}/${m[3]}`;
  const m2 = s.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  if (m2) return `${m2[3]}/${m2[2]}/${m2[1]}`;
  return s;
}

