/* Sistema da Loja — comprovante comercial não fiscal */
(function () {
  "use strict";
  const moeda = v => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const dataBR = v => v ? new Date(v).toLocaleString("pt-BR") : new Date().toLocaleString("pt-BR");
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const campo = (obj, nomes) => { for (const n of nomes) if (obj && obj[n] != null && String(obj[n]).trim()) return obj[n]; return ""; };
  const pagamento = v => ({dinheiro:"Dinheiro",pix:"PIX",cartao_credito:"Cartão de crédito",cartao_debito:"Cartão de débito",boleto:"Boleto",outro:"Outro"}[v] || v || "Não informado");

  async function buscarDados(db, vendaId) {
    const { data: venda, error: ev } = await db.from("vendas").select("*").eq("id", vendaId).single();
    if (ev || !venda) throw new Error("Não foi possível carregar os dados da venda.");
    const { data: itens, error: ei } = await db.from("itens_venda").select("*").eq("venda_id", vendaId).order("id", { ascending: true });
    if (ei) throw new Error("Não foi possível carregar os itens da venda.");
    const ids = [...new Set((itens || []).map(i => i.produto_id).filter(v => v != null))];
    let produtos = [];
    if (ids.length) {
      const r = await db.from("produtos").select("*").in("id", ids);
      if (!r.error) produtos = r.data || [];
    }
    let cliente = null;
    if (venda.cliente_id != null) {
      const r = await db.from("clientes").select("*").eq("id", venda.cliente_id).maybeSingle();
      if (!r.error) cliente = r.data;
    }
    let perfil = null;
    if (venda.usuario_id) {
      const r = await db.from("perfis").select("*").eq("id", venda.usuario_id).maybeSingle();
      if (!r.error) perfil = r.data;
    }
    let loja = null;
    const lojaId = campo(perfil, ["loja_id"]) || (JSON.parse(sessionStorage.getItem("sistemaLojaPerfil") || "{}") || {}).loja_id;
    if (lojaId) {
      const r = await db.from("lojas").select("*").eq("id", lojaId).maybeSingle();
      if (!r.error) loja = r.data;
    }
    const itensProntos = (itens || []).map(i => {
      const p = produtos.find(x => String(x.id) === String(i.produto_id)) || {};
      return { nome: campo(p, ["nome", "descricao"]) || "Produto", sku: campo(p, ["sku"]), quantidade: Number(i.quantidade) || 0, unitario: Number(i.preco_unitario) || 0, subtotal: Number(i.subtotal ?? ((Number(i.quantidade)||0)*(Number(i.preco_unitario)||0))) || 0 };
    });
    return { venda, itens: itensProntos, cliente, perfil, loja };
  }

  function htmlComprovante(d, largura) {
    const { venda, itens, cliente, perfil, loja } = d;
    const nomeLoja = campo(loja, ["nome", "razao_social", "nome_fantasia"]) || document.getElementById("nomeLojaVendedor")?.textContent?.trim() || "Sistema da Loja";
    const cnpj = campo(loja, ["cnpj"]), telefoneLoja = campo(loja, ["telefone", "telefone_contato"]), endereco = campo(loja, ["endereco", "logradouro"]);
    const nomeCliente = campo(cliente, ["nome", "nome_completo"]) || "Consumidor não identificado";
    const foneCliente = campo(cliente, ["telefone", "celular"]);
    const desconto = Number(venda.desconto) || 0;
    const subtotal = Number(venda.subtotal) || itens.reduce((s,i)=>s+i.subtotal,0);
    const total = Number(venda.total) || 0;
    const itensHtml = itens.map(i => `<tr><td class="produto">${esc(i.nome)}${i.sku ? `<small>SKU: ${esc(i.sku)}</small>` : ""}<small>${i.quantidade} x ${moeda(i.unitario)}</small></td><td class="valor">${moeda(i.subtotal)}</td></tr>`).join("");
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Comprovante da venda #${esc(venda.id)}</title><style>
      @page { size: ${largura === "a4" ? "A4" : largura === "58" ? "58mm auto" : "80mm auto"}; margin: ${largura === "a4" ? "14mm" : "3mm"}; }
      *{box-sizing:border-box} body{font-family:Arial,sans-serif;color:#111;margin:0 auto;width:${largura === "a4" ? "100%" : largura === "58" ? "52mm" : "74mm"};font-size:${largura === "a4" ? "12pt" : "11px"};line-height:1.35}
      h1{font-size:1.45em;text-align:center;margin:0 0 4px;overflow-wrap:anywhere} .centro{text-align:center}.muted{color:#444}.linha{border:0;border-top:1px dashed #555;margin:8px 0} .meta{display:flex;justify-content:space-between;gap:8px;margin:3px 0}.titulo{font-weight:bold;margin:8px 0 4px} table{width:100%;border-collapse:collapse;table-layout:fixed} td{padding:4px 0;vertical-align:top;border-bottom:1px dotted #bbb}.produto{width:70%;overflow-wrap:anywhere}.valor{width:30%;text-align:right;white-space:nowrap}.produto small{display:block;font-size:.9em}.total{font-size:1.25em;font-weight:bold}.aviso{text-align:center;font-size:.9em;margin-top:12px}.acoes{margin:12px 0;text-align:center}.acoes button{padding:8px 12px;margin:3px}@media print{.acoes{display:none}body{margin:0 auto}}
      </style></head><body>
      <h1>${esc(nomeLoja)}</h1><div class="centro">${cnpj ? `CNPJ: ${esc(cnpj)}<br>` : ""}${telefoneLoja ? `${esc(telefoneLoja)}<br>` : ""}${endereco ? `${esc(endereco)}<br>` : ""}</div>
      <hr class="linha"><div class="centro"><strong>COMPROVANTE DE VENDA</strong><br><strong>NÃO FISCAL</strong></div><hr class="linha">
      <div class="meta"><span>Venda</span><strong>#${esc(venda.id)}</strong></div><div class="meta"><span>Data</span><span>${esc(dataBR(venda.criado_em))}</span></div>
      <div class="titulo">Cliente</div><div>${esc(nomeCliente)}</div>${foneCliente ? `<div>Telefone: ${esc(foneCliente)}</div>` : ""}
      <hr class="linha"><div class="titulo">Produtos</div><table><tbody>${itensHtml}</tbody></table><hr class="linha">
      <div class="meta"><span>Subtotal</span><span>${moeda(subtotal)}</span></div><div class="meta"><span>Desconto</span><span>${moeda(desconto)}</span></div><div class="meta total"><span>TOTAL</span><span>${moeda(total)}</span></div>
      <hr class="linha"><div class="meta"><span>Pagamento</span><strong>${esc(pagamento(venda.forma_pagamento))}</strong></div>${perfil ? `<div class="meta"><span>Atendente</span><span>${esc(campo(perfil,["nome_completo","usuario"]) || "")}</span></div>` : ""}${venda.observacoes ? `<hr class="linha"><div><strong>Observações:</strong> ${esc(venda.observacoes)}</div>` : ""}
      <hr class="linha"><div class="aviso">Obrigado pela preferência!<br>Documento comercial não fiscal.</div><div class="acoes"><button onclick="window.print()">Imprimir</button><button onclick="window.close()">Fechar</button></div><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));</script></body></html>`;
  }

  async function abrirComprovante(db, vendaId, janela, formato) {
    try {
      const dados = await buscarDados(db, vendaId);
      janela.document.open(); janela.document.write(htmlComprovante(dados, formato)); janela.document.close();
    } catch (e) {
      console.error("Erro ao preparar comprovante:", e);
      janela.document.body.innerHTML = "<p>Não foi possível preparar o comprovante. Feche esta janela e tente novamente.</p>";
      alert(e.message || "Não foi possível imprimir o comprovante.");
    }
  }

  window.SistemaLojaComprovantes = {
    adicionarBotao: function (db, vendaId, botaoBase) {
      if (!vendaId || !botaoBase) return;
      let botao = document.getElementById("btnImprimirComprovanteVenda");
      if (!botao) {
        botao = document.createElement("button");
        botao.id = "btnImprimirComprovanteVenda";
        botao.type = "button";
        botao.textContent = "Imprimir comprovante";
        botao.className = "btn-imprimir-comprovante-venda";

        const ehTelaVendedor = botaoBase.classList.contains("botao-finalizar");
        if (ehTelaVendedor) {
          // Mantém impressão e finalização juntas, como na tela do administrador,
          // abaixo dos campos de pagamento e observações.
          let acoes = document.getElementById("acoesVendaComprovante");
          if (!acoes) {
            acoes = document.createElement("div");
            acoes.id = "acoesVendaComprovante";
            acoes.style.cssText = "display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:16px;";
            // A área de ações deve ficar no final do painel da venda,
            // depois do resumo, pagamento e observações, como no administrador.
            const painelVenda = botaoBase.closest(".painel-venda") || document.querySelector(".painel-venda");
            if (painelVenda) {
              painelVenda.appendChild(acoes);
            } else {
              botaoBase.parentElement.insertAdjacentElement("afterend", acoes);
            }
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
        const formato = (prompt("Escolha o papel do comprovante:\n1 - Térmica 58 mm\n2 - Térmica 80 mm\n3 - Folha A4", "2") || "2").trim();
        if (!({"1":1,"2":1,"3":1}[formato])) return;
        const janela = window.open("", "_blank", "width=450,height=700");
        if (!janela) { alert("O navegador bloqueou a janela. Permita pop-ups para este site e tente novamente."); return; }
        abrirComprovante(db, vendaId, janela, formato === "1" ? "58" : formato === "3" ? "a4" : "80");
      };
      botao.style.display = "inline-flex";
    },
    imprimir: function (db, vendaId) {
      const formato = (prompt("Escolha o papel do comprovante:\n1 - Térmica 58 mm\n2 - Térmica 80 mm\n3 - Folha A4", "2") || "2").trim();
      if (!({"1":1,"2":1,"3":1}[formato])) return;
      const janela = window.open("", "_blank", "width=450,height=700");
      if (!janela) { alert("O navegador bloqueou a janela. Permita pop-ups para este site e tente novamente."); return; }
      abrirComprovante(db, vendaId, janela, formato === "1" ? "58" : formato === "3" ? "a4" : "80");
    }
  };
})();
