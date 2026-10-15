/*
 * Sistema da Loja — comprovante comercial não fiscal
 * Recebimento em dinheiro e troco são preservados por venda neste navegador
 * para que possam aparecer no comprovante recém-gerado e em reimpressões locais.
 */
(function () {
  "use strict";

  const moeda = valor => (Number(valor) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  const dataBR = valor => valor
    ? new Date(valor).toLocaleString("pt-BR")
    : new Date().toLocaleString("pt-BR");

  const esc = valor => String(valor ?? "").replace(/[&<>"']/g, caractere => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[caractere]));

  const campo = (objeto, nomes) => {
    for (const nome of nomes) {
      if (objeto && objeto[nome] != null && String(objeto[nome]).trim()) {
        return objeto[nome];
      }
    }
    return "";
  };

  const pagamento = valor => ({
    dinheiro: "Dinheiro",
    pix: "PIX",
    cartao_credito: "Cartão de crédito",
    cartao_debito: "Cartão de débito",
    boleto: "Boleto",
    outro: "Outro",
    a_prazo: "A prazo (fiado)"
  }[valor] || valor || "Não informado");

  const chaveDinheiro = vendaId => `sistemaLojaPagamentoDinheiro:${String(vendaId)}`;

  function guardarPagamentoDinheiro(vendaId, dadosPagamento) {
    if (!vendaId || !dadosPagamento) return;

    const valorRecebido = Number(dadosPagamento.valorRecebido);
    const troco = Number(dadosPagamento.troco);
    if (!Number.isFinite(valorRecebido) || !Number.isFinite(troco)) return;

    try {
      localStorage.setItem(chaveDinheiro(vendaId), JSON.stringify({
        valorRecebido: Math.round(valorRecebido * 100) / 100,
        troco: Math.round(troco * 100) / 100
      }));
    } catch (erro) {
      console.warn("Não foi possível guardar os dados de dinheiro para a impressão local.", erro);
    }
  }

  function lerPagamentoDinheiro(vendaId) {
    try {
      const salvo = localStorage.getItem(chaveDinheiro(vendaId));
      if (!salvo) return null;

      const dados = JSON.parse(salvo);
      if (!Number.isFinite(Number(dados.valorRecebido)) || !Number.isFinite(Number(dados.troco))) {
        return null;
      }

      return {
        valorRecebido: Number(dados.valorRecebido),
        troco: Number(dados.troco)
      };
    } catch (erro) {
      console.warn("Não foi possível ler os dados de dinheiro para a impressão local.", erro);
      return null;
    }
  }

  async function buscarDados(db, vendaId) {
    const { data: venda, error: erroVenda } = await db
      .from("vendas")
      .select("*")
      .eq("id", vendaId)
      .single();

    if (erroVenda || !venda) {
      throw new Error("Não foi possível carregar os dados da venda.");
    }

    const { data: itens, error: erroItens } = await db
      .from("itens_venda")
      .select("*")
      .eq("venda_id", vendaId)
      .order("id", { ascending: true });

    if (erroItens) {
      throw new Error("Não foi possível carregar os itens da venda.");
    }

    const idsProdutos = [...new Set((itens || []).map(item => item.produto_id).filter(valor => valor != null))];
    let produtos = [];

    if (idsProdutos.length) {
      const resultadoProdutos = await db.from("produtos").select("*").in("id", idsProdutos);
      if (!resultadoProdutos.error) produtos = resultadoProdutos.data || [];
    }

    let cliente = null;
    if (venda.cliente_id != null) {
      const resultadoCliente = await db.from("clientes").select("*").eq("id", venda.cliente_id).maybeSingle();
      if (!resultadoCliente.error) cliente = resultadoCliente.data;
    }

    let perfil = null;
    if (venda.usuario_id) {
      const resultadoPerfil = await db.from("perfis").select("*").eq("id", venda.usuario_id).maybeSingle();
      if (!resultadoPerfil.error) perfil = resultadoPerfil.data;
    }

    let loja = null;
    let perfilDaSessao = {};
    try {
      perfilDaSessao = JSON.parse(sessionStorage.getItem("sistemaLojaPerfil") || "{}") || {};
    } catch (_) {
      perfilDaSessao = {};
    }

    const lojaId = campo(perfil, ["loja_id"]) || perfilDaSessao.loja_id;
    if (lojaId) {
      const resultadoLoja = await db.from("lojas").select("*").eq("id", lojaId).maybeSingle();
      if (!resultadoLoja.error) loja = resultadoLoja.data;
    }

    const itensProntos = (itens || []).map(item => {
      const produto = produtos.find(registro => String(registro.id) === String(item.produto_id)) || {};
      const quantidade = Number(item.quantidade) || 0;
      const unitario = Number(item.preco_unitario) || 0;

      return {
        nome: campo(produto, ["nome", "descricao"]) || "Produto",
        sku: campo(produto, ["sku"]),
        quantidade,
        unitario,
        subtotal: Number(item.subtotal ?? (quantidade * unitario)) || 0
      };
    });

    return { venda, itens: itensProntos, cliente, perfil, loja };
  }

  function htmlComprovante(dados, largura) {
    const { venda, itens, cliente, perfil, loja } = dados;
    const nomeLoja = campo(loja, ["nome", "razao_social", "nome_fantasia"])
      || document.getElementById("nomeLojaVendedor")?.textContent?.trim()
      || "Sistema da Loja";
    const cnpj = campo(loja, ["cnpj"]);
    const telefoneLoja = campo(loja, ["telefone", "telefone_contato"]);
    const endereco = campo(loja, ["endereco", "logradouro"]);
    const nomeCliente = campo(cliente, ["nome", "nome_completo"]) || "Consumidor não identificado";
    const telefoneCliente = campo(cliente, ["telefone", "celular"]);
    const desconto = Number(venda.desconto) || 0;
    const subtotal = Number(venda.subtotal) || itens.reduce((soma, item) => soma + item.subtotal, 0);
    const total = Number(venda.total) || 0;
    const dinheiro = venda.forma_pagamento === "dinheiro" ? dados.pagamentoDinheiro : null;

    const itensHtml = itens.map(item => `
      <tr>
        <td class="produto">
          ${esc(item.nome)}
          ${item.sku ? `<small>SKU: ${esc(item.sku)}</small>` : ""}
          <small>${item.quantidade} x ${moeda(item.unitario)}</small>
        </td>
        <td class="valor">${moeda(item.subtotal)}</td>
      </tr>
    `).join("");

    const pagamentoDinheiroHtml = dinheiro ? `
      <div class="meta"><span>Valor recebido</span><strong>${moeda(dinheiro.valorRecebido)}</strong></div>
      <div class="meta"><span>Troco</span><strong>${moeda(dinheiro.troco)}</strong></div>
    ` : "";

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Comprovante da venda #${esc(venda.id)}</title>
  <style>
    @page { size: ${largura === "a4" ? "A4" : largura === "58" ? "58mm auto" : "80mm auto"}; margin: ${largura === "a4" ? "14mm" : "3mm"}; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #111; margin: 0 auto; width: ${largura === "a4" ? "100%" : largura === "58" ? "52mm" : "74mm"}; font-size: ${largura === "a4" ? "12pt" : "11px"}; line-height: 1.35; }
    h1 { font-size: 1.45em; text-align: center; margin: 0 0 4px; overflow-wrap: anywhere; }
    .centro { text-align: center; }
    .muted { color: #444; }
    .linha { border: 0; border-top: 1px dashed #555; margin: 8px 0; }
    .meta { display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; }
    .titulo { font-weight: bold; margin: 8px 0 4px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    td { padding: 4px 0; vertical-align: top; border-bottom: 1px dotted #bbb; }
    .produto { width: 70%; overflow-wrap: anywhere; }
    .valor { width: 30%; text-align: right; white-space: nowrap; }
    .produto small { display: block; font-size: .9em; }
    .total { font-size: 1.25em; font-weight: bold; }
    .troco { font-size: 1.05em; font-weight: bold; }
    .aviso { text-align: center; font-size: .9em; margin-top: 12px; }
    .acoes { margin: 12px 0; text-align: center; }
    .acoes button { padding: 8px 12px; margin: 3px; }
    @media print { .acoes { display: none; } body { margin: 0 auto; } }
  </style>
</head>
<body>
  <h1>${esc(nomeLoja)}</h1>
  <div class="centro">${cnpj ? `CNPJ: ${esc(cnpj)}<br>` : ""}${telefoneLoja ? `${esc(telefoneLoja)}<br>` : ""}${endereco ? `${esc(endereco)}<br>` : ""}</div>
  <hr class="linha">
  <div class="centro"><strong>COMPROVANTE DE VENDA</strong><br><strong>NÃO FISCAL</strong></div>
  <hr class="linha">
  <div class="meta"><span>Venda</span><strong>#${esc(venda.id)}</strong></div>
  <div class="meta"><span>Data</span><span>${esc(dataBR(venda.criado_em))}</span></div>
  <div class="titulo">Cliente</div>
  <div>${esc(nomeCliente)}</div>
  ${telefoneCliente ? `<div>Telefone: ${esc(telefoneCliente)}</div>` : ""}
  <hr class="linha">
  <div class="titulo">Produtos</div>
  <table><tbody>${itensHtml}</tbody></table>
  <hr class="linha">
  <div class="meta"><span>Subtotal</span><span>${moeda(subtotal)}</span></div>
  <div class="meta"><span>Desconto</span><span>${moeda(desconto)}</span></div>
  <div class="meta total"><span>TOTAL</span><span>${moeda(total)}</span></div>
  <hr class="linha">
  <div class="meta"><span>Pagamento</span><strong>${esc(pagamento(venda.forma_pagamento))}</strong></div>
  ${pagamentoDinheiroHtml}
  ${perfil ? `<div class="meta"><span>Atendente</span><span>${esc(campo(perfil, ["nome_completo", "usuario"]) || "")}</span></div>` : ""}
  ${venda.observacoes ? `<hr class="linha"><div><strong>Observações:</strong> ${esc(venda.observacoes)}</div>` : ""}
  <hr class="linha">
  <div class="aviso">Obrigado pela preferência!<br>Documento comercial não fiscal.</div>
  <div class="acoes"><button onclick="window.print()">Imprimir</button><button onclick="window.close()">Fechar</button></div>
  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 250));</script>
</body>
</html>`;
  }

  async function abrirComprovante(db, vendaId, janela, formato) {
    try {
      const dados = await buscarDados(db, vendaId);
      if (dados.venda.forma_pagamento === "dinheiro") {
        dados.pagamentoDinheiro = lerPagamentoDinheiro(vendaId);
      }
      janela.document.open();
      janela.document.write(htmlComprovante(dados, formato));
      janela.document.close();
    } catch (erro) {
      console.error("Erro ao preparar comprovante:", erro);
      janela.document.body.innerHTML = "<p>Não foi possível preparar o comprovante. Feche esta janela e tente novamente.</p>";
      alert(erro.message || "Não foi possível imprimir o comprovante.");
    }
  }

  function escolherFormato() {
    const formato = (prompt("Escolha o papel do comprovante:\n1 - Térmica 58 mm\n2 - Térmica 80 mm\n3 - Folha A4", "2") || "2").trim();
    if (!({ "1": 1, "2": 1, "3": 1 }[formato])) return null;
    return formato === "1" ? "58" : formato === "3" ? "a4" : "80";
  }

  function abrirJanelaImpressao(db, vendaId) {
    const formato = escolherFormato();
    if (!formato) return;

    const janela = window.open("", "_blank", "width=450,height=700");
    if (!janela) {
      alert("O navegador bloqueou a janela. Permita pop-ups para este site e tente novamente.");
      return;
    }

    abrirComprovante(db, vendaId, janela, formato);
  }

  window.SistemaLojaComprovantes = {
    adicionarBotao: function (db, vendaId, botaoBase, dadosPagamentoDinheiro = null) {
      if (!vendaId || !botaoBase) return;

      guardarPagamentoDinheiro(vendaId, dadosPagamentoDinheiro);

      let botao = document.getElementById("btnImprimirComprovanteVenda");
      if (!botao) {
        botao = document.createElement("button");
        botao.id = "btnImprimirComprovanteVenda";
        botao.type = "button";
        botao.textContent = "Imprimir comprovante";
        botao.className = "btn-imprimir-comprovante-venda";

        const ehTelaVendedor = botaoBase.classList.contains("botao-finalizar");
        if (ehTelaVendedor) {
          let acoes = document.getElementById("acoesVendaComprovante");
          if (!acoes) {
            acoes = document.createElement("div");
            acoes.id = "acoesVendaComprovante";
            acoes.style.cssText = "display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:16px;";
            const painelVenda = botaoBase.closest(".painel-venda") || document.querySelector(".painel-venda");
            if (painelVenda) painelVenda.appendChild(acoes);
            else botaoBase.parentElement.insertAdjacentElement("afterend", acoes);
            acoes.style.cssText = "display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:16px;width:100%;order:99;";
          }
          acoes.style.order = "99";
          acoes.style.width = "100%";
          acoes.style.display = "flex";
          acoes.style.justifyContent = "flex-end";
          acoes.style.alignItems = "center";
          acoes.style.gap = "10px";
          acoes.appendChild(botaoBase);
          acoes.appendChild(botao);
          botaoBase.style.margin = "0";
          botaoBase.style.width = "auto";
          botaoBase.style.flex = "0 0 auto";
        } else {
          botao.style.cssText = "display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 16px;margin:0;border:1px solid #2563eb;border-radius:8px;background:#fff;color:#1d4ed8;font-weight:600;cursor:pointer;";
          botaoBase.insertAdjacentElement("afterend", botao);
        }
      }

      botao.style.cssText = "display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 16px;margin:0;border:1px solid #2563eb;border-radius:8px;background:#fff;color:#1d4ed8;font-weight:600;cursor:pointer;min-height:40px;white-space:nowrap;";
      botao.onclick = function () {
        abrirJanelaImpressao(db, vendaId);
      };
      botao.style.display = "inline-flex";
    },

    imprimir: function (db, vendaId) {
      abrirJanelaImpressao(db, vendaId);
    }
  };
})();
