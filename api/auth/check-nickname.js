export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { nickname } = req.body || {};
  if (!nickname) return res.status(400).json({ error: 'Введите никнейм' });

  const latin = /^[a-zA-Z0-9_]+$/;
  if (!latin.test(nickname)) return res.status(400).json({ error: 'Только латиница, цифры и _' });
  if (nickname.length < 3) return res.status(400).json({ error: 'Слишком короткий (мин. 3)' });
  if (nickname.length > 16) return res.status(400).json({ error: 'Слишком длинный (макс. 16)' });

  // TODO: подключить БД; пока считаем свободным всегда
  return res.status(200).json({ ok: true, available: true });
}
