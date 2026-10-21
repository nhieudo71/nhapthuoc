// ======================== SUPPLIERS MANAGEMENT ========================

function renderSuppliers() {
  const tbody = document.getElementById('supplier-body');
  if (!tbody) return;

  tbody.innerHTML = suppliers.length ? suppliers.map((s, i) => `<tr>
    <td class="row-num">${i + 1}</td>
    <td class="td-mono">${esc(s.code || '')}</td>
    <td><strong>${esc(s.name)}</strong></td>
    <td class="hide-mobile">${esc(s.phone || '')}</td>
    <td class="hide-tablet" style="font-size:14px;color:var(--text3)">${esc(s.addr || '')}</td>
    <td class="hide-tablet" style="font-size:14px;color:var(--text3)">${esc(s.note || '')}</td>
    <td style="text-align:right">
      <button class="btn btn-ghost btn-xs" onclick="editSupplier(${i})">✏️</button>
      <button class="btn btn-ghost btn-xs" onclick="deleteSupplier(${i})" style="color:var(--red2)">✕</button>
    </td>
  </tr>`).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:32px">Chưa có nhà cung cấp</td></tr>';
}

function showAddSupplier() {
  document.getElementById('sup-edit-idx').value = '';
  ['sup-code', 'sup-name', 'sup-phone', 'sup-note', 'sup-addr'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  openModal('modal-supplier');
}

function editSupplier(i) {
  const s = suppliers[i];
  if (!s) return;
  document.getElementById('sup-edit-idx').value = i;
  document.getElementById('sup-code').value = s.code || '';
  document.getElementById('sup-name').value = s.name || '';
  document.getElementById('sup-phone').value = s.phone || '';
  document.getElementById('sup-note').value = s.note || '';
  document.getElementById('sup-addr').value = s.addr || '';
  openModal('modal-supplier');
}

function saveSupplier() {
  const name = document.getElementById('sup-name')?.value?.trim();
  if (!name) {
    toast('Vui lòng nhập tên NCC', 'error');
    return;
  }
  const s = {
    code: document.getElementById('sup-code')?.value?.trim() || '',
    name,
    phone: document.getElementById('sup-phone')?.value?.trim() || '',
    note: document.getElementById('sup-note')?.value?.trim() || '',
    addr: document.getElementById('sup-addr')?.value?.trim() || ''
  };
  const idx = document.getElementById('sup-edit-idx')?.value;
  if (idx !== '') suppliers[parseInt(idx)] = s;
  else suppliers.push(s);

  DB.set('suppliers', suppliers);
  renderSuppliers();
  closeModal('modal-supplier');
  toast('Đã lưu NCC!', 'success');
}

function deleteSupplier(i) {
  if (!confirm(`Xóa "${suppliers[i]?.name}" khỏi danh sách NCC?`)) return;
  suppliers.splice(i, 1);
  DB.set('suppliers', suppliers);
  renderSuppliers();
  toast('Đã xóa NCC', 'info');
}

function filterSupplierAC(q) {
  const ac = document.getElementById('supplier-ac');
  if (!ac) return;
  const nq = normalize(q);
  if (!nq) {
    ac.style.display = 'none';
    return;
  }
  const hits = suppliers.filter(s => normalize(s.name).includes(nq) || normalize(s.code).includes(nq)).slice(0, 6);
  if (!hits.length) {
    ac.style.display = 'none';
    return;
  }
  ac.innerHTML = hits.map(s => `
    <div class="autocomplete-item" onclick="selectSupAC('${esc(s.code)}')">
      <span class="drug-code">${esc(s.code)}</span>${esc(s.name)}
    </div>
  `).join('');
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

function selectSupAC(code) {
  const inp = document.getElementById('inp-supplier');
  if (inp) inp.value = code;
  const ac = document.getElementById('supplier-ac');
  if (ac) ac.style.display = 'none';
}

