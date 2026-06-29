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
    text: "Pour une application a deploier sur plusieurs zones de disponibilite, quel service se charge de repartir le trafic entrant ?",
    options: ["Elastic Load Balancing", "AWS Direct Connect", "Amazon Route 53", "AWS VPN"],
    correctIndex: 0,
    explanation: "Elastic Load Balancing repartit le trafic vers plusieurs cibles pour renforcer la disponibilite et la tolerance aux pannes.",
    category: "AWS"
  },
  {
    id: "s2-aws-2",
    text: "Quel service permet de creer un reseau prive isole dans AWS avec vos sous-reseaux et routes ?",
    options: ["Amazon VPC", "AWS Organizations", "Amazon S3", "AWS Backup"],
    correctIndex: 1,
    explanation: "Amazon VPC definit un reseau virtuel prive avec sous-reseaux, tables de routage, gateways et controles reseau.",
    category: "AWS"
  },
  {
    id: "s2-aws-3",
    text: "Quel composant AWS controle le trafic entrant et sortant au niveau de l'instance EC2 avec des regles stateful ?",
    options: ["Security Group", "Network ACL", "AWS WAF", "AWS Shield"],
    correctIndex: 0,
    explanation: "Le Security Group agit comme un pare-feu stateful attache aux instances ou interfaces reseau.",
    category: "AWS"
  },
  {
    id: "s2-aws-4",
    text: "Quel composant filtre le trafic au niveau du sous-reseau avec des regles stateless ?",
    options: ["Network ACL", "Security Group", "AWS IAM", "Amazon Inspector"],
    correctIndex: 0,
    explanation: "Un Network ACL agit au niveau du sous-reseau et est stateless, donc les regles entree et sortie doivent etre coherentes.",
    category: "AWS"
  },
  {
    id: "s2-aws-5",
    text: "Quel service AWS permet de relier un reseau on-premise a un VPC via Internet chiffre ?",
    options: ["AWS Site-to-Site VPN", "AWS Direct Connect", "Amazon CloudFront", "AWS PrivateLink"],
    correctIndex: 0,
    explanation: "AWS Site-to-Site VPN cree un tunnel chiffre IPsec entre votre environnement et AWS via Internet.",
    category: "AWS"
  },
  {
    id: "s2-aws-6",
    text: "Quel service propose une liaison privee dediee entre votre data center et AWS, sans passer par Internet public ?",
    options: ["AWS Direct Connect", "AWS VPN", "Amazon Route 53", "Amazon CloudWatch"],
    correctIndex: 0,
    explanation: "AWS Direct Connect fournit une connexion reseau privee et plus previsible vers AWS.",
    category: "AWS"
  },
  {
    id: "s2-aws-7",
    text: "Quel service permet de faire du peering entre deux VPC pour qu'ils communiquent comme un seul reseau prive ?",
    options: ["VPC Peering", "AWS Backup", "AWS Budgets", "AWS Artifact"],
    correctIndex: 0,
    explanation: "Le VPC Peering relie directement deux VPC via un lien reseau prive non transitif.",
    category: "AWS"
  },
  {
    id: "s2-aws-8",
    text: "Quel service permet de connecter un VPC a une application partenaire ou un service AWS sans exposer le trafic sur Internet ?",
    options: ["AWS PrivateLink", "Amazon ECR", "AWS Snowball", "Amazon Textract"],
    correctIndex: 0,
    explanation: "AWS PrivateLink utilise des endpoints prives pour exposer un service sans ouvrir le trafic a Internet.",
    category: "AWS"
  },
  {
    id: "s2-aws-9",
    text: "Quel service DNS AWS vous permet de faire du routage par latence, geolocalisation ou failover ?",
    options: ["Amazon Route 53", "AWS WAF", "AWS Shield", "Amazon CloudWatch"],
    correctIndex: 0,
    explanation: "Amazon Route 53 propose un DNS gere avec des policies de routage avancees.",
    category: "AWS"
  },
  {
    id: "s2-aws-10",
    text: "Quel service permet de donner un acces separe aux utilisateurs et roles sans utiliser le compte root au quotidien ?",
    options: ["AWS IAM", "AWS Backup", "Amazon Athena", "Amazon S3"],
    correctIndex: 0,
    explanation: "AWS IAM sert a gerer utilisateurs, groupes, roles et policies pour appliquer le moindre privilege.",
    category: "AWS"
  },
  {
    id: "s2-aws-11",
    text: "Quel service permet de partager un systeme de fichiers entre plusieurs instances EC2 dans plusieurs zones ?",
    options: ["Amazon EFS", "Amazon EBS", "Amazon RDS", "AWS Lambda"],
    correctIndex: 0,
    explanation: "Amazon EFS est un systeme de fichiers gere, elastique et partageable entre plusieurs instances.",
    category: "AWS"
  },
  {
    id: "s2-aws-12",
    text: "Quel service aide a proteger une application web contre des attaques comme le SQL injection ou les bots malveillants ?",
    options: ["AWS WAF", "AWS Direct Connect", "Amazon EFS", "AWS Support"],
    correctIndex: 0,
    explanation: "AWS WAF filtre le trafic HTTP(S) au niveau applicatif avec des regles et des protections gerables.",
    category: "AWS"
  },
  {
    id: "s2-aws-13",
    text: "Quel service aide a proteger contre les attaques DDoS au niveau reseau et applicatif ?",
    options: ["AWS Shield", "Amazon Macie", "AWS Config", "AWS Glue"],
    correctIndex: 0,
    explanation: "AWS Shield protege contre les DDoS ; Shield Advanced apporte des protections supplementaires.",
    category: "AWS"
  },
  {
    id: "s2-aws-14",
    text: "Quel service vous aide a detecter automatiquement des mauvaises configurations de securite dans votre compte ?",
    options: ["AWS Config", "Amazon CloudFront", "AWS Snowball", "Amazon QuickSight"],
    correctIndex: 0,
    explanation: "AWS Config suit l'etat des ressources et peut evaluer leur conformite a des regles de configuration.",
    category: "AWS"
  },
  {
    id: "s2-aws-15",
    text: "Quel service AWS sert a collecter et consulter les journaux d'audit des appels API ?",
    options: ["AWS CloudTrail", "Amazon Inspector", "AWS Budgets", "Amazon Athena"],
    correctIndex: 0,
    explanation: "AWS CloudTrail enregistre les appels API et les actions effectuees dans les comptes AWS.",
    category: "AWS"
  },
  {
    id: "s2-aws-16",
    text: "Quel service permet de definir toute une infrastructure via des templates YAML ou JSON ?",
    options: ["AWS CloudFormation", "Amazon SQS", "AWS WAF", "Amazon VPC"],
    correctIndex: 0,
    explanation: "AWS CloudFormation permet de decrire et de versionner l'infrastructure en tant que code.",
    category: "AWS"
  },
  {
    id: "s2-aws-17",
    text: "Quel service permet de regrouper plusieurs comptes AWS sous une gouvernance commune ?",
    options: ["AWS Organizations", "Amazon ECR", "AWS Lambda", "Amazon VPC"],
    correctIndex: 0,
    explanation: "AWS Organizations facilite la gouvernance multi-comptes et l'application de policies communes.",
    category: "AWS"
  },
  {
    id: "s2-aws-18",
    text: "Quel service est le meilleur point d'entree pour ouvrir un cas de support sur une panne de production ?",
    options: ["AWS Support Center", "AWS Config", "Amazon EventBridge", "AWS Backup"],
    correctIndex: 0,
    explanation: "AWS Support Center permet de creer et suivre des cas de support selon votre plan.",
    category: "AWS"
  },
  {
    id: "s2-aws-19",
    text: "Quel plan de support AWS donne acces a un Technical Account Manager et a des conseils proactifs ?",
    options: ["Enterprise Support", "Basic Support", "Free Tier", "Developer Support"],
    correctIndex: 1,
    explanation: "Le plan Enterprise Support inclut un TAM et des fonctions avancees pour les grosses organisations.",
    category: "AWS"
  },
  {
    id: "s2-aws-20",
    text: "Quel service permet de chiffrer les donnees dans AWS avec des cles gerees ?",
    options: ["AWS KMS", "AWS WAF", "Amazon Route 53", "AWS Direct Connect"],
    correctIndex: 0,
    explanation: "AWS KMS fournit des cles de chiffrement gerees et integrees a de nombreux services AWS.",
    category: "AWS"
  },
  {
    id: "s2-aws-21-hard",
    text: "[DIFFICILE] Sur un Security Group, quelle affirmation est vraie ?",
    options: ["Il est stateful", "Il est applique au niveau du VPC entier", "Il est toujours stateless", "Il ne peut pas etre associe a une instance"],
    correctIndex: 0,
    explanation: "Un Security Group est stateful et s'applique aux interfaces reseau des ressources.",
    category: "AWS"
  },
  {
    id: "s2-aws-22-ultra-hard",
    text: "[ULTRA-DIFFICILE] Quel mecanisme permet a un VPC dans un compte A d'atteindre un VPC dans un compte B sans utiliser Internet ?",
    options: ["VPC Peering", "Amazon S3", "AWS Budgets", "AWS Artifact"],
    correctIndex: 0,
    explanation: "Le VPC Peering relie deux VPC de facon privee, mais il est non transitif et demande des routes explicites.",
    category: "AWS"
  },
  {
    id: "s2-aws-23-super-hard",
    text: "[SUPER-DIFFICILE] Dans le modele de responsabilite partagee, qui est responsable des correctifs du systeme d'exploitation sur une instance EC2 ?",
    options: ["Le client", "AWS", "Le fournisseur de la base de donnees", "AWS Shield"],
    correctIndex: 1,
    explanation: "Sur EC2, le client gere l'OS, les patchs et l'application; AWS gere l'infrastructure sous-jacente.",
    category: "AWS"
  },
  {
    id: "s2-aws-24",
    text: "Quel service aide a surveiller des metriques et a declencher des alarmes sur un comportement anormal ?",
    options: ["Amazon CloudWatch", "AWS Firewall Manager", "AWS Direct Connect", "AWS IAM"],
    correctIndex: 0,
    explanation: "Amazon CloudWatch regroupe metriques, logs, alarmes et dashboards de supervision.",
    category: "AWS"
  },
  {
    id: "s2-aws-25",
    text: "Quel service centralise les findings de securite venant de plusieurs outils AWS ?",
    options: ["AWS Security Hub", "AWS Budgets", "Amazon Route 53", "Amazon EFS"],
    correctIndex: 0,
    explanation: "AWS Security Hub regroupe et normalise les alertes de securite pour une vue centralisee.",
    category: "AWS"
  },
  {
    id: "s2-aws-26",
    text: "Quel service permet de gerer automatiquement des certificats SSL/TLS pour des applications AWS compatibles ?",
    options: ["AWS Certificate Manager", "AWS KMS", "AWS Config", "Amazon Inspector"],
    correctIndex: 0,
    explanation: "AWS Certificate Manager (ACM) emet et renouvelle les certificats utilises par des services compatibles.",
    category: "AWS"
  },
  {
    id: "s2-aws-27",
    text: "Quel service permet d'exposer un service prive a d'autres comptes sans ouvrir de ports publics ?",
    options: ["AWS PrivateLink", "Amazon SQS", "AWS Backup", "Amazon CloudFront"],
    correctIndex: 0,
    explanation: "AWS PrivateLink permet une exposition privee de services via des endpoints sans Internet public.",
    category: "AWS"
  },
  {
    id: "s2-aws-28",
    text: "Quel service AWS vous aide a obtenir des recommandations de bonnes pratiques, notamment en securite et en cout ?",
    options: ["AWS Trusted Advisor", "Amazon Textract", "AWS Glue", "Amazon ECR"],
    correctIndex: 0,
    explanation: "AWS Trusted Advisor fournit des recommandations de bonnes pratiques sur la securite, le cout, la fiabilite et les limites.",
    category: "AWS"
  },
  {
    id: "s2-aws-29",
    text: "Quel service permet de surveiller la conformite d'une ressource par rapport a des regles de configuration ?",
    options: ["AWS Config", "Amazon S3", "AWS VPN", "AWS WAF"],
    correctIndex: 0,
    explanation: "AWS Config enregistre l'etat des ressources et peut evaluer leur conformite via des regles.",
    category: "AWS"
  },
  {
    id: "s2-aws-30",
    text: "Quel service sert a administrer des regles de pare-feu reseau sur plusieurs comptes AWS de facon centralisee ?",
    options: ["AWS Firewall Manager", "Amazon Macie", "AWS Glue", "Amazon Athena"],
    correctIndex: 0,
    explanation: "AWS Firewall Manager centralise la gestion des politiques de securite comme WAF, Shield et Security Groups.",
    category: "AWS"
  },
  {
    id: "s2-aws-31",
    text: "Quel service est adapte pour analyser des requetes DNS ou des journaux en quasi temps reel a l'aide d'un langage de requete ?",
    options: ["CloudWatch Logs Insights", "Amazon EBS", "AWS Backup", "AWS Artifact"],
    correctIndex: 0,
    explanation: "CloudWatch Logs Insights permet de requeter rapidement des logs pour le diagnostic et l'analyse.",
    category: "AWS"
  }
];

const funQuestions = [
  {
    id: "s2-fun-0",
    text: "Tu dois expliquer a ton equipe qu'une connexion VPN n'est pas la meme chose qu'un lien dedie. Lequel est le plus simple a retenir ?",
    options: ["VPN = tunnel chiffre sur Internet", "VPN = fibre privee AWS", "VPN = base de donnees", "VPN = bucket S3"],
    correctIndex: 0,
    explanation: "Un VPN AWS est un tunnel chiffre sur Internet; Direct Connect est la liaison reseau dediee.",
    category: "Fun"
  },
  {
    id: "s2-fun-1",
    text: "Tu dois isoler proprement des applis entre prod et dev dans le meme compte AWS. Le plus logique ?",
    options: ["Deux VPC avec des Security Groups separés", "Un seul subnet public pour tout", "Tout mettre dans le meme SG", "Supprimer les ACL reseau"],
    correctIndex: 0,
    explanation: "Des VPC et des groupes de securite distincts permettent d'isoler les flux de facon claire et maintenable.",
    category: "Fun"
  },
  {
    id: "s2-fun-2",
    text: "Ton equipe doit verifier une panne reseau en urgence. Quel service te donnera d'abord une vision des metriques et des alarmes ?",
    options: ["Amazon CloudWatch", "AWS Budget", "AWS Support Center", "Amazon ECR"],
    correctIndex: 0,
    explanation: "CloudWatch est le premier endroit pour voir metriques, logs et alarmes lors d'un incident.",
    category: "Fun"
  },
  {
    id: "s2-fun-3",
    text: "Tu veux un support plus solide qu'un simple ticket mail et quelqu'un qui t'accompagne sur le long terme. Tu regardes quel niveau ?",
    options: ["Enterprise Support", "Basic Support", "AWS Free Tier", "Amazon SES"],
    correctIndex: 0,
    explanation: "Enterprise Support est le plan le plus avance pour les besoins critiques et l'accompagnement proactif.",
    category: "Fun"
  }
];

const advancedMultiQuestions = [
  {
    id: "s2-multi-1",
    text: "Tu dois durcir un VPC pour une appli web. Quels controles reseau sont pertinents ?",
    options: ["Security Groups", "Network ACL", "AWS WAF", "Route 53", "IAM Users"],
    correctIndices: [0, 1, 2],
    minSelections: 2,
    explanation: "Security Groups et NACL filtrent le reseau; WAF protege la couche HTTP(S).",
    category: "AWS"
  },
  {
    id: "s2-multi-2",
    text: "Pour connecter un datacenter on-premise a AWS, quelles options sont valides ?",
    options: ["AWS Site-to-Site VPN", "AWS Direct Connect", "AWS Client VPN", "Amazon S3 Transfer Acceleration", "AWS Artifact"],
    correctIndices: [0, 1, 2],
    minSelections: 2,
    explanation: "Site-to-Site VPN et Direct Connect sont des options classiques; Client VPN couvre les acces utilisateurs distants.",
    category: "AWS"
  },
  {
    id: "s2-multi-3",
    text: "Sur la gouvernance et l'audit, quels services sont les plus utiles ?",
    options: ["AWS Organizations", "AWS CloudTrail", "AWS Config", "Amazon CloudFront", "Amazon Polly"],
    correctIndices: [0, 1, 2],
    minSelections: 2,
    explanation: "Organizations structure les comptes, CloudTrail audite les actions et Config suit la conformite des ressources.",
    category: "AWS"
  },
  {
    id: "s2-multi-4",
    text: "Pour ameliorer la disponibilite d'une appli web mondiale, quels choix sont pertinents ?",
    options: ["Elastic Load Balancing", "Auto Scaling", "Route 53 failover", "Amazon GuardDuty", "Amazon Macie"],
    correctIndices: [0, 1, 2],
    minSelections: 2,
    explanation: "ELB, Auto Scaling et Route 53 failover renforcent disponibilite et reprise sur incident.",
    category: "AWS"
  },
  {
    id: "s2-multi-5",
    text: "Pour la securite des donnees et des secrets, quels services sont adaptes ?",
    options: ["AWS KMS", "AWS Secrets Manager", "IAM Roles", "Amazon CloudWatch", "Amazon Route 53"],
    correctIndices: [0, 1, 2],
    minSelections: 2,
    explanation: "KMS gere les cles, Secrets Manager les secrets applicatifs et les roles IAM evitent les credentials statiques.",
    category: "AWS"
  },
  {
    id: "s2-multi-6",
    text: "En cas d'incident critique, quels elements du support AWS sont les plus utiles ?",
    options: ["Support Center", "Enterprise Support", "Technical Account Manager", "AWS Budgets", "AWS Snowcone"],
    correctIndices: [0, 1, 2],
    minSelections: 2,
    explanation: "Support Center ouvre le case, Enterprise Support apporte la priorite et le TAM accompagne les operations critiques.",
    category: "AWS"
  },
  {
    id: "s2-multi-7",
    text: "Pour exposer un service de maniere privee entre comptes, quels mecanismes sont valides ?",
    options: ["AWS PrivateLink", "VPC Peering", "Transit Gateway", "Amazon CloudFront", "AWS Backup"],
    correctIndices: [0, 1, 2],
    minSelections: 2,
    explanation: "PrivateLink, VPC Peering et Transit Gateway sont des options reseau privees selon le pattern de connectivite.",
    category: "AWS"
  }
];

function buildQuiz() {
  const removedEasyIds = new Set([
    "s2-aws-1",
    "s2-aws-2",
    "s2-aws-3",
    "s2-aws-4",
    "s2-aws-5",
    "s2-aws-6",
    "s2-aws-7"
  ]);
  const curatedAws = awsQuestions.filter((question) => !removedEasyIds.has(question.id));
  const mixedAws = [...curatedAws, ...advancedMultiQuestions];

  return [
    funQuestions[0],
    ...mixedAws.slice(0, 5),
    funQuestions[1],
    ...mixedAws.slice(5, 10),
    funQuestions[2],
    ...mixedAws.slice(10, 15),
    funQuestions[3],
    ...mixedAws.slice(15)
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

    const currentQuestion = quizQuestions[state.questionIndex];
    const answerIndices = normalizeAnswerIndices(payload, currentQuestion.options.length);
    const minSelections = Number(currentQuestion.minSelections || 1);

    if (answerIndices.length < minSelections) {
      socket.emit("player:answer:error", `Coche au moins ${minSelections} reponses.`);
      return;
    }

    if (!answerIndices.every((idx) => Number.isInteger(idx) && idx >= 0 && idx < currentQuestion.options.length)) {
      return;
    }

    const elapsedMs = Math.max(0, Date.now() - state.questionStartedAt);
    const elapsedSeconds = Math.min(state.questionDurationSeconds, elapsedMs / 1000);
    const timeLeft = Math.max(0, state.questionDurationSeconds - elapsedSeconds);
    const isCorrect = isCorrectSelection(currentQuestion, answerIndices);
    const speedFactor = timeLeft / state.questionDurationSeconds;
    const points = isCorrect ? Math.round(300 + speedFactor * 700) : 0;

    state.answers.set(socket.id, {
      answerIndices,
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
    minSelections: Number(question.minSelections || 1),
    durationSeconds: state.questionDurationSeconds,
    startedAt: state.questionStartedAt
  };
}

function hostQuestionPayload() {
  const question = quizQuestions[state.questionIndex];
  return {
    ...publicQuestionPayload(),
    correctIndices: getCorrectIndices(question)
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
    correctIndices: getCorrectIndices(question),
    correctAnswer: getCorrectIndices(question).map((idx) => question.options[idx]).join(" / "),
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
      const answerLabel = (answer.answerIndices || [])
        .map((idx) => options[idx] || "(unknown)")
        .join(" / ");

      return {
        playerId,
        nickname: player ? player.nickname : "Joueur",
        answerIndices: answer.answerIndices || [],
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

function normalizeAnswerIndices(payload, optionsCount) {
  if (Array.isArray(payload?.answerIndices)) {
    return [...new Set(payload.answerIndices.map((value) => Number(value)))].filter(
      (value) => Number.isInteger(value) && value >= 0 && value < optionsCount
    );
  }

  const single = Number(payload?.answerIndex);
  if (Number.isInteger(single) && single >= 0 && single < optionsCount) {
    return [single];
  }

  return [];
}

function getCorrectIndices(question) {
  if (Array.isArray(question.correctIndices) && question.correctIndices.length > 0) {
    return [...question.correctIndices];
  }
  return [question.correctIndex];
}

function isCorrectSelection(question, answerIndices) {
  const expected = [...new Set(getCorrectIndices(question))].sort((a, b) => a - b);
  const actual = [...new Set(answerIndices)].sort((a, b) => a - b);

  if (expected.length !== actual.length) {
    return false;
  }

  return expected.every((value, index) => value === actual[index]);
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
