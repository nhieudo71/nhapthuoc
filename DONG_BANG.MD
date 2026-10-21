# BẢN ĐÓNG BĂNG TÍNH NĂNG & KIẾN TRÚC HỆ THỐNG (DONG_BANG.MD)
**Dự án:** PharmImport — Hệ Thống Quản Lý Nhập Hàng Dược Phẩm & Tương Thích VNPT  
**Phiên bản đóng băng (Baseline):** v1.0 — Ngày 21/10/2026  
**Mục đích:** Đóng băng toàn bộ các tính năng cốt lõi đang hoạt động ổn định, tránh mọi sự can thiệp làm gãy vỡ chức năng hoặc xung đột dữ liệu trong các đợt nâng cấp tiếp theo.

---

## 1. CÁC TÍNH NĂNG ĐÃ HOÀN THÀNH & ĐÓNG BĂNG 100%

### 1.1. Module Nhập & Phân Tích Hóa Đơn (`js/invoice-parser.js`)
- [x] **Đọc file Excel (.xls, .xlsx, .csv):** Tự động nhận diện dòng tiêu đề và các cột quan trọng (Tên hàng, Số lô, Hạn dùng, Đơn vị tính, Số lượng, Đơn giá, VAT, Chiết khấu).
- [x] **Xử lý PDF & Ảnh bằng Gemini AI:** Gửi ảnh/PDF đến Gemini API (`gemini-2.5-flash`, `gemini-1.5-flash`) kèm ngữ cảnh 50 thuốc trong danh mục quầy để trích xuất JSON cấu trúc chuẩn.
- [x] **Trích xuất thông tin hóa đơn:** Tự động tách Ký hiệu hóa đơn, Số hóa đơn (ghép dạng `KyHieu-So`), Ngày hóa đơn, Tên người bán/MST.
- [x] **Cơ chế Fallback Offline (Tesseract.js & PDF.js):** Khi không có API Key hoặc AI quá tải (HTTP 503), hệ thống tự động kích hoạt Tesseract OCR WebAssembly chạy cục bộ ngay trong trình duyệt mà không cần mạng.
- [x] **Hỗ trợ XML Hóa Đơn Điện Tử Thông Tư 78 & Bản Thể Hiện Trực Quan (PDF Preview):** Đọc trực tiếp file XML hóa đơn gốc của các nhà mạng (VNPT, Viettel, MISA, BKAV...). Tự động bóc tách đầy đủ Số Lô (Lot/Batch) và Hạn dùng (Expiry) qua 4 tầng: thẻ XML trực tiếp (`SoLo`, `HanDung`), thẻ mở rộng (`TTKhac`/`TTin`), thẻ ghi chú (`GChu`/`Note`), và chuỗi tên hàng hóa. Cung cấp trình render bản thể hiện trực quan hóa đơn điện tử tương tự file PDF ngay trong module tra cứu trước khi xác nhận nhập kho.

### 1.2. Module Dò Mã Thuốc Thông Minh (`js/matching.js`)
- [x] **Thuật toán Fuzzy Core-name Matching:** Chuẩn hóa tiếng Việt không dấu, loại bỏ hàm lượng (mg, ml, iu...) và quy cách dạng bào chế (viên, vỉ, lọ, chai...).
- [x] **Thứ tự ưu tiên đối chiếu:**
  1. *Danh mục thuốc quầy (`catalog`):* Ưu tiên tuyệt đối, điểm khớp >= 35 sẽ lấy mã hàng và giá bán của quầy.
  2. *Dược quốc gia (`national`):* Đối chiếu chéo để lấy tên chuẩn và mã DQG.
- [x] **AI Match All hàng loạt:** Gọi Gemini AI để đối chiếu danh sách thuốc chưa có mã với toàn bộ danh mục quầy và 2.000 thuốc DQG.

### 1.3. Module Quy Đổi Đơn Vị Đóng Gói (`js/pack-convert.js`)
- [x] **Tự động nhận diện quy cách từ tên thuốc:** Dò các chuỗi như `T/56C/200V` (nhân đa cấp thành viên), `v/10, H/50` (lấy cấp cuối), `H/100`.
- [x] **Tính toán tự động:**
  - `Số lượng nhập kho = SL hóa đơn × Quy cách đóng gói`
  - `Đơn giá nhập mới = Đơn giá hóa đơn ÷ Quy cách đóng gói`
  - `Giá bán lẻ = Đơn giá nhập mới × (1 + % Lãi / 100)` (mặc định 15%, tự động làm tròn đến hàng trăm).

### 1.4. Module Xuất File Excel VNPT (`js/import-view.js`)
- [x] **Định dạng chuẩn 100% phần mềm VNPT Pharmacy:**
  - *Sheet 1:* `Thông tin phiếu nhập` (14 cột: STT, Ngày nhập, Mã phiếu, Ngày HĐ, Số HĐ, Thủ kho, Mã kho, Chiết khấu, Mã NCC, Vận chuyển, Người giao, Thực trả, Ghi chú).
  - *Sheet 2:* `Danh sách hàng nhập` (13 cột: STT, Mã phiếu, Mã hàng, Tên hàng, ĐVT, Giá nhập, Giá bán, Số lượng, VAT, Chiết khấu, Lô SX, Hạn dùng, Vị trí).
  - *Sheet 3:* `Hướng dẫn` (Quy định bắt buộc theo mẫu của VNPT).
- [x] Xuất đúng file định dạng `.xls` tương thích mọi phiên bản VNPT.

### 1.5. Module Quản Lý Dữ Liệu Cục Bộ (`js/db.js`, `js/catalog.js`, `js/national.js`, `js/suppliers.js`, `js/records.js`)
- [x] **Danh mục thuốc quầy:** CRUD, tìm kiếm, import Excel tự động loại trừ trùng lặp.
- [x] **Dược quốc gia:** Phân trang ảo (Pagination) 50 dòng/trang, import chunk 500 dòng tránh đơ trình duyệt, cơ chế lưu trữ rút gọn (slim storage) khi dung lượng LocalStorage chạm ngưỡng quota.
- [x] **Nhà cung cấp:** CRUD, autocomplete theo mã hoặc tên khi lập hóa đơn.
- [x] **Lịch sử phiếu nhập & Dashboard:** Thống kê tổng số phiếu, tổng tiền nhập (triệu VNĐ), tổng dòng sản phẩm; xem chi tiết, sửa trực tiếp, xóa phiếu.
- [x] **Sao lưu & Phục hồi:** Xuất/nhập toàn bộ cơ sở dữ liệu qua file JSON.

---

## 2. HỢP ĐỒNG DỮ LIỆU & CƠ CHẾ LƯU TRỮ INDEXEDDB (TỐI ĐA 5GB)

Hệ thống sử dụng cơ sở dữ liệu **IndexedDB** (`PharmImport_IndexedDB`) kết hợp Cache RAM tức thì và LocalStorage dự phòng, hỗ trợ lưu trữ dung lượng lên tới **5GB+**:
1. `records`: Mảng các đối tượng phiếu nhập đã lưu.
2. `catalog`: Mảng danh mục thuốc quầy (`code`, `name`, `unit`, `price`, `vat`, `note`).
3. `national`: Mảng dược quốc gia (`code`, `name`, `active`, `form`) - lưu trữ trọn vẹn không giới hạn.
4. `suppliers`: Mảng nhà cung cấp (`code`, `name`, `phone`, `addr`, `note`).
5. `settings`: Thông tin quầy (`name`, `shopcode`, `keeper`, `supplier`).
6. `apikey`: Khóa Google Gemini API Key.
7. `theme`: Giao diện sáng/tối (`'dark'` | `'light'`).
8. `pricelist`: Bảng giá thuốc mới (`stt`, `name`, `unit`, `importPrice`, `price`, `note`, `updatedAt`).
9. `lookup_history`: Lịch sử các mã hóa đơn đã tra cứu gần đây (`code`, `providerId`, `sellerTax`, `time`).

> ⚠️ **QUY TẮC BẢO VỆ:**  
> - Bất kỳ trường dữ liệu nào mới được thêm vào phải có giá trị mặc định, không được làm crash các hàm đọc dữ liệu cũ.  
> - File xuất Excel cho VNPT không được thay đổi tên cột hoặc thứ tự cột vì hệ thống VNPT Pharmacy sẽ từ chối import nếu sai cấu trúc.

---

## 3. KIẾN TRÚC PHÂN CHIA MODULE (MODULAR ARCHITECTURE)

Hệ thống được module hóa thành các tệp độc lập, sử dụng HTML5, CSS3, Tailwind utilities và Vanilla JavaScript:
```
Nhap-thuoc/
│
├── index.html                  # Giao diện chính, cấu trúc HTML & nhúng module
├── DONG_BANG.MD                # Tài liệu đóng băng tính năng
│
├── css/
│   └── style.css               # Toàn bộ CSS giao diện, Dark/Light Theme, Responsive
│
└── js/
    ├── db.js                   # LocalStorage abstraction & biến trạng thái toàn cục
    ├── ui.js                   # Theme, Sidebar, Toast, Modal, Helper format số/ngày
    ├── matching.js             # Thuật toán dò mã thuốc, AI matching
    ├── pack-convert.js         # Quy đổi đóng gói hộp/thùng -> lẻ & tính giá bán
    ├── invoice-parser.js       # Phân tích hóa đơn (Excel, PDF, Ảnh, XML TT78)
    ├── invoice-lookup.js       # Tra cứu & tải hóa đơn từ các nhà cung cấp VN
    ├── pricelist.js            # Quản lý Tab Bảng giá thuốc & Tự động nhập giá bán
    ├── import-view.js          # Giao diện nhập hóa đơn, bảng hàng hóa, xuất VNPT
    ├── records.js              # Lịch sử phiếu nhập & Dashboard thống kê
    ├── catalog.js              # Danh mục thuốc quầy
    ├── national.js             # Dược quốc gia (phân trang, chunking)
    ├── suppliers.js            # Danh sách nhà cung cấp
    ├── backup-settings.js      # Sao lưu, phục hồi, cài đặt, kiểm tra API key
    └── app.js                  # Khởi chạy ứng dụng & Router tab điều hướng
```

---

## 4. QUY TRÌNH NÂNG CẤP TIẾP THEO
Mọi tính năng mới chỉ được phép:
1. Thêm hàm mới hoặc module mới vào thư mục `js/`.
2. Bổ sung giao diện vào các thẻ `<div id="page-...">` tương ứng trong `index.html`.
3. Tuyệt đối không xóa bỏ hoặc ghi đè các hàm hiện hữu trong danh sách đóng băng ở Mục 1.

