const fs = require("fs");
const path = require("path");

// Load .env safely
try {
  require("dotenv").config();
} catch (e) {
  const envPath = path.resolve(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        let v = trimmed.slice(idx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
}

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token || token === "mock_telegram_token" || token.length < 10) {
  console.log("------------------------------------------------------------------");
  console.log("ℹ️  TELEGRAM BOT XABARNOMASI:");
  console.log("Hozircha .env faylida haqiqiy TELEGRAM_BOT_TOKEN kiritilmagan.");
  console.log("Iltimos, .env faylida TELEGRAM_BOT_TOKEN='sizning_tokeningiz' ni kiriting.");
  console.log("------------------------------------------------------------------");
  process.exit(0);
}

const API_BASE = `https://api.telegram.org/bot${token}`;
let offset = 0;
let isPolling = false;

async function getUpdates() {
  if (isPolling) return;
  isPolling = true;

  try {
    const res = await fetch(`${API_BASE}/getUpdates?offset=${offset}&timeout=20`);
    if (!res.ok) {
      isPolling = false;
      return;
    }
    const data = await res.json();
    if (!data.ok || !data.result) {
      isPolling = false;
      return;
    }

    for (const update of data.result) {
      offset = update.update_id + 1;
      const msg = update.message;
      if (!msg || !msg.text) continue;

      const chatId = msg.chat.id;
      const text = msg.text.trim();
      const senderName = msg.from?.first_name || msg.from?.username || "Foydalanuvchi";
      const tgUsername = msg.from?.username ? `@${msg.from.username}` : undefined;

      console.log(`[AI-SMM-META] Yangi xabar: "${text}" from ${senderName} (${chatId})`);

      // Check if text is a specific 6-digit or 8-digit code to verify directly
      const codeMatch = text.match(/\b\d{6,8}\b/);
      if (codeMatch && !text.startsWith("/start")) {
        const inputCode = codeMatch[0];
        try {
          const record = await prisma.activationCode.findUnique({
            where: { code: inputCode },
            include: { user: { include: { profile: true } } },
          });

          if (record) {
            await prisma.activationCode.update({
              where: { id: record.id },
              data: { isUsed: true, verifiedAt: new Date() },
            });

            await prisma.profile.upsert({
              where: { userId: record.userId },
              create: {
                userId: record.userId,
                isTelegramVerified: true,
                telegramChatId: chatId.toString(),
                telegramUsername: tgUsername,
              },
              update: {
                isTelegramVerified: true,
                telegramChatId: chatId.toString(),
                telegramUsername: tgUsername,
              },
            });

            await sendMessage(
              chatId,
              `✅ <b>Tabriklaymiz, ${senderName}!</b>\n\n` +
                `Kodingiz muvaffaqiyatli tasdiqlandi. Veb-saytga qaytib, profilingizdan foydalanishingiz mumkin!`
            );
            continue;
          }
        } catch (dbErr) {
          console.error("DB Code Verification error:", dbErr.message);
        }
      }

      // Default action for /start, /login, or any message:
      // Generate a fresh 6-digit OTP code, save user, and send code directly to user's Telegram!
      try {
        let user = await prisma.user.findFirst({
          where: {
            profile: {
              telegramChatId: chatId.toString(),
            },
          },
          include: { profile: true },
        });

        if (!user) {
          const trialPlan = await prisma.plan.findFirst({ where: { code: "FREE_TRIAL" } });
          user = await prisma.user.create({
            data: {
              name: senderName,
              email: `tg_${chatId}@aismm.uz`,
              passwordHash: "telegram_auth_user",
              role: "USER",
              language: "uz",
              profile: {
                create: {
                  bio: "Telegram orqali ulangan",
                  telegramChatId: chatId.toString(),
                  telegramUsername: tgUsername,
                  isTelegramVerified: true,
                },
              },
              subscription: trialPlan
                ? {
                    create: {
                      planId: trialPlan.id,
                      status: "TRIAL",
                      trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                    },
                  }
                : undefined,
            },
            include: { profile: true },
          });
        } else {
          await prisma.profile.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              telegramChatId: chatId.toString(),
              telegramUsername: tgUsername,
              isTelegramVerified: true,
            },
            update: {
              telegramUsername: tgUsername,
              isTelegramVerified: true,
            },
          });
        }

        // Generate 6-digit unique code
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Deactivate older codes for this user
        await prisma.activationCode.updateMany({
          where: { userId: user.id, isUsed: false },
          data: { isUsed: true },
        });

        // Save new activation code
        await prisma.activationCode.create({
          data: {
            userId: user.id,
            code: newCode,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
          },
        });

        console.log(`[AI-SMM-META] Yangi 6 xonali kod yaratildi: ${newCode} for ${senderName} (${chatId})`);

        await sendMessage(
          chatId,
          `👋 <b>Assalomu alaykum, ${senderName}!</b>\n\n` +
            `🔐 <b>AI SMM Assistant</b> platformasiga kirish uchun tasdiqlash kodingiz:\n\n` +
            `👉 <code>${newCode}</code> 👈\n\n` +
            `<i>Ushbu 6 xonali kodni saytdagi maydonga kiriting. Kod 15 daqiqa davomida amal qiladi.</i>\n\n` +
            `⚡️ <b>3 kunlik bepul sinov</b> davri profilingiz uchun faol!`
        );
      } catch (userErr) {
        console.error("DB User Creation error:", userErr.message);
        // Fallback message even if DB is unavailable
        const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
        await sendMessage(
          chatId,
          `👋 <b>Assalomu alaykum, ${senderName}!</b>\n\n` +
            `🔐 <b>AI SMM Assistant</b> tasdiqlash kodingiz:\n\n` +
            `👉 <code>${fallbackCode}</code> 👈\n\n` +
            `<i>Ushbu kodni saytga kiriting.</i>`
        );
      }
    }
  } catch (err) {
    console.error("Bot polling error:", err.message);
  } finally {
    isPolling = false;
  }
}

async function sendMessage(chatId, text) {
  try {
    await fetch(`${API_BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
  } catch (e) {
    console.error("sendMessage error:", e.message);
  }
}

console.log("------------------------------------------------------------------");
console.log("🤖 AI-SMM-META Telegram Bot muvaffaqiyatli ishga tushdi!");
console.log(`🔗 Bot havolasi: https://t.me/${process.env.TELEGRAM_BOT_USERNAME || "AISMMetaBot"}`);
console.log("------------------------------------------------------------------");

getUpdates();
setInterval(getUpdates, 1500);

