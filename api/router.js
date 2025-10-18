import { Client, Users, ID, Databases, Query } from 'node-appwrite';

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

// === CHAT API ===
async function handleGetChats(req, res, body) {
  const { userId } = body || {};
  if (!userId) return json(res, 400, { error: 'Нет userId' });
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(client);
    
    // Получаем чаты пользователя
    const { documents: chats } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'main',
      process.env.APPWRITE_CHATS_COLLECTION_ID || 'chats',
      [Query.equal('participants', userId)]
    );
    
    return json(res, 200, { chats });
  } catch (e) {
    console.log('[get-chats] error:', e?.message);
    return json(res, 500, { error: e?.message || 'server error' });
  }
}

async function handleGetMessages(req, res, body) {
  const { chatId, limit = 50 } = body || {};
  if (!chatId) return json(res, 400, { error: 'Нет chatId' });
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(client);
    
    // Получаем сообщения чата
    const { documents: messages } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'main',
      process.env.APPWRITE_MESSAGES_COLLECTION_ID || 'messages',
      [`chatId=${chatId}`],
      limit,
      0,
      undefined,
      undefined,
      ['createdAt']
    );
    
    return json(res, 200, { messages });
  } catch (e) {
    console.log('[get-messages] error:', e?.message);
    return json(res, 500, { error: e?.message || 'server error' });
  }
}

async function handleSendMessage(req, res, body) {
  const { chatId, userId, message } = body || {};
  if (!chatId || !userId || !message) return json(res, 400, { error: 'Недостаточно данных' });
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(client);
    
    // Создаём сообщение
    const messageDoc = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID || 'main',
      process.env.APPWRITE_MESSAGES_COLLECTION_ID || 'messages',
      ID.unique(),
      {
        chatId,
        userId,
        message: message.trim(),
        createdAt: new Date().toISOString()
      }
    );
    
    return json(res, 200, { message: messageDoc });
  } catch (e) {
    console.log('[send-message] error:', e?.message);
    return json(res, 500, { error: e?.message || 'server error' });
  }
}

async function handleCreateChat(req, res, body) {
  const { userId, participantId } = body || {};
  if (!userId || !participantId) return json(res, 400, { error: 'Нет userId или participantId' });
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(client);
    
    // Проверяем, есть ли уже чат между этими пользователями
    const { documents: existingChats } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'main',
      process.env.APPWRITE_CHATS_COLLECTION_ID || 'chats',
      [Query.equal('participants', userId), Query.equal('participants', participantId)]
    );
    
    if (existingChats.length > 0) {
      return json(res, 200, { chat: existingChats[0] });
    }
    
    // Создаём новый чат
    const chatDoc = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID || 'main',
      process.env.APPWRITE_CHATS_COLLECTION_ID || 'chats',
      ID.unique(),
      {
        participants: [userId, participantId],
        createdAt: new Date().toISOString()
      }
    );
    
    return json(res, 200, { chat: chatDoc });
  } catch (e) {
    console.log('[create-chat] error:', e?.message);
    return json(res, 500, { error: e?.message || 'server error' });
  }
}

// === FRIEND REQUESTS API ===
const FRIEND_REQUESTS_COLLECTION_ID = process.env.APPWRITE_FRIEND_REQUESTS_COLLECTION_ID || 'friend_requests';

// Создать заявку в друзья
async function handleCreateFriendRequest(req, res, body) {
  const { from, to } = body || {};
  if (!from || !to || from === to) return json(res, 400, { error: 'from/to required' });
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(client);
    // Проверяем на дубликаты (pending)
    const { documents: existing } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'main',
      FRIEND_REQUESTS_COLLECTION_ID,
      [Query.equal('from', from), Query.equal('to', to), Query.equal('status', 'pending')]
    );
    if (existing.length > 0) return json(res, 400, { error: 'Already sent or pending' });

    const doc = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID || 'main',
      FRIEND_REQUESTS_COLLECTION_ID,
      ID.unique(),
      { from, to, status: 'pending', createdAt: new Date().toISOString() }
    );
    return json(res, 200, { ok: true, request: doc });
  } catch (e) {
    console.log('[friend_request] error:', e?.message);
    return json(res, 500, { error: e?.message || 'server error' });
  }
}

// Получить входящие заявки (pending)
async function handleListIncomingFriendRequests(req, res, body) {
  const { userId } = body || {};
  if (!userId) return json(res, 400, { error: 'userId required' });
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(client);
    const { documents } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'main',
      FRIEND_REQUESTS_COLLECTION_ID,
      [Query.equal('to', userId), Query.equal('status', 'pending')]
    );
    return json(res, 200, { requests: documents });
  } catch (e) {
    return json(res, 500, { error: e?.message || 'server error' });
  }
}

// Получить исходящие заявки (pending)
async function handleListOutgoingFriendRequests(req, res, body) {
  const { userId } = body || {};
  if (!userId) return json(res, 400, { error: 'userId required' });
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(client);
    const { documents } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'main',
      FRIEND_REQUESTS_COLLECTION_ID,
      [Query.equal('from', userId), Query.equal('status', 'pending')]
    );
    return json(res, 200, { requests: documents });
  } catch (e) {
    return json(res, 500, { error: e?.message || 'server error' });
  }
}

// Отклонить заявку (ignore)
async function handleIgnoreFriendRequest(req, res, body) {
  const { requestId } = body || {};
  if (!requestId) return json(res, 400, { error: 'requestId required' });
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(client);
    const ignored = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID || 'main',
      FRIEND_REQUESTS_COLLECTION_ID,
      requestId,
      { status: 'ignored' }
    );
    return json(res, 200, { ok: true, request: ignored });
  } catch (e) {
    return json(res, 500, { error: e?.message || 'server error' });
  }
}

// Принять заявку (accept)
async function handleAcceptFriendRequest(req, res, body) {
  const { requestId } = body || {};
  if (!requestId) return json(res, 400, { error: 'requestId required' });
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(client);
    // Найти заявку
    const { documents } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'main',
      FRIEND_REQUESTS_COLLECTION_ID,
      [Query.equal('$id', requestId)]
    );
    if (!documents.length) return json(res, 400, { error: 'Not found' });
    const reqDoc = documents[0];
    // Обновить статус
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID || 'main',
      FRIEND_REQUESTS_COLLECTION_ID,
      requestId,
      { status: 'accepted' }
    );
    // Создать чат (если нет)
    const { from, to } = reqDoc;
    // Проверим чаты между ними
    const { documents: existingChats } = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'main',
      process.env.APPWRITE_CHATS_COLLECTION_ID || 'chats',
      [Query.equal('participants', from), Query.equal('participants', to)]
    );
    let chat;
    if (existingChats.length > 0) {
      chat = existingChats[0];
    } else {
      chat = await databases.createDocument(
        process.env.APPWRITE_DATABASE_ID || 'main',
        process.env.APPWRITE_CHATS_COLLECTION_ID || 'chats',
        ID.unique(),
        {
          participants: [from, to],
          createdAt: new Date().toISOString()
        }
      );
    }
    return json(res, 200, { ok: true, chat });
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
  
  // Chat API
  if (path.endsWith('/get-chats')) return handleGetChats(req, res, body);
  if (path.endsWith('/get-messages')) return handleGetMessages(req, res, body);
  if (path.endsWith('/send-message')) return handleSendMessage(req, res, body);
  if (path.endsWith('/create-chat')) return handleCreateChat(req, res, body);

  // Friend Requests API
  if (path.endsWith('/friend-request/create')) return handleCreateFriendRequest(req, res, body);
  if (path.endsWith('/friend-request/incoming')) return handleListIncomingFriendRequests(req, res, body);
  if (path.endsWith('/friend-request/outgoing')) return handleListOutgoingFriendRequests(req, res, body);
  if (path.endsWith('/friend-request/accept')) return handleAcceptFriendRequest(req, res, body);
  if (path.endsWith('/friend-request/ignore')) return handleIgnoreFriendRequest(req, res, body);

  return json(res, 404, { error: 'Not found' });
}
