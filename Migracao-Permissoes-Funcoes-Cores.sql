-- Permissoes das funcoes de gerenciamento de cores
-- Alteracoes aplicadas em 09/11/2026

GRANT EXECUTE ON FUNCTION
public.movimentar_estoque_cor(bigint, text, numeric, text)
TO authenticated;

GRANT EXECUTE ON FUNCTION
public.salvar_cor_produto(bigint, bigint, text, numeric, boolean)
TO authenticated;
