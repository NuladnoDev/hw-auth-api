import { Client, Users } from 'node-appwrite';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Введите email' });
  
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const users = new Users(client);
    
    const { users: arr } = await users.list([], 100, 0);
    const found = arr.find(u => (u.email||'').toLowerCase() === String(email).toLowerCase());
    if (!found) return res.status(404).json({ error: 'Пользователь не найден' });
    
    return res.status(200).json({ userId: found.$id });
  } catch (e) {
    console.error('Get user by email error:', e);
    return res.status(500).json({ error: e?.message || 'server error' });
  }
}
