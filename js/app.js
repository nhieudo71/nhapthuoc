// ======================== APP INITIALIZATION & ROUTER ========================

function showPage(p) {
  document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));

  const pg = document.getElementById('page-' + p);
  if (pg) pg.classList.add('active');

  document.querySelectorAll(`[data-page="${p}"]`).forEach(x => x.classList.add('active'));
  closeSidebar();

  if (p === 'records') {
    renderRecords();
    renderStats();
  }
  if (p === 'lookup') {
    renderLookupPage();
  }
  if (p === 'pricelist') {
    renderPriceList();
  }
  if (p === 'catalog') {
    renderCatalog();
  }
  if (p === 'national') {
    renderNational();
  }
  if (p === 'suppliers') {
    renderSuppliers();
  }
  if (p === 'backup') {
    renderStorageInfo();
  }
  if (p === 'settings') {
    loadSettings();
  }
}

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', async () => {
  // Apply saved theme
  applyTheme(currentTheme);

  // Khởi tạo và nạp dữ liệu từ IndexedDB (dung lượng lưu trữ lên đến 5GB)
  await DB.initAndMigrate();

  // Initialize Drag & Drop for file upload
  const dropZone = document.getElementById('drop-zone');
  if (dropZone) {
    dropZone.addEventListener('dragover', e => {
      e.preventDefault();
      dropZone.classList.add('drag');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('drag');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    });
  }

  // Khởi tạo danh sách nhà cung cấp hóa đơn điện tử
  initProviderSelect();

  // Cập nhật số lượng phiếu nhập
  updateRecordCount();
});

