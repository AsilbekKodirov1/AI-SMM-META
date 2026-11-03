# AI-SMM-META — Telegram Bot Service

AI SMM Assistant SaaS platformasi uchun avtonom Telegram Bot xizmati.

Ushbu bot foydalanuvchilar veb-saytga kirishlari yoki ro‘yxatdan o‘tishlari uchun 6 xonali tezkor tasdiqlash kodlarini (OTP) generatsiya qiladi va foydalanuvchilarni avtomatik tarzda platforma bazasiga 3 kunlik bepul sinov bilan ulaydi.

---

## 🚀 Imkoniyatlar

- `/start` bosilganda avtomatik 6 xonali OTP kod yuborish.
- Foydalanuvchini platforma bazasida avtomatik ro‘yxatga olish.
- 15 daqiqalik kodning amal qilish muddati va avtomatik yangilanishi.
- Saytdan berilgan kodni botga yozib tasdiqlash imkoniyati.
- 100% xavfsiz va serverless / VPS / Render / Railway muhitlarida ishlashga tayyor.

---

## 🛠 O‘rnatish va Ishga tushirish

### 1. Repositoriyani klonlash
```bash
git clone https://github.com/AsilbekKodirov1/AI-SMM-META.git
cd AI-SMM-META
```

### 2. Bog‘liqliklarni o‘rnatish
```bash
npm install
```

### 3. `.env` faylini sozlash
`.env.example` dan nusxa olib `.env` yarating:
```bash
cp .env.example .env
```
Va o‘z ma'lumotlaringizni kiriting:
```env
TELEGRAM_BOT_TOKEN="your_bot_father_token"
TELEGRAM_BOT_USERNAME="AISMMetaBot"
DATABASE_URL="file:./dev.db" # yoki PostgreSQL URL
```

### 4. Bazani tayyorlash
```bash
npm run db:push
```

### 5. Botni ishga tushirish
```bash
npm start
```

---

## 🌐 24/7 Hosting (Render, Railway, VPS)

Ushbu botni **Render.com** (Background Worker) yoki **Railway.app** orqali 24/7 bepul ishlatishingiz mumkin:
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**: `TELEGRAM_BOT_TOKEN`, `DATABASE_URL`

---

Ishlab chiquvchi: [Asilbek Kodirov](https://github.com/AsilbekKodirov1)
