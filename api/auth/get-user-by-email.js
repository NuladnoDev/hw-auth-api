import { Client, Users } from 'node-appwrite';

function json(res, code, data) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email) return json(res, 400, { error: 'Введите email' });

  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const users = new Users(client);
    
    const { users: arr } = await users.list([], 100, 0);
    const found = arr.find(u => (u.email || '').toLowerCase() === String(email).toLowerCase());
    if (!found) return json(res, 404, { error: 'Пользователь не найден' });
    
    return json(res, 200, { userId: found.$id });
  } catch (e) {
    console.error('Get user by email error:', e);
    return json(res, 500, { error: e?.message || 'server error' });
  }
}
