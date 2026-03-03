document.getElementById('upload-btn').addEventListener('click', async () => {
    const fileInput = document.getElementById('excel-file');
    const statusMsg = document.getElementById('status-msg');
    const btn = document.getElementById('upload-btn');

    if (!fileInput.files.length) {
        statusMsg.innerHTML = '<span class="error-msg" style="color: #ef4444;">Por favor, selecione um arquivo.</span>';
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    btn.disabled = true;
    statusMsg.innerHTML = '<span style="color: #94a3b8;">Lendo arquivo Excel...</span>';

    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Pega a primeira aba da planilha
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Converte os dados da planilha para JSON (o nome da coluna será a chave)
            let jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

            if (jsonData.length === 0) {
                statusMsg.innerHTML = '<span class="error-msg" style="color: #ef4444;">A planilha está vazia.</span>';
                btn.disabled = false;
                return;
            }

            // Normalizar os nomes das colunas e formatar as praças
            const formattedData = jsonData.map(row => {
                let formattedRow = {};
                for (const key in row) {
                    const normalizedKey = key.trim().toLowerCase();

                    // Formatar texto de praca para uppercase para bater com os filtros na index
                    if (normalizedKey === 'praca' && row[key]) {
                        formattedRow[normalizedKey] = String(row[key]).trim().toUpperCase();
                    } else {
                        formattedRow[normalizedKey] = row[key];
                    }
                }
                return formattedRow;
            });

            statusMsg.innerHTML = `<span style="color: #94a3b8;">Inserindo ${formattedData.length} registros no Supabase...</span>`;

            // Envia para o Supabase
            // obs: Para que funcione via Javascript pelo Cliente, 
            // a tabela (ranking_promocao) precisa de política RLS com INSERT para a regra "anon"
            const { error } = await supabase
                .from('ranking_promocao')
                .insert(formattedData);

            if (error) {
                console.error("Supabase Error:", error);
                throw error;
            }

            statusMsg.innerHTML = '<span style="color: #10b981;">Upload concluído com sucesso! Os rankings foram atualizados.</span>';
            fileInput.value = ''; // Limpa o input
        } catch (error) {
            console.error(error);
            statusMsg.innerHTML = `<span class="error-msg" style="color: #ef4444;">Erro ao processar: verifique as colunas do seu arquivo ou a conexão com o banco. <br/> Detalhe: ${error.message}</span>`;
        } finally {
            btn.disabled = false;
        }
    };

    reader.readAsArrayBuffer(file);
});
