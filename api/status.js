import fetch from 'node-fetch';

const FIREBASE_URL = process.env.FIREBASE_URL;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED', 
      message: 'Only GET method allowed'
    });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_USER_ID',
      message: 'Parameter userId diperlukan'
    });
  }

  try {
    const response = await fetch(`${FIREBASE_URL}/validated_users/${userId}.json`);
    const userData = await response.json();

    return res.json({
      success: true,
      data: {
        verified: !!(userData && userData.key),
        user: userData
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Gagal mengambil data user'
    });
  }
}
