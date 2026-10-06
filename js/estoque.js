/* ==========================================
   SISTEMA DA LOJA
   CONTROLE DE ESTOQUE
========================================== */

const formMovimentacao =
    document.getElementById("formMovimentacao");

const produtoEstoque =
    document.getElementById("produtoEstoque");

const tipoMovimentacao =
    document.getElementById("tipoMovimentacao");

const quantidadeMovimentacao =
    document.getElementById("quantidadeMovimentacao");

const motivoMovimentacao =
    document.getElementById("motivoMovimentacao");

const mensagemEstoque =
    document.getElementById("mensagemEstoque");

const btnCancelarMovimentacao =
    document.getElementById("btnCancelarMovimentacao");

const btnAtualizarEstoque =
    document.getElementById("btnAtualizarEstoque");

const btnSair =
    document.getElementById("btnSair");

const listaEstoque =
    document.getElementById("listaEstoque");

const listaMovimentacoes =
    document.getElementById("listaMovimentacoes");

const carregandoEstoque =
    document.getElementById("carregandoEstoque");

const carregandoMovimentacoes =
    document.getElementById("carregandoMovimentacoes");

const semEstoque =
    document.getElementById("semEstoque");

const semMovimentacoes =
    document.getElementById("semMovimentacoes");

const totalProdutos =
    document.getElementById("totalProdutos");

const totalItens =
    document.getElementById("totalItens");

const totalEstoqueBaixo =
    document.getElementById("totalEstoqueBaixo");

const nomeAdministrador =
    document.getElementById("nomeAdministrador");

const avatarAdministrador =
    document.querySelector(".avatar-admin");

const dataAtual =
    document.getElementById("dataAtual");


/* ==========================================
   SUPABASE
========================================== */

const estoqueSupabase = supabaseClient;

let usuarioAtual = null;
let movimentacaoEmAndamento = false;


/* ==========================================
   MENSAGEM
========================================== */

function mostrarMensagem(texto, tipo) {

    if (!mensagemEstoque) {
        return;
    }

    mensagemEstoque.textContent = texto || "";

    mensagemEstoque.className =
        "mensagem-estoque";

    if (tipo) {
        mensagemEstoque.classList.add(tipo);
    }
}


/* ==========================================
   DATA
========================================== */

function mostrarData() {

    if (!dataAtual) {
        return;
    }

    const agora = new Date();

    dataAtual.textContent =
        agora.toLocaleDateString(
            "pt-BR",
            {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );
}


/* ==========================================
   PROTEGER PÁGINA
========================================== */

async function protegerPaginaEstoque() {

    try {

        const resultadoUsuario =
            await estoqueSupabase.auth.getUser();

        const usuario =
            resultadoUsuario.data.user;

        if (!usuario) {

            window.location.href =
                "index.html";

            return false;
        }


        const resultadoPerfil =
            await estoqueSupabase
                .from("perfis")
                .select("*")
                .eq("id", usuario.id)
                .single();


        if (
            resultadoPerfil.error ||
            !resultadoPerfil.data
        ) {

            await estoqueSupabase.auth.signOut();

            window.location.href =
                "index.html";

            return false;
        }


        const perfil =
            resultadoPerfil.data;


        if (perfil.tipo !== "admin") {

            window.location.href =
                "vendedor.html";

            return false;
        }


        if (!perfil.ativo) {

            await estoqueSupabase.auth.signOut();

            alert(
                "Seu usuário está desativado."
            );

            window.location.href =
                "index.html";

            return false;
        }


        usuarioAtual = perfil;


        if (nomeAdministrador) {

            nomeAdministrador.textContent =
                perfil.nome_completo ||
                "Administrador";
        }


        if (avatarAdministrador) {

            const nome =
                perfil.nome_completo ||
                "Administrador";

            avatarAdministrador.textContent =
                nome.charAt(0).toUpperCase();
        }


        return true;

    } catch (erro) {

        console.error(
            "Erro ao verificar usuário:",
            erro
        );

        window.location.href =
            "index.html";

        return false;
    }
}


/* ==========================================
   FORMATAÇÃO DE NÚMERO
========================================== */

function formatarNumero(valor) {

    return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3
        }
    );
}


/* ==========================================
   FORMATAÇÃO DE DATA
========================================== */

function formatarData(data) {

    if (!data) {
        return "-";
    }

    return new Date(data).toLocaleString(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* ==========================================
   CARREGAR PRODUTOS NO SELECT
========================================== */

async function carregarProdutosSelect() {

    if (!produtoEstoque) {
        return;
    }


    const resultado =
        await estoqueSupabase
            .from("produtos")
            .select(
                "id, nome, sku, ativo"
            )
            .eq("ativo", true)
            .order(
                "nome",
                {
                    ascending: true
                }
            );


    if (resultado.error) {

        console.error(
            "Erro ao carregar produtos:",
            resultado.error
        );

        produtoEstoque.innerHTML =
            '<option value="">Erro ao carregar produtos</option>';

        return;
    }


    produtoEstoque.innerHTML =
        '<option value="">Selecione um produto</option>';


    const produtos =
        resultado.data || [];


    produtos.forEach(function (produto) {

        const option =
            document.createElement("option");


        option.value =
            produto.id;


        if (produto.sku) {

            option.textContent =
                produto.nome +
                " - " +
                produto.sku;

        } else {

            option.textContent =
                produto.nome;
        }


        produtoEstoque.appendChild(option);
    });
}


/* ==========================================
   CARREGAR ESTOQUE
========================================== */

async function carregarEstoque() {

    if (carregandoEstoque) {
        carregandoEstoque.style.display =
            "block";
    }


    if (semEstoque) {
        semEstoque.style.display =
            "none";
    }


    if (listaEstoque) {
        listaEstoque.innerHTML = "";
    }


    const resultado =
        await estoqueSupabase
            .from("produtos")
            .select(`
                id,
                nome,
                sku,
                estoque,
                estoque_minimo,
                ativo,
                categorias (
                    nome
                )
            `)
            .order(
                "nome",
                {
                    ascending: true
                }
            );


    if (resultado.error) {

        console.error(
            "Erro ao carregar estoque:",
            resultado.error
        );


        if (carregandoEstoque) {
            carregandoEstoque.style.display =
                "none";
        }


        if (listaEstoque) {

            listaEstoque.innerHTML =
                "<tr>" +
                "<td colspan=\"6\">" +
                "Erro ao carregar o estoque." +
                "</td>" +
                "</tr>";
        }

        return;
    }


    if (carregandoEstoque) {
        carregandoEstoque.style.display =
            "none";
    }


    const produtos =
        resultado.data || [];


    if (produtos.length === 0) {

        if (semEstoque) {
            semEstoque.style.display =
                "block";
        }


        if (totalProdutos) {
            totalProdutos.textContent =
                "0";
        }


        if (totalItens) {
            totalItens.textContent =
                "0";
        }


        if (totalEstoqueBaixo) {
            totalEstoqueBaixo.textContent =
                "0";
        }


        return;
    }


    let quantidadeTotal = 0;
    let quantidadeEstoqueBaixo = 0;


    produtos.forEach(function (produto) {

        const estoque =
            Number(produto.estoque || 0);

        const minimo =
            Number(produto.estoque_minimo || 0);


        quantidadeTotal += estoque;


        let statusTexto =
            "Normal";

        let statusClasse =
            "status-normal";


        if (estoque <= 0) {

            statusTexto =
                "Esgotado";

            statusClasse =
                "status-esgotado";

            quantidadeEstoqueBaixo++;

        } else if (estoque <= minimo) {

            statusTexto =
                "Estoque baixo";

            statusClasse =
                "status-baixo";

            quantidadeEstoqueBaixo++;
        }


        let categoria =
            "Sem categoria";


        if (
            produto.categorias &&
            produto.categorias.nome
        ) {

            categoria =
                produto.categorias.nome;
        }


        const tr =
            document.createElement("tr");


        const tdProduto =
            document.createElement("td");

        const strongProduto =
            document.createElement("strong");

        strongProduto.textContent =
            produto.nome || "";

        tdProduto.appendChild(
            strongProduto
        );


        const tdSku =
            document.createElement("td");

        tdSku.textContent =
            produto.sku || "-";


        const tdCategoria =
            document.createElement("td");

        tdCategoria.textContent =
            categoria;


        const tdEstoque =
            document.createElement("td");

        tdEstoque.textContent =
            formatarNumero(estoque);


        const tdMinimo =
            document.createElement("td");

        tdMinimo.textContent =
            formatarNumero(minimo);


        const tdStatus =
            document.createElement("td");


        const spanStatus =
            document.createElement("span");


        spanStatus.className =
            "status-estoque " +
            statusClasse;


        spanStatus.textContent =
            statusTexto;


        tdStatus.appendChild(
            spanStatus
        );


        tr.appendChild(tdProduto);
        tr.appendChild(tdSku);
        tr.appendChild(tdCategoria);
        tr.appendChild(tdEstoque);
        tr.appendChild(tdMinimo);
        tr.appendChild(tdStatus);


        listaEstoque.appendChild(tr);
    });


    if (totalProdutos) {

        totalProdutos.textContent =
            produtos.length;
    }


    if (totalItens) {

        totalItens.textContent =
            formatarNumero(
                quantidadeTotal
            );
    }


    if (totalEstoqueBaixo) {

        totalEstoqueBaixo.textContent =
            quantidadeEstoqueBaixo;
    }
}


/* ==========================================
   CARREGAR MOVIMENTAÇÕES
========================================== */

async function carregarMovimentacoes() {

    if (carregandoMovimentacoes) {

        carregandoMovimentacoes.style.display =
            "block";
    }


    if (semMovimentacoes) {

        semMovimentacoes.style.display =
            "none";
    }


    if (listaMovimentacoes) {

        listaMovimentacoes.innerHTML =
            "";
    }


    const resultado =
        await estoqueSupabase
            .from("movimentacoes_estoque")
            .select(`
                id,
                tipo,
                quantidade,
                estoque_anterior,
                estoque_novo,
                motivo,
                criado_em,
                produtos (
                    nome
                )
            `)
            .order(
                "criado_em",
                {
                    ascending: false
                }
            )
            .limit(50);


    if (resultado.error) {

        console.error(
            "Erro ao carregar movimentações:",
            resultado.error
        );


        if (carregandoMovimentacoes) {

            carregandoMovimentacoes.style.display =
                "none";
        }


        if (listaMovimentacoes) {

            listaMovimentacoes.innerHTML =
                "<tr>" +
                "<td colspan=\"7\">" +
                "Erro ao carregar as movimentações." +
                "</td>" +
                "</tr>";
        }

        return;
    }


    if (carregandoMovimentacoes) {

        carregandoMovimentacoes.style.display =
            "none";
    }


    const movimentacoes =
        resultado.data || [];


    if (movimentacoes.length === 0) {

        if (semMovimentacoes) {

            semMovimentacoes.style.display =
                "block";
        }

        return;
    }


    movimentacoes.forEach(
        function (movimentacao) {

            let tipoTexto =
                "Ajuste";

            let tipoClasse =
                "tipo-ajuste";


            if (
                movimentacao.tipo ===
                "entrada"
            ) {

                tipoTexto =
                    "Entrada";

                tipoClasse =
                    "tipo-entrada";

            } else if (
                movimentacao.tipo ===
                "saida"
            ) {

                tipoTexto =
                    "Saída";

                tipoClasse =
                    "tipo-saida";
            }


            let nomeProduto =
                "Produto";


            if (
                movimentacao.produtos &&
                movimentacao.produtos.nome
            ) {

                nomeProduto =
                    movimentacao.produtos.nome;
            }


            const tr =
                document.createElement("tr");


            const tdData =
                document.createElement("td");

            tdData.textContent =
                formatarData(
                    movimentacao.criado_em
                );


            const tdProduto =
                document.createElement("td");

            const strongProduto =
                document.createElement("strong");

            strongProduto.textContent =
                nomeProduto;

            tdProduto.appendChild(
                strongProduto
            );


            const tdTipo =
                document.createElement("td");

            const spanTipo =
                document.createElement("span");

            spanTipo.className =
                "tipo-movimentacao " +
                tipoClasse;

            spanTipo.textContent =
                tipoTexto;

            tdTipo.appendChild(
                spanTipo
            );


            const tdQuantidade =
                document.createElement("td");

            tdQuantidade.textContent =
                formatarNumero(
                    movimentacao.quantidade
                );


            const tdAnterior =
                document.createElement("td");

            tdAnterior.textContent =
                formatarNumero(
                    movimentacao.estoque_anterior
                );


            const tdNovo =
                document.createElement("td");

            tdNovo.textContent =
                formatarNumero(
                    movimentacao.estoque_novo
                );


            const tdMotivo =
                document.createElement("td");

            tdMotivo.textContent =
                movimentacao.motivo ||
                "-";


            tr.appendChild(tdData);
            tr.appendChild(tdProduto);
            tr.appendChild(tdTipo);
            tr.appendChild(tdQuantidade);
            tr.appendChild(tdAnterior);
            tr.appendChild(tdNovo);
            tr.appendChild(tdMotivo);


            listaMovimentacoes.appendChild(
                tr
            );
        }
    );
}


/* ==========================================
   REGISTRAR MOVIMENTAÇÃO
========================================== */

async function registrarMovimentacao(event) {

    event.preventDefault();


    if (movimentacaoEmAndamento) {
        return;
    }


    const produtoId =
        produtoEstoque.value;


    const tipo =
        tipoMovimentacao.value;


    const quantidade =
        Number(
            quantidadeMovimentacao.value
        );


    const motivo =
        motivoMovimentacao.value.trim();


    if (!produtoId) {

        mostrarMensagem(
            "Selecione um produto.",
            "erro"
        );

        return;
    }


    if (
        !quantidade ||
        quantidade <= 0
    ) {

        mostrarMensagem(
            "Informe uma quantidade válida.",
            "erro"
        );

        return;
    }


    if (!usuarioAtual) {

        mostrarMensagem(
            "Usuário administrador não identificado.",
            "erro"
        );

        return;
    }


    movimentacaoEmAndamento =
        true;


    mostrarMensagem(
        "Registrando movimentação..."
    );


    try {

        const resultadoProduto =
            await estoqueSupabase
                .from("produtos")
                .select(
                    "id, nome, estoque, ativo"
                )
                .eq(
                    "id",
                    produtoId
                )
                .single();


        if (
            resultadoProduto.error ||
            !resultadoProduto.data
        ) {

            throw new Error(
                "Produto não encontrado."
            );
        }


        const produto =
            resultadoProduto.data;


        if (!produto.ativo) {

            throw new Error(
                "Este produto está inativo."
            );
        }


        const estoqueAnterior =
            Number(
                produto.estoque || 0
            );


        let estoqueNovo =
            estoqueAnterior;


        if (tipo === "entrada") {

            estoqueNovo =
                estoqueAnterior +
                quantidade;

        } else if (tipo === "saida") {

            estoqueNovo =
                estoqueAnterior -
                quantidade;

        } else if (tipo === "ajuste") {

            estoqueNovo =
                quantidade;

        } else {

            throw new Error(
                "Tipo de movimentação inválido."
            );
        }


        if (estoqueNovo < 0) {

            throw new Error(
                "A saída não pode deixar o estoque negativo."
            );
        }


        const atualizacao =
            await estoqueSupabase
                .from("produtos")
                .update({
                    estoque:
                        estoqueNovo,

                    atualizado_em:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    produtoId
                );


        if (atualizacao.error) {
            throw atualizacao.error;
        }


        const historico =
            await estoqueSupabase
                .from("movimentacoes_estoque")
                .insert({
                    produto_id:
                        produtoId,

                    usuario_id:
                        usuarioAtual.id,

                    tipo:
                        tipo,

                    quantidade:
                        quantidade,

                    estoque_anterior:
                        estoqueAnterior,

                    estoque_novo:
                        estoqueNovo,

                    motivo:
                        motivo || null
                });


        if (historico.error) {

            console.error(
                "Erro ao registrar histórico:",
                historico.error
            );

            mostrarMensagem(
                "Estoque atualizado, mas o histórico não foi registrado.",
                "erro"
            );

        } else {

            mostrarMensagem(
                "Movimentação registrada com sucesso.",
                "sucesso"
            );
        }


        formMovimentacao.reset();

        tipoMovimentacao.value =
            "entrada";


        await carregarProdutosSelect();

        await carregarEstoque();

        await carregarMovimentacoes();


    } catch (erro) {

        console.error(
            "Erro ao registrar movimentação:",
            erro
        );

        mostrarMensagem(
            erro.message ||
            "Não foi possível registrar a movimentação.",
            "erro"
        );

    } finally {

        movimentacaoEmAndamento =
            false;
    }
}


/* ==========================================
   CANCELAR
========================================== */

function cancelarMovimentacao() {

    if (formMovimentacao) {

        formMovimentacao.reset();
    }


    if (tipoMovimentacao) {

        tipoMovimentacao.value =
            "entrada";
    }


    mostrarMensagem("");
}


/* ==========================================
   SAIR
========================================== */

async function sair() {

    const resultado =
        await estoqueSupabase.auth.signOut();


    if (resultado.error) {

        console.error(
            "Erro ao sair:",
            resultado.error
        );

        alert(
            "Não foi possível sair."
        );

        return;
    }


    sessionStorage.removeItem(
        "sistemaLojaPerfil"
    );


    window.location.href =
        "index.html";
}


/* ==========================================
   EVENTOS
========================================== */

if (formMovimentacao) {

    formMovimentacao.addEventListener(
        "submit",
        registrarMovimentacao
    );
}


if (btnCancelarMovimentacao) {

    btnCancelarMovimentacao.addEventListener(
        "click",
        cancelarMovimentacao
    );
}


if (btnAtualizarEstoque) {

    btnAtualizarEstoque.addEventListener(
        "click",
        async function () {

            await carregarProdutosSelect();

            await carregarEstoque();

            await carregarMovimentacoes();
        }
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

async function iniciarEstoque() {

    mostrarData();


    const autorizado =
        await protegerPaginaEstoque();


    if (!autorizado) {
        return;
    }


    await carregarProdutosSelect();

    await carregarEstoque();

    await carregarMovimentacoes();
}


iniciarEstoque();