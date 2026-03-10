// Instanciar o cliente do Supabase
// window.supabase já vem importado do CDN no HTML
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Detectar de qual cidade estamos vendo o ranking
const path = window.location.pathname.toLowerCase();
let currentPraca = '';
let displayCity = '';

// Lógica de "separar por uma barra" e determinar a cidade correspondente
if (path.includes('/sta')) {
    currentPraca = 'SANTO ANDRÉ';
    displayCity = 'Santo André';
} else if (path.includes('/sbc')) {
    currentPraca = 'SÃO BERNARDO';
    displayCity = 'São Bernardo do Campo';
} else if (path.includes('/sp')) {
    currentPraca = 'SÃO PAULO';
    displayCity = 'São Paulo';
} else if (path.includes('/salvador')) {
    currentPraca = 'SALVADOR';
    displayCity = 'Salvador';
} else {
    // Fallback pra caso abra a pasta raiz diretamente
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get('cidade') || urlParams.get('c');

    if (param && param.toLowerCase() === 'sta') {
        currentPraca = 'SANTO ANDRÉ';
        displayCity = 'Santo André';
    } else {
        currentPraca = 'SÃO BERNARDO';
        displayCity = 'São Bernardo do Campo';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Atualiza o título dinamicamente
    document.getElementById('cidade-nome').innerText = displayCity;
    document.title = `Ranking Promocional - ${displayCity}`;

    // Inicia a busca do ranking
    fetchRanking();
});

async function fetchRanking() {
    const listContainer = document.getElementById('ranking-list');

    try {
        // Busca na View que já consolida (SOMA) os valores por ID da pessoa e Praça,
        // garantindo que não mostremos o ID e que venha o maior recebedor (nome).
        const { data, error } = await window.supabaseClient
            .from('vw_ranking_consolidado')
            .select('*')
            .ilike('praca', `%${currentPraca}%`) // Filtra pela cidade
            .order('valor_total', { ascending: false }); // Ordena do maior pro menor

        if (error) throw error;

        if (!data || data.length === 0) {
            listContainer.innerHTML = '<div class="empty-msg">Nenhum dado encontrado para esta praça ainda. <br/> (Certifique-se de que a planilha já foi enviada no Supabase).</div>';
            return;
        }

        // Guarda o ranking original em memória para não precisar ir no banco de novo ao pesquisar
        globalRankingData = data;
        renderRanking(data);

    } catch (err) {
        console.error("Erro ao buscar dados do ranking:", err);
        listContainer.innerHTML = `<div class="error-msg">Erro ao carregar o ranking: <br/>${err.message}</div>`;
    }
}

let globalRankingData = [];

function renderRanking(data) {
    const listContainer = document.getElementById('ranking-list');
    listContainer.innerHTML = '';

    if (!data || data.length === 0) {
        listContainer.innerHTML = '<div class="empty-msg">Nenhum entregador encontrado.</div>';
        return;
    }

    // Formatar os valores como Moeda Brasileira
    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    data.forEach((item, index) => {
        const tr = document.createElement('div');
        tr.className = 'ranking-item';

        const pos = index + 1;
        // As 3 primeiras posições têm cores exclusivas
        if (pos <= 3) tr.classList.add(`top-${pos}`);

        // Evita undefined
        const nomeEntregador = escapeHtml(item.recebedor) || "Não Identificado";
        const valorFormatado = formatter.format(parseFloat(item.valor_total || 0));

        // Estrutura HTML de cada linha usando CSS Grid Flex do styles.css
        tr.innerHTML = `
            <div class="col-pos">
                <div class="pos-badge">${pos}</div>
            </div>
            <div class="col-nome item-nome">${nomeEntregador}</div>
            <div class="col-valor item-valor">${valorFormatado}</div>
        `;
        listContainer.appendChild(tr);
    });
}

// Configura o ouvinte de pesquisa
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredData = globalRankingData.filter(item => {
                const nome = (item.recebedor || "").toLowerCase();
                return nome.includes(searchTerm);
            });
            renderRanking(filteredData);
        });
    }
});

// Previne ataques basicos de XSS na hora de dar replace nos nomes
function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
