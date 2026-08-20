# Os Seis Contra o Abismo: Sombras de Brentel

Um Action RPG 2D (estilo *Top-Down* Zelda) com estética 8-bits e atmosfera Dark Fantasy. Baseado no continente de Brentel, o jogo explora a brutalidade, o luto e a busca por vingança através de seis protagonistas únicos e habilidades assimétricas.

## 🛠️ Tecnologias e Arquitetura

O projeto foi construído focando em performance, simplicidade de deploy e desenvolvimento escalável:

* **Frontend (Game Engine):** [Phaser 3](https://phaser.io/) (Física Arcade, Spritesheets, Cenas)
* **Desenvolvimento e Build:** [Vite](https://vitejs.dev/) (Vanilla JS)
* **Hospedagem Alvo:** [Vercel](https://vercel.com/) (Deploy contínuo e Serverless Functions)
* **Estilo Visual:** 8-bits / Pixel Art

## 🕹️ Mecânicas Principais (Visão Geral)

* **Combate e Movimentação Real-Time:** Movimentação em 8 direções com foco em precisão e esquiva.
* **Sistema de Troca de Protagonista:** O controle alterna entre personagens específicos em pontos de controle (Checkpoints/Acampamentos).
* **Habilidades Assimétricas:**
  * **Rhogar Tordan:** Força bruta e combate corpo a corpo.
  * **Verônica Stínfy:** Magias arcanas de longo alcance.
  * **John Bardem:** Furtividade, arco e desarmamento de armadilhas.
  * **Traudon Balker:** Metamorfose druídica (Lobo e Coruja).

## 🚀 Como Rodar Localmente

Para rodar o projeto localmente para testes ou desenvolvimento, siga os passos:

1. **Pré-requisitos:** Certifique-se de ter o [Node.js](https://nodejs.org/) instalado.
2. **Clone o repositório:**
   ```bash
   git clone https://github.com/ojoesevero/rpg.git
   cd rpg
   ```
3. **Instale as dependências:**
   ```bash
   npm install
   ```
4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
5. **Abra no navegador:**
   O Vite exibirá no console a URL local (geralmente `http://localhost:5173`).

## 🗺️ Roadmap de Desenvolvimento

* **Fase 1: Setup e Movimentação** (Concluído ✅)
  - Configuração do Vite, Vercel e Phaser 3.
  - Cena inicial com movimentação 8-way do *placeholder*.
* **Fase 2: Mundo e Colisões** (Em breve 🚧)
  - Importação de *tilesets* e mapas (Tiled).
  - Câmera dinâmica e colisões de cenário.
* **Fase 3: Combate e Animação**
  - Sprites animados, hitboxes, inteligência artificial inimiga.
* **Fase 4: Backend e Estado do Jogo**
  - Integração Serverless para salvar/carregar progresso (`/api/save`).

---
*Este projeto está em desenvolvimento ativo. As informações acima refletem o GDD atual.*