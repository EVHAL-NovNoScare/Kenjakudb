import fetch from 'node-fetch';

const FIREBASE_URL = process.env.FIREBASE_URL;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only POST method allowed',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { userId, userKey, token } = req.body;

    // Validate required fields
    if (!userId || !userKey || !token) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Missing required fields: userId, userKey, token',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔐 Verification request: User ${userId}, Key ${userKey}`);

    // 1. Check if key exists in Firebase
    const keyResponse = await fetch(`${FIREBASE_URL}/tokens/${userKey}.json`);
    
    if (!keyResponse.ok) {
      return res.status(500).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to connect to database',
        timestamp: new Date().toISOString()
      });
    }

    const keyData = await keyResponse.json();

    // 2. Validate key
    if (!keyData) {
      return res.status(404).json({
        success: false,
        error: 'KEY_NOT_FOUND',
        message: 'Key tidak ditemukan di database',
        timestamp: new Date().toISOString()
      });
    }

    if (keyData.status !== "active") {
      return res.status(403).json({
        success: false,
        error: 'KEY_INACTIVE', 
        message: 'Key tidak aktif',
        timestamp: new Date().toISOString()
      });
    }

    // 3. Validate token
    if (keyData.token !== token) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Token tidak sesuai',
        timestamp: new Date().toISOString()
      });
    }

    // 4. Save verification to Firebase
    const userData = {
      userId: userId,
      key: userKey,
      token: token,
      verifiedAt: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    const saveResponse = await fetch(`${FIREBASE_URL}/validated_users/${userId}.json`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!saveResponse.ok) {
      throw new Error('Failed to save user data');
    }

    console.log(`✅ User ${userId} verified successfully`);

    // 5. Return success response
    return res.status(200).json({
      success: true,
      message: 'Token verified successfully!',
      data: {
        userId: userId,
        key: userKey,
        verifiedAt: userData.verifiedAt
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Terjadi kesalahan server',
      timestamp: new Date().toISOString()
    });
  }
}
