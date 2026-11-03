// Vercel Serverless Function for Telegram Bot Webhook
const { PrismaClient } = require("@prisma/client");

let prisma;
try {
  prisma = new PrismaClient();
} catch (e) {
  console.error("Prisma client init error:", e);
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN muhit o'zgaruvchisi topilmadi" });
  }

  const API_BASE = `https://api.telegram.org/bot${token}`;

  // If GET request, show status
  if (req.method === "GET") {
    return res.status(200).send("AI SMM Meta Telegram Bot Webhook faol va ishlamoqda! Xabarlar qabul qilishga tayyor.");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const update = req.body;
    if (!update || !update.message) {
      return res.status(200).json({ ok: true, note: "No message payload" });
    }

    const msg = update.message;
    const chatId = msg.chat?.id;
    const text = (msg.text || "").trim();
    const senderName = msg.from?.first_name || msg.from?.username || "Foydalanuvchi";
    const tgUsername = msg.from?.username ? `@${msg.from.username}` : undefined;

    if (!chatId) {
      return res.status(200).json({ ok: true, note: "No chat id" });
    }

    console.log(`[AI-SMM-META Webhook] Xabar: "${text}" from ${senderName} (${chatId})`);

    // Generate unique 6-digit OTP code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Try saving in Database if DB is available
    if (prisma) {
      try {
        let user = await prisma.user.findFirst({
          where: {
            profile: { telegramChatId: chatId.toString() },
          },
          include: { profile: true },
        });

        if (!user) {
          const trialPlan = await prisma.plan.findFirst({ where: { code: "FREE_TRIAL" } }).catch(() => null);
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
          }).catch(() => null);
        }

        if (user) {
          await prisma.activationCode.updateMany({
            where: { userId: user.id, isUsed: false },
            data: { isUsed: true },
          }).catch(() => {});

          await prisma.activationCode.create({
            data: {
              userId: user.id,
              code: newCode,
              expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            },
          }).catch(() => {});
        }
      } catch (dbErr) {
        console.warn("DB operation skipped (serverless fallback):", dbErr.message);
      }
    }

    // Send response back to Telegram
    const responseText =
      `👋 <b>Assalomu alaykum, ${senderName}!</b>\n\n` +
      `🔐 <b>AI SMM Assistant</b> platformasiga kirish uchun tasdiqlash kodingiz:\n\n` +
      `👉 <code>${newCode}</code> 👈\n\n` +
      `<i>Ushbu 6 xonali kodni saytdagi maydonga kiriting. Kod 15 daqiqa davomida amal qiladi.</i>\n\n` +
      `⚡️ <b>3 kunlik bepul sinov</b> davri profilingiz uchun faol!`;

    await fetch(`${API_BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: responseText,
        parse_mode: "HTML",
      }),
    });

    return res.status(200).json({ ok: true, code: newCode });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return res.status(200).json({ ok: false, error: err.message });
  }
};
