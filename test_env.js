const express = require('express');
const app = express();
let activePlatform = 'web';
app.get('/env', (req, res) => { res.json({ platform: activePlatform }); });
app.listen(3001, () => console.log('Ready'));
