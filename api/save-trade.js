export default async function handler(req, res) {
  // Allow CORS from your Vercel domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID  = 'c8396b81-7d40-495b-95d8-5a8fcc26229d';

  if (!NOTION_TOKEN) return res.status(500).json({ error: 'Missing NOTION_TOKEN env variable' });

  try {
    const s = req.body;

    const payload = {
      parent: { database_id: DATABASE_ID },
      properties: {
        'Trade': {
          title: [{ text: { content: s.tradeName || 'Trade' } }]
        },
        'Date': s.tradeDate
          ? { date: { start: s.tradeDate } }
          : undefined,
        'Day':            s.day         ? { rich_text: [{ text: { content: s.day } }] } : undefined,
        'Ticker':         s.ticker      ? { rich_text: [{ text: { content: s.ticker } }] } : undefined,
        'News':           s.news        ? { rich_text: [{ text: { content: s.news } }] } : undefined,
        'Trade Type':     s.tradeType   ? { select: { name: s.tradeType } } : undefined,
        'Approach':       s.approach    ? { select: { name: s.approach } } : undefined,
        'Anchor':         s.anchor      ? { rich_text: [{ text: { content: s.anchor } }] } : undefined,
        '4H Candle':      s.candle      ? { rich_text: [{ text: { content: s.candle } }] } : undefined,
        'Entry TF':       s.entry       ? { select: { name: s.entry } } : undefined,
        'Structure':      s.structure   ? { select: { name: s.structure } } : undefined,
        'LTF Level':      s.ltf         ? { select: { name: s.ltf } } : undefined,
        'V-Shape Ratio':  s.ratio       ? { rich_text: [{ text: { content: s.ratio } }] } : undefined,
        'Projected Target': s.target    ? { rich_text: [{ text: { content: s.target } }] } : undefined,
        'Outcome':        { select: { name: 'Pending' } },
      }
    };

    // Remove undefined properties
    Object.keys(payload.properties).forEach(k => {
      if (payload.properties[k] === undefined) delete payload.properties[k];
    });

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(payload)
    });

    const data = await notionRes.json();

    if (!notionRes.ok) {
      console.error('Notion error:', data);
      return res.status(500).json({ error: data.message || 'Notion API error' });
    }

    return res.status(200).json({ success: true, id: data.id, url: data.url });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message });
  }
}
