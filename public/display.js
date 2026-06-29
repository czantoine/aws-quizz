const SOCKET_URL = window.APP_CONFIG?.SOCKET_URL || window.location.origin;
const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });

const displayTitle = document.getElementById("displayTitle");
const displaySubtitle = document.getElementById("displaySubtitle");
const displayLobbyCard = document.getElementById("displayLobbyCard");
const displayLobbyText = document.getElementById("displayLobbyText");
const displayLobbyCount = document.getElementById("displayLobbyCount");
const displayLobbyPlayers = document.getElementById("displayLobbyPlayers");
const displayQuestion = document.getElementById("displayQuestion");
const displayProgress = document.getElementById("displayProgress");
const displayOptions = document.getElementById("displayOptions");
const displayTimer = document.getElementById("displayTimer");
const displayPhase = document.getElementById("displayPhase");
const displayLeaderboardBody = document.getElementById("displayLeaderboardBody");
const displayWinnerCard = document.getElementById("displayWinnerCard");
const displayWinnerText = document.getElementById("displayWinnerText");
const displayCelebration = document.getElementById("displayCelebration");
const displayCelebrationText = document.getElementById("displayCelebrationText");
const displayCelebrationGif = document.getElementById("displayCelebrationGif");
const displayPodiumCard = document.getElementById("displayPodiumCard");
const displayPodiumFirst = document.getElementById("displayPodiumFirst");
const displayPodiumSecond = document.getElementById("displayPodiumSecond");
const displayPodiumThird = document.getElementById("displayPodiumThird");
const reactionStream = document.getElementById("reactionStream");
const displayFireBanner = document.getElementById("displayFireBanner");
const displayFireText = document.getElementById("displayFireText");
const fireParticles = document.getElementById("fireParticles");

let countdownInterval = null;
let durationSeconds = 60;
const avatarByNickname = new Map();

socket.on("state:update", (state) => {
  renderLeaderboard(state.leaderboard || []);
  displayPhase.textContent = phaseLabel(state.phase);

  if (state.phase === "lobby") {
    displayLobbyCard.classList.remove("hidden");
    displayLobbyText.textContent = "En attente du lancement par le presentateur...";
    displayLobbyCount.textContent = `${state.connectedPlayers} joueur(s) connecte(s)`;
    renderLobbyPlayers(state.players || []);
    stopCountdown();
    displayTimer.textContent = `${durationSeconds}s`;
    displaySubtitle.textContent = "Les joueurs se connectent...";
    displayQuestion.textContent = "Le quiz va commencer dans un instant.";
    displayProgress.textContent = `${state.connectedPlayers} joueur(s) connecte(s)`;
    displayOptions.innerHTML = "";
    displayCelebration.classList.add("hidden");
    displayPodiumCard.classList.add("hidden");
    displayWinnerCard.classList.add("hidden");
  } else {
    displayLobbyCard.classList.add("hidden");
  }
});

socket.on("question:start", (payload) => {
  displayLobbyCard.classList.add("hidden");
  displayWinnerCard.classList.add("hidden");
  durationSeconds = payload.durationSeconds;
  displayTitle.textContent = `Quiz AWS CLF-C02 - ${payload.category}`;
  displaySubtitle.textContent = "Repondez vite: la rapidite donne plus de points.";
  displayQuestion.textContent = payload.text;
  displayProgress.textContent = `Question ${payload.index + 1} / ${payload.total}`;
  renderOptions(payload.options);
  displayCelebration.classList.add("hidden");
  displayPodiumCard.classList.add("hidden");
  hideFireBanner();
  startCountdown(payload.startedAt, payload.durationSeconds);
});

socket.on("question:ended", (payload) => {
  stopCountdown();
  displaySubtitle.textContent = `Bonne reponse: ${payload.correctAnswer}`;
  highlightCorrectOption(payload.correctIndices || [payload.correctIndex]);

  if (payload.allCorrect && payload.celebrationGif) {
    displayCelebrationText.textContent = `${payload.roundTitle}: ${payload.roundMessage}`;
    displayCelebrationGif.src = payload.celebrationGif;
    displayCelebration.classList.remove("hidden");
    animateEntrance(displayCelebration);
  } else if (payload.allWrong && payload.failGif) {
    displayCelebrationText.textContent = `${payload.roundTitle}: ${payload.roundMessage}`;
    displayCelebrationGif.src = payload.failGif;
    displayCelebration.classList.remove("hidden");
    animateEntrance(displayCelebration);
  } else {
    displayCelebration.classList.add("hidden");
  }

  renderPodium(payload.leaderboard || []);
  displayPodiumCard.classList.remove("hidden");
  animateEntrance(displayPodiumCard);
});

socket.on("game:finished", (payload) => {
  displayLobbyCard.classList.add("hidden");
  stopCountdown();
  displayPhase.textContent = "Final";
  displayTitle.textContent = "Quiz termine";
  displaySubtitle.textContent = "Merci a tous pour la partie.";
  displayQuestion.textContent = payload.message;
  displayProgress.textContent = "";
  displayOptions.innerHTML = "";
  displayCelebration.classList.add("hidden");
  hideFireBanner();
  renderPodium(payload.leaderboard || []);
  displayPodiumCard.classList.remove("hidden");

  if (payload.winner) {
    displayWinnerText.textContent = `${payload.winner.nickname} gagne avec ${payload.winner.score} points.`;
    displayWinnerCard.classList.remove("hidden");
    animateEntrance(displayWinnerCard);
  } else {
    displayWinnerCard.classList.add("hidden");
  }

  renderLeaderboard(payload.leaderboard || []);
});

socket.on("game:reset", () => {
  displayLobbyCard.classList.remove("hidden");
  stopCountdown();
  displayWinnerCard.classList.add("hidden");
  displayTitle.textContent = "Quiz AWS CLF-C02";
  displaySubtitle.textContent = "Nouvelle partie en preparation...";
  displayQuestion.textContent = "Pret pour une nouvelle manche ?";
  displayProgress.textContent = "";
  displayOptions.innerHTML = "";
  displayCelebration.classList.add("hidden");
  displayPodiumCard.classList.add("hidden");
  hideFireBanner();
  displayTimer.textContent = `${durationSeconds}s`;
  displayPhase.textContent = "Lobby";
});

function renderLobbyPlayers(players) {
  displayLobbyPlayers.innerHTML = "";
  players
    .slice()
    .sort((a, b) => a.nickname.localeCompare(b.nickname))
    .forEach((player) => {
      const li = document.createElement("li");
      li.textContent = player.nickname;
      displayLobbyPlayers.appendChild(li);
    });
}

function renderPodium(leaderboard) {
  const top = [leaderboard[0], leaderboard[1], leaderboard[2]];
  updatePodiumSlot(displayPodiumFirst, top[0]);
  updatePodiumSlot(displayPodiumSecond, top[1]);
  updatePodiumSlot(displayPodiumThird, top[2]);
}

function updatePodiumSlot(node, entry) {
  const avatarEl = node.querySelector(".avatar-podium");
  const nameEl = node.querySelector(".podium-name");
  const scoreEl = node.querySelector(".podium-score");
  if (!entry) {
    avatarEl.src = "";
    avatarEl.classList.add("hidden");
    nameEl.textContent = "-";
    scoreEl.textContent = "0 pts";
    return;
  }

  avatarEl.src = getAvatarUrl(entry.nickname);
  avatarEl.alt = `Avatar ${entry.nickname}`;
  avatarEl.classList.remove("hidden");
  nameEl.textContent = entry.nickname;
  scoreEl.textContent = `${entry.score} pts`;
}

function renderLeaderboard(leaderboard) {
  displayLeaderboardBody.innerHTML = "";
  leaderboard.slice(0, 10).forEach((entry) => {
    const tr = document.createElement("tr");
    const rankTd = document.createElement("td");
    rankTd.textContent = String(entry.rank);

    const nameTd = document.createElement("td");
    const nameWrap = document.createElement("div");
    nameWrap.className = "player-cell";
    const avatar = document.createElement("img");
    avatar.className = "avatar avatar-sm";
    avatar.alt = `Avatar ${entry.nickname}`;
    avatar.src = getAvatarUrl(entry.nickname);
    const name = document.createElement("span");
    name.textContent = entry.nickname;
    nameWrap.appendChild(avatar);
    nameWrap.appendChild(name);
    nameTd.appendChild(nameWrap);

    const scoreTd = document.createElement("td");
    const streak = Number(entry.streak || 0);
    scoreTd.textContent = streak >= 3 ? `${entry.score} pts - 🔥x${streak}` : String(entry.score);

    tr.appendChild(rankTd);
    tr.appendChild(nameTd);
    tr.appendChild(scoreTd);
    displayLeaderboardBody.appendChild(tr);
  });
}

function getAvatarUrl(nickname) {
  const key = String(nickname || "").trim().toLowerCase();
  if (!key) {
    return "";
  }

  if (avatarByNickname.has(key)) {
    return avatarByNickname.get(key);
  }

  const salt = Math.random().toString(36).slice(2, 8);
  const seed = encodeURIComponent(`${key}-${salt}`);
  const url = `https://robohash.org/${seed}?set=set4&size=160x160`;
  avatarByNickname.set(key, url);
  return url;
}

function renderOptions(options) {
  displayOptions.innerHTML = "";
  options.forEach((option, index) => {
    const item = document.createElement("div");
    item.className = "display-option";
    item.dataset.optionIndex = String(index);
    item.innerHTML = `<span class="display-option-index">${index + 1}</span><span>${option}</span>`;
    displayOptions.appendChild(item);
  });
}

function highlightCorrectOption(correctIndices) {
  const correctSet = new Set((correctIndices || []).map((value) => Number(value)));
  const nodes = displayOptions.querySelectorAll(".display-option");
  nodes.forEach((node) => {
    const optionIndex = Number(node.dataset.optionIndex);
    node.classList.remove("display-option-correct", "display-option-dim");
    if (correctSet.has(optionIndex)) {
      node.classList.add("display-option-correct");
    } else {
      node.classList.add("display-option-dim");
    }
  });
}

function startCountdown(startedAt, seconds) {
  stopCountdown();

  const render = () => {
    const elapsed = (Date.now() - startedAt) / 1000;
    const left = Math.max(0, seconds - elapsed);
    displayTimer.textContent = `${Math.ceil(left)}s`;
    displayTimer.classList.toggle("timer-urgent", left <= 10);
  };

  render();
  countdownInterval = setInterval(render, 250);
}

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  displayTimer.classList.remove("timer-urgent");
}

function phaseLabel(phase) {
  if (phase === "question") {
    return "Question";
  }
  if (phase === "review") {
    return "Correction";
  }
  if (phase === "finished") {
    return "Final";
  }
  return "Lobby";
}

function animateEntrance(element) {
  element.classList.remove("celebrate-in");
  void element.offsetWidth;
  element.classList.add("celebrate-in");
}

socket.on("display:reaction", (payload) => {
  renderReactionBubble(payload);
});

socket.on("display:streak:fire", (payload) => {
  renderFireMoment(payload);
});

function renderReactionBubble(payload) {
  const bubble = document.createElement("div");
  bubble.className = "reaction-bubble";

  const emoji = document.createElement("span");
  emoji.className = "reaction-emoji";
  emoji.textContent = payload.emoji || "🐱";

  const text = document.createElement("span");
  text.className = "reaction-author";
  text.textContent = payload.nickname || "Joueur";

  bubble.appendChild(emoji);
  bubble.appendChild(text);

  const lane = Math.floor(Math.random() * 70);
  bubble.style.left = `${lane}%`;
  bubble.style.animationDuration = `${3 + Math.random() * 1.5}s`;

  reactionStream.appendChild(bubble);
  setTimeout(() => {
    bubble.remove();
  }, 4200);
}

function renderFireMoment(payload) {
  const streak = Number(payload.streak || 0);
  const level = payload.level === "super" ? "super" : "hot";
  const name = payload.nickname || "Joueur";

  displayFireText.textContent =
    level === "super"
      ? `${name} est en FEU total - streak x${streak}`
      : `${name} chauffe la salle - streak x${streak}`;

  displayFireBanner.classList.remove("hidden", "fire-hot", "fire-super", "fire-flash");
  displayFireBanner.classList.add(level === "super" ? "fire-super" : "fire-hot");
  void displayFireBanner.offsetWidth;
  displayFireBanner.classList.add("fire-flash");

  spawnFireParticles(level);

  if (displayFireBanner._hideTimer) {
    clearTimeout(displayFireBanner._hideTimer);
  }
  displayFireBanner._hideTimer = setTimeout(() => {
    hideFireBanner();
  }, level === "super" ? 3600 : 2500);
}

function hideFireBanner() {
  if (displayFireBanner._hideTimer) {
    clearTimeout(displayFireBanner._hideTimer);
    displayFireBanner._hideTimer = null;
  }
  displayFireBanner.classList.add("hidden");
}

function spawnFireParticles(level) {
  if (!fireParticles) {
    return;
  }

  const count = level === "super" ? 20 : 12;
  for (let i = 0; i < count; i += 1) {
    const flame = document.createElement("span");
    flame.className = "fire-particle";
    flame.textContent = "🔥";
    flame.style.left = `${Math.floor(Math.random() * 94)}%`;
    flame.style.animationDuration = `${1.1 + Math.random() * 1.1}s`;
    flame.style.animationDelay = `${Math.random() * 0.25}s`;
    flame.style.fontSize = `${0.9 + Math.random() * 1.2}rem`;
    fireParticles.appendChild(flame);
    setTimeout(() => {
      flame.remove();
    }, 1800);
  }
}
