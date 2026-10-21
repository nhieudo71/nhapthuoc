// ======================== RECORDS & DASHBOARD ========================

function renderRecords() {
  const q = normalize(document.getElementById('record-search')?.value || '');
  const list = document.getElementById('records-list');
  if (!list) return;

  const filtered = records.filter(r => !q || normalize(r.code).includes(q) || normalize(r.keeper).includes(q) || normalize(r.invoiceNum || '').includes(q));
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-title">Chưa có phiếu nhập nào</div>
      <div>Hãy nhập hóa đơn đầu tiên!</div>
    </div>`;
    return;
  }

  list.innerHTML = filtered.map(r => {
    const total = (r.items || []).reduce((s, it) => s + (it.qty || 0) * (it.price || 0) * (1 + (it.vat || 0) / 100) * (1 - (it.discount || 0) / 100), 0);
    const ri = records.indexOf(r);
    return `<div class="record-item" onclick="viewRecord(${ri})">
      <div class="record-info">
        <div class="record-num">📋 <strong>${r.code || '—'}</strong> ${r.invoiceNum ? `<span class="chip" style="font-size:12px">HĐ: ${esc(r.invoiceNum)}</span>` : ''}</div>
        <div class="record-date">📅 ${r.date || '—'} &nbsp;·&nbsp; 👤 ${esc(r.keeper || '—')} &nbsp;·&nbsp; 🏪 ${esc(r.warehouse || '—')} &nbsp;·&nbsp; 💊 ${(r.items || []).length} sp</div>
      </div>
      <div style="text-align:right;margin-right:10px;flex-shrink:0">
        <div class="record-amount">${fmtNum(total)}</div>
        <div style="font-size:12.5px;color:var(--text3)">VNĐ</div>
      </div>
      <button class="btn btn-outline btn-xs hide-mobile" onclick="event.stopPropagation();editRecord(${ri})">✏️ Sửa</button>
      <button class="btn btn-outline btn-xs hide-mobile" onclick="event.stopPropagation();exportRecordVNPT(${ri})">⬇️ Xuất</button>
    </div>`;
  }).join('');
}

function renderStats() {
  const c = document.getElementById('dashboard-stats');
  if (!c) return;
  const total = records.reduce((s, r) => s + (r.items || []).reduce((ss, it) => ss + (it.qty || 0) * (it.price || 0) * (1 + (it.vat || 0) / 100) * (1 - (it.discount || 0) / 100), 0), 0);
  const items = records.reduce((s, r) => s + (r.items || []).length, 0);

  c.innerHTML = `<div class="stat-card stat-blue">
    <div class="stat-label">Tổng phiếu</div>
    <div class="stat-value">${records.length}</div>
    <div class="stat-change">phiếu nhập</div>
  </div>
  <div class="stat-card stat-green">
    <div class="stat-label">Tổng tiền</div>
    <div class="stat-value">${fmtNum(total / 1000000)}M</div>
    <div class="stat-change">VNĐ</div>
  </div>
  <div class="stat-card stat-orange">
    <div class="stat-label">Số SP</div>
    <div class="stat-value">${items}</div>
    <div class="stat-change">dòng hàng</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Bảng giá</div>
    <div class="stat-value" style="color:var(--text2)">${priceList.length}</div>
    <div class="stat-change">thuốc có giá</div>
  </div>`;
}

function viewRecord(idx) {
  currentRecordIdx = idx;
  const r = records[idx];
  if (!r) return;
  const total = (r.items || []).reduce((s, it) => s + (it.qty || 0) * (it.price || 0) * (1 + (it.vat || 0) / 100) * (1 - (it.discount || 0) / 100), 0);

  const titleEl = document.getElementById('rec-modal-title');
  if (titleEl) titleEl.textContent = `Phiếu nhập ${r.code || ''} — ${r.date || ''}`;

  const bodyEl = document.getElementById('rec-modal-body');
  if (bodyEl) {
    bodyEl.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:14px">
      <div><div class="info-label">Ngày nhập</div><div class="info-value">${r.date || '—'}</div></div>
      <div><div class="info-label">Mã phiếu</div><div class="info-value text-mono">${r.code || '—'}</div></div>
      <div><div class="info-label">Thủ kho</div><div class="info-value">${esc(r.keeper || '—')}</div></div>
      <div><div class="info-label">Mã kho</div><div class="info-value text-mono">${esc(r.warehouse || '—')}</div></div>
      <div><div class="info-label">NCC</div><div class="info-value">${esc(r.supplier || '—')}</div></div>
      <div><div class="info-label">Số HĐ</div><div class="info-value">${esc(r.invoiceNum || '—')}</div></div>
    </div>
    <div class="table-wrap" style="max-height:380px;overflow-y:auto">
      <table>
        <thead><tr>
          <th class="row-num">#</th>
          <th>Mã hàng</th>
          <th>Tên hàng</th>
          <th>ĐVT</th>
          <th>Số lô</th>
          <th>HSD</th>
          <th>SL</th>
          <th>Đơn giá</th>
          <th>Giá bán</th>
          <th>VAT%</th>
          <th>Thành tiền</th>
        </tr></thead>
        <tbody>
          ${(r.items || []).map((it, i) => {
            const a = (it.qty || 0) * (it.price || 0) * (1 + (it.vat || 0) / 100) * (1 - (it.discount || 0) / 100);
            return `<tr>
              <td class="row-num">${i + 1}</td>
              <td class="td-mono">${it.code || '—'}</td>
              <td>${esc(it.name)}</td>
              <td>${esc(it.unit || '')}</td>
              <td class="td-mono">${esc(it.lot || '—')}</td>
              <td>${esc(it.expiry || '—')}</td>
              <td class="td-mono">${it.qty}</td>
              <td class="td-mono">${fmtNum(it.price)}</td>
              <td class="td-mono" style="color:var(--accent2)">${fmtNum(it.sellprice || 0)}</td>
              <td>${it.vat || 0}%</td>
              <td class="td-mono" style="color:var(--accent2);font-weight:700">${fmtNum(a)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div style="text-align:right;margin-top:12px;font-weight:800;font-size:17px">
      Tổng: <span style="color:var(--accent2)">${fmtNum(total)} đ</span>
    </div>`;
  }
  openModal('modal-record');
}

function deleteRecord(idx) {
  if (!confirm('Xóa phiếu nhập này?')) return;
  records.splice(idx, 1);
  DB.set('records', records);
  closeModal('modal-record');
  renderRecords();
  updateRecordCount();
  toast('Đã xóa phiếu nhập', 'info');
}

function updateRecordCount() {
  const el = document.getElementById('record-count');
  if (el) el.textContent = records.length;
}

