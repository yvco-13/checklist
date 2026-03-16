module.exports = async function handler(req, res) {
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
    const prop = (value, type) => {
      if (!value) return undefined;
      if (type === 'title')  return { title: [{ text: { content: String(value) } }] };
      if (type === 'text')   return { rich_text: [{ text: { content: String(value) } }] };
      if (type === 'select') return { select: { name: String(value) } };
      if (type === 'date')   return { date: { start: String(value) } };
    };
    const properties = {
      'Trade':            prop(s.tradeName,  'title'),
      'Date':             prop(s.tradeDate,  'date'),
      'Day':              prop(s.day,        'text'),
      'Ticker':           prop(s.ticker,     'text'),
      'News':             prop(s.news,       'text'),
      'Trade Type':       prop(s.tradeType,  'select'),
      'Approach':         prop(s.approach,   'select'),
      'Anchor':           prop(s.anchor,     'text'),
      '4H Candle':        prop(s.candle,     'text'),
      'Entry TF':         prop(s.entry,      'select'),
      'Structure':        prop(s.structure,  'select'),
      'LTF Level':        prop(s.ltf,        'select'),
      'V-Shape Ratio':    prop(s.ratio,      'text'),
      'Projected Target': prop(s.target,     'text'),
      'Outcome':          prop('Pending',    'select'),
    };
    Object.keys(properties).forEach(k => {
      if (properties[k] === undefined) delete properties[k];
    });
    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({ parent: { database_id: DATABASE_ID }, properties })
    });
    const data = await notionRes.json();
    if (!notionRes.ok) return res.status(500).json({ error: data.message || 'Notion API error' });
    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
