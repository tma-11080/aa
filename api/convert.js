// api/convert.js
// Vercel Serverless Function — Gemini API版
// 環境変数: GEMINI_API_KEY を Vercel ダッシュボードで設定すること
// 無料枠: Gemini 1.5 Flash → 1日1500リクエスト / 1分15リクエスト

export default async function handler(req, res) {
if (req.method !== ‘POST’) {
return res.status(405).json({ error: ‘Method Not Allowed’ });
}

const { code, srcLang, dstLang } = req.body;

if (!code || !dstLang) {
return res.status(400).json({ error: ‘Missing required fields: code, dstLang’ });
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
return res.status(500).json({ error: ‘GEMINI_API_KEY is not configured on the server.’ });
}

const sourceLangText = srcLang === ‘auto’
? ‘the source language (auto-detect it)’
: srcLang;

const prompt = `You are an expert code converter. Convert the following code from ${sourceLangText} to ${dstLang}.

Rules:

- Output ONLY the converted code, with no explanation, no markdown fences, no preamble.
- Preserve the logic and structure as faithfully as possible.
- Use idiomatic patterns of the target language.
- Include equivalent comments where they aid understanding.
- If something cannot be directly translated, add a brief inline comment explaining the limitation.

Code to convert:
${code}`;

try {
const response = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
{
method: ‘POST’,
headers: { ‘Content-Type’: ‘application/json’ },
body: JSON.stringify({
contents: [
{
parts: [{ text: prompt }]
}
],
generationConfig: {
temperature: 0.2,
maxOutputTokens: 4096,
}
}),
}
);

```
if (!response.ok) {
  const errBody = await response.text();
  return res.status(502).json({ error: `Gemini API error: ${response.status} — ${errBody}` });
}

const data = await response.json();
const result = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

const usage = data.usageMetadata
  ? {
      input_tokens: data.usageMetadata.promptTokenCount ?? 0,
      output_tokens: data.usageMetadata.candidatesTokenCount ?? 0,
    }
  : null;

return res.status(200).json({ result, usage });
```

} catch (err) {
return res.status(500).json({ error: `Internal server error: ${err.message}` });
}
}
