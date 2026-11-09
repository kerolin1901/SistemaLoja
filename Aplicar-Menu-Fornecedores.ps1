$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$carimbo = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = Join-Path $root "backup-menu-fornecedores-$carimbo"
$arquivos = @(
    'admin.html', 'administradores.html', 'auditoria.html', 'categorias.html',
    'clientes.html', 'configuracoes-descontos.html', 'estoque.html', 'financeiro.html',
    'historico-vendas.html', 'notinhas.html', 'produtos.html', 'relatorios.html',
    'usuarios.html', 'vendas.html'
)
$link = @'

                <a href="fornecedores.html" class="item-menu">
                    <span class="icone-menu" aria-hidden="true">▦</span>
                    <span>Fornecedores</span>
                </a>
'@
$padraoProdutos = '(?is)<a\b[^>]*href\s*=\s*"produtos\.html"[^>]*>.*?</a>'
$atualizados = 0
New-Item -ItemType Directory -Path $backup -Force | Out-Null
foreach ($nome in $arquivos) {
    $caminho = Join-Path $root $nome
    if (-not (Test-Path -LiteralPath $caminho)) { continue }
    $conteudo = [System.IO.File]::ReadAllText($caminho)
    if ($conteudo -match 'href\s*=\s*["'']fornecedores\.html["'']') { continue }
    $match = [regex]::Match($conteudo, $padraoProdutos)
    if (-not $match.Success) { continue }
    Copy-Item -LiteralPath $caminho -Destination (Join-Path $backup $nome)
    $novo = $conteudo.Insert($match.Index + $match.Length, $link)
    [System.IO.File]::WriteAllText($caminho, $novo, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Atualizado: $nome" -ForegroundColor Green
    $atualizados++
}
Write-Host "`nConcluído! Acesso a Fornecedores adicionado em $atualizados página(s) administrativa(s)." -ForegroundColor Cyan
Write-Host "Backup criado em: $backup" -ForegroundColor Yellow
Write-Host 'Não foi feito commit nem push. Teste localmente antes de publicar.' -ForegroundColor Yellow
