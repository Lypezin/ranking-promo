-- Banco de Dados: Supabase

-- 1. Criar a tabela para receber os dados da planilha
CREATE TABLE ranking_promocao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data_do_lancamento_financeiro DATE,
    praca VARCHAR(255),
    id_da_pessoa_entregadora VARCHAR(255),
    recebedor VARCHAR(255),
    tipo VARCHAR(255),
    valor NUMERIC,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Ativar RLS (Segurança) e permitir leitura pública e inserção pelo Upload
ALTER TABLE ranking_promocao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura anonima" 
ON ranking_promocao FOR SELECT 
TO anon 
USING (true);

CREATE POLICY "Permitir insercao anonima" 
ON ranking_promocao FOR INSERT 
TO anon 
WITH CHECK (true);

-- 3. Criar uma View para consolidar o ranking dinamicamente
-- Agrupa pelo ID e Praca, soma os valores e ordena do maior para o menor.
CREATE OR REPLACE VIEW vw_ranking_consolidado AS
SELECT 
    praca,
    id_da_pessoa_entregadora,
    MAX(recebedor) AS recebedor,
    SUM(valor) AS valor_total
FROM ranking_promocao
GROUP BY 
    praca, 
    id_da_pessoa_entregadora
ORDER BY 
    valor_total DESC;

-- AVISO: Quando for fazer o upload da planilha (via Supabase UI),
-- garanta que os nomes das colunas na planilha Excel (CSV) são EXATAMENTE estes:
-- data_do_lancamento_financeiro | praca | id_da_pessoa_entregadora | recebedor | tipo | valor | descricao
