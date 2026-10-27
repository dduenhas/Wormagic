import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  GraduationCap,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

interface PedagogicalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FULL_PEDAGOGICAL_TEXT = `GRIMÓRIO DE GIZ: WORMS ARCANO
Artilharia Tática em Pixel Art 16-Bit com Magias da Natureza, Objetos Escolares e Física Aplicada
Design e Desenvolvimento: Diego Duenhas - diegoduenhas.com.br

====================================================================
1. FILOSOFIA DO JOGO
====================================================================
Grimório de Giz: Worms Arcano nasceu com o propósito de reinventar o clássico gênero de artilharia por turnos (Worms 1 / 1995) sob uma ótica criativa, lúdica, não-violenta e profundamente pedagógica.

Em vez do armamento bélico tradicional (bazucas, granadas e minas terrestres), o jogo transporta a física balística para o universo imaginativo de uma sala de aula viva mesclada aos elementos da natureza. O campo de batalha é um quadro-negro interativo e destrutível onde pequenas minhocas aprendizes utilizam objetos escolares encantados (borrachas, esquadros, compassos, aviões de papel, réguas de cristal) combinados a forças naturais (vento, correntes térmicas, água, sementes e eletricidade).

Pilares de Design:
1. Aprendizagem Tangível pela Experimentação (Learning by Doing): Cada disparo é um experimento prático de lançamento oblíquo, ângulo em graus, força percentual, gravidade e vetor de vento.
2. Duas Gerações de Jogabilidade em Um Único Jogo: Permite experimentar tanto a 1ª Versão (Mecânicas Simples / Retrô 1995) — ideal para iniciantes e crianças mais novas — quanto a 2ª Versão (Mecânicas Modernas) com rajadas dinâmicas de vento, correntes térmicas ascendentes, pulo duplo e zona de disparo crítico.
3. Modos Solitário (Player vs CPU) e Coletivo (Multiplayer Local): Permite tanto o treino individual contra a Inteligência Artificial balística do computador quanto partidas em dupla ou grupo no mesmo dispositivo.
4. Cultura de Paz e Humor Escolar: Nenhuma referência bélica ou sanguinolenta. Quando um personagem perde seus pontos de energia ou sai da arena, recebe avisos bem-humorados como "Reprovado!" ou "Afogou na Tinta!".

====================================================================
2. ESCOLHAS NARRATIVAS E DIREÇÃO DE ARTE
====================================================================
A narrativa visual parte da pergunta: "E se os rabiscos feitos com giz no quadro-negro ganhassem vida após o sinal do recreio?"

- Estética Pixel Art 16-Bit ("Arcane Chalkboard"): Paleta de alto contraste inspirada na superfície escura de uma lousa escolar (#0F0E17) contrastando com cores vibrantes de giz pastel e tinta guache (#FFD166, #06D6A0, #EF476F, #4CC9F0, #9B5DE5).
- Biomas Temáticos Escolares (Terrenos 100% Destrutíveis Pixel a Pixel):
  1. Floresta do Quadro-Negro: Lousa clássica coberta por musgo de giz verde e lagoa de tinta azul.
  2. Arquipélago de Aquarela: Ilhas flutuantes de papel Canson e guache vibrante.
  3. Ruínas da Biblioteca Arcana: Montanhas de grimórios antigos e pergaminhos petrificados.
  4. Bancada de Botânica: Terreno de raízes gigantes, cristais de giz e seiva luminosa.
- Identidade e Expressividade (Vestiário Escolar): Chapéus de mago, capelos de formatura, coroas de folhas, boinas de arte, óculos de biblioteca, monóculos e varinhas feitas de lápis HB, galhos de carvalho, canetas-tinteiro ou réguas de quartzo.
- Áudio Chiptune Sintetizado em Tempo Real: Todos os efeitos sonoros são gerados proceduralmente via Web Audio API (ondas quadradas, triangulares e ruído branco de 16-bit).

====================================================================
3. TELAS, MODOS E MECÂNICAS DE JOGO
====================================================================
- Tela Inicial Interativa: Seleção entre 1ª Versão (Mecânicas Simples) e 2ª Versão (Mecânicas Modernas), além da escolha rápida entre Jogar contra o Computador (Player vs CPU) ou Multiplayer Local (Player vs Player).
- Movimento de Câmera de Evidência de Turno: Zoom In (2.15x) no personagem ativo no início de cada turno com retorno automático ao Plano Geral (1.0x) para leitura completa do cenário.
- Controles Adaptativos (Desktop & Mobile Landscape): Teclado e mouse no desktop; joystick analógico virtual translúcido com calibragem de sensibilidade (engrenagem) e botões circulares de arcade em dispositivos móveis na horizontal.
- Sistema de Progressão por XP (Níveis 1 a 5): 10 feitiços desbloqueáveis baseados em elementos da natureza e objetos escolares, com opção de Modo Sandbox (Liberar Tudo) para uso imediato em sala de aula.
- Eliminação por Acerto Direto (Opcional): Permite ativar o modo K.O. Direto, que arremessa o oponente para fora do cenário com animação acrobática de estrelas ao ser atingido em cheio.

====================================================================
4. FAIXA ETÁRIA RECOMENDADA
====================================================================
- Classificação Indicativa Sugerida: Livre para todos os públicos (L) — 100% livre de violência realista.
- Faixa Etária Pedagógica Ideal: 8 a 16+ anos (do 3º ano do Ensino Fundamental ao Ensino Médio):
  * 8 a 10 anos (Ensino Fundamental - Anos Iniciais): Recomendado iniciar na 1ª Versão (Mecânicas Simples) para trabalhar noções de direção, lateralidade, ângulo (alto/baixo), força (fraco/forte) e contagem regressiva.
  * 11 a 14 anos (Ensino Fundamental - Anos Finais): Transição para a 2ª Versão (Mecânicas Modernas), explorando ângulos em graus positivos e negativos, soma de forças (vento favorável vs. vento contrário) e estratégia espacial.
  * 15 a 17+ anos (Ensino Médio e Adultos): Análise completa de lançamento oblíquo, parábolas, gravidade diferenciada por massa do projétil, sustentação aerodinâmica em zonas térmicas e competição tática.

====================================================================
5. HABILIDADES EDUCATIVAS E COGNITIVAS TRABALHADAS
====================================================================
1. Intuição Física e Balística Prática: Compreensão visual de como a combinação entre ângulo de lançamento e velocidade inicial determina o alcance horizontal e a altura máxima de uma parábola.
2. Leitura de Vetores e Variáveis Ambientais: Interpretação de indicadores numéricos e visuais de vento e correntes térmicas ascendentes para compensar desvios de trajetória.
3. Raciocínio Espacial e Geometria Aplicada: Estimativa de distâncias, ângulos de reflexão em quiques, raios de circunferência (crateras) e linha de visada.
4. Tomada de Decisão sob Tempo Limitado: Planejamento tático dentro da janela de 40 segundos por turno.
5. Gestão de Recursos e Energia: Administração de munições limitadas por partida e barra de stamina para locomoção e acrobacias.
6. Competências Socioemocionais: Alternância respeitosa de turnos, resiliência diante de erros de cálculo e ajuste iterativo de hipóteses.

====================================================================
6. ALINHAMENTO COM A BNCC (BASE NACIONAL COMUM CURRICULAR)
====================================================================
Competências Gerais da Educação Básica:
- Competência Geral 2 (Pensamento Científico, Crítico e Criativo): Exercitar a curiosidade intelectual formulando hipóteses de trajetória e testando-as experimentalmente a cada turno.
- Competência Geral 5 (Cultura Digital): Compreender e utilizar tecnologias digitais de forma crítica e significativa, incluindo a leitura dos scripts de física exportáveis para Godot 4.
- Competência Geral 9 (Empatia e Cooperação): Exercitar o diálogo, a resolução de conflitos e a cooperação em partidas presenciais compartilhadas.

Habilidades de Matemática (Ensino Fundamental e Médio):
- (EF04MA16) / (EF05MA14) — Localização e Movimentação no Plano: Descrever deslocamentos e localização de objetos no espaço, utilizando direção, sentido e giros.
- (EF06MA25) / (EF06MA26) — Ângulos (Noção, Usos e Medida): Reconhecer a abertura do ângulo como grandeza associada às direções e resolver situações-problema que envolvam medida de ângulos em graus (-24° a +81°).
- (EF07MA17) — Grandezas Diretamente e Inversamente Proporcionais: Compreender a relação entre a porcentagem de força aplicada (0%–100%), a velocidade inicial do projétil e a distância percorrida.
- (EM13MAT302) / (EM13MAT402) — Funções Polinomiais de 2º Grau (Parábolas): Construir e interpretar modelos empregando funções quadráticas em contextos de movimento balístico e trajetórias parabólicas no plano cartesiano.

Habilidades de Ciências da Natureza e Física:
- (EF07CI02) — Temperatura, Calor e Correntes de Convecção: Compreender o fenômeno das correntes térmicas ascendentes (representadas nas colunas ↑ TÉRMICA da 2ª Versão, onde o ar aquecido sobe e gera sustentação aerodinâmica).
- (EM13CNT101) / (EM13CNT204) — Cinemática Vetorial, Gravidade e Conservação de Momento: Elaborar previsões a respeito dos movimentos de objetos a partir da análise de forças gravitacionais, arrasto do vento, colisões e conservação de quantidade de movimento (knockback).

====================================================================
CRÉDITOS E AUTORIA
====================================================================
Design e Desenvolvimento: Diego Duenhas
Website: https://diegoduenhas.com.br`;

export const PedagogicalModal: React.FC<PedagogicalModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(FULL_PEDAGOGICAL_TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = FULL_PEDAGOGICAL_TEXT;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 p-0 sm:p-4 md:p-6">
      <div className="pixel-panel w-full max-w-4xl max-h-[94dvh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-[#242038] border-b-2 border-[#3D3859] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-[#FFD166]/15 border-2 border-[#FFD166] flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-[#FFD166]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-pixel text-xs sm:text-sm text-[#FFD166] truncate">
                FUNDAMENTAÇÃO PEDAGÓGICA & BNCC
              </h2>
              <p className="text-[11px] font-mono-num text-[#A7A9BE] truncate">
                Filosofia do Jogo · Habilidades Educativas · Texto Selecionável e Copiável
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyAll}
              className={`pixel-btn min-h-[38px] px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 ${
                copied
                  ? 'bg-[#06D6A0] text-[#0F0E17] border-[#06D6A0]'
                  : 'bg-[#2C2747] hover:bg-[#3B345E] text-[#FFD166] border-[#FFD166]'
              }`}
              title="Copiar toda a fundamentação pedagógica para a área de transferência"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Copiar Tudo</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="pixel-btn min-h-[38px] min-w-[38px] bg-[#EF476F] hover:bg-[#D93860] p-2 text-[#F4F1DE] flex items-center justify-center"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selectable & Copyable Content Body */}
        <div
          className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-[#F4F1DE] leading-relaxed select-text cursor-text"
          style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
        >
          {/* Author & Credits Banner */}
          <div className="bg-[#181528] border-2 border-[#FFD166] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-mono-num text-[#06D6A0] uppercase tracking-wider">
                Autoria, Concepção Pedagógica & Game Design
              </div>
              <div className="font-silk text-sm sm:text-base font-bold text-[#FFD166] mt-0.5">
                Design e Desenvolvimento: Diego Duenhas
              </div>
              <p className="text-xs text-[#A7A9BE] mt-0.5">
                Dica: Você pode selecionar qualquer trecho abaixo com o mouse ou toque para copiar, ou usar o botão &ldquo;Copiar Tudo&rdquo; no topo.
              </p>
            </div>
            <a
              href="https://diegoduenhas.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="pixel-btn min-h-[40px] bg-[#FFD166] text-[#0F0E17] border-[#FFD166] px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>diegoduenhas.com.br</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Section 1: Filosofia do Jogo */}
          <section className="bg-[#141220] border border-[#3D3859] p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#FFD166]">
              <Sparkles className="w-4 h-4 shrink-0" />
              <h3 className="font-pixel text-xs sm:text-sm">
                1. FILOSOFIA DO JOGO
              </h3>
            </div>
            <p className="text-[#F4F1DE]/90">
              <strong>Grimório de Giz: Worms Arcano</strong> nasceu com o propósito de{' '}
              <strong>
                reinventar o clássico gênero de artilharia por turnos (Worms 1 / 1995) sob uma ótica criativa, lúdica, não-violenta e profundamente pedagógica
              </strong>.
            </p>
            <p className="text-[#A7A9BE]">
              Em vez do armamento bélico tradicional (bazucas, granadas e minas terrestres), o jogo transporta a física balística para o universo imaginativo de uma{' '}
              <strong className="text-[#F4F1DE]">
                sala de aula viva mesclada aos elementos da natureza
              </strong>
              . O campo de batalha é um quadro-negro interativo e destrutível onde pequenas minhocas aprendizes utilizam objetos escolares encantados (borrachas, esquadros, compassos, aviões de papel, réguas de cristal) combinados a forças naturais (vento, correntes térmicas, água, sementes e eletricidade).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="bg-[#1A1829] border border-[#2E2A44] p-3">
                <div className="font-silk text-xs font-bold text-[#06D6A0]">
                  Aprendizagem pela Experimentação
                </div>
                <p className="text-xs text-[#A7A9BE] mt-1">
                  Cada disparo funciona como um laboratório prático de lançamento oblíquo, estimativa de ângulo em graus, força percentual, gravidade e decomposição vetorial do vento.
                </p>
              </div>
              <div className="bg-[#1A1829] border border-[#2E2A44] p-3">
                <div className="font-silk text-xs font-bold text-[#FFD166]">
                  Cultura de Paz & Humor Escolar
                </div>
                <p className="text-xs text-[#A7A9BE] mt-1">
                  Livre de referências bélicas ou violência gráfica. Quando um personagem perde seus pontos de energia ou sai da arena, recebe avisos bem-humorados como &ldquo;Reprovado!&rdquo; ou &ldquo;Afogou na Tinta!&rdquo;.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Escolhas Narrativas e Mecânicas */}
          <section className="bg-[#141220] border border-[#3D3859] p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#06D6A0]">
              <BookOpen className="w-4 h-4 shrink-0" />
              <h3 className="font-pixel text-xs sm:text-sm">
                2. ESCOLHAS NARRATIVAS, TELAS E MECÂNICAS
              </h3>
            </div>
            <p className="text-[#A7A9BE]">
              A narrativa visual parte da pergunta:{' '}
              <em className="text-[#F4F1DE]">
                &ldquo;E se os rabiscos feitos com giz no quadro-negro ganhassem vida após o sinal do recreio?&rdquo;
              </em>
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-[#F4F1DE]/90 list-disc pl-5">
              <li>
                <strong>Duas Versões de Jogabilidade Selecionáveis:</strong> A{' '}
                <span className="text-[#FFD166] font-semibold">1ª Versão (Mecânicas Simples)</span>{' '}
                traz vento fixo por turno, caminhada direta e barra de força linear — ideal para iniciantes e turmas mais novas. A{' '}
                <span className="text-[#06D6A0] font-semibold">2ª Versão (Mecânicas Modernas)</span>{' '}
                adiciona vento dinâmico com rajadas em tempo real, colunas térmicas ascendentes (<code>↑ TÉRMICA</code>), pulo duplo, salto mortal acrobático e zona de disparo crítico (<code>86%–96%</code>).
              </li>
              <li>
                <strong>Modos Player vs CPU e Multiplayer Local:</strong> Permite jogar sozinho contra a Inteligência Artificial do computador (que simula trajetórias balísticas e escolhe magias do grimório) ou em partidas locais de 2 a 4 equipes humanas compartilhando o dispositivo.
              </li>
              <li>
                <strong>Câmera de Evidência de Turno & Controles Mobile Translúcidos:</strong> Ao iniciar cada turno, a câmera aplica um zoom suave no personagem da vez e retorna rapidamente ao Plano Geral para visualização completa dos oponentes. No mobile horizontal, utiliza joystick analógico translúcido com calibragem de sensibilidade (<code>⚙</code>).
              </li>
              <li>
                <strong>Arsenal de 10 Magias Escolares e da Natureza (Níveis 1 a 5):</strong> Bomba Apagadora, Giz Explosivo, Jato de Guache, Esfera Solar de Lupa, Aviãozinho de Vendaval, Compasso Para-Raios, Semente de Espinhos (que constrói barreiras vegetais), Mochila Pesada, Chuva de Transferidores e Régua de Cristal (Teleporte).
              </li>
            </ul>
          </section>

          {/* Section 3: Idades Recomendadas e Habilidades Educativas */}
          <section className="bg-[#141220] border border-[#3D3859] p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#4CC9F0]">
              <Users className="w-4 h-4 shrink-0" />
              <h3 className="font-pixel text-xs sm:text-sm">
                3. IDADES RECOMENDADAS E HABILIDADES TRABALHADAS
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#1A1829] border border-[#3D3859] p-3">
                <div className="font-mono-num text-xs font-bold text-[#FFD166]">
                  8 a 10 ANOS · ANOS INICIAIS (EF1)
                </div>
                <p className="text-xs text-[#A7A9BE] mt-1">
                  Recomendado iniciar na <strong>1ª Versão (Mecânicas Simples)</strong>. Trabalha lateralidade, direção e sentido, noção intuitiva de ângulo (alto/baixo), proporção de força (fraco/forte) e tomada de decisão em turnos.
                </p>
              </div>
              <div className="bg-[#1A1829] border border-[#3D3859] p-3">
                <div className="font-mono-num text-xs font-bold text-[#06D6A0]">
                  11 a 14 ANOS · ANOS FINAIS (EF2)
                </div>
                <p className="text-xs text-[#A7A9BE] mt-1">
                  Transição para a <strong>2ª Versão (Mecânicas Modernas)</strong>. Explora leitura de ângulos em graus (<code>-24° a +81°</code>), adição e oposição de vetores (vento a favor vs. contra), convecção térmica e estratégia geométrica.
                </p>
              </div>
              <div className="bg-[#1A1829] border border-[#3D3859] p-3">
                <div className="font-mono-num text-xs font-bold text-[#4CC9F0]">
                  15 a 17+ ANOS · ENSINO MÉDIO
                </div>
                <p className="text-xs text-[#A7A9BE] mt-1">
                  Análise aprofundada de cinemática vetorial, lançamento oblíquo, funções quadráticas (parábolas), gravidade diferenciada por massa, conservação de momento (knockback) e lógica de programação (Godot 4).
                </p>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="font-silk text-xs font-bold text-[#F4F1DE] mb-1.5">
                Habilidades Cognitivas e Socioemocionais Desenvolvidas:
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#A7A9BE]">
                <li className="bg-[#1A1829] p-2.5 border border-[#2E2A44]">
                  <strong className="text-[#F4F1DE]">Intuição Balística:</strong> Relação prática entre ângulo ($\theta$), velocidade inicial ($v_0$) e alcance parabólico.
                </li>
                <li className="bg-[#1A1829] p-2.5 border border-[#2E2A44]">
                  <strong className="text-[#F4F1DE]">Leitura de Variáveis Ambientais:</strong> Compensação dinâmica da força do vento e uso de correntes ascendentes.
                </li>
                <li className="bg-[#1A1829] p-2.5 border border-[#2E2A44]">
                  <strong className="text-[#F4F1DE]">Gestão de Tempo e Recursos:</strong> Planejamento sob o cronômetro de 40s, controle de stamina e estoque de magias.
                </li>
                <li className="bg-[#1A1829] p-2.5 border border-[#2E2A44]">
                  <strong className="text-[#F4F1DE]">Aprendizagem Iterativa:</strong> Formulação de hipóteses, observação do erro e refinamento da mira no turno seguinte.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4: Alinhamento com a BNCC */}
          <section className="bg-[#141220] border-2 border-[#06D6A0] p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-[#06D6A0]">
              <GraduationCap className="w-5 h-5 shrink-0" />
              <h3 className="font-pixel text-xs sm:text-sm">
                4. ALINHAMENTO DETALHADO COM A BNCC
              </h3>
            </div>

            {/* Competências Gerais */}
            <div className="space-y-2">
              <h4 className="font-silk text-xs font-bold text-[#FFD166]">
                Competências Gerais da Educação Básica (BNCC)
              </h4>
              <div className="space-y-1.5 text-xs text-[#A7A9BE]">
                <p>
                  • <strong className="text-[#F4F1DE]">Competência Geral 2 (Pensamento Científico, Crítico e Criativo):</strong> Exercitar a curiosidade intelectual formulando hipóteses de trajetória (&ldquo;Se o vento está contra em -3.2, devo elevar o ângulo ou aumentar a potência?&rdquo;) e testando-as experimentalmente.
                </p>
                <p>
                  • <strong className="text-[#F4F1DE]">Competência Geral 5 (Cultura Digital):</strong> Utilizar tecnologias digitais de forma crítica e significativa, compreendendo os algoritmos de simulação física e os scripts exportáveis para a engine Godot 4.
                </p>
                <p>
                  • <strong className="text-[#F4F1DE]">Competência Geral 9 (Empatia e Cooperação):</strong> Exercitar o diálogo, a alternância respeitosa de turnos e a resolução de conflitos em partidas presenciais compartilhadas.
                </p>
              </div>
            </div>

            {/* Matemática */}
            <div className="space-y-2 border-t border-[#2E2A44] pt-3">
              <h4 className="font-silk text-xs font-bold text-[#4CC9F0]">
                Matemática e suas Tecnologias (Ensino Fundamental e Médio)
              </h4>
              <div className="space-y-2 text-xs text-[#A7A9BE]">
                <p>
                  • <code className="text-[#FFD166] font-mono-num font-bold">(EF04MA16) / (EF05MA14)</code> — <strong className="text-[#F4F1DE]">Localização e Movimentação no Plano:</strong> Descrever e interpretar deslocamentos e localização de personagens e alvos no espaço bidimensional utilizando direção, sentido e coordenadas.
                </p>
                <p>
                  • <code className="text-[#FFD166] font-mono-num font-bold">(EF06MA25) / (EF06MA26)</code> — <strong className="text-[#F4F1DE]">Ângulos (Noção, Usos e Medida em Graus):</strong> Reconhecer a abertura do ângulo como grandeza associada às direções de lançamento e resolver situações-problema utilizando o transferidor visual em tempo real do jogo (<code>-24° a +81°</code>).
                </p>
                <p>
                  • <code className="text-[#FFD166] font-mono-num font-bold">(EF07MA17)</code> — <strong className="text-[#F4F1DE]">Grandezas Diretamente e Inversamente Proporcionais:</strong> Compreender a proporcionalidade entre a porcentagem de força aplicada (<code>0%–100%</code>), a velocidade inicial do projétil e a distância horizontal atingida.
                </p>
                <p>
                  • <code className="text-[#FFD166] font-mono-num font-bold">(EM13MAT302) / (EM13MAT402)</code> — <strong className="text-[#F4F1DE]">Funções Polinomiais de 2º Grau (Parábolas):</strong> Construir e interpretar modelos que empregam funções quadráticas para descrever o movimento balístico e as curvas parabólicas sob ação da gravidade.
                </p>
              </div>
            </div>

            {/* Ciências da Natureza / Física */}
            <div className="space-y-2 border-t border-[#2E2A44] pt-3">
              <h4 className="font-silk text-xs font-bold text-[#06D6A0]">
                Ciências da Natureza e Física (Ensino Fundamental e Médio)
              </h4>
              <div className="space-y-2 text-xs text-[#A7A9BE]">
                <p>
                  • <code className="text-[#06D6A0] font-mono-num font-bold">(EF07CI02)</code> — <strong className="text-[#F4F1DE]">Temperatura, Calor e Correntes de Convecção:</strong> Compreender o fenômeno físico das correntes térmicas ascendentes (representadas nas colunas <code>↑ TÉRMICA</code> da 2ª Versão, onde o ar aquecido sobe e gera força de sustentação em planadores como o Aviãozinho de Papel).
                </p>
                <p>
                  • <code className="text-[#06D6A0] font-mono-num font-bold">(EM13CNT101) / (EM13CNT204)</code> — <strong className="text-[#F4F1DE]">Cinemática Vetorial, Gravidade e Conservação de Momento:</strong> Elaborar explicações e previsões sobre o movimento de corpos lançados obliquamente analisando a aceleração gravitacional diferenciada por massa (ex.: Mochila Pesada vs. Avião de Papel), o arrasto lateral do vento (<code>windFactor</code>), colisões elásticas (quiques do Giz Explosivo) e conservação de quantidade de movimento (impulso de knockback).
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Footer */}
        <div className="px-4 sm:px-6 py-3 bg-[#1A1829] border-t-2 border-[#3D3859] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-mono-num text-[#A7A9BE]">
            Design e Desenvolvimento:{' '}
            <a
              href="https://diegoduenhas.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FFD166] underline hover:text-[#06D6A0] font-bold"
            >
              Diego Duenhas - diegoduenhas.com.br
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="pixel-btn min-h-[38px] bg-[#242038] hover:bg-[#322C4D] px-3.5 py-1.5 text-xs font-semibold text-[#FFD166] flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Texto Copiado!' : 'Copiar Texto Completo'}
            </button>
            <button
              onClick={onClose}
              className="pixel-btn min-h-[38px] bg-[#06D6A0] px-5 py-1.5 text-xs font-bold text-[#0F0E17] border-[#06D6A0]"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
