# Oracle diagrams

Sơ đồ kiến trúc Oracle trước và sau khi migrate lên Exadata Cloud@Customer (ExaCC).

Mở `index.html` để xem toàn bộ: menu bên trái chọn sơ đồ, mỗi sơ đồ có nút Tổng quan / Chi tiết và "Sao chép ảnh" để dán vào PowerPoint.

| Nhóm | File |
|---|---|
| Hiện trạng · IBM AIX | `oracle-digital-onprem-aix-light.html`, `oracle-hub-onprem-aix-light.html`, `oracle-card-onprem-aix-light.html`, `oracle-dwh-onprem-aix-light.html` |
| Mục tiêu · ExaCC (logic) | `oracle-digital-dc-dr-light.html`, `oracle-card-dc-dr-light.html`, `oracle-dwh-dc-dr-light.html` |
| Hạ tầng vật lý · ExaCC | `oracle-exacc-physical-light.html`, `oracle-exacc-infra-dc-light.html`, `oracle-exacc-infra-dr-light.html` |

Thêm sơ đồ mới: tạo file HTML rồi thêm một dòng vào danh sách `GROUPS` trong `index.html`.

## Nhận xét

Người xem gõ nhận xét ngay trên trang (nút **💬 Nhận xét** → nhập tên, nội dung → **Gửi nhận xét**). Nhận xét được ghi vào `comments.json` và hiện ở mục **Nhận xét** trên menu.

Việc ghi file cần chạy trang qua `server.js` (Node, không cần cài thư viện):

```powershell
node server.js         # chỉ máy này: http://127.0.0.1:5501/
node server.js --lan   # cho máy khác cùng mạng LAN/VPN: http://<IP máy>:5501/
```

Trên GitHub Pages trang chỉ đọc `comments.json` (ô nhập tự ẩn). Muốn đưa nhận xét lên bản online: commit + push `comments.json`.

Mỗi phần tử trong `comments.json`:

```json
{ "diagram": "infra-dc", "author": "Tên", "date": "2026-10-13 15:30", "text": "Nội dung" }
```

`diagram` là id sơ đồ (phần sau dấu `#` trên link, vd `digital-exacc`, `dwh-aix`, `infra-dr`).
