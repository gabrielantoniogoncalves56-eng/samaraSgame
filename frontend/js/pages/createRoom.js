/**
 * createRoom.js — TELA 2: CRIAR SALA
 */
import { navigate } from '../core/router.js';
import { API } from '../api/api.js';
import { toast, apiErrorToast } from '../ui/toast.js';
import { withLoading } from '../ui/loading.js';
import { sfx } from '../ui/sound.js';
import { setState } from '../core/state.js';
import { saveSession } from '../core/storage.js';
import { CATEGORIES, MODES, DIFFICULTIES, QUESTION_COUNTS, QUESTION_TIMES, CATEGORY_ICONS } from '../data/constants.js';

export const createRoomPage = {
  render(root) {
    let selectedCategories = [];

    root.innerHTML = `
      <div class="screen screen--form">
        <header class="form-header">
          <button class="icon-btn" id="btnBack" aria-label="Voltar">←</button>
          <h1>Criar Sala</h1>
        </header>

        <form class="form-card" id="createForm">
          <label class="field-label" for="hostName">Nome do anfitrião</label>
          <input id="hostName" class="text-input" maxlength="18" placeholder="Como podemos te chamar?" required />

          <label class="field-label">Modo de jogo</label>
          <div class="mode-grid" id="modeGrid">
            ${MODES.map((m, i) => `
              <button type="button" class="mode-card ${i === 0 ? 'mode-card--active' : ''}" data-mode="${m.id}">
                <span class="mode-card__icon">${m.icon}</span>
                <span class="mode-card__name">${m.name}</span>
                <span class="mode-card__desc">${m.desc}</span>
              </button>`).join('')}
          </div>

          <div class="form-row">
            <div class="form-col">
              <label class="field-label">Dificuldade</label>
              <div class="chip-row" id="diffRow">
                ${DIFFICULTIES.map((d, i) => `<button type="button" class="chip ${i === 3 ? 'chip--active' : ''}" data-diff="${d.id}">${d.name}</button>`).join('')}
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-col">
              <label class="field-label">Número de perguntas</label>
              <div class="chip-row" id="countRow">
                ${QUESTION_COUNTS.map((c, i) => `<button type="button" class="chip ${i === 1 ? 'chip--active' : ''}" data-count="${c}">${c}</button>`).join('')}
              </div>
            </div>
            <div class="form-col">
              <label class="field-label">Tempo por pergunta</label>
              <div class="chip-row" id="timeRow">
                ${QUESTION_TIMES.map((t, i) => `<button type="button" class="chip ${i === 2 ? 'chip--active' : ''}" data-time="${t}">${t}s</button>`).join('')}
              </div>
            </div>
          </div>

          <label class="field-label">Categorias <span class="field-hint">(nenhuma selecionada = todas)</span></label>
          <div class="category-grid" id="categoryGrid">
            ${CATEGORIES.map((c) => `
              <button type="button" class="category-chip" data-cat="${c}">
                <span>${CATEGORY_ICONS[c] || '🌐'}</span> ${c}
              </button>`).join('')}
          </div>

          <label class="switch-row">
            <input type="checkbox" id="allowLateJoin" />
            <span>Permitir entrada tardia (jogadores podem entrar após o início)</span>
          </label>
          <label class="switch-row">
            <input type="checkbox" id="showExplanations" checked />
            <span>Mostrar explicações após cada pergunta</span>
          </label>

          <button type="submit" class="btn btn-primary btn-lg btn-block" id="btnSubmit">🗺️ Criar Sala</button>
        </form>
      </div>
    `;

    root.querySelector('#btnBack').onclick = () => navigate('home');

    let mode = 'classic', difficulty = 'random', count = 10, time = 30;

    root.querySelectorAll('.mode-card').forEach((btn) => {
      btn.onclick = () => {
        sfx.click();
        root.querySelectorAll('.mode-card').forEach((b) => b.classList.remove('mode-card--active'));
        btn.classList.add('mode-card--active');
        mode = btn.dataset.mode;
      };
    });
    root.querySelectorAll('#diffRow .chip').forEach((btn) => {
      btn.onclick = () => {
        sfx.click();
        root.querySelectorAll('#diffRow .chip').forEach((b) => b.classList.remove('chip--active'));
        btn.classList.add('chip--active');
        difficulty = btn.dataset.diff;
      };
    });
    root.querySelectorAll('#countRow .chip').forEach((btn) => {
      btn.onclick = () => {
        sfx.click();
        root.querySelectorAll('#countRow .chip').forEach((b) => b.classList.remove('chip--active'));
        btn.classList.add('chip--active');
        count = Number(btn.dataset.count);
      };
    });
    root.querySelectorAll('#timeRow .chip').forEach((btn) => {
      btn.onclick = () => {
        sfx.click();
        root.querySelectorAll('#timeRow .chip').forEach((b) => b.classList.remove('chip--active'));
        btn.classList.add('chip--active');
        time = Number(btn.dataset.time);
      };
    });
    root.querySelectorAll('.category-chip').forEach((btn) => {
      btn.onclick = () => {
        sfx.click();
        const cat = btn.dataset.cat;
        if (selectedCategories.includes(cat)) {
          selectedCategories = selectedCategories.filter((c) => c !== cat);
          btn.classList.remove('category-chip--active');
        } else {
          selectedCategories.push(cat);
          btn.classList.add('category-chip--active');
        }
      };
    });

    root.querySelector('#createForm').onsubmit = async (e) => {
      e.preventDefault();
      const hostName = root.querySelector('#hostName').value.trim();
      if (!hostName) { toast('Digite um nome para o anfitrião.', 'error'); return; }

      const settings = {
        mode, difficulty, questionCount: count, questionTime: time,
        categories: selectedCategories,
        allowLateJoin: root.querySelector('#allowLateJoin').checked,
        showExplanations: root.querySelector('#showExplanations').checked,
        soundEnabled: true,
      };

      try {
        const result = await withLoading('Criando sala...', () => API.createRoom({ hostName, settings }));
        setState({ session: result.session, room: result.room, createSettings: settings });
        saveSession(result.session);
        sfx.questionStart();
        navigate('host', { room: result.room, session: result.session });
      } catch (err) {
        apiErrorToast(err);
      }
    };
  },
};
