const API = '/api';
const $ = (s) => document.querySelector(s);
const brl = (n) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dt = (s) => new Date(s).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(path, method = 'GET', body) {
  const res = await fetch(API + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.erro || 'Erro na requisição');
  return data;
}

function aviso(texto, ok = false) {
  const el = $('#msg');
  el.textContent = texto;
  el.className = 'msg' + (ok ? ' ok' : '');
  el.hidden = false;
  setTimeout(() => (el.hidden = true), 4000);
}

// ---------- Abas ----------
document.querySelectorAll('#tabs button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.panel').forEach((p) => (p.hidden = p.id !== btn.dataset.tab));
  });
});

// ---------- Cada entidade: como desenhar a linha ----------
const entidades = {
  clientes: (c) => `<td>${esc(c.nome)}</td><td>${esc(c.telefone)}</td><td>${esc(c.email)}</td>`,
  barbeiros: (b) => `<td>${esc(b.nome)}</td><td>${esc(b.especialidade)}</td>`,
  servicos: (s) => `<td>${esc(s.nome)}</td><td>${brl(s.preco)}</td><td>${s.duracao_min} min</td>`,
  agendamentos: (a) => `
    <td>${dt(a.data_hora)}</td><td>${esc(a.cliente)}</td><td>${esc(a.barbeiro)}</td>
    <td>${esc(a.servico)} (${brl(a.preco)})</td>
    <td>
      <select class="status-select" data-id="${a.id}">
        ${['agendado', 'concluido', 'cancelado']
          .map((s) => `<option ${s === a.status ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </td>`
};

async function carregar(nome) {
  try {
    const dados = await api('/' + nome);
    $('#lista-' + nome).innerHTML = dados
      .map((d) => `<tr>${entidades[nome](d)}<td><button class="del" data-ent="${nome}" data-id="${d.id}">Excluir</button></td></tr>`)
      .join('') || '<tr><td colspan="6">Nenhum registro.</td></tr>';
    return dados;
  } catch (e) { aviso(e.message); }
}

async function carregarTudo() {
  const [clientes, barbeiros, servicos] = await Promise.all([
    carregar('clientes'), carregar('barbeiros'), carregar('servicos')
  ]);
  preencherSelect('#sel-cliente', clientes, 'Cliente', (c) => c.nome);
  preencherSelect('#sel-barbeiro', barbeiros, 'Barbeiro', (b) => b.nome);
  preencherSelect('#sel-servico', servicos, 'Serviço', (s) => `${s.nome} — ${brl(s.preco)}`);
  await carregar('agendamentos');
}

function preencherSelect(sel, lista = [], titulo, label) {
  $(sel).innerHTML = `<option value="">${titulo}…</option>` +
    lista.map((i) => `<option value="${i.id}">${esc(label(i))}</option>`).join('');
}

// ---------- Formulários (criar) ----------
['clientes', 'barbeiros', 'servicos', 'agendamentos'].forEach((nome) => {
  $('#form-' + nome).addEventListener('submit', async (e) => {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(e.target));
    Object.keys(dados).forEach((k) => dados[k] === '' && delete dados[k]);
    if (dados.data_hora) dados.data_hora = new Date(dados.data_hora).toISOString();
    try {
      await api('/' + nome, 'POST', dados);
      e.target.reset();
      aviso('Salvo com sucesso!', true);
      await carregarTudo();
    } catch (err) { aviso(err.message); }
  });
});

// ---------- Excluir e mudar status (delegação de eventos) ----------
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.del');
  if (!btn || !confirm('Excluir este registro?')) return;
  try {
    await api(`/${btn.dataset.ent}/${btn.dataset.id}`, 'DELETE');
    await carregarTudo();
  } catch (err) { aviso(err.message); }
});

document.addEventListener('change', async (e) => {
  if (!e.target.classList.contains('status-select')) return;
  try {
    await api(`/agendamentos/${e.target.dataset.id}`, 'PUT', { status: e.target.value });
    aviso('Status atualizado', true);
  } catch (err) { aviso(err.message); }
});

carregarTudo();
