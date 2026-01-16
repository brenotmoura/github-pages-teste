// Configuracao da API
const API_BASE_URL = 'https://minicube.com.br/api/v1/5/objects/105/records/';

// Dados processados
let parsedData = [];

// Elementos DOM
const apiKeyInput = document.getElementById('apiKey');
const toggleKeyBtn = document.getElementById('toggleKey');
const dataInput = document.getElementById('dataInput');
const parseBtn = document.getElementById('parseBtn');
const clearBtn = document.getElementById('clearBtn');
const previewSection = document.getElementById('previewSection');
const previewTable = document.getElementById('previewTable').querySelector('tbody');
const recordCount = document.getElementById('recordCount');
const sendBtn = document.getElementById('sendBtn');
const progress = document.getElementById('progress');
const logSection = document.getElementById('logSection');
const logContent = document.getElementById('logContent');

// Toggle visibilidade da API Key
toggleKeyBtn.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleKeyBtn.textContent = 'Ocultar';
    } else {
        apiKeyInput.type = 'password';
        toggleKeyBtn.textContent = 'Mostrar';
    }
});

// Salvar API Key no localStorage
apiKeyInput.addEventListener('change', () => {
    localStorage.setItem('minicube_api_key', apiKeyInput.value);
});

// Carregar API Key salva
window.addEventListener('load', () => {
    const savedKey = localStorage.getItem('minicube_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }
});

// Processar dados colados
parseBtn.addEventListener('click', () => {
    const rawData = dataInput.value.trim();

    if (!rawData) {
        alert('Cole os dados da planilha primeiro!');
        return;
    }

    parsedData = parseData(rawData);

    if (parsedData.length === 0) {
        alert('Nenhum dado valido encontrado. Verifique o formato.');
        return;
    }

    renderPreview();
});

// Limpar dados
clearBtn.addEventListener('click', () => {
    dataInput.value = '';
    parsedData = [];
    previewSection.style.display = 'none';
    logSection.style.display = 'none';
    logContent.innerHTML = '';
});

// Parser de dados
function parseData(rawData) {
    const lines = rawData.split('\n').filter(line => line.trim());
    const result = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Tentar separar por tab, ponto e virgula, ou virgula
        let columns;
        if (line.includes('\t')) {
            columns = line.split('\t');
        } else if (line.includes(';')) {
            columns = line.split(';');
        } else if (line.includes(',')) {
            columns = line.split(',');
        } else {
            columns = line.split(/\s{2,}/); // Multiplos espacos
        }

        columns = columns.map(col => col.trim());

        // Pular linha de cabecalho se detectada
        if (i === 0 && isHeaderRow(columns)) {
            continue;
        }

        if (columns.length >= 6) {
            const record = {
                data_do_pagamento: formatDate(columns[0]),
                processo_de_c_i: parseInt(columns[1]) || null,
                forma_de_pagamento: normalizeFormaPagamento(columns[2]),
                parcela: parseInt(columns[3]) || 1,
                valor_do_pagamento: parseFloat(columns[4].replace(',', '.').replace(/[^\d.]/g, '')) || 0,
                status: normalizeStatus(columns[5]),
                _rowIndex: i + 1,
                _status: 'pending'
            };
            result.push(record);
        }
    }

    return result;
}

// Verificar se e linha de cabecalho
function isHeaderRow(columns) {
    const headerKeywords = ['data', 'processo', 'forma', 'parcela', 'valor', 'status', 'pagamento'];
    const firstCol = columns[0].toLowerCase();
    return headerKeywords.some(keyword => firstCol.includes(keyword));
}

// Formatar data para YYYY-MM-DD
function formatDate(dateStr) {
    if (!dateStr) return null;

    // Se ja esta no formato correto
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }

    // Converter DD/MM/YYYY para YYYY-MM-DD
    const parts = dateStr.split(/[\/\-\.]/);
    if (parts.length === 3) {
        if (parts[0].length === 4) {
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }

    return dateStr;
}

// Normalizar forma de pagamento
function normalizeFormaPagamento(value) {
    if (!value) return null;

    const normalized = value.toLowerCase().trim();
    const mapping = {
        'dinheiro': 'Dinheiro',
        'pix': 'Pix',
        'cartao de credito': 'Cartão de Crédito',
        'cartao credito': 'Cartão de Crédito',
        'credito': 'Cartão de Crédito',
        'cartao de debito': 'Cartão de Débito',
        'cartao debito': 'Cartão de Débito',
        'debito': 'Cartão de Débito',
        'cheque': 'Cheque',
        'recorrencia': 'Recorrência',
        'recorrência': 'Recorrência'
    };

    // Remover acentos para comparacao
    const normalizedNoAccent = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    for (const [key, val] of Object.entries(mapping)) {
        const keyNoAccent = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalizedNoAccent.includes(keyNoAccent)) {
            return val;
        }
    }

    return value;
}

// Normalizar status
function normalizeStatus(value) {
    if (!value) return 'Em Aberto';

    const normalized = value.toLowerCase().trim();

    if (normalized.includes('pago')) return 'Pago';
    if (normalized.includes('cancelado')) return 'Cancelado';
    if (normalized.includes('aberto')) return 'Em Aberto';

    return 'Em Aberto';
}

// Renderizar preview
function renderPreview() {
    previewTable.innerHTML = '';

    parsedData.forEach((record, index) => {
        const row = document.createElement('tr');
        row.id = `row-${index}`;
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${record.data_do_pagamento || '-'}</td>
            <td>${record.processo_de_c_i || '-'}</td>
            <td>${record.forma_de_pagamento || '-'}</td>
            <td>${record.parcela}</td>
            <td>R$ ${record.valor_do_pagamento.toFixed(2)}</td>
            <td>${record.status}</td>
            <td id="status-${index}"><span class="badge badge-pending">Aguardando</span></td>
        `;
        previewTable.appendChild(row);
    });

    recordCount.textContent = `(${parsedData.length} registros)`;
    previewSection.style.display = 'block';
}

// Enviar todos os registros
sendBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        alert('Insira sua API Key primeiro!');
        return;
    }

    if (parsedData.length === 0) {
        alert('Nenhum dado para enviar!');
        return;
    }

    sendBtn.disabled = true;
    logSection.style.display = 'block';
    logContent.innerHTML = '';

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < parsedData.length; i++) {
        const record = parsedData[i];
        progress.textContent = `Enviando ${i + 1} de ${parsedData.length}...`;

        try {
            const payload = {
                data_do_pagamento: record.data_do_pagamento,
                processo_de_c_i: record.processo_de_c_i,
                forma_de_pagamento: record.forma_de_pagamento,
                parcela: record.parcela,
                valor_do_pagamento: record.valor_do_pagamento,
                status: record.status
            };

            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'X-API-Key': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const statusCell = document.getElementById(`status-${i}`);

            if (response.ok) {
                const result = await response.json();
                statusCell.innerHTML = `<span class="badge badge-success">OK (ID: ${result.id})</span>`;
                addLog(`#${i + 1} - Sucesso! ID: ${result.id}`, 'success');
                successCount++;
            } else {
                const error = await response.text();
                statusCell.innerHTML = `<span class="badge badge-error">Erro</span>`;
                addLog(`#${i + 1} - Erro: ${response.status} - ${error}`, 'error');
                errorCount++;
            }
        } catch (err) {
            const statusCell = document.getElementById(`status-${i}`);
            statusCell.innerHTML = `<span class="badge badge-error">Erro</span>`;
            addLog(`#${i + 1} - Erro: ${err.message}`, 'error');
            errorCount++;
        }

        // Pequeno delay para nao sobrecarregar a API
        await sleep(200);
    }

    progress.textContent = `Concluido! ${successCount} sucesso, ${errorCount} erros.`;
    sendBtn.disabled = false;

    addLog(`--- Finalizado: ${successCount} sucesso, ${errorCount} erros ---`, successCount > 0 ? 'success' : 'error');
});

// Adicionar entrada no log
function addLog(message, type) {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}

// Sleep helper
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
