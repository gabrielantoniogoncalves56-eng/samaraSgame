/**
 * createRoom.js — cria uma sala online com código de acesso.
 */
import { navigate } from '../core/router.js';
import { API } from '../api/api.js';
import { toast } from '../ui/toast.js';
import { icon } from '../ui/icons.js';
import { sfx } from '../ui/sound.js';
import { saveSession } from '../core/storage.js';

const TILE_COUNTS = [10, 15, 20, 25];
const TURN_TIMES = [20, 30, 45, 60];
const DIFFICULTIES = [
  { id: 'all', name: 'Todas' },
  { id: 'medium', name: 'Médio' },
  { id: 'hard', name: 'Difícil' },
];

export const createRoomPage = {
  render(root) {
    root.innerHTML = `
      <div class="screen screen--form">
        <header class="form-header">
          <button class="icon-btn" id="btnBack" aria-label="Voltar">${icon('arrowLeft', { size: 18 })}</button>
          <h1>Criar Sala</h1>
        </header>

        <form class="form-card" id="createForm">
          <label class="field-label" for="hostName">Nome do anfitrião</label>
          <input id="hostName" class="text-input" maxlength="18" placeholder="Como podemos te chamar?" required />

          <label class="field-label">Tiles por jogador</label>
          <div class="chip-row" id="countRow">
            ${TILE_COUNTS.map((c, i) => `<button type="button" class="chip ${i === 1 ? 'chip--active' : ''}" data-count="${c}">${c}</button>`).join('')}
          </div>

          <label class="field-label">Tempo por turno</label>
          <div class="chip-row" id="timeRow">
            ${TURN_TIMES.map((t, i) => `<button type="button" class="chip ${i === 1 ? 'chip--active' : ''}" data-time="${t}">${t}s</button>`).join('')}
          </div>

          <label class="field-label">Dificuldade das Cartas Desafio</label>
          <div class="chip-row" id="diffRow">
            ${DIFFICULTIES.map((d, i) => `<button type="button" class="chip ${i === 0 ? 'chip--active' : ''}" data-diff="${d.id}">${d.name}</button>`).join('')}
          </div>

          <p class="rule-text">Cada turno: sorteie um tile e posicione no seu mapa, encostado em
          pelo menos 1 tile já colocado. A pontuação é calculada automaticamente em tempo real.</p>

          <button type="submit" class="btn btn-primary btn-lg btn-block" id="btnSubmit">${icon('play', { size: 18 })} Criar Sala</button>
        </form>
      </div>
    `;

    root.querySelector('#btnBack').onclick = () => navigate('home');

    let maxTiles = 15, turnTime = 30, challengeDifficulty = 'all';
    root.querySelectorAll('#countRow .chip').forEach((btn) => {
      btn.onclick = () => { sfx.click(); setActive(root, '#countRow', btn); maxTiles = Number(btn.dataset.count); };
    });
    root.querySelectorAll('#timeRow .chip').forEach((btn) => {
      btn.onclick = () => { sfx.click(); setActive(root, '#timeRow', btn); turnTime = Number(btn.dataset.time); };
    });
    root.querySelectorAll('#diffRow .chip').forEach((btn) => {
      btn.onclick = () => { sfx.click(); setActive(root, '#diffRow', btn); challengeDifficulty = btn.dataset.diff; };
    });

    root.querySelector('#createForm').onsubmit = async (e) => {
      e.preventDefault();
      const hostName = root.querySelector('#hostName').value.trim();
      if (!hostName) { toast('Digite um nome para o anfitrião.', 'error'); return; }
      const submitBtn = root.querySelector('#btnSubmit');
      submitBtn.disabled = true;
      try {
        const settings = { maxTiles, turnTime, challengeDifficulty };
        const result = await API.createRoom({ hostName, settings });
        saveSession(result.session);
        sfx.turnStart();
        navigate('host', { room: result.room, session: result.session });
      } catch (err) {
        toast(err.message || 'Não foi possível criar a sala.', 'error');
        submitBtn.disabled = false;
      }
    };
  },
};

function setActive(root, selector, btn) {
  root.querySelectorAll(`${selector} .chip`).forEach((b) => b.classList.remove('chip--active'));
  btn.classList.add('chip--active');
}
