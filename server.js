const os = require("os");
const path = require("path");
const net = require("net");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const QRCode = require("qrcode");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DEFAULT_PORT = Number(process.env.PORT || 3000);
const QUESTION_DURATION_SECONDS = 60;
const CELEBRATION_GIFS = [
  "https://media.giphy.com/media/pu77FmyxXEloNdhs6U/giphy.gif",
  "https://media.giphy.com/media/1PMVNNKVIL8Ig/giphy.gif",
  "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
  "https://media.giphy.com/media/dv6bed9SrshzPRLa1s/giphy.gif",
  "https://media.giphy.com/media/xUOrwp4STllIPP6zyo/giphy.gif",
  "https://media.giphy.com/media/ktU8kAKsyIauRSOoZs/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/YTbZzCkRQCEJa/giphy.gif",
  "https://media.giphy.com/media/M1Ge89HJxugRfkH1jt/giphy.gif",
  "https://media.giphy.com/media/BjNMiLuMsLL2gu4gtl/giphy.gif",
  "https://media.giphy.com/media/s2qXK8wAvkHTO/giphy.gif",
  "https://media.giphy.com/media/IwAZ6dvvvaTtdI8SD5/giphy.gif"

];
const FAIL_GIFS = [
  "https://media.giphy.com/media/3EiNpweH34XGoQcq9Q/giphy.gif",
  "https://media.giphy.com/media/YaXDLHHbz0t5lTM03z/giphy.gif",
  "https://media.giphy.com/media/gKHGnB1ml0moQdjhEJ/giphy.gif",
  "https://media.giphy.com/media/glmRyiSI3v5E4/giphy.gif",
  "https://media.giphy.com/media/3etP8HqLPVixUc9Y3s/giphy.gif",
  "https://media.giphy.com/media/OQHD0kB7RLJMakUh2W/giphy.gif",
  "https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/giphy.gif",
  "https://media.giphy.com/media/lkdH8FmImcGoylv3t3/giphy.gif",
  "https://media.giphy.com/media/WRQBXSCnEFJIuxktnw/giphy.gif",
  "https://media.giphy.com/media/FY8c5SKwiNf1EtZKGs/giphy.gif",
  "https://media.giphy.com/media/SqmkZ5IdwzTP2/giphy.gif",
  "https://media.giphy.com/media/H4zeDO4ocDYqY/giphy.gif"
];
const ALLOWED_REACTIONS = new Set(["cat", "thumbs_up", "thumbs_down"]);
const REACTION_EMOJI = {
  cat: "🐱",
  thumbs_up: "👍",
  thumbs_down: "👎"
};
const REACTION_COOLDOWN_MS = 600;
const FIRE_STREAK_MIN = 2;
const FIRE_STREAK_SUPER = 3;
const ROUND_PHRASES = {
  "all-correct": [
    { title: "Perfect round", message: "Masterclass: tout le monde a trouve la bonne reponse." },
    { title: "Sans faute", message: "Equipe en feu: 100% de bonnes reponses." },
    { title: "Precision totale", message: "Aucun faux pas, c'etait chirurgical." },
    { title: "Clean sweep", message: "Round valide par tout le monde, enorme." }
  ],
  "all-wrong": [
    { title: "Oups collectif", message: "Tout le monde est tombe dans le piege cette fois." },
    { title: "Piege parfait", message: "0 bonne reponse, mais on rebondit au prochain round." },
    { title: "Round difficile", message: "Personne n'a eu juste, reset mental et on repart." },
    { title: "Crash test", message: "Full faux pour la salle, prochaine question pour se refaire." }
  ],
  mixed: [
    { title: "Round partage", message: "Bonne dynamique, certains ont trouve, d'autres progressent." },
    { title: "Ca se joue", message: "Des bons choix et des pieges, le quiz est ouvert." },
    { title: "Encore serre", message: "Le classement bouge, rien n'est decide." },
    { title: "Montee en puissance", message: "On ajuste les reponses et on continue fort." }
  ]
};

const awsQuestions = [
  {
    id: "s2-aws-1",
    text: "Quel service AWS permet de gerer des identites, des roles et des permissions ?",
    options: ["AWS IAM", "Amazon GuardDuty", "AWS Shield", "Amazon Macie"],
    correctIndex: 0,
    explanation: "AWS IAM (Identity and Access Management) sert a controler qui peut faire quoi sur les ressources AWS.",
    category: "AWS"
  },
  {
    id: "s2-aws-2",
    text: "Quel service de stockage est le plus adapte pour conserver des objets de facon durable et economique ?",
    options: ["Amazon EBS", "Amazon S3", "Amazon RDS", "Amazon ElastiCache"],
    correctIndex: 1,
    explanation: "Amazon S3 est le stockage d'objets standard pour de nombreux cas d'usage, avec durabilite elevee et cout optimise.",
    category: "AWS"
  },
  {
    id: "s2-aws-3",
    text: "Quel service gere une base de donnees relationnelle sans avoir a administrer le moteur vous-meme ?",
    options: ["Amazon RDS", "Amazon DynamoDB", "Amazon SQS", "Amazon Route 53"],
    correctIndex: 0,
    explanation: "Amazon RDS fournit des bases relationnelles gerees comme MySQL, PostgreSQL, MariaDB, Oracle et SQL Server.",
    category: "AWS"
  },
  {
    id: "s2-aws-4",
    text: "Quel service distribue le contenu via des points de presence proches des utilisateurs ?",
    options: ["Amazon CloudFront", "AWS Direct Connect", "AWS Backup", "Amazon Athena"],
    correctIndex: 0,
    explanation: "Amazon CloudFront est le CDN AWS, utile pour reduire la latence et accelerer la diffusion du contenu.",
    category: "AWS"
  },
  {
    id: "s2-aws-5",
    text: "Quel service execute du code a la demande sans gestion de serveurs ?",
    options: ["Amazon ECS", "AWS Lambda", "Amazon EC2", "AWS Batch"],
    correctIndex: 1,
    explanation: "AWS Lambda permet d'executer du code sans provisionner ni maintenir de serveurs.",
    category: "AWS"
  },
  {
    id: "s2-aws-6",
    text: "Quel service centralise metriques, logs et alarmes ?",
    options: ["Amazon CloudWatch", "AWS Config", "AWS Artifact", "AWS Organizations"],
    correctIndex: 0,
    explanation: "Amazon CloudWatch sert a surveiller les workloads avec metriques, logs, alarmes et tableaux de bord.",
    category: "AWS"
  },
  {
    id: "s2-aws-7",
    text: "Quel service enregistre les appels API et les actions effectuees dans un compte AWS ?",
    options: ["AWS CloudTrail", "Amazon Inspector", "Amazon Detective", "AWS WAF"],
    correctIndex: 0,
    explanation: "AWS CloudTrail conserve un historique des appels API pour l'audit et l'investigation.",
    category: "AWS"
  },
  {
    id: "s2-aws-8",
    text: "Quel service DNS permet du routage par latence, geolocalisation ou failover ?",
    options: ["Amazon Route 53", "Amazon CloudFront", "AWS Global Accelerator", "Amazon VPC"],
    correctIndex: 0,
    explanation: "Amazon Route 53 fournit l'enregistrement DNS et des policies de routage avancees.",
    category: "AWS"
  },
  {
    id: "s2-aws-9",
    text: "Quel service repartit le trafic entrant sur plusieurs cibles pour ameliorer la disponibilite ?",
    options: ["Elastic Load Balancing", "AWS Snowball", "Amazon QuickSight", "Amazon Textract"],
    correctIndex: 0,
    explanation: "Elastic Load Balancing distribue le trafic vers plusieurs instances, conteneurs ou IPs.",
    category: "AWS"
  },
  {
    id: "s2-aws-10",
    text: "Quel service ajoute ou retire automatiquement des ressources selon la charge ?",
    options: ["AWS Auto Scaling", "AWS Budgets", "AWS KMS", "Amazon Athena"],
    correctIndex: 0,
    explanation: "AWS Auto Scaling adapte automatiquement la capacite aux variations de trafic ou d'utilisation.",
    category: "AWS"
  },
  {
    id: "s2-aws-11",
    text: "Quel stockage est attache a une instance EC2 sous forme de disque bloc ?",
    options: ["Amazon EBS", "Amazon S3", "Amazon EFS", "Amazon Redshift"],
    correctIndex: 0,
    explanation: "Amazon EBS fournit un stockage bloc persistant pour les instances EC2.",
    category: "AWS"
  },
  {
    id: "s2-aws-12",
    text: "Quel service sert a decoupler deux composants avec une file de messages ?",
    options: ["Amazon SQS", "Amazon SNS", "Amazon EC2", "AWS Glue"],
    correctIndex: 0,
    explanation: "Amazon SQS est une file de messages geree pour les traitements asynchrones et le decouplage.",
    category: "AWS"
  },
  {
    id: "s2-aws-13",
    text: "Quel service diffuse un message vers plusieurs abonnements et plusieurs protocoles ?",
    options: ["Amazon SNS", "Amazon SQS", "AWS Backup", "Amazon EC2"],
    correctIndex: 0,
    explanation: "Amazon SNS est un service pub/sub pour notifier plusieurs consommateurs en parallele.",
    category: "AWS"
  },
  {
    id: "s2-aws-14",
    text: "Quel service NoSQL serverless offre des latences faibles a grande echelle ?",
    options: ["Amazon DynamoDB", "Amazon Aurora", "Amazon RDS", "Amazon ElastiCache"],
    correctIndex: 0,
    explanation: "Amazon DynamoDB est une base NoSQL geree, tres scalable et conue pour la performance previsible.",
    category: "AWS"
  },
  {
    id: "s2-aws-15",
    text: "Quel service gere les cles de chiffrement integrees a la plupart des services AWS ?",
    options: ["AWS KMS", "AWS Secrets Manager", "AWS IAM", "Amazon GuardDuty"],
    correctIndex: 0,
    explanation: "AWS KMS permet de creer et gerer des cles de chiffrement avec integration dans l'ecosysteme AWS.",
    category: "AWS"
  },
  {
    id: "s2-aws-16",
    text: "Quel service est pense pour stocker et faire tourner des secrets applicatifs ?",
    options: ["AWS Secrets Manager", "Amazon S3", "AWS CloudFormation", "Amazon Cognito"],
    correctIndex: 0,
    explanation: "AWS Secrets Manager stocke et chiffre des secrets comme des mots de passe ou des tokens API.",
    category: "AWS"
  },
  {
    id: "s2-aws-17",
    text: "Quel service permet de decrire l'infrastructure AWS en templates versionnables ?",
    options: ["AWS CloudFormation", "AWS Config", "Amazon EventBridge", "AWS Trusted Advisor"],
    correctIndex: 0,
    explanation: "AWS CloudFormation sert a definir et deploiement l'infrastructure en tant que code.",
    category: "AWS"
  },
  {
    id: "s2-aws-18",
    text: "Quel service permet de regrouper plusieurs comptes AWS sous une gouvernance centralisee ?",
    options: ["AWS Organizations", "AWS Artifact", "Amazon Macie", "Amazon CloudWatch"],
    correctIndex: 0,
    explanation: "AWS Organizations aide a gerer plusieurs comptes et a appliquer des policies communes.",
    category: "AWS"
  },
  {
    id: "s2-aws-19",
    text: "Sur EC2, qui est responsable de patcher le systeme d'exploitation dans le modele partage ?",
    options: ["AWS", "Le client", "Le fournisseur de la base de donnees", "Personne"],
    correctIndex: 1,
    explanation: "Dans le modele de responsabilite partagee, le client gere l'OS et les applications sur EC2.",
    category: "AWS"
  },
  {
    id: "s2-aws-20",
    text: "Quelle option est adaptee a une charge stable avec engagement pour reduire la facture ?",
    options: ["Savings Plans ou Reserved Instances", "Spot Instances", "On-Demand uniquement", "Free Tier"],
    correctIndex: 0,
    explanation: "Savings Plans et Reserved Instances offrent des remises contre un engagement de consommation.",
    category: "AWS"
  },
  {
    id: "s2-aws-21-hard",
    text: "[DIFFICILE] Quel est le principal inconvenient d'une Lambda executee dans un VPC ?",
    options: ["Un cold start plus lent", "Plus aucun acces au reseau", "Un cout 100x plus eleve", "Une obligation de gerer manuellement le scale"],
    correctIndex: 0,
    explanation: "Une Lambda dans un VPC peut avoir un demarrage plus lent a cause de l'attache reseau.",
    category: "AWS"
  },
  {
    id: "s2-aws-22-ultra-hard",
    text: "[ULTRA-DIFFICILE] Quel service permet de sauvegarder et restaurer des donnees AWS de facon centralisee ?",
    options: ["AWS Backup", "AWS Budgets", "Amazon QuickSight", "AWS IoT Core"],
    correctIndex: 0,
    explanation: "AWS Backup centralise la planification, la conservation et la restauration des sauvegardes.",
    category: "AWS"
  },
  {
    id: "s2-aws-23-super-hard",
    text: "[SUPER-DIFFICILE] Une action est autorisee par IAM mais refusee explicitement par une SCP. Quel est le resultat ?",
    options: ["L'action est autorisee", "Le deny explicite de la SCP gagne", "Le resultat depend de la region", "IAM Prime sur la SCP"],
    correctIndex: 1,
    explanation: "Un deny explicite bloque toujours l'action, et une SCP definit la limite maximale des permissions.",
    category: "AWS"
  },
  {
    id: "s2-aws-24",
    text: "Quel service detecte des menaces en continu en analysant differents signaux de securite ?",
    options: ["Amazon GuardDuty", "AWS Cost Explorer", "Amazon Athena", "AWS Snowcone"],
    correctIndex: 0,
    explanation: "Amazon GuardDuty detecte des menaces grace a l'analyse de signaux comme CloudTrail et les logs reseau.",
    category: "AWS"
  },
  {
    id: "s2-aws-25",
    text: "Quel service agrège les alertes et findings de securite sur plusieurs services AWS ?",
    options: ["AWS Security Hub", "AWS Artifact", "Amazon Inspector", "AWS WAF"],
    correctIndex: 0,
    explanation: "AWS Security Hub centralise et normalise les findings de securite pour simplifier le suivi.",
    category: "AWS"
  },
  {
    id: "s2-aws-26",
    text: "Quel service fournit des certificats SSL/TLS geres pour les applications AWS ?",
    options: ["AWS Certificate Manager", "AWS KMS", "AWS IAM Identity Center", "Amazon Route 53"],
    correctIndex: 0,
    explanation: "AWS Certificate Manager (ACM) emet et renouvelle des certificats utilises avec des services AWS compatibles.",
    category: "AWS"
  },
  {
    id: "s2-aws-27",
    text: "Quel service cree un reseau virtuel isole dans AWS ?",
    options: ["Amazon VPC", "AWS Organizations", "Amazon S3", "AWS Lambda"],
    correctIndex: 0,
    explanation: "Amazon VPC permet de definir un reseau prive virtuel avec sous-reseaux, routes et controles de securite.",
    category: "AWS"
  },
  {
    id: "s2-aws-28",
    text: "Quel service permet d'acceder a des services AWS de facon privee sans passer par Internet public ?",
    options: ["AWS PrivateLink", "Amazon CloudFront", "AWS Outposts", "AWS Snowball"],
    correctIndex: 0,
    explanation: "AWS PrivateLink fournit un acces prive a des services via des endpoints dans le reseau AWS.",
    category: "AWS"
  },
  {
    id: "s2-aws-29",
    text: "Quel service orchestre des conteneurs sans vous demander de gerer directement les serveurs ?",
    options: ["Amazon ECS avec Fargate", "Amazon EBS", "AWS IAM", "AWS Backup"],
    correctIndex: 0,
    explanation: "Avec ECS et Fargate, AWS prend en charge la couche d'infrastructure pour les conteneurs.",
    category: "AWS"
  },
  {
    id: "s2-aws-30",
    text: "Quel service stocke des images de conteneurs Docker de maniere geree ?",
    options: ["Amazon ECR", "Amazon EFS", "Amazon S3", "AWS Config"],
    correctIndex: 0,
    explanation: "Amazon ECR est le registre gere d'images de conteneurs pour ECS, EKS et autres environnements.",
    category: "AWS"
  },
  {
    id: "s2-aws-31",
    text: "Quel service permet d'interroger des donnees dans S3 avec SQL sans serveur ?",
    options: ["Amazon Athena", "Amazon RDS", "AWS Glue Studio", "AWS Step Functions"],
    correctIndex: 0,
    explanation: "Amazon Athena interroge directement les donnees stockees dans S3 avec un modele serverless et SQL.",
    category: "AWS"
  }
];

const funQuestions = [
  {
    id: "s2-fun-0",
    text: "Tu veux une API simple sans gerer de serveurs ni de patching. Le duo le plus naturel ?",
    options: ["Lambda + API Gateway", "EC2 + Apache", "RDS + ElastiCache", "S3 + Glacier"],
    correctIndex: 0,
    explanation: "Lambda et API Gateway couvrent tres bien les APIs serverless avec peu d'operations a maintenir.",
    category: "Fun"
  },
  {
    id: "s2-fun-1",
    text: "Tu veux un site statique avec HTTPS, un domaine perso et un minimum de bricolage. Quel combo choisiras-tu ?",
    options: ["S3 + CloudFront + Route 53 + ACM", "EC2 seul", "RDS Multi-AZ", "Lambda sans stockage"],
    correctIndex: 0,
    explanation: "S3 heberge, CloudFront accelere, Route 53 gere le DNS et ACM fournit le certificat HTTPS.",
    category: "Fun"
  },
  {
    id: "s2-fun-2",
    text: "Deux applis doivent echanger des messages sans se bloquer mutuellement. Le service le plus simple pour ca ?",
    options: ["Amazon SQS", "Amazon CloudFront", "AWS Budgets", "AWS WAF"],
    correctIndex: 0,
    explanation: "Amazon SQS absorbe les pics et decouple proprement le producteur du consommateur.",
    category: "Fun"
  },
  {
    id: "s2-fun-3",
    text: "Tu veux donner un acces propre a plusieurs comptes avec SSO et une gouvernance centrale. Tu prends quoi ?",
    options: ["IAM Identity Center", "S3 Glacier", "AWS Snowcone", "Amazon Textract"],
    correctIndex: 0,
    explanation: "IAM Identity Center permet un acces centralise et plus propre que les comptes partages a la main.",
    category: "Fun"
  }
];

function buildQuiz() {
  return [
    funQuestions[0],
    ...awsQuestions.slice(0, 5),
    funQuestions[1],
    ...awsQuestions.slice(5, 10),
    funQuestions[2],
    ...awsQuestions.slice(10, 15),
    funQuestions[3],
    ...awsQuestions.slice(15)
  ];
}

const quizQuestions = buildQuiz();

const state = {
  players: new Map(),
  answers: new Map(),
  hostIds: new Set(),
  phase: "lobby",
  questionIndex: -1,
  questionStartedAt: null,
  questionTimeout: null,
  questionDurationSeconds: QUESTION_DURATION_SECONDS
};

const networkIp = getLocalIp();
let currentPort = DEFAULT_PORT;
let qrCodeDataUrl = "";

function getJoinUrl() {
  return `http://${networkIp}:${currentPort}/`;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/host", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "host.html"));
});

app.get("/display", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "display.html"));
});

app.get("/api/config", async (_req, res) => {
  if (!qrCodeDataUrl) {
    qrCodeDataUrl = await QRCode.toDataURL(getJoinUrl());
  }
  res.json({
    joinUrl: getJoinUrl(),
    displayUrl: `${getJoinUrl()}display`,
    qrCodeDataUrl,
    questionDurationSeconds: QUESTION_DURATION_SECONDS,
    totalQuestions: quizQuestions.length
  });
});

io.on("connection", (socket) => {
  socket.on("host:join", () => {
    state.hostIds.add(socket.id);
    socket.join("hosts");
    emitFullState();
  });

  socket.on("host:start", () => {
    if (!isHost(socket.id)) {
      return;
    }
    resetRoundData();
    state.phase = "question";
    state.questionIndex = 0;
    startQuestion();
  });

  socket.on("host:next", () => {
    if (!isHost(socket.id) || state.phase !== "review") {
      return;
    }
    state.questionIndex += 1;
    if (state.questionIndex >= quizQuestions.length) {
      finishGame();
      return;
    }
    state.phase = "question";
    startQuestion();
  });

  socket.on("host:restart", () => {
    if (!isHost(socket.id)) {
      return;
    }
    clearQuestionTimer();
    for (const player of state.players.values()) {
      player.score = 0;
      player.lastPoints = 0;
      player.lastCorrect = false;
    }
    state.questionIndex = -1;
    state.phase = "lobby";
    state.questionStartedAt = null;
    state.answers.clear();
    emitFullState();
    io.emit("game:reset");
  });

  socket.on("player:join", (payload) => {
    const nickname = sanitizeNickname(payload?.nickname);
    if (!nickname) {
      socket.emit("player:error", "Pseudo invalide.");
      return;
    }

    state.players.set(socket.id, {
      id: socket.id,
      nickname,
      score: 0,
      lastPoints: 0,
      lastCorrect: false,
      streak: 0,
      bestStreak: 0,
      lastReactionAt: 0
    });

    socket.emit("player:joined", { id: socket.id, nickname });

    if (state.phase === "question" && state.questionIndex >= 0) {
      socket.emit("question:start", publicQuestionPayload());
    }
    if (state.phase === "review" && state.questionIndex >= 0) {
      socket.emit("question:ended", reviewPayload());
    }
    if (state.phase === "finished") {
      socket.emit("game:finished", gameFinishedPayload());
    }

    emitFullState();
  });

  socket.on("player:answer", (payload) => {
    if (state.phase !== "question") {
      return;
    }
    if (!state.players.has(socket.id)) {
      return;
    }
    if (state.answers.has(socket.id)) {
      return;
    }

    const answerIndex = Number(payload?.answerIndex);
    const currentQuestion = quizQuestions[state.questionIndex];
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= currentQuestion.options.length) {
      return;
    }

    const elapsedMs = Math.max(0, Date.now() - state.questionStartedAt);
    const elapsedSeconds = Math.min(state.questionDurationSeconds, elapsedMs / 1000);
    const timeLeft = Math.max(0, state.questionDurationSeconds - elapsedSeconds);
    const isCorrect = answerIndex === currentQuestion.correctIndex;
    const speedFactor = timeLeft / state.questionDurationSeconds;
    const points = isCorrect ? Math.round(300 + speedFactor * 700) : 0;

    state.answers.set(socket.id, {
      answerIndex,
      elapsedMs,
      points,
      isCorrect
    });

    const player = state.players.get(socket.id);
    player.lastPoints = points;
    player.lastCorrect = isCorrect;
    player.streak = isCorrect ? player.streak + 1 : 0;
    player.bestStreak = Math.max(player.bestStreak, player.streak);
    player.score += points;

    socket.emit("player:answer:accepted", {
      isCorrect,
      points,
      timeLeftSeconds: Number(timeLeft.toFixed(2))
    });

    socket.emit("player:streak:update", {
      streak: player.streak,
      bestStreak: player.bestStreak,
      fire: player.streak >= FIRE_STREAK_MIN,
      superFire: player.streak >= FIRE_STREAK_SUPER
    });

    if (isCorrect && player.streak >= FIRE_STREAK_MIN) {
      io.emit("display:streak:fire", {
        playerId: player.id,
        nickname: player.nickname,
        streak: player.streak,
        level: player.streak >= FIRE_STREAK_SUPER ? "super" : "hot",
        createdAt: Date.now()
      });
    }

    emitFullState();

    if (state.answers.size >= state.players.size && state.players.size > 0) {
      endQuestion("all-answered");
    }
  });

  socket.on("player:reaction", (payload) => {
    const player = state.players.get(socket.id);
    if (!player) {
      return;
    }

    const reaction = String(payload?.reaction || "").trim();
    if (!ALLOWED_REACTIONS.has(reaction)) {
      return;
    }

    const now = Date.now();
    if (now - player.lastReactionAt < REACTION_COOLDOWN_MS) {
      return;
    }

    player.lastReactionAt = now;
    io.emit("display:reaction", {
      playerId: player.id,
      nickname: player.nickname,
      reaction,
      emoji: REACTION_EMOJI[reaction],
      createdAt: now
    });
  });

  socket.on("disconnect", () => {
    state.hostIds.delete(socket.id);
    state.players.delete(socket.id);
    state.answers.delete(socket.id);

    if (state.phase === "question" && state.answers.size >= state.players.size && state.players.size > 0) {
      endQuestion("disconnect-check");
    }

    emitFullState();
  });

  emitFullState();
});

function startQuestion() {
  clearQuestionTimer();
  state.answers.clear();
  state.questionStartedAt = Date.now();

  io.emit("question:start", publicQuestionPayload());
  io.to("hosts").emit("host:question:full", hostQuestionPayload());

  state.questionTimeout = setTimeout(() => {
    endQuestion("timer");
  }, state.questionDurationSeconds * 1000);

  emitFullState();
}

function endQuestion(reason) {
  if (state.phase !== "question") {
    return;
  }
  clearQuestionTimer();
  state.phase = "review";

  io.emit("question:ended", reviewPayload(reason));
  emitFullState();
}

function finishGame() {
  clearQuestionTimer();
  state.phase = "finished";
  io.emit("game:finished", gameFinishedPayload());
  emitFullState();
}

function clearQuestionTimer() {
  if (state.questionTimeout) {
    clearTimeout(state.questionTimeout);
    state.questionTimeout = null;
  }
}

function resetRoundData() {
  clearQuestionTimer();
  for (const player of state.players.values()) {
    player.score = 0;
    player.lastPoints = 0;
    player.lastCorrect = false;
      player.streak = 0;
      player.bestStreak = 0;
    player.streak = 0;
    player.bestStreak = 0;
  }
  state.answers.clear();
  state.questionStartedAt = null;
}

function publicQuestionPayload() {
  const question = quizQuestions[state.questionIndex];
  return {
    index: state.questionIndex,
    total: quizQuestions.length,
    id: question.id,
    text: question.text,
    options: question.options,
    category: question.category,
    durationSeconds: state.questionDurationSeconds,
    startedAt: state.questionStartedAt
  };
}

function hostQuestionPayload() {
  const question = quizQuestions[state.questionIndex];
  return {
    ...publicQuestionPayload(),
    correctIndex: question.correctIndex
  };
}

function reviewPayload(reason = "manual") {
  const question = quizQuestions[state.questionIndex];
  const answers = [...state.answers.values()];
  const allAnswered = state.players.size > 0 && state.answers.size === state.players.size;
  const allCorrect = allAnswered && answers.every((answer) => answer.isCorrect);
  const allWrong = allAnswered && answers.every((answer) => !answer.isCorrect);
  let roundOutcome = "mixed";
  if (allCorrect) {
    roundOutcome = "all-correct";
  } else if (allWrong) {
    roundOutcome = "all-wrong";
  }
  const roundText = randomRoundPhrase(roundOutcome);
  const roundTitle = roundText.title;
  const roundMessage = roundText.message;
  const explanation = question.explanation || "";

  const topFastCorrect = [...state.answers.entries()]
    .filter(([, answer]) => answer.isCorrect)
    .sort((a, b) => a[1].elapsedMs - b[1].elapsedMs)
    .slice(0, 3)
    .map(([playerId, answer], i) => {
      const player = state.players.get(playerId);
      return {
        rank: i + 1,
        nickname: player ? player.nickname : "Joueur",
        points: answer.points,
        elapsedMs: answer.elapsedMs
      };
    });

  return {
    reason,
    index: state.questionIndex,
    total: quizQuestions.length,
    question: question.text,
    category: question.category,
    correctIndex: question.correctIndex,
    correctAnswer: question.options[question.correctIndex],
    explanation,
    allCorrect,
    allWrong,
    roundOutcome,
    roundTitle,
    roundMessage,
    celebrationGif: allCorrect ? randomCelebrationGif() : null,
    failGif: allWrong ? randomFailGif() : null,
    leaderboard: leaderboardPayload(),
    topFastCorrect
  };
}

function randomCelebrationGif() {
  const index = Math.floor(Math.random() * CELEBRATION_GIFS.length);
  return CELEBRATION_GIFS[index];
}

function randomFailGif() {
  const index = Math.floor(Math.random() * FAIL_GIFS.length);
  return FAIL_GIFS[index];
}

function randomRoundPhrase(outcome) {
  const pool = ROUND_PHRASES[outcome] || ROUND_PHRASES.mixed;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

function hostAnswersPayload() {
  const question = quizQuestions[state.questionIndex];
  const options = question ? question.options : [];

  const details = [...state.answers.entries()]
    .map(([playerId, answer]) => {
      const player = state.players.get(playerId);
      const answerLabel = options[answer.answerIndex] || "(unknown)";

      return {
        playerId,
        nickname: player ? player.nickname : "Joueur",
        answerIndex: answer.answerIndex,
        answerLabel,
        isCorrect: answer.isCorrect,
        points: answer.points,
        elapsedMs: answer.elapsedMs
      };
    })
    .sort((a, b) => a.elapsedMs - b.elapsedMs)
    .map((entry, index) => ({
      order: index + 1,
      ...entry
    }));

  return {
    phase: state.phase,
    questionIndex: state.questionIndex,
    totalQuestions: quizQuestions.length,
    playerCount: state.players.size,
    answerCount: details.length,
    details
  };
}

function gameFinishedPayload() {
  const leaderboard = leaderboardPayload();
  const winner = leaderboard[0] || null;
  return {
    leaderboard,
    winner,
    message: winner
      ? `Bravo ${winner.nickname} ! Tu es le champion AWS CLF-C02 du jour.`
      : "Quiz termine."
  };
}

function emitFullState() {
  const payload = {
    phase: state.phase,
    questionIndex: state.questionIndex,
    totalQuestions: quizQuestions.length,
    connectedPlayers: state.players.size,
    answeredPlayers: state.answers.size,
    leaderboard: leaderboardPayload(),
    players: [...state.players.values()].map((p) => ({
      id: p.id,
      nickname: p.nickname,
      score: p.score,
      streak: p.streak || 0,
      bestStreak: p.bestStreak || 0
    }))
  };

  io.emit("state:update", payload);
  io.to("hosts").emit("host:answers:update", hostAnswersPayload());
}

function leaderboardPayload() {
  return [...state.players.values()]
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({
      rank: index + 1,
      id: player.id,
      nickname: player.nickname,
      score: player.score,
      lastPoints: player.lastPoints,
      lastCorrect: player.lastCorrect,
      streak: player.streak || 0,
      bestStreak: player.bestStreak || 0
    }));
}

function sanitizeNickname(input) {
  const cleaned = String(input || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 20);
  return cleaned;
}

function isHost(socketId) {
  return state.hostIds.has(socketId);
}

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    const netList = nets[name] || [];
    for (const net of netList) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    function tryPort(port) {
      const tester = net.createServer();

      tester.once("error", (error) => {
        if (error.code === "EADDRINUSE") {
          tryPort(port + 1);
          return;
        }
        reject(error);
      });

      tester.once("listening", () => {
        tester.close(() => resolve(port));
      });

      tester.listen(port);
    }

    tryPort(startPort);
  });
}

(async function bootstrap() {
  try {
    const selectedPort = await findAvailablePort(DEFAULT_PORT);
    if (selectedPort !== DEFAULT_PORT) {
      console.warn(`Port ${DEFAULT_PORT} already in use, switched to ${selectedPort}.`);
    }
    currentPort = selectedPort;

    try {
      qrCodeDataUrl = await QRCode.toDataURL(getJoinUrl());
    } catch (error) {
      console.error("Unable to generate QR code:", error.message);
    }

    server.listen(selectedPort, () => {
      console.log(`Quiz server running on http://localhost:${selectedPort}`);
      console.log(`Players join URL: ${getJoinUrl()}`);
      console.log(`Host panel: http://localhost:${selectedPort}/host`);
    });
  } catch (error) {
    console.error("Unable to start server:", error.message);
    process.exit(1);
  }
})();
