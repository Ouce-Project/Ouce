<div align="center">

<img src="assets/logo1.png" alt="Ouce" width="120">

# Ouce

Player de música no navegador com slowed, reverb e speed up em tempo real. Cada pessoa guarda a própria biblioteca, monta playlists e pode publicar faixas para qualquer um ouvir.

![Supabase](https://img.shields.io/badge/Supabase-0330ef?style=flat-square&labelColor=0B0B0B&logo=supabase&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-0330ef?style=flat-square&labelColor=0B0B0B&logo=nodedotjs&logoColor=white)
![Web Audio](https://img.shields.io/badge/Web_Audio-API-0330ef?style=flat-square&labelColor=0B0B0B)
![ES Modules](https://img.shields.io/badge/JavaScript-ES_Modules-0330ef?style=flat-square&labelColor=0B0B0B&logo=javascript&logoColor=white)
![Remix Icon](https://img.shields.io/badge/Remix_Icon-4.6-0330ef?style=flat-square&labelColor=0B0B0B)
![Licença](https://img.shields.io/badge/licen%C3%A7a-PolyForm--Noncommercial--1.0.0-0330ef?style=flat-square&labelColor=0B0B0B)

</div>

## Instalação

Requer Node.js 20+ (só para servir os arquivos) e um projeto no [Supabase](https://supabase.com).

```bash
git clone https://github.com/xMqRs/ouce
cd ouce
cp js/config.example.js js/config.js
```

Não há dependências para instalar. O site é HTML, CSS e módulos ES puros.

## Configuração

Edite `js/config.js`:

| Variável | Obrigatória | Padrão |
|---|---|---|
| `supabaseUrl` | Sim | nenhum |
| `supabaseAnonKey` | Sim | nenhum |
| `bucket` | Não | `audio` |

> [!IMPORTANT]
> Rode `supabase/schema.sql` no SQL Editor do seu projeto antes de abrir o site. Sem ele não existem as tabelas, o bucket nem as políticas, e login, histórico, playlists e biblioteca pública não funcionam.

A chave `anon` é pública por natureza: ela vai para o navegador de qualquer jeito. Quem protege os dados são as políticas de RLS do `schema.sql`. Nunca use a chave `service_role` aqui.

O schema foi reconstruído a partir de como o código usa as tabelas. Se você já tem um banco rodando, confira os tipos das colunas antes de aplicar.

## Execução

```bash
npm run dev
```

Abra `http://localhost:3000`. Abrir o `index.html` direto pelo explorador de arquivos não funciona, porque o site usa módulos ES e o navegador bloqueia imports em `file://`.

## O que tem

- Slowed, speed up, reverb e grave ajustáveis na hora, com presets
- Vinil que gira junto com a velocidade e equalizador de fundo que reage ao áudio
- Modo foco com cartão largo e painel de efeitos flutuante
- A cor do site acompanha a capa da música, ou fica na cor que você escolher em hex
- Histórico, playlists e biblioteca pública com login
- Upload por clique ou arrastando arquivos, com capa lida direto do MP3
- Layout para desktop e celular

## Como o som é processado

| Controle | Faixa | O que faz |
|---|---|---|
| Slowed | 0 a 100% | Velocidade de 1.00x até 0.50x |
| Speed up | 0 a 100% | Velocidade de 1.00x até 1.80x |
| Reverb | 0 a 100% | Mistura o áudio com uma resposta de impulso de 3 s |
| Grave | 0 a 100% | Realce de até +15 dB abaixo de 140 Hz |

Slowed e speed up se anulam. O tom acompanha a velocidade (`preservesPitch` desligado), como num vinil de verdade.

## Cores

| Uso | Hex |
|---|---|
| Principal | ![#0330ef](https://img.shields.io/badge/-%230330EF-0330ef?style=flat-square) |
| Preto | ![#0B0B0B](https://img.shields.io/badge/-%230B0B0B-0B0B0B?style=flat-square) |
| Cinza escuro | ![#0F0F0F](https://img.shields.io/badge/-%230F0F0F-0F0F0F?style=flat-square) |

Os tons de destaque (`--accent-hi`, `--accent-lo`) são derivados da cor principal em `js/theme.js`. A cor escolhida fica no `localStorage` (`ouce_pref_accent`); a que vem da capa vale só para a música atual e some ao recarregar.

## Atalhos

| Tecla | Ação |
|---|---|
| `Espaço` | Tocar ou pausar |
| `←` `→` | Voltar ou avançar 5 s |
| `N` `P` | Próxima e anterior |
| `F` | Modo foco |
| `Esc` | Fechar painel de efeitos ou sair do foco |

## Estrutura

```
ouce/
├─ index.html
├─ assets/logo.svg
├─ css/
│  ├─ tokens.css        cores e variáveis
│  ├─ base.css          reset, fundo, abertura
│  ├─ layout.css        barra lateral e telas
│  ├─ player.css        cartão do player e efeitos
│  ├─ focus.css         modo foco
│  ├─ library.css       listas, playlists, mini player
│  ├─ components.css    botões, diálogos, avisos
│  └─ responsive.css    telas pequenas e toque
├─ js/
│  ├─ main.js           ponto de entrada
│  ├─ config.example.js modelo da configuração
│  ├─ supabase.js       cliente
│  ├─ state.js          estado global e elemento de áudio
│  ├─ engine.js         grafo do Web Audio (reverb, grave)
│  ├─ player.js         reprodução e fila
│  ├─ effects.js        sliders e presets
│  ├─ library.js        listas e abas
│  ├─ tracks.js         envio, edição, publicação, exclusão
│  ├─ playlists.js      playlists
│  ├─ auth.js           login, cadastro, foto de perfil
│  ├─ theme.js          cor automática pela capa
│  ├─ views.js          troca de telas e modo foco
│  ├─ visuals.js        equalizador de fundo e animações
│  ├─ stats.js          contadores do site
│  ├─ ui.js             avisos e utilitários de interface
│  └─ lib/              funções puras (dom, imagem, ID3, efeitos)
└─ supabase/schema.sql  tabelas, funções e políticas
```

## Licença

[PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/). O código é aberto para leitura: você pode estudar, copiar para uso pessoal e modificar. Uso comercial precisa de autorização do autor. Veja o arquivo `LICENSE`.
