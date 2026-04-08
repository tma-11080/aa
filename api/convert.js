// api/convert.js
// Vercel Serverless Function
// 環境変数: ANTHROPIC_API_KEY を Vercel ダッシュボードで設定すること

export default async function handler(req, res) {
if (req.method !== ‘POST’) {
return res.status(405).json({ error: ‘Method Not Allowed’ });
}

const { code, srcLang, dstLang } = req.body;

if (!code || !dstLang) {
return res.status(400).json({ error: ‘Missing required fields: code, dstLang’ });
}

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
return res.status(500).json({ error: ‘ANTHROPIC_API_KEY is not configured on the server.’ });
}

const sourceLangText = srcLang === ‘auto’
? ‘the source language (auto-detect it)’
: srcLang;

const systemPrompt = `You are an expert code converter. Your job is to translate code from one programming language to another.

Rules:

- Output ONLY the converted code, with no explanation, no markdown fences, no preamble.
- Preserve the logic and structure as faithfully as possible.
- Use idiomatic patterns of the target language.
- Include equivalent comments where they aid understanding.
- If something cannot be directly translated, add a brief inline comment explaining the limitation.`;
  
  const userPrompt = `Convert the following code from ${sourceLangText} to ${dstLang}.

```
${code}
````;

try {
const response = await fetch(‘https://api.anthropic.com/v1/messages’, {
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘x-api-key’: apiKey,
‘anthropic-version’: ‘2023-06-01’,
},
body: JSON.stringify({
model: ‘claude-sonnet-4-20250514’,
max_tokens: 4096,
system: systemPrompt,
messages: [
{ role: ‘user’, content: userPrompt }
],
}),
});

```
if (!response.ok) {
  const errBody = await response.text();
  return res.status(502).json({ error: `Claude API error: ${response.status} — ${errBody}` });
}

const data = await response.json();
const result = data.content?.[0]?.text ?? '';

return res.status(200).json({
  result,
  usage: data.usage ?? null,
});
```

} catch (err) {
return res.status(500).json({ error: `Internal server error: ${err.message}` });
}
}
