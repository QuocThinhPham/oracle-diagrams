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

Nhận xét lưu trong `comments.json`, trang `index.html` đọc file này để hiển thị (mục **Nhận xét** trên menu và nút **💬 Nhận xét** của từng sơ đồ). Thêm nhận xét: thêm một phần tử vào mảng rồi commit + push.

```json
{ "diagram": "infra-dc", "author": "Tên người nhận xét", "date": "2026-10-13", "text": "Nội dung" }
```

`diagram` là id sơ đồ (phần sau dấu `#` trên link, vd `digital-exacc`, `dwh-aix`, `infra-dr`). Xem trên máy cần chạy qua web server (vd `python -m http.server`), mở bằng file:// sẽ không đọc được `comments.json`.
