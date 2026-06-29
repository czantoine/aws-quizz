const SOCKET_URL = window.APP_CONFIG?.SOCKET_URL || window.location.origin;
const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });

const qrImage = document.getElementById("qrImage");
const joinLink = document.getElementById("joinLink");
const displayLink = document.getElementById("displayLink");

const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");

const hostState = document.getElementById("hostState");
const hostQuestionTitle = document.getElementById("hostQuestionTitle");
const hostQuestionText = document.getElementById("hostQuestionText");
const hostMeta = document.getElementById("hostMeta");
const hostQuestionModeHint = document.getElementById("hostQuestionModeHint");
const hostCorrect = document.getElementById("hostCorrect");
const hostTimer = document.getElementById("hostTimer");
const hostCelebration = document.getElementById("hostCelebration");
const hostCelebrationText = document.getElementById("hostCelebrationText");
const hostCelebrationGif = document.getElementById("hostCelebrationGif");
const hostExplanation = document.getElementById("hostExplanation");
const hostExplanationText = document.getElementById("hostExplanationText");

const hostLeaderboardBody = document.getElementById("hostLeaderboardBody");
const hostPodiumCard = document.getElementById("hostPodiumCard");
const hostPodiumFirst = document.getElementById("hostPodiumFirst");
const hostPodiumSecond = document.getElementById("hostPodiumSecond");
const hostPodiumThird = document.getElementById("hostPodiumThird");
const hostAnswersBody = document.getElementById("hostAnswersBody");
const correctCountChip = document.getElementById("correctCountChip");
const wrongCountChip = document.getElementById("wrongCountChip");
const pendingCountChip = document.getElementById("pendingCountChip");
const playerCount = document.getElementById("playerCount");
const playersList = document.getElementById("playersList");

let countdownInterval = null;
let currentDuration = 60;
let seenAnswerPlayerIds = new Set();
let lastCounts = { correct: 0, wrong: 0, pending: 0 };

socket.emit("host:join");

startBtn.addEventListener("click", () => {
  socket.emit("host:start");
});

nextBtn.addEventListener("click", () => {
  socket.emit("host:next");
});

restartBtn.addEventListener("click", () => {
  socket.emit("host:restart");
});

fetch("/api/config")
  .then((res) => res.json())
  .then((config) => {
    qrImage.src = config.qrCodeDataUrl;
    joinLink.href = config.joinUrl;
    joinLink.textContent = config.joinUrl;
    displayLink.href = config.displayUrl;
    displayLink.textContent = config.displayUrl;
    currentDuration = config.questionDurationSeconds;
    hostTimer.textContent = `${currentDuration}s`;
  })
  .catch(() => {
    hostState.textContent = "Impossible de charger le QR code.";
  });

socket.on("state:update", (state) => {
  hostState.textContent = `Phase: ${state.phase} | Joueurs: ${state.connectedPlayers} | Reponses: ${state.answeredPlayers}`;

  playerCount.textContent = `${state.connectedPlayers} joueur(s)`;
  playersList.innerHTML = "";
  state.players.forEach((player) => {
    const li = document.createElement("li");
    li.textContent = `${player.nickname} (${player.score} pts)`;
    playersList.appendChild(li);
  });

  renderHostLeaderboard(state.leaderboard);

  startBtn.disabled = !(state.phase === "lobby" || state.phase === "finished");
  nextBtn.disabled = state.phase !== "review";

  if (state.phase === "lobby") {
    hostQuestionTitle.textContent = "En attente...";
    hostQuestionText.textContent = "Lance la partie pour afficher la premiere question.";
    hostMeta.textContent = "";
    hostQuestionModeHint.classList.add("hidden");
    hostCorrect.textContent = "";
    hostCelebration.classList.add("hidden");
    hostPodiumCard.classList.add("hidden");
    hostAnswersBody.innerHTML = "";
    seenAnswerPlayerIds = new Set();
    updateAnswerChips(0, 0, state.connectedPlayers);
    stopCountdown();
  }

  if (state.phase === "finished") {
    hostQuestionTitle.textContent = "Quiz termine";
    hostMeta.textContent = "";
    hostQuestionModeHint.classList.add("hidden");
    hostCorrect.textContent = "Un nouveau champion est ne.";
    hostCelebration.classList.add("hidden");
    renderPodium(state.leaderboard || []);
    hostPodiumCard.classList.remove("hidden");
    updateAnswerChips(0, 0, 0);
    stopCountdown();
  }
});

socket.on("host:question:full", (payload) => {
  hostQuestionTitle.textContent = `Question ${payload.index + 1}/${payload.total}`;
  hostQuestionText.textContent = payload.text;
  hostMeta.textContent = `Categorie: ${payload.category}`;
  if (Number(payload.minSelections || 1) > 1) {
    hostQuestionModeHint.textContent = "Plusieurs reponses possibles";
    hostQuestionModeHint.classList.remove("hidden");
  } else {
    hostQuestionModeHint.classList.add("hidden");
  }
  hostCorrect.textContent = "";
  hostCelebration.classList.add("hidden");
  hostPodiumCard.classList.add("hidden");
  hostAnswersBody.innerHTML = "";
  seenAnswerPlayerIds = new Set();
  updateAnswerChips(0, 0, 0);
  startCountdown(payload.startedAt, payload.durationSeconds);
});

socket.on("host:answers:update", (payload) => {
  renderAnswers(payload);
});

socket.on("question:ended", (payload) => {
  stopCountdown();
  hostCorrect.textContent = `Bonne reponse: ${payload.correctAnswer}`;

  if (payload.explanation) {
    hostExplanationText.textContent = payload.explanation;
    hostExplanation.classList.remove("hidden");
    animateEntrance(hostExplanation);
  } else {
    hostExplanation.classList.add("hidden");
  }

  if (payload.allCorrect && payload.celebrationGif) {
    hostCelebrationText.textContent = `${payload.roundTitle}: ${payload.roundMessage}`;
    hostCelebrationGif.src = payload.celebrationGif;
    hostCelebration.classList.remove("hidden");
    animateEntrance(hostCelebration);
  } else if (payload.allWrong && payload.failGif) {
    hostCelebrationText.textContent = `${payload.roundTitle}: ${payload.roundMessage}`;
    hostCelebrationGif.src = payload.failGif;
    hostCelebration.classList.remove("hidden");
    animateEntrance(hostCelebration);
  } else {
    hostCelebration.classList.add("hidden");
  }

  renderPodium(payload.leaderboard || []);
  hostPodiumCard.classList.remove("hidden");
  animateEntrance(hostPodiumCard);

  if (payload.topFastCorrect.length > 0) {
    const winner = payload.topFastCorrect[0];
    hostMeta.textContent = `Le plus rapide: ${winner.nickname} (${winner.points} pts)`;
  } else {
    hostMeta.textContent = "Personne n'a trouve la bonne reponse cette fois.";
  }
});

socket.on("game:finished", (payload) => {
  stopCountdown();
  hostQuestionTitle.textContent = "Podium final";
  hostQuestionText.textContent = payload.message;
  hostMeta.textContent = "";
  hostQuestionModeHint.classList.add("hidden");

  if (payload.winner) {
    hostCorrect.textContent = `Trop fort ${payload.winner.nickname}, score final ${payload.winner.score} points.`;
  } else {
    hostCorrect.textContent = "Pas de vainqueur: aucun joueur connecte.";
  }

  renderPodium(payload.leaderboard || []);
  hostPodiumCard.classList.remove("hidden");
});

socket.on("game:reset", () => {
  stopCountdown();
  hostTimer.textContent = `${currentDuration}s`;
  hostCelebration.classList.add("hidden");
  hostQuestionModeHint.classList.add("hidden");
  hostPodiumCard.classList.add("hidden");
  hostAnswersBody.innerHTML = "";
  seenAnswerPlayerIds = new Set();
  updateAnswerChips(0, 0, 0);
});

function renderHostLeaderboard(leaderboard) {
  hostLeaderboardBody.innerHTML = "";
  leaderboard.forEach((entry) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${entry.rank}</td><td>${entry.nickname}</td><td>${entry.score}</td><td>+${entry.lastPoints}</td>`;
    hostLeaderboardBody.appendChild(tr);
  });
}

function startCountdown(startedAt, durationSeconds) {
  stopCountdown();

  const render = () => {
    const elapsed = (Date.now() - startedAt) / 1000;
    const left = Math.max(0, durationSeconds - elapsed);
    hostTimer.textContent = `${Math.ceil(left)}s`;
    hostTimer.classList.toggle("timer-urgent", left <= 10);
  };

  render();
  countdownInterval = setInterval(render, 250);
}

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  hostTimer.classList.remove("timer-urgent");
}

function renderAnswers(payload) {
  if (payload.questionIndex < 0) {
    return;
  }

  const correctCount = payload.details.filter((entry) => entry.isCorrect).length;
  const wrongCount = payload.details.length - correctCount;
  const pendingCount = Math.max(0, payload.playerCount - payload.answerCount);
  updateAnswerChips(correctCount, wrongCount, pendingCount);

  hostAnswersBody.innerHTML = "";
  payload.details.forEach((entry) => {
    const tr = document.createElement("tr");
    const statusText = entry.isCorrect ? "Bon" : "Faux";
    const timeSeconds = (entry.elapsedMs / 1000).toFixed(2);

    tr.className = entry.isCorrect ? "answer-row answer-correct" : "answer-row answer-wrong";
    if (!seenAnswerPlayerIds.has(entry.playerId)) {
      tr.classList.add(entry.isCorrect ? "pop-good" : "pop-bad");
      seenAnswerPlayerIds.add(entry.playerId);
    }

    tr.innerHTML = `<td>${entry.order}</td><td>${entry.nickname}</td><td>${entry.answerLabel}</td><td>${statusText}</td><td>${timeSeconds}s</td><td>+${entry.points}</td>`;
    hostAnswersBody.appendChild(tr);
  });
}

function updateAnswerChips(correct, wrong, pending) {
  correctCountChip.textContent = `${correct} correct`;
  wrongCountChip.textContent = `${wrong} faux`;
  pendingCountChip.textContent = `${pending} attente`;

  animateChipIfChanged(correctCountChip, correct, lastCounts.correct);
  animateChipIfChanged(wrongCountChip, wrong, lastCounts.wrong);
  animateChipIfChanged(pendingCountChip, pending, lastCounts.pending);

  lastCounts = { correct, wrong, pending };
}

function animateChipIfChanged(element, current, previous) {
  if (current === previous) {
    return;
  }
  element.classList.remove("chip-bump");
  void element.offsetWidth;
  element.classList.add("chip-bump");
}

function animateEntrance(element) {
  element.classList.remove("celebrate-in");
  void element.offsetWidth;
  element.classList.add("celebrate-in");
}

function renderPodium(leaderboard) {
  const top = [leaderboard[0], leaderboard[1], leaderboard[2]];
  updatePodiumSlot(hostPodiumFirst, top[0]);
  updatePodiumSlot(hostPodiumSecond, top[1]);
  updatePodiumSlot(hostPodiumThird, top[2]);
}

function updatePodiumSlot(node, entry) {
  const nameEl = node.querySelector(".podium-name");
  const scoreEl = node.querySelector(".podium-score");
  if (!entry) {
    nameEl.textContent = "-";
    scoreEl.textContent = "0 pts";
    return;
  }

  nameEl.textContent = entry.nickname;
  scoreEl.textContent = `${entry.score} pts`;
}
