# 🎓✨ Grimório de Giz: Worms Arcano

> **Artulharia Tática em Pixel Art 16-Bit com Magias da Natureza, Objetos Escolares e Física Aplicada**  
> **Design e Desenvolvimento:** [Diego Duenhas](https://diegoduenhas.com.br) — [diegoduenhas.com.br](https://diegoduenhas.com.br)

---

## 📖 1. Filosofia do Jogo

**Grimório de Giz: Worms Arcano** nasceu com o propósito de **reinventar o clássico gênero de artilharia por turnos (*Worms 1 / 1995*) sob uma ótica criativa, lúdica, não-violenta e profundamente pedagógica**.

Em vez do armamento bélico tradicional (bazucas, granadas e minas terrestres), o jogo transporta a física balística para o universo imaginativo de uma **sala de aula viva mesclada aos elementos da natureza**. O campo de batalha é um quadro-negro interativo e destrutível onde pequenas minhocas aprendizes utilizam **objetos escolares encantados** (borrachas, esquadros, compassos, aviões de papel, réguas de cristal) combinados a **forças naturais** (vento, correntes térmicas, água, sementes e eletricidade).

### Pilares de Design
1. **Aprendizagem Tangível pela Experimentação (Learning by Doing):** Cada disparo é um experimento prático de lançamento oblíquo, ângulo em graus, força percentual, gravidade e vetor de vento.
2. **Duas Gerações de Jogabilidade em Um Único Jogo:** Permite experimentar tanto a **1ª Versão (Mecânicas Simples / Retrô 1995)** — ideal para iniciantes e crianças mais novas — quanto a **2ª Versão (Mecânicas Modernas)** com rajadas dinâmicas de vento, correntes térmicas ascendentes, pulo duplo e zona de disparo crítico.
3. **Acessibilidade Multiplataforma (Desktop & Mobile Landscape):** No computador, oferece controles precisos de teclado/mouse; em celulares e tablets na horizontal (*landscape*), remove caixas opacas que cobririam a visão e adota **joystick analógico virtual translúcido (com sensibilidade ajustável)** e botões circulares de arcade.
4. **Cultura de Paz e Humor Escolar:** Nenhuma referência bélica ou sanguinolenta. Quando um personagem perde seus pontos de energia ou sai da arena, ele recebe avisos bem-humorados como *"Reprovado!"* ou *"Afogou na Tinta!"*.

---

## 🎨 2. Escolhas Narrativas e Direção de Arte

A narrativa visual parte da pergunta: *"E se os rabiscos feitos com giz no quadro-negro ganhassem vida após o sinal do recreio?"*

* **Estética Pixel Art 16-Bit ("Arcane Chalkboard"):** Paleta de alto contraste inspirada na superfície escura de uma lousa escolar (`#0F0E17`) contrastando com cores vibrantes de giz pastel e tinta guache (`#FFD166`, `#06D6A0`, `#EF476F`, `#4CC9F0`, `#9B5DE5`).
* **Biomas Temáticos Escolares (Terrenos 100% Destrutíveis Pixel a Pixel):**
  1. **Floresta do Quadro-Negro:** Lousa clássica coberta por musgo de giz verde e lagoa de tinta azul.
  2. **Laboratório de Química:** Bancadas cristalinas roxas sobre reagentes luminosos.
  3. **Geleira de Papel:** Folhas dobradas de caderno congeladas sob vento constante.
  4. **Observatório Astral:** Ruínas geométricas flutuantes onde a gravidade e os ventos desafiam a precisão.
* **Identidade e Expressividade (Vestiário Escolar):** Os jogadores personalizam suas equipes com chapéus de mago, capelos de formatura, coroas de folhas, boinas de arte, óculos de leitura, monóculos e varinhas feitas de lápis HB, canetas-tinteiro ou réguas de cristal.
* **Áudio Chiptune Sintetizado em Tempo Real:** Todos os efeitos sonoros são gerados proceduralmente via *Web Audio API* (ondas quadradas, triangulares e ruído branco de 16-bit), sem depender de arquivos pesados externos.

---

## 🖥️ 3. Telas e Fluxo de Experiência (UX/UI)

### 3.1. Tela Inicial — Seleção de Versão com Personagens Interativos
* Apresenta dois grandes cartões protagonizados por personagens em Pixel Art funcionando como botões principais:
  * **1ª Versão — Mecânicas Simples (Estilo Clássico 1995):** Vento fixo por turno, caminhada direta, pulo simples e barra de força linear.
  * **2ª Versão — Mecânicas Modernas (Física Dinâmica 2.0):** Vento vivo com rajadas senoidais, colunas térmicas ascendentes, pulo duplo, mortal acrobático e zona de disparo crítico (`86%–96%`).
* Inclui seletor rápido do modo **Eliminação Direta (K.O. Fora do Cenário)** e atalho para configurar equipes e cenários.

### 3.2. Arena de Batalha Principal (Canvas 1280×720 em Tela Cheia)
* **Movimento de Câmera de Evidência de Turno:** No início de cada turno (tanto no desktop quanto no mobile), a câmera realiza um **Zoom In (`2.15x`)** suave no personagem da vez com um halo dourado para evidenciar quem joga, retornando rapidamente ao **Plano Geral (`1.0x`)** para que o jogador visualize todos os adversários e planeje sua mira.
* **HUD Desktop (`>= 1024px`):** Barra superior com atalhos rápidos e doca inferior estilizada em pixel art exibindo a magia equipada, barra de força com marcação de zona crítica e status de XP.
* **HUD Mobile Translúcido (`< 1024px` - Otimizado para Horizontal/Landscape):**
  * Zero caixas opacas cobrindo o cenário.
  * **Canto Inferior Esquerdo:** Joystick analógico virtual translúcido (eixo horizontal para caminhar/virar; eixo vertical para ajustar o ângulo de mira com trava automática ao soltar o dedo) + botão de **Engrenagem (`⚙`)** ao lado.
  * **Canto Inferior Direito:** Botões circulares translúcidos para **Magia**, **Mortal**, **Pulo** e **ATIRAR**.

### 3.3. Calibragem de Sensibilidade do Joystick (`⚙`)
* Modal acessível pelo ícone de engrenagem ao lado do analógico que pausa o cronômetro do turno e permite ajustar:
  * **Predefinições Rápidas:** *Preciso (60%)*, *Padrão (100%)* e *Ágil (160%)*.
  * **Comportamento da Mira:** *Incremental (Sobe/desce e trava onde parar ao soltar o dedo)* ou *Direcional 360° (Aponta direto na direção do analógico)*.
  * **Sensibilidade da Mira Vertical (`25%` a `250%`)** e **Sensibilidade de Caminhada (`40%` a `200%`)**.
  * **Zona Morta Central / Deadzone (`8%` a `45%`)** com visualização em anel pontilhado dentro do joystick.
  * **Tamanho do Analógico (*Compacto*, *Médio*, *Grande*)**, **Inverter Eixo Y** e **Toque no Cenário**.

### 3.4. Grimório de Feitiços (Arsenal & Progressão de Níveis)
* Exibe as 10 magias divididas por nível de desbloqueio (Níveis 1 a 5), seus atributos (Dano, Raio de Cratera, Sensibilidade ao Vento, Munição por Partida) e inclui o botão **Modo Sandbox (Liberar Tudo)** para uso livre em sala de aula ou partidas rápidas.

### 3.5. Vestiário & Configuração de Partida
* Permite configurar de **2 a 4 equipes** (Multiplayer Local *Pass-and-Play* ou contra **IA / CPU** com simulação balística inteligente), renomear equipes, escolher o bioma e ativar/desativar o modo **Eliminação por Acerto Direto**.

### 3.6. Blueprint de Arquitetura Godot 4
* Exporta e documenta os scripts em **GDScript (`.gd`)** e *CanvasItem Shaders* equivalentes para portabilidade nativa na engine **Godot 4.x**.

---

## ⚙️ 4. Mecânicas de Jogo e Arsenal Arcano-Escolar

### Comparativo entre Versões de Jogabilidade

| Recurso / Mecânica | 1ª Versão: Mecânicas Simples | 2ª Versão: Mecânicas Modernas |
| :--- | :--- | :--- |
| **Comportamento do Vento** | Fixo durante todo o turno | Dinâmico em tempo real (rajadas + partículas visuais) |
| **Correntes Térmicas** | Desativadas | Colunas de ar quente ascendente que elevam projéteis e minhocas |
| **Mobilidade** | Caminhada clássica + Pulo simples | Física com inércia + Pulo Duplo + Salto Mortal Acrobático |
| **Barra de Disparo** | Carregamento linear simples | Barra oscilante com **Zona Crítica (`86%–96%`)** (+25% dano/raio) |
| **Previsão de Trajetória** | Pontilhado curto básico | Simulação balística estendida com alerta de alvo na mira |

### Modo Opcional: Eliminação por Acerto Direto (Fora do Cenário)
* **Padrão (Desativado):** Os feitiços subtraem pontos de vida (`HP`) proporcionalmente à distância do impacto.
* **Ativado nas Configurações:** Um impacto direto no oponente aplica um super-impulso que **arremessa o personagem girando para fora da tela** com rastro de estrelas e explosão *Star K.O.* nas bordas do cenário.

### As 10 Magias do Grimório (Progressão de Nível 1 a 5)
1. **🧽 Bomba Apagadora (Nv. 1 — Escolar):** Arremesso balístico clássico que apaga uma cratera circular no terreno.
2. **🖍️ Giz Explosivo (Nv. 1 — Escolar):** Quica no terreno antes de se dividir em 4 fragmentos coloridos de giz.
3. **🌊 Jato de Guache (Nv. 1 — Água):** Rajada tripla de tinta pressurizada com alto empurrão (*knockback*).
4. **☀️ Esfera Solar de Lupa (Nv. 2 — Fogo):** Feitiço ígneo veloz de trajetória tensa e baixa influência do vento.
5. **✈️ Aviãozinho de Vendaval (Nv. 2 — Vento):** Planador de papel com baixa gravidade que navega longas distâncias a favor do vento e das térmicas.
6. **⚡ Compasso Para-Raios (Nv. 3 — Raio):** Marca o ponto de impacto e invoca um relâmpago vertical do topo do cenário.
7. **🌿 Semente de Espinhos (Nv. 3 — Terra):** Além de causar dano, **constrói uma barreira vegetal de giz** no local do impacto, alterando a topografia do mapa.
8. **🎒 Mochila Pesada (Nv. 4 — Escolar):** Queda de altíssima gravidade que abre a maior cratera do jogo.
9. **☄️ Chuva de Transferidores (Nv. 5 — Arcano):** Invoca 3 meteoros geométricos em sequência diagonal.
10. **📏 Régua de Cristal — Teleporte (Nv. 5 — Arcano):**Reposiciona instantaneamente o jogador no ponto onde a régua tocar.

---

## 🎯 5. Faixa Etária Recomendada

* **Classificação Indicativa Sugerida:** **Livre para todos os públicos (L)** — 100% livre de violência realista, sangue ou linguagem imprópria.
* **Faixa Etária Pedagógica Ideal:** **8 a 16 anos** (do **3º ano do Ensino Fundamental** ao **Ensino Médio**), com excelente adaptação para cada ciclo:
  * **8 a 10 anos (Ensino Fundamental — Anos Iniciais):** Recomendado iniciar na **1ª Versão (Mecânicas Simples)** para trabalhar noções de direção, lateralidade, ângulo (alto/baixo), força (fraco/forte) e contagem regressiva.
  * **11 a 14 anos (Ensino Fundamental — Anos Finais):** Transição para a **2ª Versão (Mecânicas Modernas)**, explorando ângulos em graus positivos e negativos, soma de forças (vento favorável vs. vento contrário) e estratégia espacial.
  * **15 a 17+ anos (Ensino Médio e Adultos):** Análise completa de lançamento oblíquo, parábolas, gravidade diferenciada por massa do projétil, sustentação aerodinâmica em zonas térmicas e competição tática multiplayer.

---

## 🧠 6. Habilidades Educativas e Cognitivas Trabalhadas

1. **Intuição Física e Balística Prática:** Compreensão visual e imediata de como a combinação entre **ângulo de lançamento ($\theta$)** e **velocidade inicial ($v_0$)** determina o alcance horizontal e a altura máxima de uma parábola.
2. **Leitura de Vetores e Variáveis Ambientais:** Interpretação de indicadores numéricos e visuais de vento (`→ +4.2` ou `← -3.5`) e correntes ascendentes para compensar desvios de trajetória.
3. **Raciocínio Espacial e Geometria Aplicada:** Uso de tabelas (feitiços que quicam em ângulos reflexivos), estimativa de distâncias, raios de circunferência (crateras) e linha de visada.
4. **Tomada de Decisão sob Tempo Limitado:** O relógio de 40 segundos por turno estimula o planejamento rápido: posicionar-se, escolher a magia adequada ao relevo, calcular o disparo e executar.
5. **Gestão de Recursos e Energia:** Controle de munições limitadas por partida e administração da barra de energia (*stamina*) para caminhar, dar pulo duplo ou salto acrobático.
6. **Competências Socioemocionais (Multiplayer Local):** Alternância respeitosa de turnos (*Pass-and-Play*), trabalho em equipe, resiliência diante de erros de cálculo e aprendizagem iterativa (ajustar o próximo tiro com base no anterior).

---

## 📚 7. Alinhamento com a BNCC (Base Nacional Comum Curricular)

O jogo pode ser utilizado em projetos interdisciplinares, laboratórios de informática, clubes de robótica/games e aulas de **Matemática**, **Ciências da Natureza** e **Física**.

### 7.1. Competências Gerais da Educação Básica (BNCC)
* **Competência Geral 2 (Pensamento Científico, Crítico e Criativo):** Exercitar a curiosidade intelectual formulando hipóteses de trajetória ("Se o vento está contra em `-3.2`, preciso aumentar a força ou diminuir o ângulo?") e testando-as experimentalmente a cada turno.
* **Competência Geral 5 (Cultura Digital):** Compreender e utilizar tecnologias digitais de forma crítica, significativa e ética, incluindo a leitura do código-fonte aberto e dos scripts de física exportáveis para a engine **Godot 4**.
* **Competência Geral 9 (Empatia e Cooperação):** Exercitar o diálogo, a resolução de conflitos e a cooperação em partidas presenciais compartilhadas no mesmo dispositivo.

### 7.2. Habilidades de Matemática (Ensino Fundamental e Médio)
* **`(EF04MA16)` / `(EF05MA14)` — Localização e Movimentação no Plano:** Descrever deslocamentos e localização de pessoas e de objetos no espaço, utilizando direção, sentido e giros.
* **`(EF06MA25)` / `(EF06MA26)` — Ângulos (Noção, Usos e Medida):** Reconhecer a abertura do ângulo como grandeza associada às figuras geométricas e resolver situações-problema que envolvam a noção de ângulo em diferentes contextos (no jogo, o transferidor em tempo real mostra o ângulo exato em graus de `-24°` a `+81°`).
* **`(EF07MA17)` — Grandezas Diretamente e Inversamente Proporcionais:** Compreender a relação entre a porcentagem de força aplicada (`0%–100%`), a velocidade inicial do projétil e a distância percorrida.
* **`(EM13MAT302)` / `(EM13MAT402)` — Funções Polinomiais de 2º Grau (Parábolas):** Construir modelos empregando funções quadráticas para resolver problemas em contextos de movimento balístico e trajetórias parabólicas no plano cartesiano.

### 7.3. Habilidades de Ciências da Natureza e Física
* **`(EF07CI02)` — Temperatura, Calor e Correntes de Convecção:** Diferenciar temperatura e calor e compreender o fenômeno das **correntes térmicas ascendentes** (representadas nas colunas `↑ TÉRMICA` da 2ª Versão, onde o ar aquecido sobe e gera sustentação aerodinâmica).
* **`(EM13CNT101)` / `(EM13CNT204)` — Cinemática Vetorial, Gravidade e Conservação de Momento:** Elaborar explicações, previsões e cálculos a respeito dos movimentos de objetos na Terra a partir da análise de forças gravitacionais, resistência/arrasto do vento (`windFactor`), colisões elásticas/inelásticas (`bounces`) e conservação de quantidade de movimento (*knockback*).

---

## 🚀 8. Como Executar Localmente e Fazer Deploy na Vercel

### Pré-requisitos
* **Node.js** `>= 18.x` (ou **Bun**)

### Instalação e Execução em Desenvolvimento
```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento (porta 3000)
npm run dev
```

### Build de Produção e Deploy na Vercel
O repositório já inclui os arquivos `vercel.json` e `.npmrc` pré-configurados para deploy instantâneo na **Vercel**:
```bash
# Gerar pacote otimizado em /dist
npm run build
```
Basta conectar o repositório do GitHub na Vercel — o comando `npm run build` e o diretório de saída `dist` serão detectados automaticamente.

---

## 👨‍💻 9. Créditos e Autoria

* **Design, Concepção Pedagógica e Desenvolvimento:** **Diego Duenhas**
* **Website & Portfólio Oficial:** [diegoduenhas.com.br](https://diegoduenhas.com.br)
* **Tecnologias Utilizadas:** React 19, TypeScript, HTML5 Canvas 2D (Pixel Art Procedural), Web Audio API (Sintetizador 16-Bit), Tailwind CSS 4, Vite e Arquitetura Godot 4 (GDScript).
