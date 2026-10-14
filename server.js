// Servidor local (desenvolvimento). Na Vercel quem roda é o api/index.js.
const express = require('express');
const path = require('path');
const app = require('./api/index');

const server = express();
server.use(express.static(path.join(__dirname, 'public')));
server.use(app);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Rodando em http://localhost:${PORT}`));
