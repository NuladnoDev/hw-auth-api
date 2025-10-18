import { Client, Users, ID } from 'node-appwrite';

function json(res, code, data) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(data));
}

async function handleRegister(req, res, body) {
  const { email, password } = body || {};
  if (!email || !password) return json(res, 400, { error: 'email and password required' });
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const users = new Users(client);
    
    console.log('[register] Creating user for email:', email);
    let createdUser = null;
    try { 
      createdUser = await users.create(ID.unique(), email, undefined, password, email);
      console.log('[register] User created successfully:', createdUser.$id);
    } catch (e) { 
      console.log('[register] User creation error (might already exist):', e?.message);
    }
    
    // Если пользователь был создан, используем его ID
    if (createdUser && createdUser.$id) {
      console.log('[register] Returning created user ID:', createdUser.$id);
      return json(res, 200, { ok: true, userId: createdUser.$id });
    }
    
    // Иначе ищем в списке пользователей
    console.log('[register] Searching for user in list...');
    const { users: arr } = await users.list([], 100, 0);
    console.log('[register] Found users:', arr.length);
    const found = arr.find(u => (u.email||'').toLowerCase() === String(email).toLowerCase());
    const uid = found ? found.$id : null;
    console.log('[register] Found user ID:', uid);
    return json(res, 200, { ok: true, userId: uid });
  } catch (e) { 
    console.log('[register] Error:', e?.message);
    return json(res, 500, { error: e?.message || 'server error' }); 
  }
}

function isLatinNick(n) { return /^[a-zA-Z0-9_]+$/.test(n); }

async function handleCheckNickname(req, res, body) {
  const { nickname } = body || {};
  if (!nickname) return json(res, 400, { error: 'Введите никнейм' });
  if (!isLatinNick(nickname)) return json(res, 400, { error: 'Только латиница, цифры и _' });
  if (nickname.length < 3) return json(res, 400, { error: 'Слишком короткий (мин. 3)' });
  if (nickname.length > 16) return json(res, 400, { error: 'Слишком длинный (макс. 16)' });
  return json(res, 200, { ok: true, available: true });
}

async function handleSetNickname(req, res, body) {
  console.log('[set-nickname] body:', body);
  const { userId, nickname } = body || {};
  if (!userId || !nickname) {
    console.log('[set-nickname] Мало данных:', { userId, nickname });
    return json(res, 400, { error: 'Нет userId или nickname' });
  }
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const users = new Users(client);

    await users.updatePrefs(userId, { nickname });
    console.log('[set-nickname] Ник установлен!', { userId, nickname });
    return json(res, 200, { ok: true });
  } catch (e) {
    console.log('[set-nickname] error:', e, e?.stack);
    return json(res, 500, { error: e?.message || 'server error' });
  }
}

const INVITES = [
  'OP3NA1','K9QW2X','M7LD4Z','RX2B8C','V1NP0T','H3JK9F','D5SA2L','F8QE6R','G2TZ1X','B7MU4N',
  'P3LA9Q','Q4WE8Z','Z1XC7V','N6BT5M','C9RJ2K','L0OP7A','Y2HN5K','T8MK1S','S4PL9D','J5AR2F',
  'U7VC3M','I9QE1Z','E6RT4Y','A1SD2F','W3ER4T','R5TY6U','Q7AZ8X','X9CV0B','M1NB2V','K3JH4G',
  'H5GF6D','F7DS8A','D9SA0Q','P1LO2K','O3MN4B','I5UJ6Y','U7HY8T','Y9GT0F','T2FR3D','R4DE5S'
];

async function handleVerifyInvite(req, res, body) {
  const code = String((body || {}).code || '').toUpperCase();
  if (!code) return json(res, 400, { error: 'Введите код' });
  if (!INVITES.includes(code)) return json(res, 401, { error: 'Неверный код' });
  return json(res, 200, { ok: true });
}

async function handleGetEmailFromNickname(req, res, body) {
  const nickname = String((body || {}).nickname || '').toLowerCase();
  if (!nickname) return json(res, 400, { error: 'Нет никнейма' });
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const users = new Users(client);
    const { users: arr } = await users.list([], 100, 0);
    const found = arr.find(u => String((u.prefs && u.prefs.nickname) || '').toLowerCase() === nickname);
    if (!found) return json(res, 404, { error: 'Пользователь с таким ником не найден' });
    return json(res, 200, { ok: true, email: found.email, userId: found.$id });
  } catch (e) {
    return json(res, 500, { error: e?.message || 'server error' });
  }
}

async function handleGetUserByEmail(req, res, body) {
  const { email } = body || {};
  if (!email) return json(res, 400, { error: 'Введите email' });
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const users = new Users(client);
    const { users: arr } = await users.list([], 100, 0);
    const found = arr.find(u => (u.email||'').toLowerCase() === String(email).toLowerCase());
    if (!found) return json(res, 404, { error: 'Пользователь не найден' });
    return json(res, 200, { userId: found.$id });
  } catch (e) {
    return json(res, 500, { error: e?.message || 'server error' });
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (!req.url) return json(res, 404, { error: 'Not found' });

  const url = new URL(req.url, 'http://x');
  const path = url.pathname || '';

  let body = {};
  if (req.method === 'POST') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch {}
  }

  if (path.endsWith('/register')) return handleRegister(req, res, body);
  if (path.endsWith('/check-nickname')) return handleCheckNickname(req, res, body);
  if (path.endsWith('/set-nickname')) return handleSetNickname(req, res, body);
  if (path.endsWith('/verify-invite')) return handleVerifyInvite(req, res, body);
  if (path.endsWith('/get-email-from-nickname')) return handleGetEmailFromNickname(req, res, body);
  if (path.endsWith('/get-user-by-email')) return handleGetUserByEmail(req, res, body);

  return json(res, 404, { error: 'Not found' });
}
