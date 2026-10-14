CREATE TABLE IF NOT EXISTS clientes (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  telefone   VARCHAR(20)  NOT NULL,
  email      VARCHAR(120) UNIQUE,
  criado_em  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS barbeiros (
  id            SERIAL PRIMARY KEY,
  nome          VARCHAR(100) NOT NULL,
  especialidade VARCHAR(100),
  ativo         BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS servicos (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL,
  preco       NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
  duracao_min INTEGER NOT NULL CHECK (duracao_min > 0)
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id          SERIAL PRIMARY KEY,
  cliente_id  INTEGER NOT NULL REFERENCES clientes(id)  ON DELETE CASCADE,
  barbeiro_id INTEGER NOT NULL REFERENCES barbeiros(id) ON DELETE RESTRICT,
  servico_id  INTEGER NOT NULL REFERENCES servicos(id)  ON DELETE RESTRICT,
  data_hora   TIMESTAMPTZ NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'agendado'
              CHECK (status IN ('agendado','concluido','cancelado')),
  observacoes TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (barbeiro_id, data_hora)
);

INSERT INTO barbeiros (nome, especialidade) VALUES
  ('Carlos', 'Degradê'),
  ('Marcos', 'Barba');

INSERT INTO servicos (nome, preco, duracao_min) VALUES
  ('Corte de cabelo', 40.00, 30),
  ('Barba', 25.00, 20),
  ('Corte + Barba', 60.00, 50);

INSERT INTO clientes (nome, telefone, email) VALUES
  ('João Silva', '81999990000', 'joao@email.com');
