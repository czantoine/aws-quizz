const SOCKET_URL = window.APP_CONFIG?.SOCKET_URL || window.location.origin;
const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });

const joinCard = document.getElementById("joinCard");
const waitingCard = document.getElementById("waitingCard");
const questionCard = document.getElementById("questionCard");
const reviewCard = document.getElementById("reviewCard");
const finalCard = document.getElementById("finalCard");

const joinForm = document.getElementById("joinForm");
const nicknameInput = document.getElementById("nicknameInput");
const joinError = document.getElementById("joinError");
const welcomeText = document.getElementById("welcomeText");

const questionCategory = document.getElementById("questionCategory");
const questionText = document.getElementById("questionText");
const questionProgress = document.getElementById("questionProgress");
const answersGrid = document.getElementById("answersGrid");
const timerEl = document.getElementById("timer");
const answerState = document.getElementById("answerState");

const reviewResult = document.getElementById("reviewResult");
const reviewCorrect = document.getElementById("reviewCorrect");
const leaderboardBody = document.getElementById("leaderboardBody");

const winnerMessage = document.getElementById("winnerMessage");
const finalLeaderboardBody = document.getElementById("finalLeaderboardBody");
const reactionCard = document.getElementById("reactionCard");
const reactionState = document.getElementById("reactionState");
const reactionButtons = Array.from(document.querySelectorAll(".reaction-btn"));
const playerFireBanner = document.getElementById("playerFireBanner");
const playerFireText = document.getElementById("playerFireText");
const playerFireParticles = document.getElementById("playerFireParticles");

let myPlayerId = null;
let myNickname = "";
let countdownInterval = null;
let questionLocked = false;
let lastReactionAt = 0;

reactionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!myPlayerId) {
      return;
    }

    const now = Date.now();
    if (now - lastReactionAt < 600) {
      reactionState.textContent = "Doucement 😄 attends un instant avant la prochaine reaction.";
      return;
    }

    const reaction = button.dataset.reaction;
    socket.emit("player:reaction", { reaction });
    lastReactionAt = now;
    reactionState.textContent = "Reaction envoyee sur l'ecran public.";
  });
});

joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nickname = nicknameInput.value.trim();
  if (!nickname) {
    joinError.textContent = "Entre un pseudo valide.";
    return;
  }
  socket.emit("player:join", { nickname });
});

socket.on("player:error", (msg) => {
  joinError.textContent = msg;
});

socket.on("player:joined", ({ id, nickname }) => {
  myPlayerId = id;
  myNickname = nickname;
  welcomeText.textContent = `Bienvenue ${nickname}.`;
  reactionCard.classList.remove("hidden");
  hidePlayerFire();
  showOnly(waitingCard);
});

socket.on("state:update", (state) => {
  if (!myPlayerId) {
    return;
  }

  if (state.phase === "lobby") {
    showOnly(waitingCard);
  }

  if (state.phase === "finished") {
    renderLeaderboard(finalLeaderboardBody, state.leaderboard);
  }
});

socket.on("question:start", (payload) => {
  if (!myPlayerId) {
    return;
  }

  questionLocked = false;
  hidePlayerFire();
  answerState.textContent = "Choisis vite, plus tu reponds rapidement, plus tu marques de points.";
  reviewResult.textContent = "";
  reviewCorrect.textContent = "";

  questionCategory.textContent = payload.category;
  questionText.textContent = payload.text;
  questionProgress.textContent = `Question ${payload.index + 1} / ${payload.total}`;

  answersGrid.innerHTML = "";
  payload.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "answer-btn";
    button.textContent = option;
    button.addEventListener("click", () => {
      if (questionLocked) {
        return;
      }
      questionLocked = true;
      lockAnswerButtons();
      socket.emit("player:answer", { answerIndex: index });
    });
    answersGrid.appendChild(button);
  });

  startCountdown(payload.startedAt, payload.durationSeconds);
  showOnly(questionCard);
});

socket.on("player:answer:accepted", ({ isCorrect, points }) => {
  const short = isCorrect ? `Bonne reponse, +${points} points.` : "Mauvaise reponse, 0 point.";
  answerState.textContent = `${short} Attends la fin du chrono.`;
});

socket.on("player:streak:update", (payload) => {
  renderPlayerFire(payload);
});

socket.on("question:ended", (payload) => {
  stopCountdown();
  const me = payload.leaderboard.find((entry) => entry.id === myPlayerId);
  if (me) {
    reviewResult.textContent = `Tu es ${ordinal(me.rank)} avec ${me.score} points.`;
  }
  reviewCorrect.textContent = `Bonne reponse: ${payload.correctAnswer}`;
  renderLeaderboard(leaderboardBody, payload.leaderboard);
  showOnly(reviewCard);
});

socket.on("game:finished", (payload) => {
  stopCountdown();
  hidePlayerFire();
  winnerMessage.textContent = payload.message;
  renderLeaderboard(finalLeaderboardBody, payload.leaderboard);
  showOnly(finalCard);
});

socket.on("game:reset", () => {
  stopCountdown();
  hidePlayerFire();
  reactionCard.classList.remove("hidden");
  showOnly(waitingCard);
});

function showOnly(section) {
  [joinCard, waitingCard, questionCard, reviewCard, finalCard].forEach((el) => {
    el.classList.toggle("hidden", el !== section);
  });
}

function renderLeaderboard(target, leaderboard) {
  target.innerHTML = "";
  leaderboard.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${row.rank}</td><td>${row.nickname}</td><td>${row.score}</td>`;
    target.appendChild(tr);
  });
}

function startCountdown(startedAt, durationSeconds) {
  stopCountdown();

  const render = () => {
    const elapsed = (Date.now() - startedAt) / 1000;
    const left = Math.max(0, durationSeconds - elapsed);
    timerEl.textContent = `${Math.ceil(left)}s`;
  };

  render();
  countdownInterval = setInterval(render, 250);
}

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

function lockAnswerButtons() {
  const buttons = answersGrid.querySelectorAll("button");
  buttons.forEach((button) => {
    button.disabled = true;
  });
}

function ordinal(num) {
  if (num === 1) {
    return "1er";
  }
  return `${num}e`;
}

function renderPlayerFire(payload) {
  const streak = Number(payload?.streak || 0);
  const superFire = Boolean(payload?.superFire);
  const fire = Boolean(payload?.fire);

  if (!fire || streak < 2) {
    hidePlayerFire();
    return;
  }

  playerFireText.textContent = superFire
    ? `${myNickname || "Tu"} es en FEU total - streak x${streak}`
    : `${myNickname || "Tu"} es en feu - streak x${streak}`;

  playerFireBanner.classList.remove("hidden", "fire-hot", "fire-super", "fire-flash");
  playerFireBanner.classList.add(superFire ? "fire-super" : "fire-hot");
  void playerFireBanner.offsetWidth;
  playerFireBanner.classList.add("fire-flash");

  spawnPlayerFireParticles(superFire ? "super" : "hot");

  if (playerFireBanner._hideTimer) {
    clearTimeout(playerFireBanner._hideTimer);
  }
  playerFireBanner._hideTimer = setTimeout(() => {
    hidePlayerFire();
  }, superFire ? 3200 : 2200);
}

function hidePlayerFire() {
  if (playerFireBanner && playerFireBanner._hideTimer) {
    clearTimeout(playerFireBanner._hideTimer);
    playerFireBanner._hideTimer = null;
  }
  if (playerFireBanner) {
    playerFireBanner.classList.add("hidden");
  }
}

function spawnPlayerFireParticles(level) {
  if (!playerFireParticles) {
    return;
  }

  const count = level === "super" ? 16 : 10;
  for (let i = 0; i < count; i += 1) {
    const flame = document.createElement("span");
    flame.className = "fire-particle";
    flame.textContent = "🔥";
    flame.style.left = `${Math.floor(Math.random() * 94)}%`;
    flame.style.animationDuration = `${1 + Math.random() * 0.95}s`;
    flame.style.animationDelay = `${Math.random() * 0.2}s`;
    flame.style.fontSize = `${0.85 + Math.random() * 0.95}rem`;
    playerFireParticles.appendChild(flame);
    setTimeout(() => {
      flame.remove();
    }, 1700);
  }
}
