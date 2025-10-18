import { Client, Users } from 'node-appwrite';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, nickname } = req.body || {};
  console.log('[set-nickname]', { userId, nickname });
  if (!userId || !nickname) return res.status(400).json({ error: 'Нет данных' });
  if (typeof nickname !== 'string' || nickname.length < 3 || nickname.length > 30) {
    return res.status(400).json({ error: 'Некорректный ник' });
  }

  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const users = new Users(client);
    let user;
    try {
      user = await users.get(userId);
    } catch (e) {
      console.log('[set-nickname] user not found', { userId, e: e.message, stack: e.stack });
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    await users.updatePrefs(userId, { nickname });
    console.log('[set-nickname] nickname updated', { userId, nickname });
    return res.status(200).json({ ok: true });
  } catch(e) {
    console.log('[set-nickname] error', { e: e.message, stack: e.stack });
    return res.status(500).json({ error: e?.message || 'server error' });
  }
}
