export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'طريقة الطلب غير مسموحة' });
  }

  const { systemPrompt, userPrompt, accessCode } = req.body || {};

  const allowedCodes = (process.env.ALLOWED_CODES || '')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);

  if (allowedCodes.length > 0 && !allowedCodes.includes(accessCode)) {
    return res.status(401).json({ error: 'كود الدخول غير صحيح' });
  }

  if (!systemPrompt || !userPrompt) {
    return res.status(400).json({ error: 'بيانات الطلب ناقصة' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return res.status(502).json({ error: 'خطأ من خدمة الذكاء الاصطناعي' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
}
