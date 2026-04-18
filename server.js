const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.static('public')); // serves your HTML files

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const log = `${new Date().toISOString()} - IP: ${ip} - Page: ${req.url}\n`;
  fs.appendFileSync('visitors.log', log); // saves to a file
  next();
});

app.listen(3000, () => console.log('Site running at http://localhost:3000'));