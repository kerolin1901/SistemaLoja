# Adiciona o acesso à Auditoria em todas as páginas do administrador da loja.
# Execute este script na pasta raiz do projeto Sistema da Loja.
$ErrorActionPreference = 'Stop'

$paginas = @(
    'usuarios.html',
    'produtos.html',
    'categorias.html',
    'estoque.html',
    'vendas.html',
    'configuracoes-descontos.html',
    'historico-vendas.html',
    'financeiro.html',
    'notinhas.html',
    'relatorios.html'
)

$root = (Get-Location).Path
$arquivoAuditoria = Join-Path $root 'auditoria.html'
if (-not (Test-Path -LiteralPath $arquivoAuditoria -PathType Leaf)) {
    throw 'Não encontrei auditoria.html. Extraia este pacote na pasta raiz do Sistema da Loja.'
}

$linkNormal = @'
                <a href="auditoria.html" class="item-menu">
                    <span class="icone-menu" aria-hidden="true">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M5 4h14v16H5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                            <path d="M8 8h8M8 12h5M8 16h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </span>
                    <span>Auditoria</span>
                </a>
'@
$linkAdminNotinhas = @'
<a href="auditoria.html" class="item-menu" data-role="admin">
    <span class="icone-menu" aria-hidden="true">
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 4h14v16H5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M8 8h8M8 12h5M8 16h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
    </span>
    <span>Auditoria</span>
</a>
'@

# Prepara e valida todas as alterações antes de tocar nos arquivos.
$planos = @()
foreach ($nome in $paginas) {
    $caminho = Join-Path $root $nome
    if (-not (Test-Path -LiteralPath $caminho -PathType Leaf)) {
        throw "Arquivo obrigatório não encontrado: $nome"
    }

    $bytes = [System.IO.File]::ReadAllBytes($caminho)
    $temBom = $bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF
    if ($temBom) {
        $conteudo = [System.Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3)
    } else {
        $conteudo = [System.Text.Encoding]::UTF8.GetString($bytes)
    }

    if ($conteudo -match '(?i)href\s*=\s*["'']auditoria\.html["'']') {
        Write-Host "Já possui Auditoria: $nome" -ForegroundColor DarkGray
        continue
    }

    $novaLinha = if ($conteudo.Contains("`r`n")) { "`r`n" } else { "`n" }
    $padraoNav = '(?is)(<nav\b[^>]*class\s*=\s*["'']menu["''][^>]*>)(.*?)(</nav>)'
    $nav = [regex]::Match($conteudo, $padraoNav)
    if (-not $nav.Success) {
        throw "Não encontrei o menu lateral administrativo em $nome. Nenhum arquivo foi alterado."
    }

    $corpoMenu = $nav.Groups[2].Value
    if ($nome -eq 'notinhas.html') {
        # Notinhas compartilha o menu entre administrador e vendedor.
        # O item é inserido somente na área do administrador.
        $marcadorVendedor = [regex]::Match($corpoMenu, '(?is)<div\b[^>]*data-role\s*=\s*["'']vendedor["'']')
        if (-not $marcadorVendedor.Success) {
            throw 'Não encontrei o início do menu do vendedor em notinhas.html. Nenhum arquivo foi alterado.'
        }
        $insercao = $linkAdminNotinhas.Replace("`n", $novaLinha)
        $corpoNovo = $corpoMenu.Insert($marcadorVendedor.Index, $insercao + $novaLinha)
    } else {
        $insercao = $linkNormal.Replace("`n", $novaLinha)
        $corpoNovo = $corpoMenu + $novaLinha + $insercao
    }

    $novoNav = $nav.Groups[1].Value + $corpoNovo + $nav.Groups[3].Value
    $conteudoNovo = $conteudo.Substring(0, $nav.Index) + $novoNav + $conteudo.Substring($nav.Index + $nav.Length)
    $planos += [pscustomobject]@{
        Nome = $nome
        Caminho = $caminho
        Conteudo = $conteudoNovo
        TemBom = $temBom
    }
}

if ($planos.Count -eq 0) {
    Write-Host 'Todas as páginas já possuem o acesso à Auditoria.' -ForegroundColor Green
    exit 0
}

# Backup de todos os arquivos que serão alterados.
$carimbo = Get-Date -Format 'yyyyMMdd-HHmmss'
$pastaBackup = Join-Path $root "backup-menu-auditoria-$carimbo"
New-Item -ItemType Directory -Path $pastaBackup | Out-Null
foreach ($plano in $planos) {
    Copy-Item -LiteralPath $plano.Caminho -Destination (Join-Path $pastaBackup $plano.Nome)
}

try {
    foreach ($plano in $planos) {
        $encoding = [System.Text.UTF8Encoding]::new([bool]$plano.TemBom)
        [System.IO.File]::WriteAllText($plano.Caminho, $plano.Conteudo, $encoding)
        Write-Host "Atualizado: $($plano.Nome)" -ForegroundColor Green
    }
} catch {
    foreach ($plano in $planos) {
        $copia = Join-Path $pastaBackup $plano.Nome
        if (Test-Path -LiteralPath $copia) {
            Copy-Item -LiteralPath $copia -Destination $plano.Caminho -Force
        }
    }
    throw "Falha ao atualizar os menus. Os arquivos originais foram restaurados. Detalhe: $($_.Exception.Message)"
}

Write-Host ''
Write-Host "Concluído! A Auditoria foi adicionada a $($planos.Count) páginas administrativas." -ForegroundColor Green
Write-Host "Backup criado em: $pastaBackup" -ForegroundColor Cyan
Write-Host 'O menu do vendedor em notinhas.html permanece sem o item Auditoria.' -ForegroundColor Yellow
Write-Host 'Não foi feito commit nem push. Teste as páginas localmente antes de publicar.' -ForegroundColor Yellow
