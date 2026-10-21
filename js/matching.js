// ======================== DRUG MATCHING ========================

function extractCoreName(s) {
  return normalize(s)
    .replace(/\d+[.,]?\d*\s*(mg|mcg|ug|g|ml|l|iu|ui|%|mmol|meq)(\/\d+[.,]?\d*\s*(mg|mcg|g|ml|l|iu|ui|%))?/gi, '')
    .replace(/\b(vien|hop|chai|ong|goi|tube|tuyp|lo|bich|vi|tui|siro|syrup|tablet|capsule|injection|amp|ampul|nang|bot|kem|gel|dung dich|vien nen|vien nang)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreDrug(candidateName, queryName) {
  const cn = normalize(candidateName), qn = normalize(queryName);
  const cc = extractCoreName(candidateName), qc = extractCoreName(queryName);
  if (cn === qn) return 100;
  if (cc === qc && cc.length > 1) return 95;
  if (cn.startsWith(qn) || qn.startsWith(cn)) return 88;
  if (cc.startsWith(qc) || qc.startsWith(cc)) return 83;
  if (cn.includes(qn) || qn.includes(cn)) return 75;
  if (cc.includes(qc) || qc.includes(cc)) return 70;
  
  // Token overlap — đếm từ chung có ý nghĩa (>= 2 ký tự)
  const ta = cn.split(' ').filter(w => w.length >= 2);
  const tb = qn.split(' ').filter(w => w.length >= 2);
  const setB = new Set(tb);
  const inter = ta.filter(w => setB.has(w));
  if (inter.length >= 1) {
    const firstMatch = ta[0] && tb[0] && (ta[0] === tb[0] || ta[0].startsWith(tb[0]) || tb[0].startsWith(ta[0]));
    const ratio = inter.length / Math.max(ta.length, tb.length, 1);
    const base = Math.round(35 + ratio * 45);
    return firstMatch ? Math.min(base + 15, 90) : base;
  }
  return 0;
}

function findDrug(name) {
  if (!name || name.trim() === '') return null;

  // 1. Danh mục quầy — ưu tiên tuyệt đối (có mã + giá bán đầy đủ)
  let bestCatScore = 0, bestCat = null;
  for (const d of catalog) {
    const s = scoreDrug(d.name, name);
    if (s > bestCatScore) {
      bestCatScore = s;
      bestCat = d;
    }
  }
  if (bestCatScore >= 35) return { ...bestCat, _fromNational: false };

  // 2. Dược quốc gia
  let bestNatScore = 0, bestNat = null;
  for (const d of national) {
    const s = scoreDrug(d.name, name);
    if (s > bestNatScore) {
      bestNatScore = s;
      bestNat = d;
    }
  }
  if (bestNatScore >= 35 && bestNat) {
    let crossScore = 0, crossMatch = null;
    for (const d of catalog) {
      const s = scoreDrug(d.name, bestNat.name);
      if (s > crossScore) {
        crossScore = s;
        crossMatch = d;
      }
    }
    if (crossScore >= 35) return { ...crossMatch, _fromNational: false };
    return { code: bestNat.code || '', name: bestNat.name, unit: '', price: 0, vat: 0, _fromNational: true };
  }

  return null;
}

// Dò lại toàn bộ danh sách hàng nhập
function rematchAll() {
  let fixed = 0;
  currentItems.forEach((it, i) => {
    const m = findDrug(it.name);
    if (m && m.code && m.code !== it.code) {
      currentItems[i].code = m.code;
      currentItems[i].matchSrc = m._fromNational ? 'nat' : 'cat';
      currentItems[i].matched = true;
      if (m.unit && !it.unit) currentItems[i].unit = m.unit;
      if (m.price && !it.sellprice) currentItems[i].sellprice = m.price;
      if (m.vat && !it.vat) currentItems[i].vat = m.vat;
      fixed++;
    } else if (m && !it.code) {
      currentItems[i].matchSrc = m._fromNational ? 'nat' : 'cat';
    }
  });
  renderItemsTable();
  toast(fixed > 0 ? `Dò lại xong! Cập nhật ${fixed} sản phẩm` : 'Không có thêm mã nào mới', 'info');
}

// Dò mã hàng loạt bằng Gemini AI
async function aiMatchAll() {
  const key = cleanApiKey(apiKey || DB.get('apikey', ''));
  if (!key) {
    toast('Vui lòng nhập Gemini API Key trong Cài đặt', 'error');
    return;
  }
  const unmatched = currentItems.filter(it => !it.code);
  if (!unmatched.length) {
    toast('Tất cả sản phẩm đã có mã hàng!', 'success');
    return;
  }

  const btn = document.getElementById('btn-ai-match');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Đang dò...';
  }

  const catLines = catalog.map(d => `${d.code}|${d.name}|${d.unit || ''}|${d.price || 0}|${d.vat || 0}`).join('\n');
  const natLines = national.slice(0, 2000).map(d => `${d.code || ''}|${d.name}`).join('\n');
  const itemLines = unmatched.map((it, i) => `${i + 1}. ${it.name}`).join('\n');

  const prompt = `Bạn là trợ lý dược phẩm. Hãy dò mã hàng cho các sản phẩm dưới đây bằng cách đối chiếu với danh mục.

DANH MỤC QUẦY (mã|tên|đvt|giá bán|vat):
${catLines || '(trống)'}

DANH MỤC DƯỢC QUỐC GIA (mã|tên):
${natLines || '(trống)'}

SẢN PHẨM CẦN DÒ MÃ:
${itemLines}

Quy tắc:
- Ưu tiên khớp danh mục quầy (có mã + giá bán đầy đủ hơn)
- Nếu không có trong danh mục quầy thì dùng mã DQG
- Cho phép khớp mờ: bỏ qua hàm lượng, dạng bào chế, viết tắt
- Nếu không tìm được thì để code rỗng ""

Trả về JSON (không markdown):
{"results":[{"idx":1,"code":"mã hàng","name":"tên chuẩn trong danh mục","unit":"","price":0,"vat":0,"src":"cat hoặc nat hoặc"}]}`;

  try {
    const txt = await callGeminiAI([{ text: prompt }]);
    const clean = txt.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    let fixed = 0;
    (parsed.results || []).forEach(r => {
      if (!r.code) return;
      const it = unmatched[r.idx - 1];
      if (!it) return;
      const realIdx = currentItems.indexOf(it);
      if (realIdx < 0) return;
      currentItems[realIdx].code = r.code;
      currentItems[realIdx].matchSrc = r.src || 'ai';
      currentItems[realIdx].matched = true;
      if (r.unit && !currentItems[realIdx].unit) currentItems[realIdx].unit = r.unit;
      if (r.price && !currentItems[realIdx].sellprice) currentItems[realIdx].sellprice = r.price;
      if (r.vat && !currentItems[realIdx].vat) currentItems[realIdx].vat = r.vat;
      fixed++;
    });
    renderItemsTable();
    toast(`AI dò xong! Tìm được mã cho ${fixed}/${unmatched.length} sản phẩm`, 'success');
  } catch (e) {
    toast('Lỗi AI: ' + e.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '🤖 <span class="btn-label-sm">Dò mã AI</span>';
    }
  }
}

