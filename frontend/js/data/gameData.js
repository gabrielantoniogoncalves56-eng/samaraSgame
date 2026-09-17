/**
 * gameData.js
 * Definição central do jogo ROTAS — territórios, perfis migratórios e
 * suas regras de pontuação. Cada perfil foi mapeado a um conceito
 * exigido pelo tema: Imigração, Emigração, Êxodo Rural, Migrações
 * internas e Refúgio/Migrações internacionais.
 */

export const TERRITORIES = [
  { id: 'rural', name: 'Zona Rural', color: 'var(--terr-rural)', icon: 'tree',
    desc: 'Área de origem do êxodo rural — agropecuária e pequenas comunidades.' },
  { id: 'cidade-media', name: 'Cidade Média', color: 'var(--terr-cidade)', icon: 'building',
    desc: 'Centros regionais que recebem e distribuem fluxos migratórios internos.' },
  { id: 'periferia', name: 'Periferia Urbana', color: 'var(--terr-periferia)', icon: 'houses',
    desc: 'Bairros que crescem rapidamente com a chegada de migrantes do campo.' },
  { id: 'centro-urbano', name: 'Centro Urbano', color: 'var(--terr-centro)', icon: 'skyline',
    desc: 'Metrópoles — principal destino de migrações internas e internacionais.' },
  { id: 'fronteira', name: 'Fronteira Internacional', color: 'var(--terr-fronteira)', icon: 'flag',
    desc: 'Pontos de entrada e saída do país — imigração, emigração e refúgio.' },
];

export const PROFILES = [
  {
    id: 'exodo-rural',
    name: 'Êxodo Rural',
    icon: 'tractor',
    color: 'var(--prof-exodo)',
    concept: 'Migração interna do campo para a cidade',
    flavor: 'Famílias que deixam a lavoura em busca de emprego e serviços urbanos — o motor histórico da urbanização brasileira.',
    scoring: {
      type: 'diversity',
      label: 'Pontos por diversidade de território ao redor',
      table: [
        { k: '1 tipo ao redor', v: 1 }, { k: '2 tipos ao redor', v: 2 },
        { k: '3 tipos ao redor', v: 3 }, { k: '4 tipos ao redor', v: 4 },
        { k: '5 tipos ao redor', v: 5 },
      ],
      help: 'Cada peça deste perfil vale 1 ponto por tipo diferente de território adjacente (máx. 5). Some todos os seus migrantes de Êxodo Rural.',
    },
  },
  {
    id: 'migracao-interna',
    name: 'Migração Interna',
    icon: 'route',
    color: 'var(--prof-interna)',
    concept: 'Migrações internas e movimentos pendulares/sazonais no Brasil',
    flavor: 'Trabalhadores que se deslocam entre regiões do país — como o histórico fluxo Nordeste–Sudeste — de forma sazonal, pendular ou definitiva.',
    scoring: {
      type: 'line',
      label: 'Pontos por linha reta de 3 ou mais',
      table: [
        { k: '3 em linha', v: 3 }, { k: '4 em linha', v: 6 }, { k: '5 ou mais em linha', v: 10 },
      ],
      help: 'Conte linhas retas (horizontal, vertical ou diagonal) com 3+ peças deste perfil. Linhas podem se cruzar; cada linha conta uma vez.',
    },
  },
  {
    id: 'imigracao',
    name: 'Imigração',
    icon: 'planeLanding',
    color: 'var(--prof-imigracao)',
    concept: 'Chegada de estrangeiros para se estabelecer no país',
    flavor: 'Do ciclo do café aos fluxos venezuelanos e haitianos de hoje — pessoas que chegam de outros países e formam comunidades.',
    scoring: {
      type: 'group',
      label: 'Pontos por grupo conectado (4 ou mais)',
      table: [
        { k: 'Grupo de 4', v: 5 }, { k: 'Grupo de 5', v: 9 }, { k: 'Grupo de 6 ou mais', v: 14 },
      ],
      help: 'Conte grupos conectados (adjacentes) de 4 ou mais peças deste perfil. Grupos menores que 4 não pontuam.',
    },
  },
  {
    id: 'emigracao',
    name: 'Emigração',
    icon: 'planeTakeoff',
    color: 'var(--prof-emigracao)',
    concept: 'Saída de brasileiros em busca de trabalho no exterior',
    flavor: 'Dekasseguis no Japão, brasileiros nos EUA e em Portugal — quem parte em busca de novas oportunidades, mantendo laços com quem fica.',
    scoring: {
      type: 'pairs',
      label: 'Pontos por par adjacente',
      table: [
        { k: '1 par', v: 3 }, { k: '2 pares', v: 7 }, { k: '3 pares', v: 12 }, { k: '4 ou mais pares', v: 18 },
      ],
      help: 'Conte pares adjacentes deste perfil (representando o vínculo entre quem parte e a família que recebe as remessas). Cada peça só entra em um par.',
    },
  },
  {
    id: 'refugio',
    name: 'Refúgio e Migração Forçada',
    icon: 'shield',
    color: 'var(--prof-refugio)',
    concept: 'Deslocamento forçado internacional — guerras, perseguição e crises',
    flavor: 'Sírios, venezuelanos e outros povos deslocados à força por conflitos, perseguição ou crises humanitárias ao redor do mundo.',
    scoring: {
      type: 'isolated',
      label: 'Pontos por peça isolada',
      table: [
        { k: '1 isolado', v: 2 }, { k: '2 isolados', v: 5 }, { k: '3 isolados', v: 9 }, { k: '4 ou mais isolados', v: 14 },
      ],
      help: 'Conte peças deste perfil sem nenhuma outra do mesmo perfil adjacente — representando a dispersão forçada de quem foge.',
    },
  },
];

export const GAME_META = {
  title: 'ROTAS — Caminhos da Migração',
  subtitle: 'Imigração, Emigração, Êxodo Rural e os grandes movimentos migratórios do Brasil e do Mundo',
  players: '2 a 4 jogadores (ou grupos)',
  duration: '20 a 30 minutos',
  credit: '<a href="https://github.com/gabrielantoniogoncalves56-eng/samaraSgame" target="_blank">Link do Repositorio</a>'
};

export const PEDAGOGICAL_MAP = [
  { mechanic: 'Escolher e encaixar territórios', concept: 'Fatores de atração e repulsão (push/pull)' },
  { mechanic: 'Corredores de território', concept: 'Continuidade e consolidação de rotas migratórias' },
  { mechanic: 'Carta Êxodo Rural', concept: 'Migração interna do campo para a cidade' },
  { mechanic: 'Carta Migração Interna', concept: 'Deslocamentos sazonais, pendulares e regionais no Brasil' },
  { mechanic: 'Carta Imigração', concept: 'Chegada de estrangeiros e formação de comunidades' },
  { mechanic: 'Carta Emigração', concept: 'Saída de brasileiros e o papel das remessas' },
  { mechanic: 'Carta Refúgio', concept: 'Deslocamento forçado e crises humanitárias no mundo' },
  { mechanic: 'Cartas Desafio', concept: 'Consolidação de conceitos por meio de perguntas' },
  { mechanic: 'Bônus de maior corredor', concept: 'Polos de atração e concentração populacional' },
  { mechanic: 'Sorteio de tiles', concept: 'Imprevisibilidade dos fluxos migratórios reais' },
];
