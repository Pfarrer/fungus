const STORAGE_KEY = "fungus-player-name";

export function getSavedPlayerName(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

export function savePlayerName(name: string): void {
  localStorage.setItem(STORAGE_KEY, name);
}

const MENU_STYLES = `
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: #1a1a2e; display: flex; flex-direction: column;
  align-items: center; justify-content: center; z-index: 300;
  font-family: monospace; color: #e0e0e0;
`;

const BUTTON_STYLE = `
  padding: 12px 32px; border: 2px solid #4ecdc4;
  background: #16213e; color: #4ecdc4; cursor: pointer;
  border-radius: 6px; font-family: monospace; font-size: 18px;
  width: 260px; text-align: center;
`;

const INPUT_STYLE = `
  padding: 10px 16px; border: 2px solid #4a4e69;
  background: #16213e; color: #e0e0e0; font-family: monospace;
  font-size: 16px; border-radius: 6px; width: 260px;
  text-align: center; outline: none;
`;

const ERROR_STYLE = "color: #e94560; font-size: 14px; margin-top: 8px; min-height: 20px;";
const CODE_DISPLAY_STYLE = "font-size: 36px; color: #4ecdc4; letter-spacing: 6px; margin: 16px 0;";
const LABEL_STYLE = "font-size: 14px; color: #999; margin-bottom: 8px;";

let overlay: HTMLElement | null = null;

function removeOverlay(): void {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
}

function createOverlay(): HTMLElement {
  removeOverlay();
  overlay = document.createElement("div");
  document.body.appendChild(overlay);
  return overlay;
}

function styleInput(input: HTMLInputElement): void {
  input.style.cssText = INPUT_STYLE;
  input.addEventListener("focus", () => {
    input.style.borderColor = "#4ecdc4";
  });
  input.addEventListener("blur", () => {
    input.style.borderColor = "#4a4e69";
  });
}

export interface MenuCallbacks {
  onSinglePlayer: (playerName: string) => void;
  onBotMatch: (playerName: string) => void;
  onHostGame: (playerName: string) => void;
  onJoinGame: (playerName: string, code: string) => void;
}

export function renderMenuScreen(callbacks: MenuCallbacks): void {
  const el = createOverlay();
  el.style.cssText = MENU_STYLES;

  const title = document.createElement("h1");
  title.textContent = "Fungus";
  title.style.cssText = "font-size: 48px; color: #4ecdc4; margin-bottom: 32px;";
  el.appendChild(title);

  const nameLabel = document.createElement("div");
  nameLabel.textContent = "Player Name";
  nameLabel.style.cssText = LABEL_STYLE;
  el.appendChild(nameLabel);

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = getSavedPlayerName();
  nameInput.placeholder = "Enter your name";
  nameInput.maxLength = 20;
  styleInput(nameInput);
  el.appendChild(nameInput);

  const errorDiv = document.createElement("div");
  errorDiv.style.cssText = ERROR_STYLE;
  el.appendChild(errorDiv);

  const btnContainer = document.createElement("div");
  btnContainer.style.cssText = "display: flex; flex-direction: column; gap: 12px; margin-top: 24px;";

  const singlePlayerBtn = document.createElement("button");
  singlePlayerBtn.textContent = "Single Player (Sandbox)";
  singlePlayerBtn.style.cssText = BUTTON_STYLE;

  const botMatchBtn = document.createElement("button");
  botMatchBtn.textContent = "Single Player (vs Bot)";
  botMatchBtn.style.cssText = BUTTON_STYLE;

  const multiplayerBtn = document.createElement("button");
  multiplayerBtn.textContent = "Multiplayer";
  multiplayerBtn.style.cssText = BUTTON_STYLE;

  btnContainer.appendChild(singlePlayerBtn);
  btnContainer.appendChild(botMatchBtn);
  btnContainer.appendChild(multiplayerBtn);
  el.appendChild(btnContainer);

  function validateName(): boolean {
    const name = nameInput.value.trim();
    if (!name) {
      errorDiv.textContent = "Please enter a player name";
      nameInput.style.borderColor = "#e94560";
      return false;
    }
    errorDiv.textContent = "";
    nameInput.style.borderColor = "#4a4e69";
    return true;
  }

  singlePlayerBtn.addEventListener("click", () => {
    if (!validateName()) return;
    const name = nameInput.value.trim();
    savePlayerName(name);
    callbacks.onSinglePlayer(name);
  });

  botMatchBtn.addEventListener("click", () => {
    if (!validateName()) return;
    const name = nameInput.value.trim();
    savePlayerName(name);
    callbacks.onBotMatch(name);
  });

  multiplayerBtn.addEventListener("click", () => {
    if (!validateName()) return;
    const name = nameInput.value.trim();
    savePlayerName(name);
    renderMultiplayerSelect(name, callbacks);
  });
}

function renderMultiplayerSelect(playerName: string, callbacks: MenuCallbacks): void {
  const el = createOverlay();
  el.style.cssText = MENU_STYLES;

  const title = document.createElement("h2");
  title.textContent = "Multiplayer";
  title.style.cssText = "font-size: 32px; color: #4ecdc4; margin-bottom: 32px;";
  el.appendChild(title);

  const btnContainer = document.createElement("div");
  btnContainer.style.cssText = "display: flex; flex-direction: column; gap: 12px;";

  const hostBtn = document.createElement("button");
  hostBtn.textContent = "Host Game";
  hostBtn.style.cssText = BUTTON_STYLE;

  const joinBtn = document.createElement("button");
  joinBtn.textContent = "Join Game";
  joinBtn.style.cssText = BUTTON_STYLE;

  const backBtn = document.createElement("button");
  backBtn.textContent = "Back";
  backBtn.style.cssText = BUTTON_STYLE.replace("#4ecdc4", "#999");

  btnContainer.appendChild(hostBtn);
  btnContainer.appendChild(joinBtn);
  btnContainer.appendChild(backBtn);
  el.appendChild(btnContainer);

  hostBtn.addEventListener("click", () => {
    savePlayerName(playerName);
    callbacks.onHostGame(playerName);
  });

  joinBtn.addEventListener("click", () => {
    savePlayerName(playerName);
    renderJoinScreen(playerName, callbacks);
  });

  backBtn.addEventListener("click", () => {
    renderMenuScreen(callbacks);
  });
}

export function renderHostingScreen(gameCode: string): void {
  const el = createOverlay();
  el.style.cssText = MENU_STYLES;

  const title = document.createElement("h2");
  title.textContent = "Hosting Game";
  title.style.cssText = "font-size: 28px; color: #4ecdc4; margin-bottom: 16px;";
  el.appendChild(title);

  const codeLabel = document.createElement("div");
  codeLabel.textContent = "Share this code with your opponent:";
  codeLabel.style.cssText = LABEL_STYLE;
  el.appendChild(codeLabel);

  const codeDiv = document.createElement("div");
  codeDiv.textContent = gameCode;
  codeDiv.style.cssText = CODE_DISPLAY_STYLE;
  el.appendChild(codeDiv);

  const waiting = document.createElement("div");
  waiting.textContent = "Waiting for opponent...";
  waiting.style.cssText = "color: #ff8c00; font-size: 16px; margin-top: 16px;";
  el.appendChild(waiting);
}

function renderJoinScreen(playerName: string, callbacks: MenuCallbacks): void {
  const el = createOverlay();
  el.style.cssText = MENU_STYLES;

  const title = document.createElement("h2");
  title.textContent = "Join Game";
  title.style.cssText = "font-size: 28px; color: #4ecdc4; margin-bottom: 24px;";
  el.appendChild(title);

  const codeLabel = document.createElement("div");
  codeLabel.textContent = "Enter game code:";
  codeLabel.style.cssText = LABEL_STYLE;
  el.appendChild(codeLabel);

  const codeInput = document.createElement("input");
  codeInput.type = "text";
  codeInput.placeholder = "A3F7K2";
  codeInput.maxLength = 6;
  styleInput(codeInput);
  codeInput.style.textTransform = "uppercase";
  el.appendChild(codeInput);

  const errorDiv = document.createElement("div");
  errorDiv.style.cssText = ERROR_STYLE;
  el.appendChild(errorDiv);

  const btnContainer = document.createElement("div");
  btnContainer.style.cssText = "display: flex; flex-direction: column; gap: 12px; margin-top: 24px;";

  const connectBtn = document.createElement("button");
  connectBtn.textContent = "Connect";
  connectBtn.style.cssText = BUTTON_STYLE;

  const backBtn = document.createElement("button");
  backBtn.textContent = "Back";
  backBtn.style.cssText = BUTTON_STYLE.replace("#4ecdc4", "#999");

  btnContainer.appendChild(connectBtn);
  btnContainer.appendChild(backBtn);
  el.appendChild(btnContainer);

  connectBtn.addEventListener("click", () => {
    const code = codeInput.value.trim().toUpperCase();
    if (!code) {
      errorDiv.textContent = "Please enter a game code";
      codeInput.style.borderColor = "#e94560";
      return;
    }
    errorDiv.textContent = "";
    savePlayerName(playerName);
    callbacks.onJoinGame(playerName, code);
  });

  backBtn.addEventListener("click", () => {
    renderMultiplayerSelect(playerName, callbacks);
  });
}

export function showJoinError(message: string): void {
  const errorDiv = overlay?.querySelector("div[style*='color: #e94560']") as HTMLElement | null;
  if (errorDiv) {
    errorDiv.textContent = message;
  }
}

export function hideMenu(): void {
  removeOverlay();
}

export function showMenu(callbacks: MenuCallbacks): void {
  renderMenuScreen(callbacks);
}
