# GeoBattle — Frontend

Frontend estático, mobile-first e desacoplado do backend. O padrão usado é:

`pages → API service layer → mockApi/backendApi`

A interface não chama Google Apps Script diretamente. Para trocar a implementação, altere somente `js/config.js`:

```js
export const CONFIG = {
  API_MODE: 'mock',
  API_BASE_URL: '',
  POLLING_INTERVAL: 1800,
  DEBUG: true
};
```

## Executar

Como é um projeto ES Modules, rode por um servidor estático local. Exemplos:

- VS Code + Live Server
- `python -m http.server 5500` dentro de `frontend/`
- qualquer hospedagem estática

Depois abra `http://localhost:5500`.

## Modo Demo

O modo `mock` não precisa de servidor de API. Ao criar uma sala, o frontend cria jogadores simulados (`Leo`, `Maria`, `João`, `Ana`) para demonstrar a dinâmica multiplayer.

## Backend

Quando o Apps Script estiver publicado, configure `API_MODE: 'backend'` e `API_BASE_URL` com a URL `/exec` do Web App.

## Arquitetura

- `core/`: estado, rota e armazenamento da sessão.
- `api/`: contrato da API, mock e implementação HTTP.
- `game/`: timer, sala, engine e pontuação local.
- `pages/`: telas.
- `ui/`: toast, modal, loading e animações.
- `data/questions.js`: banco inicial de perguntas.

A pontuação no mock é apenas para demonstração. Em produção, o Apps Script deve ser a autoridade final.
