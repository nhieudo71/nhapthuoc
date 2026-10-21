// ======================== NATIONAL DRUG DATABASE ========================

let natPage = 0;
const NAT_PER_PAGE = 50;

function renderNational() {
  const q = normalize(document.getElementById('nat-search')?.value || '');
  const container = document.getElementById('nat-content');
  const countEl = document.getElementById('nat-count');
  if (countEl) countEl.textContent = national.length.toLocaleString('vi-VN');
  if (!container) return;

  if (!national.length) {
    if (!DB.isReady) {
      container.innerHTML = `<div class="empty-state" style="padding:40px 20px">
        <div style="font-size:36px;margin-bottom:12px;animation:spin 1s linear infinite;display:inline-block">⏳</div>
        <div class="empty-title">Đang nạp 52.000 thuốc quốc gia từ IndexedDB...</div>
        <div style="color:var(--text3);font-size:14px">Vui lòng chờ trong giây lát (khoảng 1-2 giây)</div>
      </div>`;
      return;
    }
    container.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🏥</div>
      <div class="empty-title">Chưa có danh mục dược quốc gia</div>
      <div>Nhấn "Import DQG" để tải lên file Excel/XLS</div>
    </div>`;
    return;
  }

  const filtered = national.filter(d => !q || normalize(d.name).includes(q) || normalize(d.code || '').includes(q));
  const totalPages = Math.max(1, Math.ceil(filtered.length / NAT_PER_PAGE));
  if (natPage >= totalPages) natPage = totalPages - 1;
  if (natPage < 0) natPage = 0;

  const pageData = filtered.slice(natPage * NAT_PER_PAGE, (natPage + 1) * NAT_PER_PAGE);
  const offset = natPage * NAT_PER_PAGE;

  const windowSize = 2;
  const pages = new Set([0, totalPages - 1]);
  for (let p = Math.max(0, natPage - windowSize); p <= Math.min(totalPages - 1, natPage + windowSize); p++) pages.add(p);
  const sorted = [...pages].sort((a, b) => a - b);
  let btnHtml = '';
  let prev = -1;
  for (const p of sorted) {
    if (prev !== -1 && p - prev > 1) btnHtml += `<span style="padding:0 4px;color:var(--text3)">…</span>`;
    btnHtml += `<button onclick="natGoPage(${p})" class="btn btn-sm ${p === natPage ? 'btn-primary' : 'btn-outline'}" style="min-width:32px;padding:4px 8px">${p + 1}</button>`;
    prev = p;
  }

  container.innerHTML = `
    <div class="table-wrap" style="max-height:460px;overflow-y:auto">
      <table>
        <thead><tr>
          <th class="row-num">#</th>
          <th>Mã thuốc</th>
          <th>Tên thuốc</th>
          <th class="hide-mobile">Hoạt chất</th>
          <th class="hide-tablet">Dạng bào chế</th>
        </tr></thead>
        <tbody>
          ${pageData.map((d, i) => `<tr>
            <td class="row-num">${offset + i + 1}</td>
            <td class="td-mono">${esc(d.code || '—')}</td>
            <td><strong>${esc(d.name)}</strong></td>
            <td class="hide-mobile" style="font-size:14px;color:var(--text3)">${esc(d.active || '')}</td>
            <td class="hide-tablet" style="font-size:14px;color:var(--text3)">${esc(d.form || '')}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:10px 4px 2px">
      <div style="font-size:14px;color:var(--text3);font-weight:600">
        Trang ${natPage + 1}/${totalPages} &nbsp;·&nbsp; ${filtered.length.toLocaleString('vi-VN')} kết quả${q ? ' (đang lọc)' : ''}
      </div>
      <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap">
        <button onclick="natGoPage(natPage-1)" class="btn btn-outline btn-sm" ${natPage === 0 ? 'disabled' : ''}>‹</button>
        ${btnHtml}
        <button onclick="natGoPage(natPage+1)" class="btn btn-outline btn-sm" ${natPage >= totalPages - 1 ? 'disabled' : ''}>›</button>
      </div>
    </div>`;
}

function natGoPage(p) {
  const q = normalize(document.getElementById('nat-search')?.value || '');
  const filtered = national.filter(d => !q || normalize(d.name).includes(q) || normalize(d.code || '').includes(q));
  const totalPages = Math.max(1, Math.ceil(filtered.length / NAT_PER_PAGE));
  natPage = Math.max(0, Math.min(p, totalPages - 1));
  renderNational();
  document.getElementById('nat-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function importNational(input) {
  const file = input.files[0];
  if (!file) return;
  toast('Đang đọc file DQG...', 'info');
  let rows;
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  } catch (e) {
    toast('Lỗi đọc file: ' + e.message, 'error');
    input.value = '';
    return;
  }

  let headerRow = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i].map(c => normalize(String(c)));
    if (r.some(c => c.includes('ten') || c.includes('thuoc') || c.includes('ma'))) {
      headerRow = i;
      break;
    }
  }
  const headers = rows[headerRow].map(c => normalize(String(c)));
  const codeCol = headers.findIndex(c => c.includes('ma') && (c.includes('thuoc') || c.includes('dang') || c === 'ma'));
  const nameCol = headers.findIndex(c => c.includes('ten') && (c.includes('thuoc') || c.includes('thuong')));
  const activeCol = headers.findIndex(c => c.includes('hoat chat'));
  const formCol = headers.findIndex(c => c.includes('dang bao') || c.includes('ham luong'));

  const dataRows = rows.slice(headerRow + 1);
  if (!dataRows.length) {
    toast('Không tìm thấy dữ liệu trong file', 'error');
    input.value = '';
    return;
  }

  const CHUNK = 500;
  const parsed = [];
  toast(`Đang xử lý ${dataRows.length.toLocaleString('vi-VN')} dòng...`, 'info');
  for (let start = 0; start < dataRows.length; start += CHUNK) {
    const chunk = dataRows.slice(start, start + CHUNK);
    for (const r of chunk) {
      const name = String(r[nameCol >= 0 ? nameCol : 1] || r[1] || '').trim();
      if (!name || name.length < 2) continue;
      parsed.push({
        code: String(r[codeCol >= 0 ? codeCol : 0] || '').trim(),
        name,
        active: String(r[activeCol >= 0 ? activeCol : ''] || '').trim(),
        form: String(r[formCol >= 0 ? formCol : ''] || '').trim()
      });
    }
    await new Promise(r => setTimeout(r, 0));
  }

  if (!parsed.length) {
    toast('Không đọc được dữ liệu. Kiểm tra lại định dạng file.', 'error');
    input.value = '';
    return;
  }

  national = parsed;
  natPage = 0;
  
  toast(`Đang lưu ${national.length.toLocaleString('vi-VN')} thuốc vào ổ cứng IndexedDB...`, 'info');
  // Chờ transaction hoàn tất ghi trọn vẹn xuống IndexedDB trước khi báo hoàn tất
  await DB.set('national', national);
  
  renderNational();
  toast(`✅ Đã lưu vĩnh viễn ${national.length.toLocaleString('vi-VN')} thuốc DQG vào IndexedDB! F5/Refresh không bao giờ mất!`, 'success');
  input.value = '';
}

async function clearNational() {
  if (!confirm('Xóa toàn bộ danh mục dược quốc gia?')) return;
  national = [];
  natPage = 0;
  if (typeof idbClearNational === 'function') {
    await idbClearNational();
  }
  await DB.set('national', national);
  renderNational();
  toast('Đã xóa danh mục DQG', 'info');
}

