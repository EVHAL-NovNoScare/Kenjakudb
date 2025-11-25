// api/verify.js
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, userKey, token } = req.body;

    if (!userId || !userKey || !token) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing data' 
      });
    }

    // Firebase check logic here...
    const response = await fetch(`https://kenjakudatabase-default-rtdb.asia-southeast1.firebasedatabase.app/tokens/${userKey}.json`);
    const keyData = await response.json();

    if (!keyData || keyData.status !== "active") {
      return res.json({ success: false, message: 'Invalid key' });
    }

    if (keyData.token !== token) {
      return res.json({ success: false, message: 'Invalid token' });
    }

    // Save to validated_users
    await fetch(`https://kenjakudatabase-default-rtdb.asia-southeast1.firebasedatabase.app/validated_users/${userId}.json`, {
      method: 'PATCH',
      body: JSON.stringify({
        userId, userKey, token, validatedAt: new Date().toISOString()
      })
    });

    return res.json({ 
      success: true, 
      message: 'Token verified!',
      data: { key: userKey, userId }
    });

  } catch (error) {
    return res.json({ 
      success: false, 
      message: 'Server error' 
    });
  }
}
