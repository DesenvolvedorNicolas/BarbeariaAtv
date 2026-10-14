const express = require('express');
const cors = require('cors');
const { query } = require('../lib/db');

const app = express();
app.use(cors());
app.use(express.json());

// Evita try/catch repetido em cada rota
const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next);

/**
 * Cria um CRUD completo para uma tabela.
 * table/campos são constantes do código (nunca vêm do usuário), então são seguros.
 */
function crud({ table, campos, obrigatorios, listSql, getSql }) {
  const r = express.Router();

  const faltando = (body) => obrigatorios.filter((c) => body[c] === undefined || body[c] === '');

  r.get('/', ah(async (req, res) => {
    const rows = await query(listSql || `SELECT * FROM ${table} ORDER BY id`);
    res.json(rows);
  }));

  r.get('/:id', ah(async (req, res) => {
    const rows = await query(getSql || `SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(rows[0]);
  }));

  r.post('/', ah(async (req, res) => {
    const f = faltando(req.body);
    if (f.length) return res.status(400).json({ erro: `Campos obrigatórios: ${f.join(', ')}` });
    const cols = campos.filter((c) => req.body[c] !== undefined);
    const vals = cols.map((c) => req.body[c]);
    const marks = cols.map((_, i) => `$${i + 1}`).join(', ');
    const rows = await query(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${marks}) RETURNING *`, vals
    );
    res.status(201).json(rows[0]);
  }));

  r.put('/:id', ah(async (req, res) => {
    const cols = campos.filter((c) => req.body[c] !== undefined);
    if (!cols.length) return res.status(400).json({ erro: 'Nada para atualizar' });
    const sets = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const vals = [...cols.map((c) => req.body[c]), req.params.id];
    const rows = await query(
      `UPDATE ${table} SET ${sets} WHERE id = $${cols.length + 1} RETURNING *`, vals
    );
    if (!rows.length) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(rows[0]);
  }));

  r.delete('/:id', ah(async (req, res) => {
    const rows = await query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ erro: 'Não encontrado' });
    res.status(204).end();
  }));

  return r;
}

const JOIN_AGENDAMENTOS = `
  SELECT a.id, a.data_hora, a.status, a.observacoes,
         a.cliente_id,  c.nome AS cliente,
         a.barbeiro_id, b.nome AS barbeiro,
         a.servico_id,  s.nome AS servico, s.preco, s.duracao_min
  FROM agendamentos a
  JOIN clientes  c ON c.id = a.cliente_id
  JOIN barbeiros b ON b.id = a.barbeiro_id
  JOIN servicos  s ON s.id = a.servico_id`;

app.get('/api', (req, res) => {
  res.json({
    api: 'Barbearia',
    rotas: ['/api/clientes', '/api/barbeiros', '/api/servicos', '/api/agendamentos']
  });
});

app.use('/api/clientes', crud({
  table: 'clientes',
  campos: ['nome', 'telefone', 'email'],
  obrigatorios: ['nome', 'telefone']
}));

app.use('/api/barbeiros', crud({
  table: 'barbeiros',
  campos: ['nome', 'especialidade', 'ativo'],
  obrigatorios: ['nome']
}));

app.use('/api/servicos', crud({
  table: 'servicos',
  campos: ['nome', 'preco', 'duracao_min'],
  obrigatorios: ['nome', 'preco', 'duracao_min']
}));

app.use('/api/agendamentos', crud({
  table: 'agendamentos',
  campos: ['cliente_id', 'barbeiro_id', 'servico_id', 'data_hora', 'status', 'observacoes'],
  obrigatorios: ['cliente_id', 'barbeiro_id', 'servico_id', 'data_hora'],
  listSql: `${JOIN_AGENDAMENTOS} ORDER BY a.data_hora`,
  getSql: `${JOIN_AGENDAMENTOS} WHERE a.id = $1`
}));

// Tratamento central de erros (códigos do PostgreSQL)
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === '23505') {
    return res.status(409).json({ erro: 'Registro duplicado (e-mail já usado ou horário já ocupado).' });
  }
  if (err.code === '23503') {
    return res.status(409).json({ erro: 'Operação inválida: registro relacionado inexistente ou em uso.' });
  }
  if (err.code === '23514' || err.code === '22P02' || err.code === '22007') {
    return res.status(400).json({ erro: 'Valor inválido em algum campo.' });
  }
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

module.exports = app;
