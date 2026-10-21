// ======================== PHARMACY CATALOG ========================

function renderCatalog() {
  const q = normalize(document.getElementById('cat-search')?.value || '');
  const filtered = catalog.filter(d => !q || normalize(d.name).includes(q) || normalize(d.code).includes(q));
  
  const countEl = document.getElementById('cat-count');
  if (countEl) countEl.textContent = catalog.length;

  const tbody = document.getElementById('catalog-body');
  if (!tbody) return;

  tbody.innerHTML = filtered.length ? filtered.map(d => {
    const ri = catalog.indexOf(d);
    return `<tr>
      <td class="row-num">${ri + 1}</td>
      <td class="td-mono">${esc(d.code || '')}</td>
      <td><strong>${esc(d.name)}</strong></td>
      <td class="hide-mobile">${esc(d.unit || '')}</td>
      <td class="td-mono" style="color:var(--accent2);font-weight:700">${fmtNum(d.price || 0)}</td>
      <td class="hide-mobile">${d.vat || 0}%</td>
      <td class="hide-tablet" style="color:var(--text3);font-size:14px">${esc(d.note || '')}</td>
      <td style="text-align:right">
        <button class="btn btn-ghost btn-xs" onclick="editDrug(${ri})">✏️</button>
        <button class="btn btn-ghost btn-xs" onclick="deleteDrug(${ri})" style="color:var(--red2)">✕</button>
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:32px">Chưa có thuốc nào</td></tr>';
}

function showAddDrug() {
  document.getElementById('drug-modal-title').textContent = 'Thêm thuốc mới';
  document.getElementById('drug-edit-idx').value = '';
  ['d-code', 'd-name', 'd-unit', 'd-vat', 'd-price', 'd-note'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('d-vat').value = '5';
  openModal('modal-drug');
}

function editDrug(i) {
  const d = catalog[i];
  if (!d) return;
  document.getElementById('drug-modal-title').textContent = 'Sửa thuốc';
  document.getElementById('drug-edit-idx').value = i;
  document.getElementById('d-code').value = d.code || '';
  document.getElementById('d-name').value = d.name || '';
  document.getElementById('d-unit').value = d.unit || '';
  document.getElementById('d-vat').value = d.vat || 5;
  document.getElementById('d-price').value = d.price || 0;
  document.getElementById('d-note').value = d.note || '';
  openModal('modal-drug');
}

function saveDrug() {
  const name = document.getElementById('d-name')?.value?.trim();
  if (!name) {
    toast('Vui lòng nhập tên thuốc', 'error');
    return;
  }
  const d = {
    code: document.getElementById('d-code')?.value?.trim() || '',
    name,
    unit: document.getElementById('d-unit')?.value?.trim() || '',
    vat: parseFloat(document.getElementById('d-vat')?.value) || 0,
    price: parseFloat(document.getElementById('d-price')?.value) || 0,
    note: document.getElementById('d-note')?.value?.trim() || ''
  };
  const idx = document.getElementById('drug-edit-idx')?.value;
  if (idx !== '') catalog[parseInt(idx)] = d;
  else catalog.push(d);

  DB.set('catalog', catalog);
  renderCatalog();
  closeModal('modal-drug');
  toast('Đã lưu thuốc vào danh mục!', 'success');
}

function deleteDrug(i) {
  if (!confirm(`Xóa "${catalog[i]?.name}" khỏi danh mục?`)) return;
  catalog.splice(i, 1);
  DB.set('catalog', catalog);
  renderCatalog();
  toast('Đã xóa', 'info');
}

async function importCatalog(input) {
  const file = input.files[0];
  if (!file) return;
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    let headerRow = 0;
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const r = rows[i].map(c => String(c).toLowerCase());
      if (r.some(c => c.includes('mã') || c.includes('code') || c.includes('tên'))) {
        headerRow = i;
        break;
      }
    }
    const headers = rows[headerRow].map(c => String(c).toLowerCase());
    const codeCol = headers.findIndex(c => c.includes('mã'));
    const nameCol = headers.findIndex(c => c.includes('tên'));
    const unitCol = headers.findIndex(c => c.includes('đơn vị') || c.includes('dvt'));
    const priceCol = headers.findIndex(c => c.includes('giá bán') || c.includes('price'));
    const vatCol = headers.findIndex(c => c.includes('vat') || c.includes('thuế'));

    let added = 0;
    for (let i = headerRow + 1; i < rows.length; i++) {
      const r = rows[i];
      const name = String(r[nameCol] || r[1] || '').trim();
      if (!name) continue;
      const code = String(r[codeCol] || r[0] || '').trim();
      if (!catalog.find(d => d.code === code && d.name === name)) {
        catalog.push({
          code,
          name,
          unit: String(r[unitCol] || '').trim(),
          price: parseFloat(String(r[priceCol] || 0).replace(/\./g, '').replace(',', '.')) || 0,
          vat: parseFloat(r[vatCol] || 5) || 5,
          note: ''
        });
        added++;
      }
    }
    DB.set('catalog', catalog);
    renderCatalog();
    toast(`Import xong! Thêm ${added} thuốc`, 'success');
  } catch (e) {
    toast('Lỗi import danh mục: ' + e.message, 'error');
  } finally {
    input.value = '';
  }
}

