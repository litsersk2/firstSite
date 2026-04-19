const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();

const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI);
let db;

async function connectDB() {
  await client.connect();
  db = client.db('mywebsite');
  console.log('Connected to database');
}
connectDB();

app.use(express.static('public'));

app.use(async (req, res, next) => {
  try {
    // Get and clean the IP address
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Remove IPv6 prefix if present
    ip = ip.replace('::ffff:', '');
    
    // If multiple IPs in x-forwarded-for, take the first one
    if (ip.includes(',')) ip = ip.split(',')[0].trim();

    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Detect browser
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('MSIE')) browser = 'Internet Explorer';

    // Detect device
    let device = 'Desktop';
    if (userAgent.includes('Mobile')) device = 'Mobile';
    else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) device = 'Tablet';

    // Get country from IP
    let country = 'Unknown';
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
      const geoData = await geoRes.json();
      console.log('Geo lookup result:', geoData); // temporary debug line
      if (geoData.status === 'success') {
        country = geoData.country;
      }
    } catch (err) {
      console.error('Geo lookup failed:', err);
    }

    await db.collection('visitors').insertOne({
      ip,
      browser,
      device,
      country,
      page: req.url,
      time: new Date()
    });

  } catch (err) {
    console.error('Could not log visitor:', err);
  }
  next();
});

// View visitors
app.get('/visitors', async (req, res) => {
  try {
    const visitors = await db.collection('visitors').find().sort({ time: -1 }).toArray();
    res.json(visitors);
  } catch (err) {
    res.status(500).send('Error fetching visitors');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Site running on port ${PORT}`));
