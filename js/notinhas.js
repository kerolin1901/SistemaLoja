
/* =========================================================
   SISTEMA DA LOJA
   NOTINHAS / FIADO
   CONSULTA + REGISTRO DE RECEBIMENTO PARCIAL

   Recebimentos são registrados exclusivamente pela RPC
   registrar_recebimento_notinha, com chave de idempotência.
   A distribuição é automática da parcela mais antiga para a mais nova.
========================================================= */

const notinhasSupabase = supabaseClient;

const elemento = (id) => document.getElementById(id);

let perfilAtual = null;
let notinhas = [];
let clientesPorId = new Map();
let parcelasPorNotinha = new Map();
let recebimentosPorId = new Map();
let notinhaAtual = null;
let chaveRecebimentoPendente = null;
let assinaturaRecebimentoPendente = null;

/* =========================================================
   FORMATAÇÃO E UTILITÁRIOS
========================================================= */

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, (caractere) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}

function converterDataLocal(valor) {
    if (!valor) {
        return null;
    }

    const texto = String(valor).slice(0, 10);
    const partes = texto.split("-");

    if (partes.length !== 3) {
        return null;
    }

    const data = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
    );

    return Number.isNaN(data.getTime()) ? null : data;
}

function formatarDataBR(valor) {
    if (!valor) {
        return "—";
    }

    const data = converterDataLocal(valor);

    return data
        ? data.toLocaleDateString("pt-BR")
        : "—";
}

function obterHojeLocal() {
    const agora = new Date();

    agora.setHours(0, 0, 0, 0);

    return agora;
}

function obterDataISOHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function converterValorDigitado(valor) {
    let texto = String(valor ?? "").trim();
    texto = texto.replace(/R\$/gi, "").replace(/\s/g, "");

    if (!texto) {
        return NaN;
    }

    // Aceita 5,00 e 5.00; em formato brasileiro, ponto é milhar.
    if (texto.includes(",")) {
        texto = texto.replace(/\./g, "").replace(",", ".");
    }

    const numero = Number(texto);
    return Number.isFinite(numero) ? Math.round(numero * 100) / 100 : NaN;
}

function criarChaveIdempotencia() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (caractere) => {
        const aleatorio = Math.random() * 16 | 0;
        const valor = caractere === "x" ? aleatorio : (aleatorio & 0x3 | 0x8);
        return valor.toString(16);
    });
}

function distribuirRecebimentoNaNotinha(notinha, valor) {
    let restanteCentavos = Math.round(valor * 100);
    const alocacoes = [];

    const parcelasOrdenadas = obterParcelas(notinha.id)
        .slice()
        .sort((a, b) => {
            const dataA = String(a.vencimento || "9999-12-31");
            const dataB = String(b.vencimento || "9999-12-31");
            if (dataA !== dataB) return dataA.localeCompare(dataB);
            return Number(a.numero_parcela || 0) - Number(b.numero_parcela || 0);
        });

    for (const parcela of parcelasOrdenadas) {
        if (restanteCentavos <= 0) break;

        const saldoCentavos = Math.max(0, Math.round(obterSaldoParcela(parcela) * 100));
        if (saldoCentavos <= 0) continue;

        const aplicadoCentavos = Math.min(restanteCentavos, saldoCentavos);
        alocacoes.push({
            parcela_id: Number(parcela.id),
            valor_aplicado: Number((aplicadoCentavos / 100).toFixed(2))
        });
        restanteCentavos -= aplicadoCentavos;
    }

    if (restanteCentavos !== 0) {
        throw new Error("Não foi possível distribuir todo o valor nas parcelas em aberto. Atualize a notinha e tente novamente.");
    }

    return alocacoes;
}

function mostrarFeedbackRecebimento(texto, tipo = "erro") {
    const feedback = elemento("feedbackRecebimento");
    if (!feedback) return;

    feedback.textContent = texto;
    feedback.classList.remove("hidden", "payment-feedback-error", "payment-feedback-success");
    feedback.classList.add(tipo === "sucesso" ? "payment-feedback-success" : "payment-feedback-error");
}

function mostrarAviso(texto) {
    elemento("avisoModulo").textContent = texto;
}

function mostrarErro(texto) {
    const caixa = elemento("mensagemErro");

    caixa.textContent = texto;
    caixa.classList.remove("hidden");
}

function limparErro() {
    const caixa = elemento("mensagemErro");

    caixa.textContent = "";
    caixa.classList.add("hidden");
}

function limparTabela(mensagem) {
    elemento("listaNotinhas").innerHTML = `
        <tr>
            <td colspan="8" class="empty-cell">
                ${escaparHTML(mensagem)}
            </td>
        </tr>
    `;

    elemento("contadorResultados").textContent = "0 resultados";
    elemento("estadoTabela").textContent = "";
}

function statusTexto(status) {
    const textos = {
        aberta: "Em aberto",
        paga: "Paga",
        cancelada: "Cancelada"
    };

    return textos[status] || "Indefinida";
}

function statusClasse(status) {
    const classes = {
        aberta: "status-open",
        paga: "status-paid",
        cancelada: "status-cancelled"
    };

    return classes[status] || "";
}

/* =========================================================
   AUTENTICAÇÃO E PERFIL
========================================================= */

async function protegerPaginaNotinhas() {
    try {
        const {
            data: { session },
            error: erroSessao
        } = await notinhasSupabase.auth.getSession();

        if (erroSessao || !session) {
            window.location.href = "index.html";
            return false;
        }

        const {
            data: perfil,
            error: erroPerfil
        } = await notinhasSupabase
            .from("perfis")
            .select("id, nome_completo, usuario, tipo, ativo, loja_id")
            .eq("id", session.user.id)
            .maybeSingle();

        if (
            erroPerfil ||
            !perfil ||
            !["admin", "vendedor"].includes(perfil.tipo) ||
            perfil.ativo !== true ||
            !perfil.loja_id
        ) {
            await notinhasSupabase.auth.signOut({
                scope: "local"
            });

            window.location.href = "index.html";
            return false;
        }

        perfilAtual = perfil;

        const nome =
            perfil.nome_completo ||
            perfil.usuario ||
            "Usuário";

        elemento("nomeUsuario").textContent = nome;
        elemento("avatarUsuario").textContent =
            nome.trim().charAt(0).toUpperCase() || "U";

        elemento("tipoUsuario").textContent =
            perfil.tipo === "admin"
                ? "Administrador"
                : "Vendedor";

        elemento("perfilLoja").textContent =
            perfil.tipo === "admin"
                ? "Administração"
                : "Área do vendedor";

        document.querySelectorAll("[data-role]").forEach((link) => {
            link.classList.toggle(
                "hidden",
                link.dataset.role !== perfil.tipo
            );
        });

        elemento("btnNovaVenda").href =
            perfil.tipo === "admin"
                ? "vendas.html"
                : "vendedor-vendas.html";

        return true;

    } catch (erro) {
        console.error("Erro ao verificar acesso às notinhas:", erro);

        mostrarErro(
            "Não foi possível verificar seu acesso. Entre novamente no sistema."
        );

        return false;
    }
}

/* =========================================================
   PARCELAS E SALDOS

   O saldo é calculado a partir das parcelas e das alocações
   de recebimentos. Não alteramos valores diretamente aqui.
========================================================= */

function obterParcelas(notinhaId) {
    return parcelasPorNotinha.get(String(notinhaId)) || [];
}

function obterValorPagoParcela(parcela) {
    const alocacoes = parcela.alocacoes || [];

    return alocacoes.reduce(
        (total, alocacao) =>
            total + Number(alocacao.valor_aplicado || 0),
        0
    );
}

function obterSaldoParcela(parcela) {
    const original = Number(parcela.valor_original || 0);
    const pago = obterValorPagoParcela(parcela);

    return Math.max(0, original - pago);
}

function calcularSaldoNotinha(notinha) {
    if (notinha.status === "cancelada" || notinha.status === "paga") {
        return 0;
    }

    const parcelas = obterParcelas(notinha.id);

    if (!parcelas.length) {
        return Number(notinha.total || 0);
    }

    return parcelas.reduce(
        (total, parcela) => total + obterSaldoParcela(parcela),
        0
    );
}

function obterProximoVencimento(notinha) {
    if (notinha.status !== "aberta") {
        return null;
    }

    return obterParcelas(notinha.id)
        .filter((parcela) => obterSaldoParcela(parcela) > 0)
        .map((parcela) => parcela.vencimento)
        .filter(Boolean)
        .sort()[0] || null;
}

function parcelaEstaVencida(parcela) {
    if (obterSaldoParcela(parcela) <= 0) {
        return false;
    }

    const vencimento = converterDataLocal(parcela.vencimento);

    if (!vencimento) {
        return false;
    }

    return vencimento < obterHojeLocal();
}

function notinhaEstaVencida(notinha) {
    if (notinha.status !== "aberta") {
        return false;
    }

    return obterParcelas(notinha.id).some(parcelaEstaVencida);
}

/* =========================================================
   INDICADORES
========================================================= */

function renderizarIndicadores() {
    let totalAberto = 0;
    let totalVencido = 0;
    let totalAVencer = 0;
    let totalVenceHoje = 0;
    let quantidadeAbertas = 0;
    let quantidadePagas = 0;
    let parcelasVencidas = 0;
    let parcelasAVencer = 0;
    let parcelasVencemHoje = 0;
    const hojeISO = obterDataISOHoje();

    notinhas.forEach((notinha) => {
        const saldo = calcularSaldoNotinha(notinha);

        if (notinha.status === "aberta" && saldo > 0) {
            totalAberto += saldo;
            quantidadeAbertas++;

            obterParcelas(notinha.id).forEach((parcela) => {
                const saldoParcelaCentavos = Math.max(
                    0,
                    Math.round(obterSaldoParcela(parcela) * 100)
                );
                if (saldoParcelaCentavos <= 0) return;

                const vencimento = String(parcela.vencimento || "").slice(0, 10);
                if (!vencimento) return;

                const saldoParcela = saldoParcelaCentavos / 100;
                if (vencimento < hojeISO) {
                    totalVencido += saldoParcela;
                    parcelasVencidas++;
                } else if (vencimento === hojeISO) {
                    totalVenceHoje += saldoParcela;
                    parcelasVencemHoje++;
                } else {
                    totalAVencer += saldoParcela;
                    parcelasAVencer++;
                }
            });
        }

        if (notinha.status === "paga") {
            quantidadePagas++;
        }
    });

    elemento("totalAReceber").textContent = formatarMoeda(totalAberto);
    elemento("totalVencido").textContent = formatarMoeda(totalVencido);
    elemento("quantidadeVencidas").textContent =
        parcelasVencidas + (parcelasVencidas === 1 ? " parcela atrasada" : " parcelas atrasadas");
    elemento("totalAVencer").textContent = formatarMoeda(totalAVencer);
    elemento("quantidadeAVencer").textContent =
        parcelasAVencer + (parcelasAVencer === 1 ? " parcela com vencimento futuro" : " parcelas com vencimento futuro");
    elemento("totalVenceHoje").textContent = formatarMoeda(totalVenceHoje);
    elemento("quantidadeVenceHoje").textContent =
        parcelasVencemHoje + (parcelasVencemHoje === 1 ? " parcela vence hoje" : " parcelas vencem hoje");
    elemento("quantidadeAbertas").textContent = String(quantidadeAbertas);
    elemento("quantidadePagas").textContent = String(quantidadePagas);

    renderizarListasVencimento(hojeISO);
}

function renderizarListasVencimento(hojeISO) {
    const parcelasVencidas = [];
    const parcelasDeHoje = [];
    const hoje = converterDataLocal(hojeISO);

    notinhas.forEach((notinha) => {
        if (notinha.status !== "aberta") return;

        const cliente = clientesPorId.get(String(notinha.cliente_id));
        const nomeCliente = cliente?.nome || "Cliente não identificado";
        const numeroNotinha = String(notinha.numero ?? "").padStart(6, "0");

        obterParcelas(notinha.id).forEach((parcela) => {
            const saldoCentavos = Math.max(0, Math.round(obterSaldoParcela(parcela) * 100));
            if (saldoCentavos <= 0) return;

            const vencimento = String(parcela.vencimento || "").slice(0, 10);
            if (!vencimento) return;

            const item = {
                notinhaId: notinha.id,
                numeroNotinha,
                cliente: nomeCliente,
                numeroParcela: parcela.numero_parcela,
                vencimento,
                saldo: saldoCentavos / 100
            };

            if (vencimento < hojeISO) {
                const dataVencimento = converterDataLocal(vencimento);
                const diasAtraso = dataVencimento && hoje
                    ? Math.max(1, Math.round((hoje.getTime() - dataVencimento.getTime()) / 86400000))
                    : 0;
                parcelasVencidas.push({ ...item, diasAtraso });
            } else if (vencimento === hojeISO) {
                parcelasDeHoje.push(item);
            }
        });
    });

    parcelasVencidas.sort((a, b) => a.vencimento.localeCompare(b.vencimento) || a.cliente.localeCompare(b.cliente, "pt-BR"));
    parcelasDeHoje.sort((a, b) => a.cliente.localeCompare(b.cliente, "pt-BR") || Number(a.numeroParcela || 0) - Number(b.numeroParcela || 0));

    const renderizarLista = (itens, vencida, mensagemVazia) => {
        if (!itens.length) {
            return `<p class="due-empty">${mensagemVazia}</p>`;
        }

        return itens.map((item) => {
            const detalheParcela = item.numeroParcela
                ? `Parcela ${escaparHTML(item.numeroParcela)}`
                : "Parcela";
            const textoPrazo = vencida
                ? `${item.diasAtraso} ${item.diasAtraso === 1 ? "dia de atraso" : "dias de atraso"}`
                : "Vence hoje";
            return `
                <article class="due-list-item ${vencida ? "is-overdue" : "is-due-today"}">
                    <div class="due-item-info">
                        <strong>${escaparHTML(item.cliente)}</strong>
                        <small>Notinha #${escaparHTML(item.numeroNotinha)} · ${detalheParcela}</small>
                        <small>Vencimento: ${formatarDataBR(item.vencimento)}</small>
                    </div>
                    <div class="due-item-actions">
                        <strong>${formatarMoeda(item.saldo)}</strong>
                        <small>${textoPrazo}</small>
                        <button type="button" class="due-detail-button" data-detalhe="${escaparHTML(item.notinhaId)}">Ver notinha</button>
                    </div>
                </article>
            `;
        }).join("");
    };

    elemento("listaParcelasVencidas").innerHTML = renderizarLista(
        parcelasVencidas,
        true,
        "Nenhuma parcela vencida. Todas as parcelas em aberto estão dentro do prazo."
    );
    elemento("listaVencimentosHoje").innerHTML = renderizarLista(
        parcelasDeHoje,
        false,
        "Nenhuma parcela com saldo vence hoje."
    );
}

/* =========================================================
   PESQUISA E FILTROS
========================================================= */

function dataDentroDoFiltro(valor, inicio, fim) {
    const data = String(valor || "").slice(0, 10);

    return (!inicio || data >= inicio) &&
        (!fim || data <= fim);
}

function filtrarNotinhas() {
    const busca = elemento("buscaNotinha")
        .value
        .trim()
        .toLocaleLowerCase("pt-BR");

    const status = elemento("filtroStatus").value;
    const inicio = elemento("dataInicio").value;
    const fim = elemento("dataFim").value;

    const resultado = notinhas.filter((notinha) => {
        const cliente = clientesPorId.get(
            String(notinha.cliente_id)
        );

        const textoPesquisa = [
            notinha.numero,
            notinha.venda_id,
            cliente?.nome,
            cliente?.telefone
        ]
            .join(" ")
            .toLocaleLowerCase("pt-BR");

        return (
            (!busca || textoPesquisa.includes(busca)) &&
            (status === "todas" || notinha.status === status) &&
            dataDentroDoFiltro(notinha.emitida_em, inicio, fim)
        );
    });

    renderizarTabelaNotinhas(resultado);
}

function renderizarTabelaNotinhas(lista) {
    const corpo = elemento("listaNotinhas");

    corpo.innerHTML = "";

    elemento("contadorResultados").textContent =
        lista.length +
        (lista.length === 1 ? " resultado" : " resultados");

    if (!lista.length) {
        limparTabela(
            "Nenhuma notinha encontrada para os filtros selecionados."
        );
        return;
    }

    lista.forEach((notinha) => {
        const cliente = clientesPorId.get(
            String(notinha.cliente_id)
        );

        const saldo = calcularSaldoNotinha(notinha);
        const proximoVencimento = obterProximoVencimento(notinha);
        const atrasada = notinhaEstaVencida(notinha);

        const situacao = atrasada
            ? "Atrasada"
            : statusTexto(notinha.status);

        const classeSituacao = atrasada
            ? "status-overdue"
            : statusClasse(notinha.status);

        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>
                <div class="cell-main">
                    #${escaparHTML(String(notinha.numero).padStart(6, "0"))}
                </div>
                <div class="cell-sub">
                    Venda #${escaparHTML(notinha.venda_id)}
                </div>
            </td>

            <td>
                <div class="cell-main">
                    ${escaparHTML(cliente?.nome || "Cliente não identificado")}
                </div>
                <div class="cell-sub">
                    ${escaparHTML(cliente?.telefone || "Sem telefone")}
                </div>
            </td>

            <td>${formatarDataBR(notinha.emitida_em)}</td>
            <td>${formatarDataBR(proximoVencimento)}</td>
            <td>${formatarMoeda(notinha.total)}</td>
            <td><strong>${formatarMoeda(saldo)}</strong></td>

            <td>
                <span class="status-pill ${classeSituacao}">
                    ${escaparHTML(situacao)}
                </span>
            </td>

            <td>
                <button
                    type="button"
                    class="table-action"
                    data-detalhe="${escaparHTML(notinha.id)}"
                >
                    Detalhes
                </button>
            </td>
        `;

        corpo.appendChild(linha);
    });
}

/* =========================================================
   CARREGAR DADOS DO SUPABASE

   Requer as tabelas do módulo e suas políticas RLS já instaladas.
========================================================= */

async function carregarDadosNotinhas() {
    limparErro();

    mostrarAviso("Consultando notinhas da loja...");

    try {
        const {
            data: listaNotinhas,
            error: erroNotinhas
        } = await notinhasSupabase
            .from("notinhas")
            .select(`
                id,
                loja_id,
                numero,
                cliente_id,
                venda_id,
                emitida_em,
                subtotal,
                desconto,
                total,
                status,
                observacoes,
                cancelada_em,
                cancelada_por,
                motivo_cancelamento,
                atualizado_em
            `)
            .eq("loja_id", perfilAtual.loja_id)
            .order("emitida_em", { ascending: false });

        if (erroNotinhas) {
            console.error("Consulta de notinhas:", erroNotinhas);

            notinhas = [];
            clientesPorId = new Map();
            parcelasPorNotinha = new Map();

            renderizarIndicadores();

            limparTabela(
                "A estrutura do banco para Notinhas ainda não foi instalada."
            );

            mostrarAviso(
                "Não foi possível consultar as notinhas. Confira a conexão e as permissões do Supabase."
            );

            return false;
        }

        notinhas = listaNotinhas || [];
        clientesPorId = new Map();
        parcelasPorNotinha = new Map();
        recebimentosPorId = new Map();

        if (notinhas.length === 0) {
            renderizarIndicadores();
            filtrarNotinhas();

            mostrarAviso(
                "Nenhuma notinha cadastrada nesta loja."
            );

            elemento("estadoTabela").textContent =
                "Consulta realizada com sucesso.";

            return true;
        }

        const clienteIds = [
            ...new Set(
                notinhas
                    .map((notinha) => notinha.cliente_id)
                    .filter(Boolean)
            )
        ];

        if (clienteIds.length > 0) {
            const {
                data: clientes,
                error: erroClientes
            } = await notinhasSupabase
                .from("clientes")
                .select("id, nome, telefone")
                .in("id", clienteIds);

            if (erroClientes) {
                throw erroClientes;
            }

            (clientes || []).forEach((cliente) => {
                clientesPorId.set(String(cliente.id), cliente);
            });
        }

        notinhas.forEach((notinha) => {
            notinha.parcelas = [];
            parcelasPorNotinha.set(String(notinha.id), []);
        });

        const idsNotinhas = notinhas.map((notinha) => notinha.id);

        const {
            data: parcelas,
            error: erroParcelas
        } = await notinhasSupabase
            .from("parcelas_notinha")
            .select(`
                id,
                loja_id,
                notinha_id,
                numero_parcela,
                vencimento,
                valor_original
            `)
            .eq("loja_id", perfilAtual.loja_id)
            .in("notinha_id", idsNotinhas);

        if (erroParcelas) {
            throw erroParcelas;
        }

        const parcelasCarregadas = parcelas || [];
        const parcelasPorId = new Map();

        parcelasCarregadas.forEach((parcela) => {
            parcela.alocacoes = [];

            parcelasPorId.set(String(parcela.id), parcela);

            const lista = parcelasPorNotinha.get(
                String(parcela.notinha_id)
            ) || [];

            lista.push(parcela);

            parcelasPorNotinha.set(
                String(parcela.notinha_id),
                lista
            );

            const notinha = notinhas.find(
                (item) => String(item.id) === String(parcela.notinha_id)
            );

            if (notinha) {
                notinha.parcelas.push(parcela);
            }
        });

        if (parcelasCarregadas.length > 0) {
            const idsParcelas = parcelasCarregadas.map(
                (parcela) => parcela.id
            );

            const {
                data: alocacoes,
                error: erroAlocacoes
            } = await notinhasSupabase
                .from("alocacoes_recebimento_notinha")
                .select(`
                    id,
                    loja_id,
                    recebimento_id,
                    parcela_id,
                    valor_aplicado
                `)
                .eq("loja_id", perfilAtual.loja_id)
                .in("parcela_id", idsParcelas);

            if (erroAlocacoes) {
                throw erroAlocacoes;
            }

            const listaAlocacoes = alocacoes || [];

            listaAlocacoes.forEach((alocacao) => {
                const parcela = parcelasPorId.get(
                    String(alocacao.parcela_id)
                );

                if (parcela) {
                    parcela.alocacoes.push(alocacao);
                }
            });

            const idsRecebimentos = [
                ...new Set(
                    listaAlocacoes
                        .map((alocacao) => alocacao.recebimento_id)
                        .filter(Boolean)
                )
            ];

            if (idsRecebimentos.length > 0) {
                const {
                    data: recebimentos,
                    error: erroRecebimentos
                } = await notinhasSupabase
                    .from("recebimentos_notinha")
                    .select(`
                        id,
                        loja_id,
                        valor_total,
                        data_recebimento,
                        recebido_por,
                        observacoes
                    `)
                    .eq("loja_id", perfilAtual.loja_id)
                    .in("id", idsRecebimentos);

                if (erroRecebimentos) {
                    throw erroRecebimentos;
                }

                (recebimentos || []).forEach((recebimento) => {
                    recebimentosPorId.set(
                        String(recebimento.id),
                        recebimento
                    );
                });
            }
        }

        renderizarIndicadores();
        filtrarNotinhas();

        mostrarAviso(
            "Notinhas consultadas conforme as permissões da sua loja."
        );

        elemento("estadoTabela").textContent =
            "Atualizado às " +
            new Date().toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit"
            });

        return true;

    } catch (erro) {
        console.error("Erro ao carregar dados das notinhas:", erro);

        mostrarErro(
            "Não foi possível carregar todos os dados. Verifique a migração e as permissões do Supabase."
        );

        mostrarAviso(
            "Consulta interrompida para evitar exibição de saldos incompletos."
        );

        return false;
    }
}

/* =========================================================
   AUDITORIA ADMINISTRATIVA DA NOTINHA
========================================================= */

function formatarDataHoraAuditoria(valor) {
    if (!valor) return "—";
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return "—";
    return data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function obterDetalhesAuditoria(registro) {
    if (!registro?.detalhes) return {};
    if (typeof registro.detalhes === "object") return registro.detalhes;
    try {
        return JSON.parse(registro.detalhes);
    } catch {
        return {};
    }
}

function rotuloEventoAuditoria(evento) {
    const rotulos = {
        notinha_criada: "Notinha criada",
        notinha_corrigida: "Notinha corrigida",
        notinha_cancelada: "Notinha cancelada",
        recebimento_registrado: "Recebimento registrado",
        limite_fiado_excedido_autorizado_por_admin: "Limite de fiado autorizado"
    };
    return rotulos[evento] || String(evento || "Evento administrativo").replaceAll("_", " ");
}

function montarResumoAuditoria(registro) {
    const detalhes = obterDetalhesAuditoria(registro);
    const linhas = [];

    if (detalhes.motivo) {
        linhas.push(`
            <p class="audit-detail-line">
                <strong>Justificativa:</strong> ${escaparHTML(detalhes.motivo)}
            </p>
        `);
    }

    if (registro.evento === "notinha_corrigida") {
        const antes = Array.isArray(detalhes.parcelas_antes) ? detalhes.parcelas_antes : [];
        const depois = Array.isArray(detalhes.parcelas_depois) ? detalhes.parcelas_depois : [];
        const antesPorChave = new Map(antes.map((p) => [String(p.id ?? p.numero_parcela), p]));
        const mudancas = [];

        depois.forEach((nova) => {
            const antiga = antesPorChave.get(String(nova.id ?? nova.numero_parcela));
            if (!antiga) return;
            const numero = escaparHTML(nova.numero_parcela ?? antiga.numero_parcela ?? "—");
            const vencimentoAntes = String(antiga.vencimento || "").slice(0, 10);
            const vencimentoDepois = String(nova.vencimento || "").slice(0, 10);
            if (vencimentoAntes !== vencimentoDepois) {
                mudancas.push(`
                    <li>
                        <strong>Parcela ${numero} — vencimento:</strong>
                        <span class="audit-old-value">${formatarDataBR(vencimentoAntes)}</span>
                        <span class="audit-arrow">→</span>
                        <span class="audit-new-value">${formatarDataBR(vencimentoDepois)}</span>
                    </li>
                `);
            }
            const valorAntes = Math.round(Number(antiga.valor_original || 0) * 100);
            const valorDepois = Math.round(Number(nova.valor_original || 0) * 100);
            if (valorAntes !== valorDepois) {
                mudancas.push(`
                    <li>
                        <strong>Parcela ${numero} — valor:</strong>
                        <span class="audit-old-value">${formatarMoeda(antiga.valor_original)}</span>
                        <span class="audit-arrow">→</span>
                        <span class="audit-new-value">${formatarMoeda(nova.valor_original)}</span>
                    </li>
                `);
            }
        });

        const observacoesAntes = detalhes.observacoes_antes ?? "";
        const observacoesDepois = detalhes.observacoes_depois ?? "";
        if (String(observacoesAntes) !== String(observacoesDepois)) {
            mudancas.push(`
                <li>
                    <strong>Observações:</strong>
                    <span class="audit-old-value">${escaparHTML(observacoesAntes || "(vazio)")}</span>
                    <span class="audit-arrow">→</span>
                    <span class="audit-new-value">${escaparHTML(observacoesDepois || "(vazio)")}</span>
                </li>
            `);
        }

        if (mudancas.length) {
            linhas.push(`
                <div class="audit-change-block">
                    <strong>Alterações realizadas</strong>
                    <ul class="audit-change-list">${mudancas.join("")}</ul>
                </div>
            `);
        } else {
            linhas.push(`<p class="audit-detail-line">A correção foi registrada, mas não foram encontradas diferenças nos vencimentos, valores ou observações salvos.</p>`);
        }

        if (detalhes.recebimentos_historicos_preservados === true) {
            linhas.push(`<p class="audit-preserved-note">Os recebimentos anteriores foram preservados.</p>`);
        }
    } else if (registro.evento === "notinha_criada") {
        if (detalhes.total !== undefined) {
            linhas.push(`<p class="audit-detail-line"><strong>Total inicial:</strong> ${formatarMoeda(detalhes.total)}</p>`);
        }
        if (detalhes.parcelas !== undefined) {
            linhas.push(`<p class="audit-detail-line"><strong>Quantidade de parcelas:</strong> ${escaparHTML(detalhes.parcelas)}</p>`);
        }
        if (detalhes.primeiro_vencimento) {
            linhas.push(`<p class="audit-detail-line"><strong>Primeiro vencimento:</strong> ${formatarDataBR(detalhes.primeiro_vencimento)}</p>`);
        }
    } else if (registro.evento === "notinha_cancelada") {
        linhas.push(`<p class="audit-detail-line"><strong>Produtos devolvidos fisicamente:</strong> ${detalhes.produtos_devolvidos_fisicamente ? "Sim" : "Não"}</p>`);
        if (detalhes.venda_marcada_cancelada === true) {
            linhas.push(`<p class="audit-preserved-note">A venda vinculada foi marcada como cancelada; o registro de auditoria foi preservado.</p>`);
        }
    } else if (Object.keys(detalhes).length) {
        const chavesIgnoradas = new Set(["motivo"]);
        const pares = Object.entries(detalhes).filter(([chave]) => !chavesIgnoradas.has(chave));
        pares.forEach(([chave, valor]) => {
            const rotulo = chave.replaceAll("_", " ");
            const texto = typeof valor === "object" ? JSON.stringify(valor) : String(valor);
            linhas.push(`<p class="audit-detail-line"><strong>${escaparHTML(rotulo)}:</strong> ${escaparHTML(texto)}</p>`);
        });
    }

    return linhas.join("") || `<p class="audit-detail-line">Este evento não possui detalhes adicionais.</p>`;
}

async function carregarAuditoriaNotinha(notinhaId) {
    const painel = elemento("historicoAuditoriaNotinha");
    if (!painel || perfilAtual?.tipo !== "admin") return;

    const idEsperado = String(notinhaId);
    painel.innerHTML = `<p class="audit-state">Carregando histórico de alterações...</p>`;

    try {
        const { data: registros, error } = await notinhasSupabase
            .from("auditoria_fiado")
            .select("id, loja_id, notinha_id, usuario_id, evento, detalhes, criado_em")
            .eq("loja_id", perfilAtual.loja_id)
            .eq("notinha_id", Number(notinhaId))
            .order("criado_em", { ascending: false })
            .limit(50);

        if (error) throw error;
        if (!painel.isConnected || String(notinhaAtual?.id) !== idEsperado) return;

        const lista = registros || [];
        if (!lista.length) {
            painel.innerHTML = `
                <div class="audit-state">
                    Nenhum registro de auditoria foi encontrado para esta notinha.
                    <span>Se a alteração foi feita antes da auditoria estar ativa no banco, ela pode não ter um registro histórico.</span>
                </div>
            `;
            return;
        }

        const idsUsuarios = [...new Set(lista.map((item) => item.usuario_id).filter(Boolean))];
        const nomesUsuarios = new Map();
        if (idsUsuarios.length) {
            const { data: usuarios, error: erroUsuarios } = await notinhasSupabase
                .from("perfis")
                .select("id, nome_completo, usuario")
                .eq("loja_id", perfilAtual.loja_id)
                .in("id", idsUsuarios);
            if (!erroUsuarios) {
                (usuarios || []).forEach((usuario) => {
                    nomesUsuarios.set(String(usuario.id), usuario.nome_completo || usuario.usuario || "Usuário");
                });
            }
        }

        if (!painel.isConnected || String(notinhaAtual?.id) !== idEsperado) return;

        painel.innerHTML = lista.map((registro) => {
            const nomeResponsavel = registro.usuario_id
                ? (nomesUsuarios.get(String(registro.usuario_id)) || `Usuário ${String(registro.usuario_id).slice(0, 8)}`)
                : "Usuário não disponível";
            return `
                <article class="audit-entry">
                    <div class="audit-entry-heading">
                        <div>
                            <strong>${escaparHTML(rotuloEventoAuditoria(registro.evento))}</strong>
                            <p>${escaparHTML(formatarDataHoraAuditoria(registro.criado_em))} · ${escaparHTML(nomeResponsavel)}</p>
                        </div>
                        <span class="audit-entry-tag">Auditoria</span>
                    </div>
                    <div class="audit-entry-body">${montarResumoAuditoria(registro)}</div>
                </article>
            `;
        }).join("");
    } catch (erro) {
        console.error("Não foi possível carregar a auditoria da notinha:", erro);
        if (!painel.isConnected || String(notinhaAtual?.id) !== idEsperado) return;
        painel.innerHTML = `
            <div class="audit-state audit-state-error">
                Não foi possível consultar a auditoria desta notinha.
                <span>${escaparHTML(erro?.message || "Verifique se a permissão de consulta à tabela auditoria_fiado está ativa para o administrador da loja.")}</span>
                <span>Os detalhes da correção continuam registrados no banco se a operação administrativa foi confirmada.</span>
            </div>
        `;
    }
}

/* =========================================================
   DETALHES DA NOTINHA
========================================================= */

function renderizarDetalhesNotinha(notinha) {
    const cliente = clientesPorId.get(String(notinha.cliente_id));
    const parcelas = obterParcelas(notinha.id)
        .slice()
        .sort((a, b) => a.numero_parcela - b.numero_parcela);

    const todasAlocacoes = parcelas.flatMap((parcela) => parcela.alocacoes || []);
    const saldo = calcularSaldoNotinha(notinha);

    elemento("tituloDetalhes").textContent =
        "Notinha #" + String(notinha.numero).padStart(6, "0");

    const linhasParcelas = parcelas.length
        ? parcelas.map((parcela) => {
            const pago = obterValorPagoParcela(parcela);
            // Em notinha cancelada, preservamos o valor histórico da parcela,
            // mas não exibimos o saldo como dívida ainda a receber.
            const restante = notinha.status === "cancelada"
                ? 0
                : obterSaldoParcela(parcela);
            return `
                <tr>
                    <td>${escaparHTML(parcela.numero_parcela)}</td>
                    <td>${formatarDataBR(parcela.vencimento)}</td>
                    <td>${formatarMoeda(parcela.valor_original)}</td>
                    <td>${formatarMoeda(pago)}</td>
                    <td>${formatarMoeda(restante)}</td>
                </tr>
            `;
        }).join("")
        : `
            <tr>
                <td colspan="5" class="empty-cell">
                    As parcelas desta notinha ainda não estão cadastradas.
                </td>
            </tr>
        `;

    // Agrupa todas as alocações de uma mesma operação para não duplicar
    // um recebimento quando ele alcançar mais de uma parcela da notinha.
    const recebimentosAgrupados = new Map();
    todasAlocacoes.forEach((alocacao) => {
        const chave = String(alocacao.recebimento_id);
        const atual = recebimentosAgrupados.get(chave) || {
            recebimento_id: alocacao.recebimento_id,
            valor_aplicado: 0
        };
        atual.valor_aplicado += Number(alocacao.valor_aplicado || 0);
        recebimentosAgrupados.set(chave, atual);
    });

    const linhasRecebimentos = recebimentosAgrupados.size
        ? [...recebimentosAgrupados.values()]
            .sort((a, b) => Number(a.recebimento_id) - Number(b.recebimento_id))
            .map((item) => {
                const recebimento = recebimentosPorId.get(String(item.recebimento_id));
                return `
                    <tr>
                        <td>${formatarDataBR(recebimento?.data_recebimento)}</td>
                        <td>#${escaparHTML(item.recebimento_id)}</td>
                        <td>${formatarMoeda(item.valor_aplicado)}</td>
                        <td>${escaparHTML(recebimento?.observacoes || "—")}</td>
                    </tr>
                `;
            }).join("")
        : `
            <tr>
                <td colspan="4" class="empty-cell">Nenhum recebimento registrado.</td>
            </tr>
        `;

    const podeAdministrar = perfilAtual?.tipo === "admin" && notinha.status === "aberta";
    const temRecebimentos = todasAlocacoes.length > 0;
    // Uma parcela única com recebimento não pode ter o valor alterado, pois
    // a soma das parcelas precisa permanecer igual ao total original da notinha.
    const bloquearValorParcelaUnica = temRecebimentos && parcelas.length === 1;
    const linhasEdicaoParcelas = parcelas.map((parcela) => `
        <tr>
            <td>${escaparHTML(parcela.numero_parcela)}</td>
            <td>
                <input
                    type="date"
                    data-parcela-vencimento="${escaparHTML(parcela.id)}"
                    value="${escaparHTML(String(parcela.vencimento || "").slice(0, 10))}"
                    required
                    aria-label="Vencimento da parcela ${escaparHTML(parcela.numero_parcela)}"
                >
            </td>
            <td>
                <input
                    type="text"
                    inputmode="decimal"
                    data-parcela-valor="${escaparHTML(parcela.id)}"
                    data-numero-parcela="${escaparHTML(parcela.numero_parcela)}"
                    value="${escaparHTML(Number(parcela.valor_original || 0).toLocaleString("pt-BR", {minimumFractionDigits: 2, maximumFractionDigits: 2}))}"
                    ${bloquearValorParcelaUnica ? 'disabled aria-disabled="true" title="Valor bloqueado: esta notinha tem uma única parcela com recebimento; o total original precisa ser mantido."' : ""}
                    required
                    aria-label="Valor da parcela ${escaparHTML(parcela.numero_parcela)}"
                >
            </td>
        </tr>
    `).join("");

    const formularioAdministrativo = podeAdministrar ? `
        <section class="admin-management-panel" aria-labelledby="tituloAcoesAdmin">
            <div class="admin-management-heading">
                <div>
                    <h3 id="tituloAcoesAdmin">Ações do administrador</h3>
                    <p>Correções exigem justificativa e ficam registradas na auditoria.</p>
                </div>
                <span class="admin-only-tag">Somente admin</span>
            </div>

            <div class="admin-management-buttons">
                <button type="button" class="btn-secondary" data-toggle-admin-form="formCorrigirNotinha">
                    Corrigir notinha
                </button>
                ${temRecebimentos ? "" : `
                    <button type="button" class="admin-danger-button" data-toggle-admin-form="formCancelarNotinha">
                        Cancelar notinha
                    </button>
                `}
            </div>

            <form id="formCorrigirNotinha" class="admin-edit-form hidden" novalidate>
                <h4>Corrigir parcelas e observações</h4>
                <p class="admin-form-hint">
                    O total original da venda e o número de parcelas serão mantidos.
                    ${bloquearValorParcelaUnica
                        ? "Esta notinha tem uma única parcela e já possui recebimento. O valor fica bloqueado para preservar o total original; você ainda pode corrigir o vencimento e as observações."
                        : temRecebimentos
                            ? "Esta notinha já tem recebimentos. Você pode redistribuir os valores entre as parcelas, desde que nenhuma parcela fique abaixo do valor já recebido nela e a soma continue igual ao total original. A justificativa e os valores antes/depois ficam registrados na auditoria; os recebimentos existentes não são modificados."
                            : "Se alterar valores, a soma precisa continuar exatamente igual ao total original."}
                </p>

                <label class="admin-field" for="motivoCorrecaoNotinha">
                    <span>Justificativa da correção (obrigatória)</span>
                    <textarea id="motivoCorrecaoNotinha" maxlength="500" rows="2" required placeholder="Explique por que a correção é necessária"></textarea>
                </label>

                <label class="admin-field" for="observacoesCorrecaoNotinha">
                    <span>Observações da notinha</span>
                    <textarea id="observacoesCorrecaoNotinha" maxlength="1000" rows="2" placeholder="Observações administrativas da notinha">${escaparHTML(notinha.observacoes || "")}</textarea>
                </label>

                <div class="table-wrap admin-edit-table-wrap">
                    <table class="detail-table admin-edit-table">
                        <thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor (R$)</th></tr></thead>
                        <tbody>${linhasEdicaoParcelas}</tbody>
                    </table>
                </div>

                <div id="feedbackCorrecaoNotinha" class="admin-feedback hidden" role="status" aria-live="polite"></div>
                <div class="admin-form-actions">
                    <button type="button" class="btn-secondary" data-toggle-admin-form="formCorrigirNotinha">Voltar</button>
                    <button type="submit" class="btn-primary" id="btnSalvarCorrecaoNotinha">Salvar correção</button>
                </div>
            </form>

            ${temRecebimentos ? `
                <p class="admin-form-hint admin-warning">
                    O cancelamento está bloqueado porque esta notinha possui recebimentos vinculados.
                    O histórico financeiro deve ser estornado corretamente antes de cancelar uma dívida já parcialmente paga.
                </p>
            ` : `
                <form id="formCancelarNotinha" class="admin-edit-form hidden" novalidate>
                    <h4>Cancelar notinha e venda a prazo</h4>
                    <p class="admin-form-hint admin-warning">
                        O cancelamento marca a venda vinculada como cancelada. Ele não apaga a notinha nem a auditoria.
                        Só marque a devolução física se os produtos realmente voltaram para a loja.
                    </p>
                    <label class="admin-field" for="motivoCancelamentoNotinha">
                        <span>Justificativa do cancelamento (obrigatória)</span>
                        <textarea id="motivoCancelamentoNotinha" maxlength="500" rows="3" required placeholder="Informe o motivo do cancelamento"></textarea>
                    </label>
                    <label class="admin-stock-return-option" for="confirmarDevolucaoFisicaNotinha">
                        <input type="checkbox" id="confirmarDevolucaoFisicaNotinha">
                        <span>Os produtos foram devolvidos fisicamente e devem voltar ao estoque.</span>
                    </label>
                    <p class="admin-form-hint">Se a caixa ficar desmarcada, o estoque não será alterado.</p>
                    <div id="feedbackCancelamentoNotinha" class="admin-feedback hidden" role="status" aria-live="polite"></div>
                    <div class="admin-form-actions">
                        <button type="button" class="btn-secondary" data-toggle-admin-form="formCancelarNotinha">Voltar</button>
                        <button type="submit" class="admin-danger-button" id="btnConfirmarCancelamentoNotinha">Confirmar cancelamento</button>
                    </div>
                </form>
            `}
        </section>
    ` : "";

    const podeReceber = notinha.status === "aberta" && saldo > 0;
    const formularioRecebimento = podeReceber ? `
        <section class="payment-form-panel" aria-labelledby="tituloRecebimento">
            <div class="payment-form-heading">
                <div>
                    <h3 id="tituloRecebimento">Registrar recebimento</h3>
                    <p>Informe o valor efetivamente recebido. O sistema aplicará primeiro na parcela mais antiga desta notinha.</p>
                </div>
                <div class="payment-balance">
                    <span>Saldo disponível</span>
                    <strong>${formatarMoeda(saldo)}</strong>
                </div>
            </div>

            <form id="formRecebimentoNotinha" novalidate>
                <div class="payment-form-grid">
                    <label class="form-field" for="valorRecebimento">
                        <span class="form-field-label">Valor recebido (R$)</span>
                        <input
                            id="valorRecebimento"
                            name="valorRecebimento"
                            type="text"
                            inputmode="decimal"
                            autocomplete="off"
                            placeholder="Ex.: 5,00"
                            maxlength="14"
                            required
                        >
                    </label>

                    <label class="form-field" for="formaRecebimento">
                        <span class="form-field-label">Forma de pagamento</span>
                        <select id="formaRecebimento" name="formaRecebimento" required>
                            <option value="dinheiro">Dinheiro</option>
                            <option value="pix">PIX</option>
                            <option value="cartao_debito">Cartão de débito</option>
                            <option value="cartao_credito">Cartão de crédito</option>
                            <option value="boleto">Boleto</option>
                            <option value="outro">Outro</option>
                        </select>
                    </label>

                    <label class="form-field" for="dataRecebimento">
                        <span class="form-field-label">Data do recebimento</span>
                        <input
                            id="dataRecebimento"
                            name="dataRecebimento"
                            type="date"
                            value="${obterDataISOHoje()}"
                            max="${obterDataISOHoje()}"
                            required
                        >
                    </label>

                    <label class="form-field payment-observations" for="observacoesRecebimento">
                        <span class="form-field-label">Observações (opcional)</span>
                        <input
                            id="observacoesRecebimento"
                            name="observacoesRecebimento"
                            type="text"
                            maxlength="500"
                            placeholder="Ex.: pagamento parcial via PIX"
                        >
                    </label>
                </div>

                <p class="payment-hint">O valor não pode ultrapassar o saldo desta notinha. Se for menor que a parcela, o restante continuará em aberto.</p>
                <div id="feedbackRecebimento" class="payment-feedback hidden" role="status" aria-live="polite"></div>
                <div class="payment-form-actions">
                    <button type="submit" class="btn-primary" id="btnRegistrarRecebimento">
                        Registrar recebimento
                    </button>
                </div>
            </form>
        </section>
    ` : "";

    elemento("detalhesNotinha").innerHTML = `
        <div class="detail-summary">
            <div class="detail-box">
                <span>Cliente</span>
                <strong>${escaparHTML(cliente?.nome || "—")}</strong>
                <div class="cell-sub">${escaparHTML(cliente?.telefone || "Sem telefone")}</div>
            </div>
            <div class="detail-box">
                <span>Total original</span>
                <strong>${formatarMoeda(notinha.total)}</strong>
            </div>
            <div class="detail-box">
                <span>Saldo atual</span>
                <strong>${formatarMoeda(saldo)}</strong>
            </div>
        </div>

        <p>
            <strong>Venda:</strong> #${escaparHTML(notinha.venda_id)}
            &nbsp; <strong>Emissão:</strong> ${formatarDataBR(notinha.emitida_em)}
            &nbsp; <strong>Situação:</strong> ${escaparHTML(statusTexto(notinha.status))}
        </p>

        <h3 class="section-title">Parcelas</h3>
        <div class="table-wrap">
            <table class="detail-table">
                <thead>
                    <tr>
                        <th>Parcela</th>
                        <th>Vencimento</th>
                        <th>Valor original</th>
                        <th>Pago</th>
                        <th>Saldo</th>
                    </tr>
                </thead>
                <tbody>${linhasParcelas}</tbody>
            </table>
        </div>

        ${formularioAdministrativo}

        ${formularioRecebimento}

        <h3 class="section-title">Histórico de recebimentos</h3>
        <div class="table-wrap">
            <table class="detail-table">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Recebimento</th>
                        <th>Valor aplicado nesta notinha</th>
                        <th>Observações</th>
                    </tr>
                </thead>
                <tbody>${linhasRecebimentos}</tbody>
            </table>
        </div>

        ${perfilAtual?.tipo === "admin" ? `
            <section class="audit-history-panel" aria-labelledby="tituloAuditoriaNotinha">
                <div class="audit-history-heading">
                    <div>
                        <h3 id="tituloAuditoriaNotinha">Histórico de alterações (auditoria)</h3>
                        <p>Registros administrativos, justificativas e valores anteriores e novos.</p>
                    </div>
                    <button type="button" class="btn-secondary audit-refresh-button" data-atualizar-auditoria>Atualizar histórico</button>
                </div>
                <div id="historicoAuditoriaNotinha" class="audit-history-list" aria-live="polite">
                    <p class="audit-state">Carregando histórico de alterações...</p>
                </div>
            </section>
        ` : ""}

        ${notinha.observacoes
            ? `<p><strong>Observações da notinha:</strong> ${escaparHTML(notinha.observacoes)}</p>`
            : ""}
        ${notinha.status === "cancelada" ? `
            <div class="admin-warning">
                <strong>Notinha cancelada em:</strong> ${formatarDataBR(notinha.cancelada_em)}<br>
                <strong>Justificativa:</strong> ${escaparHTML(notinha.motivo_cancelamento || "Não informada")}
            </div>
        ` : ""}

        <section class="print-signature" aria-label="Assinatura do cliente">
            <div class="print-signature-line"></div>
            <p>Assinatura do cliente</p>
        </section>
    `;

    if (perfilAtual?.tipo === "admin") {
        carregarAuditoriaNotinha(notinha.id);
    }
}

async function registrarRecebimentoDaNotinha(evento) {
    evento.preventDefault();
    limparErro();

    const notinhaId = notinhaAtual?.id;
    const notinha = notinhas.find((item) => String(item.id) === String(notinhaId));
    if (!notinha || notinha.status !== "aberta") {
        mostrarFeedbackRecebimento("Esta notinha não está em aberto e não aceita novos recebimentos.");
        return;
    }

    const campoValor = elemento("valorRecebimento");
    const campoForma = elemento("formaRecebimento");
    const campoData = elemento("dataRecebimento");
    const campoObservacoes = elemento("observacoesRecebimento");
    const botao = elemento("btnRegistrarRecebimento");

    const valor = converterValorDigitado(campoValor?.value);
    const saldo = calcularSaldoNotinha(notinha);
    const dataRecebimento = campoData?.value || obterDataISOHoje();
    const forma = campoForma?.value;
    const observacoes = campoObservacoes?.value.trim() || null;

    if (!Number.isFinite(valor) || valor <= 0) {
        mostrarFeedbackRecebimento("Informe um valor maior que R$ 0,00. Exemplo: 5,00.");
        campoValor?.focus();
        return;
    }

    if (valor > saldo + 0.001) {
        mostrarFeedbackRecebimento(`O valor informado supera o saldo desta notinha (${formatarMoeda(saldo)}).`);
        campoValor?.focus();
        return;
    }

    const formasPermitidas = ["dinheiro", "pix", "cartao_debito", "cartao_credito", "boleto", "outro"];
    if (!formasPermitidas.includes(forma)) {
        mostrarFeedbackRecebimento("Selecione uma forma de pagamento válida.");
        campoForma?.focus();
        return;
    }

    if (!dataRecebimento || dataRecebimento > obterDataISOHoje()) {
        mostrarFeedbackRecebimento("A data do recebimento deve ser hoje ou uma data anterior.");
        campoData?.focus();
        return;
    }

    let alocacoes;
    try {
        alocacoes = distribuirRecebimentoNaNotinha(notinha, valor);
    } catch (erro) {
        mostrarFeedbackRecebimento(erro.message || "Não foi possível distribuir o recebimento.");
        return;
    }

    const valorArredondado = Number(valor.toFixed(2));
    const formas = [{ forma_pagamento: forma, valor: valorArredondado }];
    const assinatura = JSON.stringify({
        cliente_id: Number(notinha.cliente_id),
        valor: valorArredondado,
        formas,
        alocacoes,
        data: dataRecebimento,
        observacoes
    });

    // Mantém a mesma chave em memória e na sessão do navegador se a resposta
    // se perder; assim, uma repetição dos mesmos dados reutiliza a chave segura.
    if (!chaveRecebimentoPendente || assinaturaRecebimentoPendente !== assinatura) {
        chaveRecebimentoPendente = null;
        assinaturaRecebimentoPendente = null;

        try {
            const pendenteSalvo = JSON.parse(
                sessionStorage.getItem("sistemaLojaRecebimentoPendente") || "null"
            );
            if (pendenteSalvo && pendenteSalvo.assinatura === assinatura && pendenteSalvo.chave) {
                chaveRecebimentoPendente = pendenteSalvo.chave;
                assinaturaRecebimentoPendente = assinatura;
            }
        } catch (erroStorage) {
            console.warn("Não foi possível recuperar a chave pendente da sessão:", erroStorage);
        }

        if (!chaveRecebimentoPendente) {
            chaveRecebimentoPendente = criarChaveIdempotencia();
            assinaturaRecebimentoPendente = assinatura;
            try {
                sessionStorage.setItem("sistemaLojaRecebimentoPendente", JSON.stringify({
                    assinatura,
                    chave: chaveRecebimentoPendente
                }));
            } catch (erroStorage) {
                console.warn("Não foi possível salvar a chave pendente na sessão:", erroStorage);
            }
        }
    }

    if (botao) {
        botao.disabled = true;
        botao.textContent = "Registrando...";
    }

    try {
        const { data, error } = await notinhasSupabase.rpc(
            "registrar_recebimento_notinha",
            {
                p_cliente_id: Number(notinha.cliente_id),
                p_valor: valorArredondado,
                p_formas: formas,
                p_alocacoes: alocacoes,
                p_chave_idempotencia: chaveRecebimentoPendente,
                p_data_recebimento: dataRecebimento,
                p_observacoes: observacoes
            }
        );

        if (error) {
            console.error("Erro ao registrar recebimento da notinha:", error);
            mostrarFeedbackRecebimento(
                error.message || "Não foi possível registrar o recebimento. Nenhuma confirmação foi recebida do banco."
            );
            return;
        }

        if (!data || data.sucesso !== true) {
            console.error("Resposta inesperada ao registrar recebimento:", data);
            mostrarFeedbackRecebimento("O banco não confirmou o recebimento. Atualize a página e confira o histórico antes de tentar novamente.");
            return;
        }

        const eraDuplicado = data.duplicado === true;

        const recarregou = await carregarDadosNotinhas();
        const notinhaAtualizada = notinhas.find(
            (item) => String(item.id) === String(notinhaId)
        );

        if (recarregou && notinhaAtualizada) {
            chaveRecebimentoPendente = null;
            assinaturaRecebimentoPendente = null;
            try {
                sessionStorage.removeItem("sistemaLojaRecebimentoPendente");
            } catch (erroStorage) {
                console.warn("Não foi possível limpar a chave pendente da sessão:", erroStorage);
            }
            notinhaAtual = notinhaAtualizada;
            renderizarDetalhesNotinha(notinhaAtualizada);
            mostrarAviso(
                eraDuplicado
                    ? `O recebimento #${data.recebimento_id} já estava registrado; nenhum lançamento duplicado foi criado.`
                    : `Recebimento de ${formatarMoeda(valorArredondado)} registrado com sucesso. Saldo atualizado: ${formatarMoeda(calcularSaldoNotinha(notinhaAtualizada))}.`
            );
        } else {
            mostrarErro("O recebimento foi confirmado pelo banco, mas não foi possível atualizar os saldos na tela. Clique em Atualizar para consultar novamente.");
        }
    } catch (erro) {
        console.error("Erro inesperado ao registrar recebimento:", erro);
        mostrarFeedbackRecebimento(
            erro.message || "Ocorreu um erro inesperado. Confira o histórico antes de fazer uma nova tentativa."
        );
    } finally {
        // O formulário pode ter sido re-renderizado após o sucesso.
        const botaoAtual = elemento("btnRegistrarRecebimento");
        if (botaoAtual) {
            botaoAtual.disabled = false;
            botaoAtual.textContent = "Registrar recebimento";
        }
    }
}

function mostrarFeedbackAdmin(id, texto, tipo = "erro") {
    const feedback = elemento(id);
    if (!feedback) return;
    feedback.textContent = texto;
    feedback.classList.remove("hidden", "admin-feedback-error", "admin-feedback-success");
    feedback.classList.add(tipo === "sucesso" ? "admin-feedback-success" : "admin-feedback-error");
}

async function corrigirNotinhaAdmin(evento) {
    evento.preventDefault();
    if (perfilAtual?.tipo !== "admin") {
        mostrarErro("Somente o administrador pode corrigir notinhas.");
        return;
    }

    const notinhaId = notinhaAtual?.id;
    const notinha = notinhas.find((item) => String(item.id) === String(notinhaId));
    if (!notinha || notinha.status !== "aberta") {
        mostrarFeedbackAdmin("feedbackCorrecaoNotinha", "Somente notinhas em aberto podem ser corrigidas.");
        return;
    }

    const motivo = elemento("motivoCorrecaoNotinha")?.value.trim() || "";
    const observacoes = elemento("observacoesCorrecaoNotinha")?.value.trim() || null;
    if (!motivo) {
        mostrarFeedbackAdmin("feedbackCorrecaoNotinha", "Informe a justificativa obrigatória.");
        elemento("motivoCorrecaoNotinha")?.focus();
        return;
    }

    const camposVencimento = [...document.querySelectorAll("[data-parcela-vencimento]")];
    const parcelas = camposVencimento.map((campoData) => {
        const id = campoData.dataset.parcelaVencimento;
        const campoValor = document.querySelector(`[data-parcela-valor="${CSS.escape(id)}"]`);
        return {
            id: Number(id),
            numero_parcela: Number(campoValor?.dataset.numeroParcela),
            vencimento: campoData.value,
            valor_original: converterValorDigitado(campoValor?.value)
        };
    });

    if (!parcelas.length || parcelas.some((p) => !p.id || !p.vencimento || !Number.isFinite(p.valor_original) || p.valor_original <= 0)) {
        mostrarFeedbackAdmin("feedbackCorrecaoNotinha", "Confira o vencimento e o valor de todas as parcelas.");
        return;
    }

    const somaCentavos = parcelas.reduce((total, p) => total + Math.round(p.valor_original * 100), 0);
    const totalCentavos = Math.round(Number(notinha.total) * 100);
    const temRecebimentos = parcelas.some((p) => {
        const parcelaOrigem = obterParcelas(notinha.id).find((origem) => String(origem.id) === String(p.id));
        return (parcelaOrigem?.alocacoes || []).length > 0;
    });

    if (somaCentavos !== totalCentavos) {
        mostrarFeedbackAdmin("A soma dos valores das parcelas precisa ser igual ao total original de " + formatarMoeda(notinha.total) + ".");
        return;
    }

    if (temRecebimentos) {
        const valorAbaixoDoRecebido = parcelas.some((p) => {
            const parcelaOrigem = obterParcelas(notinha.id).find((origem) => String(origem.id) === String(p.id));
            if (!parcelaOrigem) return true;
            const valorJaRecebidoCentavos = Math.round(obterValorPagoParcela(parcelaOrigem) * 100);
            const novoValorCentavos = Math.round(p.valor_original * 100);
            return novoValorCentavos < valorJaRecebidoCentavos;
        });
        if (valorAbaixoDoRecebido) {
            mostrarFeedbackAdmin("feedbackCorrecaoNotinha", "O valor de uma parcela não pode ficar abaixo do que já foi recebido nela. Os recebimentos existentes serão preservados.");
            return;
        }
    }

    const valoresParcelasAlterados = parcelas.some((p) => {
        const parcelaOrigem = obterParcelas(notinha.id).find((origem) => String(origem.id) === String(p.id));
        return !parcelaOrigem || Math.round(Number(parcelaOrigem.valor_original) * 100) !== Math.round(p.valor_original * 100);
    });
    const ajusteComRecebimentos = temRecebimentos && valoresParcelasAlterados;

    const botao = elemento("btnSalvarCorrecaoNotinha");
    if (botao) {
        botao.disabled = true;
        botao.textContent = "Salvando...";
    }

    try {
        const { data, error } = await notinhasSupabase.rpc("corrigir_notinha_admin", {
            p_notinha_id: Number(notinha.id),
            p_motivo: motivo,
            p_observacoes: observacoes,
            p_parcelas: parcelas
        });

        if (error) {
            console.error("Erro ao corrigir notinha:", error);
            mostrarFeedbackAdmin("feedbackCorrecaoNotinha", error.message || "Não foi possível salvar a correção.");
            return;
        }

        if (!data || data.sucesso !== true) {
            mostrarFeedbackAdmin("feedbackCorrecaoNotinha", "O banco não confirmou a correção. Atualize e confira a notinha antes de tentar novamente.");
            return;
        }

        const recarregou = await carregarDadosNotinhas();
        const atualizada = notinhas.find((item) => String(item.id) === String(notinhaId));
        if (!recarregou || !atualizada) {
            mostrarErro("A correção foi confirmada, mas a tela não conseguiu atualizar os dados. Clique em Atualizar para conferir.");
            return;
        }

        notinhaAtual = atualizada;
        renderizarDetalhesNotinha(atualizada);
        mostrarAviso(
            ajusteComRecebimentos
                ? "Correção administrativa salva. A alteração dos valores foi registrada na auditoria; os recebimentos anteriores foram preservados."
                : "Correção administrativa salva e registrada na auditoria."
        );
    } catch (erro) {
        console.error("Falha inesperada na correção da notinha:", erro);
        mostrarFeedbackAdmin("feedbackCorrecaoNotinha", erro.message || "Ocorreu um erro. Atualize e confira os dados antes de repetir.");
    } finally {
        const botaoAtual = elemento("btnSalvarCorrecaoNotinha");
        if (botaoAtual) {
            botaoAtual.disabled = false;
            botaoAtual.textContent = "Salvar correção";
        }
    }
}

async function cancelarNotinhaAdmin(evento) {
    evento.preventDefault();
    if (perfilAtual?.tipo !== "admin") {
        mostrarErro("Somente o administrador pode cancelar notinhas.");
        return;
    }

    const notinhaId = notinhaAtual?.id;
    const notinha = notinhas.find((item) => String(item.id) === String(notinhaId));
    if (!notinha || notinha.status !== "aberta") {
        mostrarFeedbackAdmin("feedbackCancelamentoNotinha", "Somente notinhas em aberto podem ser canceladas.");
        return;
    }

    const temRecebimentos = obterParcelas(notinha.id).some((p) => (p.alocacoes || []).length > 0);
    if (temRecebimentos) {
        mostrarFeedbackAdmin("feedbackCancelamentoNotinha", "Esta notinha possui recebimentos vinculados. O cancelamento está bloqueado até implementar o estorno financeiro.");
        return;
    }

    const motivo = elemento("motivoCancelamentoNotinha")?.value.trim() || "";
    const produtosDevolvidos = elemento("confirmarDevolucaoFisicaNotinha")?.checked === true;
    if (!motivo) {
        mostrarFeedbackAdmin("feedbackCancelamentoNotinha", "Informe a justificativa obrigatória do cancelamento.");
        elemento("motivoCancelamentoNotinha")?.focus();
        return;
    }

    const numero = String(notinha.numero).padStart(6, "0");
    const avisoEstoque = produtosDevolvidos
        ? "O estoque dos produtos será restaurado porque você confirmou a devolução física."
        : "O estoque NÃO será alterado, pois você não confirmou a devolução física.";
    if (!window.confirm(`Confirma cancelar a Notinha #${numero} e a venda #${notinha.venda_id}?\n\n${avisoEstoque}\n\nA operação ficará registrada na auditoria.`)) {
        return;
    }

    const botao = elemento("btnConfirmarCancelamentoNotinha");
    if (botao) {
        botao.disabled = true;
        botao.textContent = "Cancelando...";
    }

    try {
        const { data, error } = await notinhasSupabase.rpc("cancelar_notinha_admin", {
            p_notinha_id: Number(notinha.id),
            p_motivo: motivo,
            p_produtos_devolvidos: produtosDevolvidos
        });

        if (error) {
            console.error("Erro ao cancelar notinha:", error);
            mostrarFeedbackAdmin("feedbackCancelamentoNotinha", error.message || "Não foi possível cancelar a notinha.");
            return;
        }

        if (!data || data.sucesso !== true) {
            mostrarFeedbackAdmin("feedbackCancelamentoNotinha", "O banco não confirmou o cancelamento. Atualize a tela e confira antes de tentar novamente.");
            return;
        }

        const recarregou = await carregarDadosNotinhas();
        const atualizada = notinhas.find((item) => String(item.id) === String(notinhaId));
        if (!recarregou || !atualizada) {
            mostrarErro("O cancelamento foi confirmado, mas a tela não conseguiu atualizar. Clique em Atualizar e confira a notinha.");
            return;
        }

        notinhaAtual = atualizada;
        renderizarDetalhesNotinha(atualizada);
        mostrarAviso(
            data.estoque_restaurado
                ? "Notinha cancelada; venda marcada como cancelada e estoque restaurado conforme devolução física confirmada."
                : "Notinha cancelada; venda marcada como cancelada. O estoque permaneceu inalterado porque não foi confirmada devolução física."
        );
    } catch (erro) {
        console.error("Falha inesperada no cancelamento da notinha:", erro);
        mostrarFeedbackAdmin("feedbackCancelamentoNotinha", erro.message || "Ocorreu um erro. Atualize e confira os dados antes de repetir.");
    } finally {
        const botaoAtual = elemento("btnConfirmarCancelamentoNotinha");
        if (botaoAtual) {
            botaoAtual.disabled = false;
            botaoAtual.textContent = "Confirmar cancelamento";
        }
    }
}

function abrirDetalhesNotinha(id) {
    notinhaAtual = notinhas.find(
        (notinha) => String(notinha.id) === String(id)
    );

    if (!notinhaAtual) {
        return;
    }

    renderizarDetalhesNotinha(notinhaAtual);
    elemento("modalDetalhes").classList.remove("hidden");
}

/* =========================================================
   EVENTOS E INICIALIZAÇÃO
========================================================= */

function configurarEventosNotinhas() {
    elemento("btnAtualizar").addEventListener(
        "click",
        carregarDadosNotinhas
    );

    elemento("buscaNotinha").addEventListener(
        "input",
        filtrarNotinhas
    );

    ["filtroStatus", "dataInicio", "dataFim"].forEach((id) => {
        elemento(id).addEventListener("change", filtrarNotinhas);
    });

    elemento("listaNotinhas").addEventListener("click", (evento) => {
        const botao = evento.target.closest("[data-detalhe]");

        if (botao) {
            abrirDetalhesNotinha(botao.dataset.detalhe);
        }
    });

    elemento("painelVencimentosNotinhas").addEventListener("click", (evento) => {
        const botao = evento.target.closest("[data-detalhe]");
        if (botao) {
            abrirDetalhesNotinha(botao.dataset.detalhe);
        }
    });

    elemento("detalhesNotinha").addEventListener("submit", (evento) => {
        if (!evento.target) return;
        if (evento.target.id === "formRecebimentoNotinha") {
            registrarRecebimentoDaNotinha(evento);
        } else if (evento.target.id === "formCorrigirNotinha") {
            corrigirNotinhaAdmin(evento);
        } else if (evento.target.id === "formCancelarNotinha") {
            cancelarNotinhaAdmin(evento);
        }
    });

    elemento("detalhesNotinha").addEventListener("click", (evento) => {
        const botaoAuditoria = evento.target.closest("[data-atualizar-auditoria]");
        if (botaoAuditoria && notinhaAtual) {
            carregarAuditoriaNotinha(notinhaAtual.id);
            return;
        }

        const botao = evento.target.closest("[data-toggle-admin-form]");
        if (!botao) return;

        const idFormulario = botao.dataset.toggleAdminForm;
        const formulario = elemento(idFormulario);
        if (!formulario) return;

        formulario.classList.toggle("hidden");
        if (!formulario.classList.contains("hidden")) {
            const primeiroCampo = formulario.querySelector("textarea, input, button");
            primeiroCampo?.focus();
        }
    });

    elemento("btnImprimirNotinha").addEventListener(
        "click",
        () => window.print()
    );

    document.querySelectorAll("[data-fechar]").forEach((botao) => {
        botao.addEventListener("click", () => {
            elemento(botao.dataset.fechar).classList.add("hidden");
        });
    });

    elemento("modalDetalhes").addEventListener("click", (evento) => {
        if (evento.target.id === "modalDetalhes") {
            elemento("modalDetalhes").classList.add("hidden");
        }
    });

    elemento("btnSair").addEventListener("click", async () => {
        try {
            await notinhasSupabase.auth.signOut({
                scope: "local"
            });
        } finally {
            window.location.href = "index.html";
        }
    });
}

async function inicializarNotinhas() {
    configurarEventosNotinhas();

    const autorizado = await protegerPaginaNotinhas();

    if (!autorizado) {
        return;
    }

    if (perfilAtual.tipo === "admin") {
        mostrarAviso(
            "Área administrativa: consulta de notinhas da sua loja."
        );
    } else {
        mostrarAviso(
            "Área do vendedor: consulta de notinhas da sua loja."
        );
    }

    await carregarDadosNotinhas();
}

document.addEventListener(
    "DOMContentLoaded",
    inicializarNotinhas
);
