const INVITES = [
  'OP3NA1','K9QW2X','M7LD4Z','RX2B8C','V1NP0T','H3JK9F','D5SA2L','F8QE6R','G2TZ1X','B7MU4N',
  'P3LA9Q','Q4WE8Z','Z1XC7V','N6BT5M','C9RJ2K','L0OP7A','Y2HN5K','T8MK1S','S4PL9D','J5AR2F',
  'U7VC3M','I9QE1Z','E6RT4Y','A1SD2F','W3ER4T','R5TY6U','Q7AZ8X','X9CV0B','M1NB2V','K3JH4G',
  'H5GF6D','F7DS8A','D9SA0Q','P1LO2K','O3MN4B','I5UJ6Y','U7HY8T','Y9GT0F','T2FR3D','R4DE5S'
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Введите код' });

  const ok = INVITES.includes(String(code).toUpperCase());
  if (!ok) return res.status(401).json({ error: 'Неверный код' });
  return res.status(200).json({ ok: true });
}
