// 1-Click Telegram Webhook Setup for Vercel
module.exports = async (req, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN sozlanmagan" });
  }

  // Detect host URL from headers or query param
  const host = req.query.url || req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const webhookUrl = `${proto}://${host}/api/webhook`;

  const API_BASE = `https://api.telegram.org/bot${token}`;

  try {
    const tgRes = await fetch(`${API_BASE}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    const data = await tgRes.json();

    return res.status(200).json({
      success: data.ok,
      message: data.ok
        ? "✅ Webhook muvaffaqiyatli o'rnatildi! Endi Telegram botingiz har bir /start xabariga javob beradi."
        : "❌ Webhook o'rnatishda xatolik yuz berdi.",
      webhookUrl,
      telegramResponse: data,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
