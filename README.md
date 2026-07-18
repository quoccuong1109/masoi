<div align="center">

# 🌙 MA SÓI · GAME MASTER TOOL 🐺

**Công cụ hỗ trợ Quản trò — phân vai, điều phối đêm/ngày, bỏ phiếu, theo dõi thắng thua**

[![Live Demo](https://img.shields.io/badge/🎮_Live_Demo-quoccuong1109.github.io-7c3aed?style=for-the-badge)](https://quoccuong1109.github.io/masoi)
[![Roles](https://img.shields.io/badge/Vai_trò-19_vai-fbbf24?style=for-the-badge)](#-danh-sách-vai-trò-19-vai)
[![Players](https://img.shields.io/badge/Người_chơi-4_–_30-14b8a6?style=for-the-badge)](#)
[![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-ES6_Modules-f59e0b?style=for-the-badge&logo=javascript&logoColor=white)](#-công-nghệ)

</div>

---

## ✨ Tính năng nổi bật

| | |
|---|---|
| 🎲 **Random cân bằng** | Thuật toán tính điểm sức mạnh từng vai, đảm bảo tỉ lệ Sói/Dân công bằng qua 200 lần thử |
| 🌙 **Điều phối đêm** | Thứ tự gọi dậy tự động, picker chọn nạn nhân / bảo vệ / điều tra trực quan |
| ☀️ **Ban ngày đầy đủ** | Timer thảo luận có vòng tròn đếm ngược, bảng nhập phiếu, hiển thị kết quả |
| 💀 **Chuỗi tử vong** | Thợ Săn bắn, Sói Đầu Đàn kéo theo, người yêu chết theo — tự động xử lý theo đúng thứ tự |
| 📌 **Pin vai** | Ghim các vai muốn giữ cố định khi Random lại |
| 💾 **Lưu tên người chơi** | Tự động gợi ý tên đã chơi từ ván trước |
| 📜 **Lịch sử ván** | Ghi lại toàn bộ hành động đêm/ngày, tổng kết cuối ván |
| 🔊 **Hiệu ứng âm thanh** | Web Audio API — không cần tải file ngoài |

---

## 🐺 Danh sách vai trò (19 vai)

### Phe Ma Sói — thắng khi bằng hoặc vượt số Dân còn sống

| Vai | | Khả năng |
|-----|---|----------|
| Ma Sói | 🐺 | Mỗi đêm thức dậy cùng đồng đội, chọn 1 nạn nhân |
| Sói Đầu Đàn | 👑 | Bị treo cổ ban ngày → kéo thêm 1 người chết theo |
| Sói Con | 🐶 | Bị loại → toàn bộ Sói thức thêm 1 lần để trả thù |
| Sói Trắng | 🤍 | Đêm chẵn tiêu diệt thêm 1 người kể cả đồng đội · **Mục tiêu: thắng một mình** |
| Người Sói | 🧑‍🦱 | Tiên Tri soi ra là **Dân** · miễn nhiễm hoàn toàn |
| **Trùm Sói** 🆕 | 🤴 | Mỗi đêm điều tra 1 người — biết ngay họ có phải **Dân Làng thường** không |

### Phe Dân Làng — thắng khi loại hết Ma Sói

| Vai | | Khả năng |
|-----|---|----------|
| Tiên Tri | 🔮 | Mỗi đêm soi 1 người: **Sói** hay **Dân** *(Người Sói hiện là Dân!)* |
| Phù Thủy | 🧙 | 1 thuốc cứu + 1 thuốc độc, mỗi lọ dùng 1 lần |
| Thợ Săn | 🏹 | Khi chết (ngày hoặc đêm) → bắn ngay 1 người khác |
| Bảo Vệ | 🛡️ | Mỗi đêm che chắn 1 người, không trùng đêm trước |
| Thần Tình Yêu | 💘 | Đêm 1 ghép đôi 2 người · 1 chết → người kia chết theo |
| Cảnh Sát Trưởng | ⭐ | Phiếu bầu ban ngày **gấp đôi** · có thể truyền lại trước khi chết |
| Kẻ Ngốc | 🃏 | Mục tiêu: bị treo cổ ban ngày → **thắng một mình** |
| Linh Mục | ✝️ | 1 lần thánh hóa ban ngày · nếu là Sói → bị loại ngay |
| Đồng Cốt | 👻 | Mỗi đêm hỏi 1 hồn ma 1 câu Có/Không |
| **Bác Sĩ** 🆕 | 🩺 | Mỗi đêm cứu 1 người khỏi đòn tấn công của Sói *(kể cả bản thân, không biết ai bị cắn)* |
| **Thám Tử** 🆕 | 🕵️ | Mỗi đêm chọn 2 người · Quản trò báo **Có/Không** có Ma Sói trong đó |
| **Mối Giới** 🆕 | 🤝 | 1 lần duy nhất: ghép đôi 2 người ở **bất kỳ đêm nào** *(linh hoạt hơn Thần Tình Yêu)* |
| Dân Làng | 🧑‍🌾 | Quan sát, thảo luận, bỏ phiếu sáng suốt |

---

## 🚀 Hướng dẫn sử dụng

```
1. Cài đặt ván
   Kéo slider chọn số người → Random hoặc tự chọn từng vai → Tiếp theo

2. Nhập tên & Phát bài
   Nhập tên từng người → Phát bài → Mỗi người bấm lật bài xem vai riêng tư

3. Đêm
   Tool tự sinh thứ tự gọi dậy → Làm theo từng bước → Chọn nạn nhân / bảo vệ / điều tra

4. Ban ngày
   Xem kết quả đêm → Thảo luận (có timer) → Nhập phiếu bầu → Treo cổ hoặc hòa

5. Lặp lại cho đến khi có phe thắng 🏆
```

---

## 🛠 Công nghệ

```
Vanilla JS (ES6 Modules)  ·  HTML5  ·  CSS3  ·  Web Audio API
```

> Không framework, không dependency, không build step — mở `index.html` là chạy được ngay.

---

## 📁 Cấu trúc dự án

```
masoi/
├── index.html          ← Markup tất cả màn hình (SPA)
├── css/
│   └── main.css        ← Toàn bộ style
└── js/
    ├── main.js         ← Entry point, expose globals cho HTML onclick
    ├── data.js         ← Định nghĩa 19 vai, POWER score, calcBalance
    ├── state.js        ← Game state tập trung (st, freshNc)
    ├── setup.js        ← Màn hình cài đặt & phát bài bí mật
    ├── night.js        ← Logic đêm, picker từng vai
    ├── day.js          ← Logic ngày, bỏ phiếu, win condition
    ├── ui.js           ← goScreen, showToast, goBack
    └── audio.js        ← Web Audio sound effects
```

---

## 🌐 Deploy & Chạy local

**Chạy online:** [quoccuong1109.github.io/masoi](https://quoccuong1109.github.io/masoi)

**Chạy local:**
```bash
git clone https://github.com/quoccuong1109/masoi.git
cd masoi
python -m http.server 8080
# Mở http://localhost:8080
```
*(Cần serve qua HTTP vì dùng ES6 Modules — không mở file:// trực tiếp)*

---

<div align="center">

Made with ❤️ by **anhgiaochilang** · THPT Chi Lăng

</div>
