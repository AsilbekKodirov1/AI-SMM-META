module.exports = async (req, res) => {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const currentUrl = `${proto}://${host}`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="uz">
    <head>
      <meta charset="UTF-8">
      <title>AI SMM Meta - Telegram Bot Service</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 40px; max-width: 520px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        h1 { font-size: 24px; margin-bottom: 12px; color: #38bdf8; }
        p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
        .btn { display: inline-block; background: #2563eb; color: #fff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; transition: 0.2s; }
        .btn:hover { background: #1d4ed8; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: rgba(34, 197, 94, 0.2); color: #4ade80; font-size: 12px; font-weight: bold; margin-bottom: 16px; border: 1px solid rgba(34, 197, 94, 0.4); }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">● TIZIM FAOL (ONLINE)</div>
        <h1>AI SMM Meta Telegram Bot</h1>
        <p>Bot Vercel Serverless tizimida muvaffaqiyatli ishga tushdi. Telegram bilan to‘liq integratsiya qilish uchun quyidagi tugmani bosing:</p>
        <a href="${currentUrl}/api/set-webhook" class="btn">⚡️ Webhookni Faollashtirish (1-Klik)</a>
      </div>
    </body>
    </html>
  `);
};
