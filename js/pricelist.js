// ======================== PRICE LIST & AUTO-PRICING ========================

let priceListPage = 0;
const PRICE_PER_PAGE = 50;

function renderPriceList() {
  const q = normalize(document.getElementById('price-search')?.value || '');
  const countEl = document.getElementById('price-count');
  const tbody = document.getElementById('price-table-body');
  if (!tbody) return;

  const filtered = priceList.filter(d => !q || normalize(d.name).includes(q) || normalize(d.unit || '').includes(q));
  if (countEl) countEl.textContent = priceList.length;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:36px">
      ${priceList.length === 0 ? 'Chưa có bảng giá thuốc nào. Nhấn "Import Excel" hoặc "Thêm giá thuốc" để tạo!' : 'Không tìm thấy thuốc phù hợp'}
    </td></tr>`;
    renderPricePagination(0, 1);
    return;
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PRICE_PER_PAGE));
  if (priceListPage >= totalPages) priceListPage = totalPages - 1;
  if (priceListPage < 0) priceListPage = 0;

  const pageData = filtered.slice(priceListPage * PRICE_PER_PAGE, (priceListPage + 1) * PRICE_PER_PAGE);
  const offset = priceListPage * PRICE_PER_PAGE;

  tbody.innerHTML = pageData.map((d, i) => {
    const realIdx = priceList.indexOf(d);
    const importPriceText = (d.importPrice !== null && d.importPrice !== undefined && d.importPrice !== '' && !isNaN(d.importPrice)) 
      ? fmtNum(d.importPrice) 
      : '<span style="color:var(--text3);font-style:italic">Để trống</span>';
    const priceText = fmtNum(d.price || 0);

    return `<tr>
      <td class="row-num">${d.stt || (offset + i + 1)}</td>
      <td><strong>${esc(d.name)}</strong></td>
      <td><span class="chip" style="font-size:11px">${esc(d.unit || '—')}</span></td>
      <td class="td-mono" style="text-align:right">${importPriceText}</td>
      <td class="td-mono" style="text-align:right;color:var(--accent2);font-weight:700">${priceText}</td>
      <td class="hide-tablet" style="color:var(--text3);font-size:12px">${esc(d.note || '')}</td>
      <td style="text-align:right">
        <button class="btn btn-ghost btn-xs" onclick="editPriceItem(${realIdx})">✏️</button>
        <button class="btn btn-ghost btn-xs" onclick="deletePriceItem(${realIdx})" style="color:var(--red2)">✕</button>
      </td>
    </tr>`;
  }).join('');

  renderPricePagination(priceListPage, totalPages, filtered.length);
}

function renderPricePagination(current, total, totalCount = 0) {
  const container = document.getElementById('price-pagination');
  if (!container) return;
  if (total <= 1) {
    container.innerHTML = totalCount ? `<div style="font-size:12px;color:var(--text3)">Tổng cộng: ${totalCount} thuốc</div>` : '';
    return;
  }

  let html = `<div style="font-size:12px;color:var(--text3)">Trang ${current + 1}/${total} (${totalCount} thuốc)</div><div style="display:flex;gap:4px">`;
  html += `<button class="btn btn-outline btn-xs" onclick="goPricePage(${current - 1})" ${current === 0 ? 'disabled' : ''}>‹</button>`;
  
  const windowSize = 2;
  const pages = new Set([0, total - 1]);
  for (let p = Math.max(0, current - windowSize); p <= Math.min(total - 1, current + windowSize); p++) pages.add(p);
  const sorted = [...pages].sort((a, b) => a - b);
  let prev = -1;
  for (const p of sorted) {
    if (prev !== -1 && p - prev > 1) html += `<span style="padding:0 3px;color:var(--text3)">…</span>`;
    html += `<button class="btn btn-xs ${p === current ? 'btn-primary' : 'btn-outline'}" onclick="goPricePage(${p})">${p + 1}</button>`;
    prev = p;
  }
  html += `<button class="btn btn-outline btn-xs" onclick="goPricePage(${current + 1})" ${current >= total - 1 ? 'disabled' : ''}>›</button></div>`;
  container.innerHTML = html;
}

function goPricePage(p) {
  priceListPage = p;
  renderPriceList();
}

// Modal Thêm / Sửa giá thuốc
function showAddPriceItem() {
  document.getElementById('price-modal-title').textContent = 'Thêm giá thuốc';
  document.getElementById('price-edit-idx').value = '';
  document.getElementById('p-stt').value = (priceList.length + 1);
  document.getElementById('p-name').value = '';
  document.getElementById('p-unit').value = '';
  document.getElementById('p-import-price').value = '';
  document.getElementById('p-price').value = '';
  document.getElementById('p-note').value = '';
  openModal('modal-price');
}

function editPriceItem(idx) {
  const item = priceList[idx];
  if (!item) return;
  document.getElementById('price-modal-title').textContent = 'Sửa giá thuốc';
  document.getElementById('price-edit-idx').value = idx;
  document.getElementById('p-stt').value = item.stt || (idx + 1);
  document.getElementById('p-name').value = item.name || '';
  document.getElementById('p-unit').value = item.unit || '';
  document.getElementById('p-import-price').value = (item.importPrice !== null && item.importPrice !== undefined) ? item.importPrice : '';
  document.getElementById('p-price').value = item.price || 0;
  document.getElementById('p-note').value = item.note || '';
  openModal('modal-price');
}

function savePriceItem() {
  const name = document.getElementById('p-name')?.value?.trim();
  const price = parseFloat(document.getElementById('p-price')?.value) || 0;
  if (!name) {
    toast('Vui lòng nhập tên thuốc', 'error');
    return;
  }

  const unit = document.getElementById('p-unit')?.value?.trim() || '';
  const rawImport = document.getElementById('p-import-price')?.value?.trim();
  const importPrice = rawImport !== '' ? parseFloat(rawImport) : null;
  const stt = parseInt(document.getElementById('p-stt')?.value) || (priceList.length + 1);
  const note = document.getElementById('p-note')?.value?.trim() || '';

  const item = {
    stt,
    name,
    unit,
    importPrice,
    price,
    note,
    updatedAt: new Date().toISOString()
  };

  const idx = document.getElementById('price-edit-idx')?.value;
  if (idx !== '') {
    priceList[parseInt(idx)] = item;
  } else {
    priceList.push(item);
  }

  DB.set('pricelist', priceList);
  renderPriceList();
  closeModal('modal-price');
  toast('Đã lưu vào Bảng giá thuốc!', 'success');
}

function deletePriceItem(idx) {
  if (!confirm(`Xóa "${priceList[idx]?.name}" khỏi Bảng giá thuốc?`)) return;
  priceList.splice(idx, 1);
  DB.set('pricelist', priceList);
  renderPriceList();
  toast('Đã xóa', 'info');
}

function clearPriceList() {
  if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ Bảng giá thuốc?')) return;
  priceList = [];
  DB.set('pricelist', priceList);
  renderPriceList();
  toast('Đã xóa toàn bộ Bảng giá thuốc', 'info');
}

// Import Excel theo định dạng: STT, Tên thuốc, Đơn vị tính, Giá nhập, Giá bán
async function importPriceList(input) {
  const file = input.files[0];
  if (!file) return;
  toast('Đang đọc file Excel bảng giá...', 'info');

  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    if (!rows || rows.length < 2) {
      toast('File Excel không có dữ liệu!', 'error');
      input.value = '';
      return;
    }

    // Tìm dòng tiêu đề
    let headerRow = 0;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const r = rows[i].map(c => normalize(String(c)));
      if (r.some(c => c.includes('ten') || c.includes('thuoc') || c.includes('gia') || c.includes('stt') || c.includes('dvt'))) {
        headerRow = i;
        break;
      }
    }

    const headers = rows[headerRow].map(c => normalize(String(c)));
    const sttCol = headers.findIndex(c => c.includes('stt') || c === 'no' || c === 'tt');
    const nameCol = headers.findIndex(c => c.includes('ten') && (c.includes('thuoc') || c.includes('hang') || c.includes('sp') || c.length < 15));
    const unitCol = headers.findIndex(c => c.includes('don vi') || c.includes('dvt') || c.includes('unit'));
    const importPriceCol = headers.findIndex(c => (c.includes('nhap') || c.includes('von') || c.includes('cost')) && c.includes('gia'));
    const sellPriceCol = headers.findIndex(c => (c.includes('ban') || c.includes('le') || c.includes('retail')) && c.includes('gia'));

    const resolvedNameCol = nameCol >= 0 ? nameCol : 1;
    const resolvedSellPriceCol = sellPriceCol >= 0 ? sellPriceCol : (headers.findIndex(c => c.includes('gia') && c !== importPriceCol) >= 0 ? headers.findIndex(c => c.includes('gia') && c !== importPriceCol) : (rows[headerRow].length - 1));

    let added = 0;
    let updated = 0;

    for (let i = headerRow + 1; i < rows.length; i++) {
      const r = rows[i];
      const name = String(r[resolvedNameCol] || '').trim();
      if (!name || name.length < 2) continue;

      const rawStt = sttCol >= 0 ? parseInt(r[sttCol]) : 0;
      const stt = (!isNaN(rawStt) && rawStt > 0) ? rawStt : (priceList.length + 1);

      // Đơn vị tính
      const unit = unitCol >= 0 ? String(r[unitCol] || '').trim() : '';

      // Giá nhập (không bắt buộc, nếu có thì parse, không có thì để null)
      let importPrice = null;
      if (importPriceCol >= 0 && r[importPriceCol] !== '' && r[importPriceCol] !== undefined) {
        const parsed = parseFloat(String(r[importPriceCol]).replace(/[.,\s]/g, '').replace(',', '.'));
        if (!isNaN(parsed) && parsed > 0) importPrice = parsed;
      }

      // Giá bán
      let sellPrice = 0;
      if (resolvedSellPriceCol >= 0 && r[resolvedSellPriceCol] !== '' && r[resolvedSellPriceCol] !== undefined) {
        const parsed = parseFloat(String(r[resolvedSellPriceCol]).replace(/[.,\s]/g, '').replace(',', '.'));
        if (!isNaN(parsed)) sellPrice = parsed;
      }

      // Kiểm tra trùng tên thuốc để cập nhật hoặc thêm mới
      const existing = priceList.find(x => normalize(x.name) === normalize(name));
      if (existing) {
        existing.price = sellPrice;
        if (unit) existing.unit = unit;
        if (importPrice !== null) existing.importPrice = importPrice;
        existing.updatedAt = new Date().toISOString();
        updated++;
      } else {
        priceList.push({
          stt,
          name,
          unit,
          importPrice,
          price: sellPrice,
          note: '',
          updatedAt: new Date().toISOString()
        });
        added++;
      }
    }

    DB.set('pricelist', priceList);
    priceListPage = 0;
    renderPriceList();
    toast(`Nhập bảng giá thành công! Thêm mới ${added}, cập nhật ${updated} thuốc.`, 'success');
  } catch (e) {
    toast('Lỗi đọc file Excel: ' + e.message, 'error');
  } finally {
    input.value = '';
  }
}

// Xuất file Excel Bảng giá thuốc (gồm STT, Tên thuốc, Đơn vị tính, Giá nhập, Giá bán)
function exportPriceList() {
  if (!priceList.length) {
    toast('Bảng giá thuốc đang trống!', 'warning');
    return;
  }
  const wb = XLSX.utils.book_new();
  const headers = ['STT', 'Tên thuốc', 'Đơn vị tính', 'Giá nhập', 'Giá bán'];
  const rows = priceList.map((d, i) => [
    d.stt || (i + 1),
    d.name,
    d.unit || '',
    d.importPrice !== null && d.importPrice !== undefined ? d.importPrice : '',
    d.price || 0
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [{ wch: 8 }, { wch: 40 }, { wch: 14 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Bang_Gia_Thuoc');
  XLSX.writeFile(wb, `bang_gia_thuoc_${new Date().toISOString().split('T')[0]}.xlsx`);
  toast('Đã xuất file Excel bảng giá thuốc!', 'success');
}

// ======================== TỰ ĐỘNG NHẬP GIÁ THUỐC ========================
// Tính năng: Tự động tra cứu và điền giá bán + ĐVT thuốc khi nhập hóa đơn mới
function autoApplyPricesToCurrentInvoice() {
  if (!currentItems || !currentItems.length) {
    toast('Chưa có danh sách hàng nhập để điền giá bán!', 'warning');
    return;
  }

  let filledCount = 0;
  let fromPriceListCount = 0;
  let fromCatalogCount = 0;

  currentItems.forEach((it, idx) => {
    if (!it.name) return;
    let foundPrice = null;
    let foundUnit = null;

    // 1. Ưu tiên tìm trong Bảng giá thuốc (PriceList)
    let bestScore = 0;
    let bestPriceItem = null;
    for (const p of priceList) {
      const s = scoreDrug(p.name, it.name);
      if (s > bestScore) {
        bestScore = s;
        bestPriceItem = p;
      }
    }

    if (bestScore >= 50 && bestPriceItem && bestPriceItem.price > 0) {
      foundPrice = bestPriceItem.price;
      foundUnit = bestPriceItem.unit || null;
      fromPriceListCount++;
    } else {
      // 2. Dự phòng tìm trong Danh mục quầy (Catalog)
      const catMatch = findDrug(it.name);
      if (catMatch && catMatch.price > 0) {
        foundPrice = catMatch.price;
        foundUnit = catMatch.unit || null;
        fromCatalogCount++;
      }
    }

    // Gán giá bán nếu tìm được
    if (foundPrice !== null && foundPrice > 0) {
      currentItems[idx].sellprice = foundPrice;
      if (!currentItems[idx].unit && foundUnit) {
        currentItems[idx].unit = foundUnit;
      }
      filledCount++;
    }
  });

  renderItemsTable();

  if (filledCount > 0) {
    toast(`🎯 Đã tự động nhập giá bán cho ${filledCount}/${currentItems.length} thuốc! (Bảng giá: ${fromPriceListCount}, Danh mục: ${fromCatalogCount})`, 'success');
  } else {
    toast('Không tìm thấy giá bán phù hợp trong Bảng giá và Danh mục cho các thuốc này!', 'info');
  }
}
