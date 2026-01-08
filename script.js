const app = {
    carrinho: [],

    init: () => {
        app.atualizarSelectProdutos();
        app.atualizarSelectClientes();
        app.filtrarNotas();
    },

    mudarAba: (aba) => {
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
        document.getElementById(`aba-${aba}`).classList.add('active');
        document.getElementById(`tab${aba.charAt(0).toUpperCase() + aba.slice(1)}`).classList.add('active');
    },

    salvarCliente: () => {
        const nome = document.getElementById('cliNome').value;
        if (!nome) return;
        const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
        clientes.push({ id: Date.now(), nome });
        localStorage.setItem('clientes', JSON.stringify(clientes));
        document.getElementById('cliNome').value = '';
        app.atualizarSelectClientes();
    },

    salvarProduto: () => {
        const nome = document.getElementById('prodNome').value;
        const valor = parseFloat(document.getElementById('prodValor').value);
        if (!nome || isNaN(valor)) return;
        const produtos = JSON.parse(localStorage.getItem('produtos')) || [];
        produtos.push({ id: Date.now(), nome, valor });
        localStorage.setItem('produtos', JSON.stringify(produtos));
        document.getElementById('prodNome').value = '';
        document.getElementById('prodValor').value = '';
        app.atualizarSelectProdutos();
    },

    atualizarSelectClientes: () => {
        const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
        const select = document.getElementById('selectCliente');
        let html = '<option value="Consumidor Final">Consumidor Final</option>';
        html += clientes.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
        select.innerHTML = html;
    },

    atualizarSelectProdutos: () => {
        const produtos = JSON.parse(localStorage.getItem('produtos')) || [];
        const select = document.getElementById('selectProduto');
        select.innerHTML = produtos.map(p => `<option value="${p.id}">${p.nome} (R$ ${p.valor.toFixed(2)})</option>`).join('');
    },

    adicionarAoCarrinho: () => {
        const idProd = parseInt(document.getElementById('selectProduto').value);
        const qtd = parseInt(document.getElementById('vendaQtd').value);
        if (!idProd || qtd <= 0) return;

        const produtos = JSON.parse(localStorage.getItem('produtos')) || [];
        const p = produtos.find(prod => prod.id === idProd);

        const existente = app.carrinho.find(i => i.idProduto === idProd);
        if (existente) {
            existente.qtdProduto += qtd;
            existente.valorParcial = existente.qtdProduto * p.valor;
        } else {
            app.carrinho.push({ idProduto: p.id, nome: p.nome, qtdProduto: qtd, valorParcial: p.valor * qtd });
        }
        app.renderizarCarrinho();
    },

    renderizarCarrinho: () => {
        const lista = document.getElementById('listaCarrinho');
        lista.innerHTML = app.carrinho.map((item, i) => `
            <tr>
                <td>${item.nome}</td>
                <td>${item.qtdProduto}x</td>
                <td>R$ ${item.valorParcial.toFixed(2)}</td>
                <td><button class="btn-remove" onclick="app.carrinho.splice(${i},1);app.renderizarCarrinho()">X</button></td>
            </tr>
        `).join('');
        const total = app.carrinho.reduce((acc, item) => acc + item.valorParcial, 0);
        document.getElementById('totalVenda').innerText = `Total: R$ ${total.toFixed(2)}`;
    },

    finalizarVenda: () => {
        if (app.carrinho.length === 0) return alert("Carrinho vazio!");
        const agora = new Date();
        const novaNota = {
            id: Date.now(),
            cliente: document.getElementById('selectCliente').value,
            dataISO: agora.toISOString().split('T')[0],
            horaISO: agora.toTimeString().substring(0, 5),
            dataFormatada: agora.toLocaleString('pt-BR'),
            valorTotal: app.carrinho.reduce((acc, i) => acc + i.valorParcial, 0),
            itens: [...app.carrinho]
        };
        const notas = JSON.parse(localStorage.getItem('notas')) || [];
        notas.push(novaNota);
        localStorage.setItem('notas', JSON.stringify(notas));
        app.carrinho = [];
        app.renderizarCarrinho();
        app.filtrarNotas();
        alert("Venda realizada!");
    },

    filtrarNotas: () => {
        const notas = JSON.parse(localStorage.getItem('notas')) || [];
        const fCli = document.getElementById('filtroCliente').value.toLowerCase();
        const fData = document.getElementById('filtroData').value;
        const fHora = document.getElementById('filtroHora').value;

        const filtradas = notas.filter(n => {
            return n.cliente.toLowerCase().includes(fCli) && 
                   (!fData || n.dataISO === fData) && 
                   (!fHora || n.horaISO === fHora);
        });

        const container = document.getElementById('listaNotasFiltradas');
        container.innerHTML = filtradas.reverse().map(n => `
            <div class="nota-card">
                <div class="nota-header"><span>#${n.id}</span><span>${n.dataFormatada}</span></div>
                <strong>Cliente: ${n.cliente}</strong><br>
                <small>${n.itens.map(i => `${i.qtdProduto}x ${i.nome}`).join(', ')}</small>
                <div style="text-align:right; font-weight:bold; color:var(--primary)">R$ ${n.valorTotal.toFixed(2)}</div>
            </div>
        `).join('') || '<p style="text-align:center">Nenhuma nota encontrada.</p>';
    },

    limparFiltros: () => {
        document.getElementById('filtroCliente').value = '';
        document.getElementById('filtroData').value = '';
        document.getElementById('filtroHora').value = '';
        app.filtrarNotas();
    }
};

app.init();

let instaladorPWA; // Variável para guardar o evento

window.addEventListener('beforeinstallprompt', (e) => {
    // 1. Previne que o navegador mostre o prompt automático muito cedo
    e.preventDefault();
    // 2. Guarda o evento para ser usado depois
    instaladorPWA = e;
    // 3. Mostra o seu botão customizado
    const btn = document.getElementById('btnInstalar');
    btn.style.display = 'block';

    btn.addEventListener('click', () => {
        // 4. Esconde o botão após o clique
        btn.style.display = 'none';
        // 5. Mostra o prompt de instalação oficial
        instaladorPWA.prompt();
        // 6. Verifica se o usuário aceitou ou recusou
        instaladorPWA.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Usuário instalou o RockDash!');
            }
            instaladorPWA = null;
        });
    });
});

// Esconde o botão se o app já estiver instalado
window.addEventListener('appinstalled', () => {
    document.getElementById('btnInstalar').style.display = 'none';
    console.log('RockDash instalado com sucesso!');
});