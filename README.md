# 💊 PharmImport — Quản Lý Nhập Hàng Dược Phẩm

**PharmImport** là ứng dụng web hiện đại, gọn nhẹ giúp quầy thuốc & nhà thuốc xử lý nhanh quy trình nhập hàng từ hóa đơn (Excel, Ảnh, PDF, XML), tự động dò mã hàng theo danh mục quầy và Dược Quốc Gia, tự động điền giá bán, và xuất file Excel tương thích 100% với phần mềm **VNPT Pharmacy**.

---

## 🚀 Tính Năng Nổi Bật

1. **Đọc hóa đơn đa định dạng thông minh:**
   - **Excel (.xls, .xlsx, .csv):** Tự động nhận diện cột Tên hàng, Số lô, HSD, Số lượng, Đơn giá, VAT, Chiết khấu.
   - **Ảnh & PDF (Gemini AI + OCR Tesseract.js):** Nhận diện hóa đơn quét/chụp bằng AI hoặc OCR cục bộ chạy ngay trong trình duyệt mà không cần mạng.
   - **XML Hóa Đơn Điện Tử (Thông tư 78):** Đọc trực tiếp file XML gốc của VNPT, Viettel, MISA, BKAV... với độ chính xác 100%.

2. **Tra cứu & Tải hóa đơn từ Nhà Cung Cấp:**
   - Hỗ trợ 14 nhà cung cấp HĐĐT lớn nhất Việt Nam: **Tổng Cục Thuế, VNPT-Invoice, Viettel S-Invoice, MISA meInvoice, BKAV eHoadon, EasyInvoice, Thái Sơn, CyberBill, Mắt Bão, FPT, M-Invoice, MobiFone, VNPAY, Vi-Invoice**.
   - Chỉ cần nhập mã hóa đơn và bấm **📥 Tải vào app**, hệ thống tự động dò và mở ngay bảng thông tin phiếu nhập cùng danh sách mặt hàng trong ứng dụng.

3. **Tab Bảng giá thuốc & Nút "🎯 Tự nhập giá thuốc":**
   - Quản lý bảng giá niêm yết theo định dạng: `STT`, `Tên thuốc`, `Giá nhập` (không bắt buộc), `Giá bán`.
   - Nhập/xuất file Excel bảng giá thuốc dễ dàng.
   - Nút **🎯 Tự nhập giá thuốc** trên thanh công cụ Bước 3 tự động quét và điền giá bán cho toàn bộ sản phẩm trên hóa đơn mới chỉ với 1 click.

4. **Quy đổi đơn vị đóng gói (Hộp/Thùng ➔ Viên/Lọ):**
   - Tự động nhận diện quy cách từ tên thuốc (VD: `T/56C/200V`, `v/10, H/50`, `H/100`).
   - Tự tính lại số lượng nhập, đơn giá nhập lẻ và tính giá bán lẻ theo % lãi bạn chọn (mặc định +15%, tự làm tròn trăm).

5. **Xuất file Excel chuẩn VNPT Pharmacy (.xls):**
   - Đúng cấu trúc 2 sheet dữ liệu (`Thông tin phiếu nhập`, `Danh sách hàng nhập`) và sheet `Hướng dẫn` tương thích 100% khi import vào phần mềm VNPT.

6. **Bảo mật & Cục bộ:**
   - Dữ liệu lưu an toàn trên máy người dùng (LocalStorage), hỗ trợ Sao lưu & Phục hồi JSON nhanh chóng.

---

## 📁 Cấu Trúc Mã Nguồn (Modular Architecture)

```
Nhap-thuoc/
│
├── index.html                  # Giao diện chính ứng dụng
├── README.md                   # Hướng dẫn sử dụng chi tiết
├── DONG_BANG.MD                # Tài liệu đóng băng kiến trúc & dữ liệu
│
├── css/
│   └── style.css               # Giao diện Dark/Light theme, bố cục responsive
│
└── js/
    ├── db.js                   # Quản lý LocalStorage & trạng thái ứng dụng
    ├── ui.js                   # Điều khiển theme, sidebar, thông báo toast, modal
    ├── matching.js             # Thuật toán dò mã thuốc, AI match hàng loạt
    ├── pack-convert.js         # Module quy đổi đóng gói & tính lãi
    ├── invoice-parser.js       # Phân tích hóa đơn (Excel, PDF, Ảnh, XML TT78)
    ├── invoice-lookup.js       # Tra cứu & nạp hóa đơn từ nhà cung cấp Việt Nam
    ├── pricelist.js            # Quản lý Tab Bảng giá thuốc & Tự nhập giá bán
    ├── import-view.js          # Xử lý bảng hàng nhập, tính tiền, xuất file VNPT
    ├── records.js              # Lịch sử phiếu nhập & Dashboard thống kê
    ├── catalog.js              # Quản lý danh mục thuốc quầy
    ├── national.js             # Tra cứu danh mục Dược Quốc Gia
    ├── suppliers.js            # Quản lý danh sách nhà cung cấp
    ├── backup-settings.js      # Sao lưu, phục hồi dữ liệu, cài đặt API key
    └── app.js                  # Khởi chạy ứng dụng & router chuyển trang
```

---

## 📖 Hướng Dẫn Sử Dụng Chi Tiết

### Bước 1: Nhập hóa đơn vào hệ thống
Bạn có 2 cách nhập hóa đơn:

#### Cách 1: Kéo thả file hóa đơn
- Kéo và thả file **Excel**, **Ảnh** (PNG, JPG), **PDF** hoặc **XML** vào ô *Bước 1 — Tải hóa đơn lên*.
- Ứng dụng sẽ tự động phân tích và nạp toàn bộ danh sách thuốc.

#### Cách 2: Tải bằng Mã hóa đơn từ Nhà Cung Cấp
1. Tại ô tra cứu bên phải Bước 1, chọn **Đơn vị cung cấp hóa đơn** (ví dụ: VNPT, Viettel, MISA, BKAV...).
2. Nhập **Mã tra cứu hóa đơn** hoặc **Số hóa đơn** (ví dụ: `1C25TBA-1241`).
3. Bấm **📥 Tải vào app**:
   - Ứng dụng sẽ tự động dò và mở ngay **Bước 2 (Thông tin phiếu nhập)** cùng **Bước 3 (Danh sách hàng nhập)** ngay trong app.
   - Tự động điền Số hóa đơn, Ngày hóa đơn và Nhà cung cấp tương ứng.

---

### Bước 2: Dò mã thuốc & Áp giá bán

1. **Dò mã thuốc:**
   - Bấm **🔄 Dò lại** để so khớp mã hàng từ Danh mục thuốc quầy và Dược Quốc Gia.
   - Bấm **🤖 Dò mã AI** để dùng trí tuệ nhân tạo Gemini dò mã tự động cho các thuốc chưa có mã.

2. **Tự nhập giá bán thuốc:**
   - Bấm nút **🎯 Tự nhập giá thuốc** trên thanh công cụ Bước 3.
   - Hệ thống sẽ tự động đối chiếu tên thuốc với **Bảng giá thuốc** và điền ngay giá bán (`sellprice`) cho bạn.

3. **Quy đổi đóng gói lẻ (nếu cần):**
   - Với các thuốc bán theo viên/lọ nhưng trên hóa đơn ghi theo hộp/thùng, bấm icon **📦** ở cuối dòng để quy đổi số lượng và tính giá bán theo % lãi mong muốn.

---

### Bước 3: Lưu & Xuất file VNPT

1. Bấm **💾 Lưu** để lưu phiếu nhập vào lịch sử hệ thống.
2. Bấm **⬇️ Xuất VNPT** để tải file Excel `.xls`.
3. Mở phần mềm VNPT Pharmacy, vào mục **Nhập hàng ➔ Nhập từ file Excel** và chọn file vừa xuất.

---

### Quản lý Bảng Giá Thuốc & Danh Mục

- **Tab Bảng giá thuốc:**
  - Nhập file Excel bảng giá thuốc gồm 4 cột: `STT`, `Tên thuốc`, `Giá nhập` (không bắt buộc), `Giá bán`.
  - Giúp bạn quản lý bảng giá bán lẻ cố định của quầy thuốc.
- **Tab Sao lưu & Phục hồi:**
  - Định kỳ bấm **⬇️ Tải file sao lưu** để tải file `.json` lưu về máy tính nhằm bảo vệ dữ liệu khi đổi trình duyệt hoặc cài lại máy.

---

## 🛠️ Công Nghệ Sử Dụng
- **Ngôn ngữ:** HTML5, CSS3, Tailwind CSS, Vanilla JavaScript (ES6+).
- **Thư viện ngoài:** SheetJS (xlsx.full.min.js), Tesseract.js (OCR WebAssembly), PDF.js.
- **AI Engine:** Google Gemini API (`gemini-2.5-flash`).
- **Không yêu cầu Node.js server:** Chạy hoàn toàn tĩnh (Client-side) trên mọi trình duyệt web hiện đại.
