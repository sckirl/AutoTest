// A4.1 — serves tests/fixtures/app on a local port so codegen recording and future
// offline journey tests never break because someone else's demo site changed.
const express = require('express');
const path = require('path');

const PORT = Number(process.env.FIXTURE_PORT || 3999);
const app = express();
app.use(express.static(path.join(__dirname, 'app')));
const server = app.listen(PORT, () => {
  const port = server.address().port;
  console.log(`FIXTURE_PORT=${port}`);
  console.log(`Fixture app on http://localhost:${port}`);
});
