/* ==========================================

   SISTEMA DA LOJA

   FINANCEIRO + FLUXO DE CAIXA

========================================== */





/* ==========================================

   SUPABASE

========================================== */



const financeiroSupabase =

    supabaseClient;





/* ==========================================

   ELEMENTOS

========================================== */



const nomeAdministrador =

    document.getElementById("nomeAdministrador");



const avatarAdministrador =

    document.querySelector(".avatar-admin");



const totalEntradas =

    document.getElementById("totalEntradas");



const totalSaidas =

    document.getElementById("totalSaidas");



const saldoFinanceiro =

    document.getElementById("saldoFinanceiro");

const totalEntradasVendas =
    document.getElementById("totalEntradasVendas");

const totalOutrasEntradas =
    document.getElementById("totalOutrasEntradas");



const formFinanceiro =

    document.getElementById("formFinanceiro");



const tipoFinanceiro =

    document.getElementById("tipoFinanceiro");



const categoriaFinanceiro =

    document.getElementById("categoriaFinanceiro");



const descricaoFinanceiro =

    document.getElementById("descricaoFinanceiro");



const valorFinanceiro =

    document.getElementById("valorFinanceiro");



const dataFinanceiro =

    document.getElementById("dataFinanceiro");



const mensagemFinanceiro =

    document.getElementById("mensagemFinanceiro");



const carregandoFinanceiro =

    document.getElementById("carregandoFinanceiro");



const semFinanceiro =

    document.getElementById("semFinanceiro");



const containerTabelaFinanceiro =

    document.getElementById(

        "containerTabelaFinanceiro"

    );



const listaFinanceiro =

    document.getElementById("listaFinanceiro");



const btnAtualizarFinanceiro =

    document.getElementById(

        "btnAtualizarFinanceiro"

    );



const btnCancelarFinanceiro =

    document.getElementById(

        "btnCancelarFinanceiro"

    );



const btnSair =

    document.getElementById("btnSair");





/* ==========================================

   ELEMENTOS DO FLUXO

========================================== */



const dataInicialFluxo =

    document.getElementById(

        "dataInicialFluxo"

    );



const dataFinalFluxo =

    document.getElementById(

        "dataFinalFluxo"

    );



const btnConsultarFluxo =

    document.getElementById(

        "btnConsultarFluxo"

    );



const entradasPeriodo =

    document.getElementById(

        "entradasPeriodo"

    );

const vendasPeriodo =
    document.getElementById("vendasPeriodo");

const outrasEntradasPeriodo =
    document.getElementById("outrasEntradasPeriodo");



const saidasPeriodo =

    document.getElementById(

        "saidasPeriodo"

    );



const caixaPeriodo =

    document.getElementById(

        "caixaPeriodo"

    );



const periodoSelecionado =

    document.getElementById(

        "periodoSelecionado"

    );



const carregandoFluxo =

    document.getElementById(

        "carregandoFluxo"

    );



const semFluxo =

    document.getElementById(

        "semFluxo"

    );



const containerTabelaFluxo =

    document.getElementById(

        "containerTabelaFluxo"

    );



const listaFluxo =

    document.getElementById(

        "listaFluxo"

    );



const totalFluxoVendas =
    document.getElementById("totalFluxoVendas");

const totalFluxoOutrasEntradas =
    document.getElementById("totalFluxoOutrasEntradas");

const totalFluxoEntradas =

    document.getElementById(

        "totalFluxoEntradas"

    );



const totalFluxoSaidas =

    document.getElementById(

        "totalFluxoSaidas"

    );



const totalFluxoCaixa =

    document.getElementById(

        "totalFluxoCaixa"

    );





/* ==========================================

   UTILITÁRIOS

========================================== */



function formatarMoeda(valor) {



    return Number(

        valor || 0

    ).toLocaleString(

        "pt-BR",

        {

            style: "currency",

            currency: "BRL"

        }

    );



}





function ehEntradaDeVenda(lancamento) {
    return (
        lancamento.tipo === "entrada" &&
        String(lancamento.categoria || "").trim().toLowerCase() === "venda"
    );
}


function formatarData(data) {



    if (!data) {



        return "-";



    }





    const dataObj =

        new Date(

            data + "T00:00:00"

        );





    if (

        Number.isNaN(

            dataObj.getTime()

        )

    ) {



        return data;



    }





    return dataObj.toLocaleDateString(

        "pt-BR"

    );



}





function obterDataHoje() {



    const agora =

        new Date();





    const ano =

        agora.getFullYear();





    const mes =

        String(

            agora.getMonth() + 1

        ).padStart(

            2,

            "0"

        );





    const dia =

        String(

            agora.getDate()

        ).padStart(

            2,

            "0"

        );





    return `${ano}-${mes}-${dia}`;



}





function obterPrimeiroDiaDoMes() {



    const agora =

        new Date();





    const ano =

        agora.getFullYear();





    const mes =

        String(

            agora.getMonth() + 1

        ).padStart(

            2,

            "0"

        );





    return `${ano}-${mes}-01`;



}





function formatarPeriodo(

    inicio,

    fim

) {



    return (

        formatarData(inicio) +

        " até " +

        formatarData(fim)

    );



}





/* ==========================================

   MENSAGEM

========================================== */



function mostrarMensagem(

    texto,

    tipo = "sucesso"

) {



    mensagemFinanceiro.textContent =

        texto;





    mensagemFinanceiro.className =

        "mensagem-financeiro " +

        tipo;



}





function limparMensagem() {



    mensagemFinanceiro.textContent =

        "";





    mensagemFinanceiro.className =

        "mensagem-financeiro";



}





/* ==========================================

   PROTEGER PÁGINA

========================================== */



async function protegerPaginaFinanceiro() {



    const {

        data: {

            session

        }

    } =

        await financeiroSupabase

            .auth

            .getSession();





    if (!session) {



        window.location.href =

            "index.html";



        return false;



    }





    const {

        data: perfil,

        error

    } =

        await financeiroSupabase

            .from("perfis")

            .select(`

                id,

                nome_completo,

                usuario,

                tipo,

                ativo

            `)

            .eq(

                "id",

                session.user.id

            )

            .maybeSingle();





    if (error) {



        console.error(error);





        alert(

            "Não foi possível verificar o usuário."

        );





        window.location.href =

            "index.html";





        return false;



    }





    if (

        !perfil ||

        perfil.tipo !== "admin" ||

        perfil.ativo !== true

    ) {



        await financeiroSupabase

            .auth

            .signOut({

                scope: "local"

            });





        window.location.href =

            "index.html";





        return false;



    }





    const nome =

        perfil.nome_completo ||

        perfil.usuario ||

        "Administrador";





    nomeAdministrador.textContent =

        nome;





    if (avatarAdministrador) {



        avatarAdministrador.textContent =

            nome

                .charAt(0)

                .toUpperCase();



    }





    return true;



}





/* ==========================================

   CARREGAR FINANCEIRO GERAL

========================================== */



async function carregarFinanceiro() {



    carregandoFinanceiro.style.display =

        "block";





    semFinanceiro.style.display =

        "none";





    containerTabelaFinanceiro.style.display =

        "none";





    listaFinanceiro.innerHTML =

        "";





    const {

        data,

        error

    } =

        await financeiroSupabase

            .from("financeiro")

            .select(`

                id,

                usuario_id,

                tipo,

                categoria,

                descricao,

                valor,

                data_movimento,

                criado_em

            `)

            .order(

                "data_movimento",

                {

                    ascending: false

                }

            )

            .order(

                "criado_em",

                {

                    ascending: false

                }

            );





    carregandoFinanceiro.style.display =

        "none";





    if (error) {



        console.error(

            "Erro ao carregar financeiro:",

            error

        );





        mostrarMensagem(

            "Não foi possível carregar o financeiro: " +

            error.message,

            "erro"

        );





        return;



    }





    const lancamentos =

        data || [];





    let entradas = 0;

    let entradasVendas = 0;

    let outrasEntradas = 0;

    let saidas = 0;





    lancamentos.forEach(

        function (lancamento) {



            const valor =

                Number(

                    lancamento.valor

                ) || 0;





            if (lancamento.tipo === "entrada") {
                entradas += valor;

                if (ehEntradaDeVenda(lancamento)) {
                    entradasVendas += valor;
                } else {
                    outrasEntradas += valor;
                }
            }





            if (

                lancamento.tipo ===

                "saida"

            ) {



                saidas += valor;



            }



        }

    );





    const saldo =

        entradas - saidas;





    totalEntradas.textContent =

        formatarMoeda(

            entradas

        );

    if (totalEntradasVendas) {
        totalEntradasVendas.textContent = formatarMoeda(entradasVendas);
    }

    if (totalOutrasEntradas) {
        totalOutrasEntradas.textContent = formatarMoeda(outrasEntradas);
    }





    totalSaidas.textContent =

        formatarMoeda(

            saidas

        );





    saldoFinanceiro.textContent =

        formatarMoeda(

            saldo

        );





    if (!lancamentos.length) {



        semFinanceiro.style.display =

            "block";



        return;



    }





    containerTabelaFinanceiro.style.display =

        "block";





    lancamentos.forEach(

        function (lancamento) {



            const tr =

                document.createElement(

                    "tr"

                );





            const tdData =

                document.createElement(

                    "td"

                );





            tdData.textContent =

                formatarData(

                    lancamento.data_movimento

                );





            const tdTipo =

                document.createElement(

                    "td"

                );





            const spanTipo =

                document.createElement(

                    "span"

                );





            spanTipo.className =

                "tipo-financeiro " +

                (

                    lancamento.tipo ===

                    "entrada"

                        ? "tipo-entrada"

                        : "tipo-saida"

                );





            spanTipo.textContent =

                lancamento.tipo ===

                "entrada"

                    ? "Entrada"

                    : "Saída";





            tdTipo.appendChild(

                spanTipo

            );





            const tdCategoria =

                document.createElement(

                    "td"

                );





            tdCategoria.textContent =

                lancamento.categoria ||

                "-";





            const tdDescricao =

                document.createElement(

                    "td"

                );





            tdDescricao.textContent =

                lancamento.descricao ||

                "-";





            const tdValor =

                document.createElement(

                    "td"

                );





            tdValor.className =

                lancamento.tipo ===

                "entrada"

                    ? "valor-entrada"

                    : "valor-saida";





            const sinal =

                lancamento.tipo ===

                "entrada"

                    ? "+"

                    : "-";





            tdValor.textContent =

                sinal +

                " " +

                formatarMoeda(

                    lancamento.valor

                );





            const tdAcoes =

                document.createElement(

                    "td"

                );





            const btnExcluir =

                document.createElement(

                    "button"

                );





            btnExcluir.type =

                "button";





            btnExcluir.className =

                "botao-excluir-financeiro";





            btnExcluir.textContent =

                "Excluir";





            btnExcluir.addEventListener(

                "click",

                function () {



                    excluirLancamento(

                        lancamento.id

                    );



                }

            );





            tdAcoes.appendChild(

                btnExcluir

            );





            tr.appendChild(tdData);



            tr.appendChild(tdTipo);



            tr.appendChild(tdCategoria);



            tr.appendChild(tdDescricao);



            tr.appendChild(tdValor);



            tr.appendChild(tdAcoes);





            listaFinanceiro.appendChild(

                tr

            );



        }

    );



}





/* ==========================================

   FLUXO DE CAIXA

========================================== */



async function consultarFluxoCaixa() {



    limparMensagem();





    const inicio =

        dataInicialFluxo.value;





    const fim =

        dataFinalFluxo.value;





    if (!inicio || !fim) {



        mostrarMensagem(

            "Informe a data inicial e a data final.",

            "erro"

        );



        return;



    }





    if (inicio > fim) {



        mostrarMensagem(

            "A data inicial não pode ser maior que a data final.",

            "erro"

        );



        return;



    }





    carregandoFluxo.style.display =

        "block";





    semFluxo.style.display =

        "none";





    containerTabelaFluxo.style.display =

        "none";





    listaFluxo.innerHTML =

        "";





    entradasPeriodo.textContent =

        formatarMoeda(0);

    if (vendasPeriodo) {
        vendasPeriodo.textContent = formatarMoeda(0);
    }

    if (outrasEntradasPeriodo) {
        outrasEntradasPeriodo.textContent = formatarMoeda(0);
    }





    saidasPeriodo.textContent =

        formatarMoeda(0);





    caixaPeriodo.textContent =

        formatarMoeda(0);





    periodoSelecionado.textContent =

        "Consultando período: " +

        formatarPeriodo(

            inicio,

            fim

        );





    const {

        data,

        error

    } =

        await financeiroSupabase

            .from("financeiro")

            .select(`

                id,

                tipo,

                categoria,

                descricao,

                valor,

                data_movimento

            `)

            .gte(

                "data_movimento",

                inicio

            )

            .lte(

                "data_movimento",

                fim

            )

            .order(

                "data_movimento",

                {

                    ascending: true

                }

            );





    carregandoFluxo.style.display =

        "none";





    if (error) {



        console.error(

            "Erro no fluxo de caixa:",

            error

        );





        mostrarMensagem(

            "Não foi possível consultar o fluxo de caixa: " +

            error.message,

            "erro"

        );





        return;



    }





    const lancamentos =

        data || [];





    let totalEntradasPeriodo = 0;

    let totalVendasPeriodo = 0;

    let totalOutrasEntradasPeriodo = 0;

    let totalSaidasPeriodo = 0;





    lancamentos.forEach(

        function (lancamento) {



            const valor =

                Number(

                    lancamento.valor

                ) || 0;





            if (lancamento.tipo === "entrada") {
                totalEntradasPeriodo += valor;

                if (ehEntradaDeVenda(lancamento)) {
                    totalVendasPeriodo += valor;
                } else {
                    totalOutrasEntradasPeriodo += valor;
                }
            }





            if (

                lancamento.tipo ===

                "saida"

            ) {



                totalSaidasPeriodo +=

                    valor;



            }



        }

    );





    const caixa =

        totalEntradasPeriodo -

        totalSaidasPeriodo;





    entradasPeriodo.textContent =

        formatarMoeda(

            totalEntradasPeriodo

        );

    if (vendasPeriodo) {
        vendasPeriodo.textContent = formatarMoeda(totalVendasPeriodo);
    }

    if (outrasEntradasPeriodo) {
        outrasEntradasPeriodo.textContent = formatarMoeda(totalOutrasEntradasPeriodo);
    }





    saidasPeriodo.textContent =

        formatarMoeda(

            totalSaidasPeriodo

        );





    caixaPeriodo.textContent =

        formatarMoeda(

            caixa

        );





    if (caixa < 0) {



        caixaPeriodo.style.color =

            "#dc2626";



    } else {



        caixaPeriodo.style.color =

            "#0f172a";



    }





    if (totalFluxoVendas) {
        totalFluxoVendas.textContent = formatarMoeda(totalVendasPeriodo);
    }

    if (totalFluxoOutrasEntradas) {
        totalFluxoOutrasEntradas.textContent = formatarMoeda(totalOutrasEntradasPeriodo);
    }

    totalFluxoEntradas.textContent =

        formatarMoeda(

            totalEntradasPeriodo

        );





    totalFluxoSaidas.textContent =

        formatarMoeda(

            totalSaidasPeriodo

        );





    totalFluxoCaixa.textContent =

        formatarMoeda(

            caixa

        );





    if (!lancamentos.length) {



        semFluxo.style.display =

            "block";



        periodoSelecionado.textContent =

            "Período consultado: " +

            formatarPeriodo(

                inicio,

                fim

            ) +

            " — nenhum movimento encontrado.";





        return;



    }





    const dias =

        criarListaDeDias(

            inicio,

            fim

        );





    const resumoPorDia =

        {};





    dias.forEach(

        function (dia) {



            resumoPorDia[dia] = {
                vendas: 0,
                outrasEntradas: 0,
                entrada: 0,
                saida: 0
            };



        }

    );





    lancamentos.forEach(

        function (lancamento) {



            const dia =

                lancamento.data_movimento;





            if (

                !resumoPorDia[dia]

            ) {



                resumoPorDia[dia] = {
                    vendas: 0,
                    outrasEntradas: 0,
                    entrada: 0,
                    saida: 0
                };



            }





            const valor =

                Number(

                    lancamento.valor

                ) || 0;





            if (lancamento.tipo === "entrada") {
                resumoPorDia[dia].entrada += valor;

                if (ehEntradaDeVenda(lancamento)) {
                    resumoPorDia[dia].vendas += valor;
                } else {
                    resumoPorDia[dia].outrasEntradas += valor;
                }
            }





            if (

                lancamento.tipo ===

                "saida"

            ) {



                resumoPorDia[dia].saida +=

                    valor;



            }



        }

    );





    dias.forEach(

        function (dia) {



            const vendas = resumoPorDia[dia].vendas;

            const outrasEntradas = resumoPorDia[dia].outrasEntradas;

            const entrada = resumoPorDia[dia].entrada;





            const saida =

                resumoPorDia[dia].saida;





            const caixaDia =

                entrada - saida;





            const tr =

                document.createElement(

                    "tr"

                );





            const tdData =

                document.createElement(

                    "td"

                );





            tdData.textContent =

                formatarData(

                    dia

                );





            const tdEntrada =

                document.createElement(

                    "td"

                );





            tdEntrada.className =

                "valor-fluxo-entrada";





            tdEntrada.textContent =

                formatarMoeda(

                    entrada

                );





            const tdVendas = document.createElement("td");
            tdVendas.className = "valor-fluxo-entrada";
            tdVendas.textContent = formatarMoeda(vendas);

            const tdOutrasEntradas = document.createElement("td");
            tdOutrasEntradas.className = "valor-fluxo-entrada";
            tdOutrasEntradas.textContent = formatarMoeda(outrasEntradas);

            const tdSaida =

                document.createElement(

                    "td"

                );





            tdSaida.className =

                "valor-fluxo-saida";





            tdSaida.textContent =

                formatarMoeda(

                    saida

                );





            const tdCaixa =

                document.createElement(

                    "td"

                );





            if (caixaDia < 0) {



                tdCaixa.className =

                    "valor-fluxo-caixa-negativo";



            } else {



                tdCaixa.className =

                    "valor-fluxo-caixa";



            }





            tdCaixa.textContent =

                formatarMoeda(

                    caixaDia

                );





            tr.appendChild(tdData);
            tr.appendChild(tdVendas);
            tr.appendChild(tdOutrasEntradas);
            tr.appendChild(tdEntrada);
            tr.appendChild(tdSaida);
            tr.appendChild(tdCaixa);





            listaFluxo.appendChild(

                tr

            );



        }

    );





    containerTabelaFluxo.style.display =

        "block";





    periodoSelecionado.textContent =

        "Período consultado: " +

        formatarPeriodo(

            inicio,

            fim

        );



}





/* ==========================================

   CRIAR LISTA DE DIAS

========================================== */



function criarListaDeDias(

    inicio,

    fim

) {



    const lista = [];





    let dataAtual =

        new Date(

            inicio +

            "T00:00:00"

        );





    const dataFinal =

        new Date(

            fim +

            "T00:00:00"

        );





    while (

        dataAtual <=

        dataFinal

    ) {



        const ano =

            dataAtual.getFullYear();





        const mes =

            String(

                dataAtual.getMonth() + 1

            ).padStart(

                2,

                "0"

            );





        const dia =

            String(

                dataAtual.getDate()

            ).padStart(

                2,

                "0"

            );





        lista.push(

            `${ano}-${mes}-${dia}`

        );





        dataAtual.setDate(

            dataAtual.getDate() + 1

        );



    }





    return lista;



}





/* ==========================================

   SALVAR LANÇAMENTO

========================================== */



async function salvarLancamento(

    evento

) {



    evento.preventDefault();





    limparMensagem();





    const tipo =

        tipoFinanceiro.value;





    const categoria =

        categoriaFinanceiro.value.trim();





    const descricao =

        descricaoFinanceiro.value.trim();





    const valor =

        Number(

            valorFinanceiro.value

        );





    const data =

        dataFinanceiro.value;





    if (

        tipo !== "entrada" &&

        tipo !== "saida"

    ) {



        mostrarMensagem(

            "Selecione um tipo válido.",

            "erro"

        );



        return;



    }





    if (!categoria) {



        mostrarMensagem(

            "Selecione uma categoria.",

            "erro"

        );



        return;



    }





    if (!descricao) {



        mostrarMensagem(

            "Informe uma descrição.",

            "erro"

        );



        return;



    }





    if (

        !Number.isFinite(valor) ||

        valor <= 0

    ) {



        mostrarMensagem(

            "Informe um valor maior que zero.",

            "erro"

        );



        return;



    }





    if (!data) {



        mostrarMensagem(

            "Informe a data do lançamento.",

            "erro"

        );



        return;



    }





    const {

        data: {

            user

        }

    } =

        await financeiroSupabase

            .auth

            .getUser();





    if (!user) {



        mostrarMensagem(

            "Sua sessão expirou. Faça login novamente.",

            "erro"

        );



        return;



    }





    const btnSalvar =

        document.getElementById(

            "btnSalvarFinanceiro"

        );





    btnSalvar.disabled =

        true;





    btnSalvar.textContent =

        "Salvando...";





    const {

        error

    } =

        await financeiroSupabase

            .from("financeiro")

            .insert({



                usuario_id:

                    user.id,



                tipo:

                    tipo,



                categoria:

                    categoria,



                descricao:

                    descricao,



                valor:

                    valor,



                data_movimento:

                    data



            });





    btnSalvar.disabled =

        false;





    btnSalvar.textContent =

        "Salvar lançamento";





    if (error) {



        console.error(

            "Erro ao salvar:",

            error

        );





        mostrarMensagem(

            "Não foi possível salvar: " +

            error.message,

            "erro"

        );





        return;



    }





    mostrarMensagem(

        "Lançamento salvo com sucesso.",

        "sucesso"

    );





    limparFormulario();





    await carregarFinanceiro();





    await consultarFluxoCaixa();



}





/* ==========================================

   LIMPAR FORMULÁRIO

========================================== */



function limparFormulario() {



    tipoFinanceiro.value =

        "entrada";





    categoriaFinanceiro.value =

        "";





    descricaoFinanceiro.value =

        "";





    valorFinanceiro.value =

        "";





    dataFinanceiro.value =

        obterDataHoje();



}





/* ==========================================

   EXCLUIR LANÇAMENTO

========================================== */



async function excluirLancamento(

    id

) {



    const confirmar =

        window.confirm(

            "Deseja realmente excluir este lançamento?"

        );





    if (!confirmar) {



        return;



    }





    const {

        error

    } =

        await financeiroSupabase

            .from("financeiro")

            .delete()

            .eq(

                "id",

                id

            );





    if (error) {



        console.error(

            "Erro ao excluir:",

            error

        );





        mostrarMensagem(

            "Não foi possível excluir: " +

            error.message,

            "erro"

        );





        return;



    }





    mostrarMensagem(

        "Lançamento excluído com sucesso.",

        "sucesso"

    );





    await carregarFinanceiro();





    await consultarFluxoCaixa();



}





/* ==========================================

   SAIR

========================================== */



async function sair() {



    await financeiroSupabase

        .auth

        .signOut({

            scope: "local"

        });





    window.location.href =

        "index.html";



}





/* ==========================================

   MENU FUTURO

========================================== */



function configurarMenuFuturo() {



    const itens =

        document.querySelectorAll(

            "[data-futuro]"

        );





    itens.forEach(

        function (item) {



            item.addEventListener(

                "click",

                function (evento) {



                    evento.preventDefault();





                    const nome =

                        item.getAttribute(

                            "data-futuro"

                        );





                    alert(

                        "A área de " +

                        nome +

                        " será desenvolvida nesta etapa."

                    );



                }

            );



        }

    );



}





/* ==========================================

   EVENTOS

========================================== */



if (formFinanceiro) {



    formFinanceiro.addEventListener(

        "submit",

        salvarLancamento

    );



}





if (btnAtualizarFinanceiro) {



    btnAtualizarFinanceiro.addEventListener(

        "click",

        async function () {



            limparMensagem();



            await carregarFinanceiro();



            await consultarFluxoCaixa();



        }

    );



}





if (btnCancelarFinanceiro) {



    btnCancelarFinanceiro.addEventListener(

        "click",

        function () {



            limparFormulario();



            limparMensagem();



        }

    );



}





if (btnConsultarFluxo) {



    btnConsultarFluxo.addEventListener(

        "click",

        consultarFluxoCaixa

    );



}





if (btnSair) {



    btnSair.addEventListener(

        "click",

        sair

    );



}





/* ==========================================

   INICIAR

========================================== */



async function iniciarFinanceiro() {



    const autorizado =

        await protegerPaginaFinanceiro();





    if (!autorizado) {



        return;



    }





    dataFinanceiro.value =

        obterDataHoje();





    dataInicialFluxo.value =

        obterPrimeiroDiaDoMes();





    dataFinalFluxo.value =

        obterDataHoje();





    await carregarFinanceiro();





    await consultarFluxoCaixa();





    configurarMenuFuturo();



}





iniciarFinanceiro();