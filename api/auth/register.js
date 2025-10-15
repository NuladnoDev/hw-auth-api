import { Client, Account, ID } from 'appwrite';

const allow = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  allow(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const account = new Account(client);

    // создаём пользователя (если уже есть — пропустим)
    try {
      await account.create(ID.unique(), email, password);
    } catch {}

    // создаём сессию
    const session = await account.createEmailPasswordSession(email, password);

    return res.status(200).json({ ok: true, session });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'server error' });
  }
}
