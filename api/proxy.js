const DEFAULT_NODES = [
  'https://europe.signum.network',
  'https://singapore.signum.network',
  'https://us.signum.network',
  'https://canada.signum.network',
  'https://latam.signum.network',
  'https://africa.signum.network',
]

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const { node: preferredNode, ...params } = req.query

  const nodes = preferredNode
    ? [preferredNode.startsWith('http') ? preferredNode : `https://${preferredNode}`, ...DEFAULT_NODES]
    : DEFAULT_NODES

  const qs = new URLSearchParams(params).toString()
  let lastError = 'Unknown error'

  for (const nodeUrl of nodes) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)

      const response = await fetch(`${nodeUrl}/burst?${qs}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      clearTimeout(timer)

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()
      if (data.errorCode) return res.status(400).json(data)

      return res.status(200).json({ ...data, _node: nodeUrl })
    } catch (e) {
      lastError = e.message
    }
  }

  return res.status(502).json({
    error: true,
    errorCode: 502,
    errorDescription: `All nodes unavailable. Last error: ${lastError}`,
  })
}