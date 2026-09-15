/**
 * joinRoom.js — TELA 4: ENTRAR NA SALA
 */
import { navigate } from '../core/router.js';
import { API } from '../api/api.js';
import { toast, apiErrorToast } from '../ui/toast.js';
import { withLoading } from '../ui/loading.js';
import { sfx } from '../ui/sound.js';
import { setState } from '../core/state.js';
import { saveSession } from '../core/storage.js';

export const joinRoomPage = {
  render(root, params = {}) {
    root.innerHTML = `
      <div class="screen screen--form screen--narrow">
        <header class="form-header">
          <button class="icon-btn" id="btnBack" aria-label="Voltar">←</button>
          <h1>Entrar em uma Sala</h1>
        </header>

        <form class="form-card" id="joinForm">
          <div class="join-icon">🚩</div>
          <label class="field-label" for="roomCode">Código da sala</label>
          <input id="roomCode" class="text-input text-input--code" maxlength="6"
                 autocomplete="off" autocapitalize="characters" placeholder="ABC123"
                 value="${params.code || ''}" />

          <label class="field-label" for="playerName">Seu nome</label>
          <input id="playerName" class="text-input" maxlength="18" placeholder="Como podemos te chamar?" />

          <button type="submit" class="btn btn-primary btn-lg btn-block" id="btnSubmit">🚀 Entrar</button>
        </form>
      </div>
    `;

    root.querySelector('#btnBack').onclick = () => navigate('home');

    const codeInput = root.querySelector('#roomCode');
    codeInput.addEventListener('input', () => {
      codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    });

    root.querySelector('#joinForm').onsubmit = async (e) => {
      e.preventDefault();
      const roomCode = codeInput.value.trim();
      const name = root.querySelector('#playerName').value.trim();
      if (!roomCode || roomCode.length < 6) { toast('Digite o código completo da sala.', 'error'); return; }
      if (!name) { toast('Digite seu nome.', 'error'); return; }

      try {
        const result = await withLoading('Entrando na sala...', () => API.joinRoom({ roomCode, name }));
        setState({ session: result.session, room: result.room });
        saveSession(result.session);
        sfx.questionStart();
        navigate('lobby', { room: result.room, session: result.session });
      } catch (err) {
        apiErrorToast(err);
      }
    };
  },
};
