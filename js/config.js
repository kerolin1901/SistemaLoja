/* ==========================================
   SISTEMA DA LOJA
   CONFIGURAÇÃO SUPABASE
========================================== */

const SUPABASE_URL =
    "https://nzlocfpzhytddornause.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_M84hLcVlzdwkC7MLW7semg_iqFduNeu";


/* ==========================================
   CRIAR CONEXÃO COM SUPABASE
========================================== */

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);