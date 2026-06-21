export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { prompt } = req.body;
  
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
        max_tokens: 1024,
        system: 'You are a professional solar energy consultant writing a polished, customer-facing diagnostic report. Be accurate and never misleading — this is shown to a real customer. Hard rules: a battery stores the customer\'s own solar and adds NO generation, so never claim it eliminates the bill or makes it "$0" (they still pay fixed connection charges and for any usage solar+battery can\'t cover); present all future figures as estimates/projections, not guarantees; use only the rates and numbers given in the prompt and do not invent specific rate filings, dates, or percentages. Address the customer directly as "you". Use the exact section headings provided, each on its own line wrapped in **bold**, 2-4 sentences each, bolding key dollar figures. No greeting, sign-off, or preamble — start at the first heading.',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    // 2. Check if Anthropic returned a bad status code
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Anthropic API Error' });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}