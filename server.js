const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();

// Your MongoDB connection string
const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI);
let db;

// Connect to database when server starts
async function connectDB() {
  await client.connect();
  db = client.db('mywebsite');
  console.log('Connected to database');
}
connectDB();

app.use(express.static('public'));

// Log every visitor
app.use(async (req, res, next) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await db.collection('visitors').insertOne({
      ip: ip,
      page: req.url,
      time: new Date()
    });
    console.log(`Logged visitor: ${ip}`);
  } catch (err) {
    console.error('Could not log visitor:', err);
  }
  next();
});

// See all visitors at /visitors
app.get('/visitors', async (req, res) => {
  const visitors = await db.collection('visitors').find().toArray();
  res.json(visitors);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Site running on port ${PORT}`));
