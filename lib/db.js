const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.warn('Aviso: DATABASE_URL não definida.');
}

// Driver HTTP do Neon: ideal para funções serverless (sem pool de conexões)
const sql = neon(process.env.DATABASE_URL || '');

// Executa uma query parametrizada e devolve as linhas
const query = (text, params = []) => sql.query(text, params);

module.exports = { query };
