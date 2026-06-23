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
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmw4NXlmMjdkcjIxMzhzMm1uaDVreTYydGJ1YXc5OHMyYjdsYnd1dSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/wmuyDdRNXYximlvYM1/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3N290cG13OGQzMDV5eTYwZ3p5bzNka2tqYWNhdWhic2YwaWxnc3I3OCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/w9eIBZ7DQD7mxv7NtY/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExamY4N3V6OTJzOWtibzMwYWFmb3F5YnpsbHBqcXVtYXBnb3d6aGV4ZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/6vaX3rmgrO2sWEXZQz/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3NzV5aHB6anV1OHo5ZmpnMzVwc2RsdXBrZ2k4MDJvMnM0ZHl1ZDlieCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/CcmwiFn1q3jPTQ3Y4K/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dHpjNTNpajBmbmp1ZzMyaTQ1OW5vMDUyem53NDFkazd6OTVuYm5obyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/cdNSp4L5vCU7aQrYnV/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dHpjNTNpajBmbmp1ZzMyaTQ1OW5vMDUyem53NDFkazd6OTVuYm5obyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/o4va9aMaFyvLMYewmU/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3b293ZWw2NmF3emkyNjhkaTF5OG02OHcyejh6YzFqdGtqZG03dnNidCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xULW8JVo4V7x9aqae4/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3NHdvZDN1NXRwaWtwMnhkYTVrZ3k2aGFzNTlwYWQ3eXFzbHV5ZnBmOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/KvGkTDzBnY03m/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3YmdrdmNuMHltdWkwMGcyOTEzaGg0MTdlYzhtMXFrYmI5cTR2enQ4ciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/uNvXBlop4OLwhkPQUS/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3YmdrdmNuMHltdWkwMGcyOTEzaGg0MTdlYzhtMXFrYmI5cTR2enQ4ciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ovSNOmpGgVMY4R1QU0/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3a241NGFibW9oZmw4YnlrYWZqamVpYzd6ZXYzMGk1eTV5dzJwZml3aSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/6Ggx27ZZjVUKtcUPMK/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dW0zZGRxeXd2dW04ZjVlNXY4NXowc3Boenc4cGJtaHNraGYzdGs1YyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/puq6wFWMbnX6Ljz0yQ/giphy.gif"

];
const FAIL_GIFS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmVhNnI4cGFmcGdycnI2bjBxaXJqdngzeGJpMGRvaWZsaHpnN3gxbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xTiTnIilwuFFFpf2Cc/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmVhNnI4cGFmcGdycnI2bjBxaXJqdngzeGJpMGRvaWZsaHpnN3gxbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/fpXxIjftmkk9y/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2NvOGVjMXQwZmxxbGg3cHhzdXJuNzNxenh4eDIwMTI4c2xkYXNpZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/pY8jLmZw0ElqvVeRH4/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmVhNnI4cGFmcGdycnI2bjBxaXJqdngzeGJpMGRvaWZsaHpnN3gxbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/vQqeT3AYg8S5O/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3aHVuaHc3OTlwMmdheTA0Ym1xMXEycjgzNGRsMnV1cDhjaWM0YjI2aSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/w36LqLo57gmvXa7wjf/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bmFlc2JucDl2NGZ6Z2NwbnVyOWxwY25pbWRtOG9xOHJzemF3MjM1NSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/OPYnG3Xf8zLag/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZzNobmZ0a3l3b2w0aWdyb2JwaHZ4djc3cjVuNzV1YW0zMjBjc2xtYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/bbcXfKM7sacXZFb8ri/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3MjFzbGV4d3hkeHl2N29sOXNuZDcwOW9sZ2R5YXZidWd2dG1tdmNyNSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5Tg1PLEnROfPmd8bQf/giphy.gif"
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
    id: "aws-1",
    text: "Quel service AWS permet de gerer les identites et les permissions ?",
    options: ["Amazon GuardDuty", "AWS IAM", "AWS Shield", "Amazon Macie"],
    correctIndex: 1,
    explanation: "AWS IAM (Identity and Access Management) est le service cle pour gerer les utilisateurs, roles, et permissions d'acces aux ressources AWS.",
    category: "AWS"
  },
  {
    id: "aws-2",
    text: "Dans le modele de responsabilite partagee, AWS est responsable de quoi ?",
    options: ["Configurer les mots de passe IAM", "Securiser l'infrastructure physique", "Patcher votre code applicatif", "Creer vos sauvegardes"],
    correctIndex: 1,
    explanation: "AWS est responsable de la securite de l'infrastructure physique (data centers, reseaux, hardware). Les clients sont responsables de leur config, code, et donnees.",
    category: "AWS"
  },
  {
    id: "aws-3",
    text: "Quel service est principalement utilise pour stocker des objets de maniere durable ?",
    options: ["Amazon RDS", "Amazon EBS", "Amazon S3", "Amazon DynamoDB"],
    correctIndex: 2,
    explanation: "Amazon S3 (Simple Storage Service) est le service de stockage d'objets hautement durable (99.999999999% de durabilite).",
    category: "AWS"
  },
  {
    id: "aws-4",
    text: "Quel modele de tarification AWS vous donne une remise en echange d'un engagement ?",
    options: ["On-Demand", "Reserved Instances / Savings Plans", "Spot uniquement", "Free Tier"],
    correctIndex: 1,
    explanation: "Reserved Instances et Savings Plans offrent des remises de 30-70% en echange d'un engagement de 1 ou 3 ans.",
    category: "AWS"
  },
  {
    id: "aws-5",
    text: "Quel service est un CDN global pour accelerer la distribution de contenu ?",
    options: ["Amazon Route 53", "Amazon CloudFront", "AWS Direct Connect", "Elastic Load Balancing"],
    correctIndex: 1,
    explanation: "Amazon CloudFront est le CDN (Content Delivery Network) d'AWS, avec des points de presence mondiaux pour accelerer les contenus.",
    category: "AWS"
  },
  {
    id: "aws-6",
    text: "Quel service est une base de donnees relationnelle geree ?",
    options: ["Amazon Redshift", "Amazon RDS", "Amazon ElastiCache", "Amazon S3"],
    correctIndex: 1,
    explanation: "Amazon RDS est le service de base de donnees relationnelle geree (MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, Aurora) avec sauvegardes, patching et haute disponibilite.",
    category: "AWS"
  },
  {
    id: "aws-7",
    text: "Quel service permet d'executer du code sans gerer de serveurs ?",
    options: ["Amazon EC2", "AWS Lambda", "Amazon ECS", "AWS Batch"],
    correctIndex: 1,
    explanation: "AWS Lambda execute du code a la demande sans gerer d'infrastructure. Vous payez a l'invocation et au temps d'execution.",
    category: "AWS"
  },
  {
    id: "aws-8",
    text: "Quel service DNS hautement disponible est propose par AWS ?",
    options: ["Amazon CloudWatch", "Amazon Route 53", "AWS WAF", "Amazon VPC"],
    correctIndex: 1,
    explanation: "Amazon Route 53 est le service DNS d'AWS, hautement disponible, avec routage avance (latency, geolocation, failover, etc.).",
    category: "AWS"
  },
  {
    id: "aws-9",
    text: "Quel service aide a detecter des menaces en continu dans votre compte AWS ?",
    options: ["AWS Artifact", "Amazon Inspector", "Amazon GuardDuty", "AWS Budgets"],
    correctIndex: 2,
    explanation: "Amazon GuardDuty detecte des menaces en continu via l'analyse des logs CloudTrail, VPC Flow Logs et DNS logs avec de l'intelligence de menace.",
    category: "AWS"
  },
  {
    id: "aws-10",
    text: "Quel outil donne une estimation des couts avant de deployer ?",
    options: ["AWS Cost Explorer", "AWS Pricing Calculator", "AWS Organizations", "AWS Trusted Advisor"],
    correctIndex: 1,
    explanation: "AWS Pricing Calculator permet d'estimer les couts futurs selon l'architecture prevue, avant tout deploiement en production.",
    category: "AWS"
  },
  {
    id: "aws-11",
    text: "Quel service permet de surveiller metriques, logs et alarmes ?",
    options: ["AWS CloudTrail", "Amazon CloudWatch", "AWS Config", "Amazon EventBridge"],
    correctIndex: 1,
    explanation: "Amazon CloudWatch centralise metriques, logs, alarmes et dashboards pour la supervision operationnelle des workloads AWS.",
    category: "AWS"
  },
  {
    id: "aws-12",
    text: "Quel service enregistre les appels API faits dans le compte AWS ?",
    options: ["AWS CloudTrail", "Amazon Inspector", "AWS IAM Identity Center", "AWS X-Ray"],
    correctIndex: 0,
    explanation: "AWS CloudTrail journalise les appels API (qui a fait quoi, quand, et depuis ou), utile pour audit, securite et investigation.",
    category: "AWS"
  },
  {
    id: "aws-13",
    text: "Pour reduire les couts avec des interruptions possibles, quel type d'instance choisir ?",
    options: ["On-Demand", "Dedicated Hosts", "Spot Instances", "Reserved Instances"],
    correctIndex: 2,
    explanation: "Les Spot Instances exploitent la capacite AWS inutilisee avec de fortes remises, mais elles peuvent etre interrompues si AWS recupere la capacite.",
    category: "AWS"
  },
  {
    id: "aws-14",
    text: "Quel service est concu pour le stockage d'archives a faible cout ?",
    options: ["Amazon S3 Glacier", "Amazon EFS", "Amazon FSx", "Amazon Aurora"],
    correctIndex: 0,
    explanation: "Amazon S3 Glacier est optimise pour l'archivage a faible cout, avec des temps de restauration plus longs selon la classe choisie.",
    category: "AWS"
  },
  {
    id: "aws-15",
    text: "Quel service permet une federation de comptes AWS avec gouvernance centralisee ?",
    options: ["AWS Organizations", "AWS Budgets", "AWS Secrets Manager", "AWS KMS"],
    correctIndex: 0,
    explanation: "AWS Organizations permet de regrouper plusieurs comptes, appliquer des politiques globales (SCP) et centraliser la gouvernance/billing.",
    category: "AWS"
  },
  {
    id: "aws-16",
    text: "Quel service est souvent utilise pour distribuer des applications sur plusieurs zones de disponibilite ?",
    options: ["Elastic Load Balancing", "AWS Snowball", "AWS Glue", "Amazon Rekognition"],
    correctIndex: 0,
    explanation: "Elastic Load Balancing repartit le trafic sur plusieurs cibles et AZ, ce qui ameliore disponibilite, scalabilite et tolerance aux pannes.",
    category: "AWS"
  },
  {
    id: "aws-17",
    text: "Quel service protege contre les attaques DDoS au niveau applicatif et reseau ?",
    options: ["AWS Shield", "AWS Firewall Manager", "AWS Backup", "Amazon Detective"],
    correctIndex: 0,
    explanation: "AWS Shield (Standard et Advanced) protege contre les attaques DDoS. Shield Advanced offre des protections et visibilites supplementaires.",
    category: "AWS"
  },
  {
    id: "aws-18",
    text: "Quel service facilite l'authentification des utilisateurs finaux dans une appli web/mobile ?",
    options: ["Amazon Cognito", "AWS Directory Service", "AWS IAM", "AWS STS"],
    correctIndex: 0,
    explanation: "Amazon Cognito gere l'authentification et la federation d'identite pour les utilisateurs finaux (apps web/mobile), avec User Pools et Identity Pools.",
    category: "AWS"
  },
  {
    id: "aws-19",
    text: "Quel service permet d'analyser les depenses AWS et visualiser des tendances ?",
    options: ["AWS Cost Explorer", "AWS Artifact", "AWS Personal Health Dashboard", "Amazon Athena"],
    correctIndex: 0,
    explanation: "AWS Cost Explorer sert a analyser les couts et usages dans le temps, avec filtres, regroupements et previsions de depenses.",
    category: "AWS"
  },
  {
    id: "aws-20",
    text: "Quel avantage principal du cloud AWS est le plus lie a l'agilite ?",
    options: ["Commander des serveurs physiques en avance", "Provisionner des ressources en minutes", "Utiliser uniquement du materiel on-premise", "Eviter toute automatisation"],
    correctIndex: 1,
    explanation: "L'agilite cloud vient surtout de la capacite a provisionner rapidement des ressources a la demande, sans cycles d'achat materiel longs.",
    category: "AWS"
  },
  {
    id: "aws-21-hard",
    text: "[DIFFICILE] Vous deployez une Lambda dans une VPC. Quel est l'INCONVENIENT majeur comparee a une Lambda sans VPC ?",
    options: ["Cold start plus lent (attache ENI)", "Impossible d'acceder aux APIs publiques", "Cout multiplie par 100", "Vous devez gerer le scale manuellement"],
    correctIndex: 0,
    explanation: "Lambda en VPC = cold start plus lent car elle attache une ENI (Elastic Network Interface) a chaque invocation. Sans VPC, c'est instantane.",
    category: "AWS"
  },
  {
    id: "aws-22-ultra-hard",
    text: "[ULTRA-DIFFICILE] Vous avez des Reserved Instances pour 1 an et vous ne les utilisez plus. Comment revendre legalement ?",
    options: ["AWS Resale Market direct", "AWS Marketplace (Reserved Instances uniquement)", "AWS Instance Exchange uniquement", "Impossible: RIs sont non-transferables"],
    correctIndex: 1,
    explanation: "AWS Marketplace Reserved Instances est la seule plateforme officielle pour acheter/vendre des RIs non utilisees. Instance Exchange ne permet que le swap de type d'instance.",
    category: "AWS"
  },
  {
    id: "aws-23-super-hard",
    text: "[SUPER-DIFFICILE] Dans une policy IAM, que se passe-t-il si une action est autorisee par une identity-based policy mais refusee explicitement dans une Service Control Policy (SCP) AWS Organizations ?",
    options: ["L'action est autorisee car IAM est prioritaire", "L'action est refusee, le deny explicite de la SCP gagne", "Le resultat depend de la region", "L'action est autorisee uniquement pour le compte management"],
    correctIndex: 1,
    explanation: "En evaluation IAM, un deny explicite gagne toujours. Une SCP definit la limite maximale des permissions dans le compte membre, donc un deny dans la SCP bloque meme si IAM autorise.",
    category: "AWS"
  },
  {
    id: "aws-24",
    text: "Quel service AWS fournit des cles de chiffrement gerees et integree avec la plupart des services AWS ?",
    options: ["AWS KMS", "AWS Secrets Manager", "AWS WAF", "Amazon Detective"],
    correctIndex: 0,
    explanation: "AWS KMS (Key Management Service) permet de creer et gerer des cles de chiffrement, avec controles d'acces IAM et audit via CloudTrail.",
    category: "AWS"
  },
  {
    id: "aws-25",
    text: "Quel service est le plus adapte pour stocker et recuperer des secrets applicatifs (mots de passe DB, tokens API) ?",
    options: ["Amazon S3", "AWS Secrets Manager", "AWS CloudFormation", "AWS Budgets"],
    correctIndex: 1,
    explanation: "AWS Secrets Manager est concu pour stocker, chiffrer et faire la rotation automatique de secrets applicatifs.",
    category: "AWS"
  },
  {
    id: "aws-26",
    text: "Quel service permet de definir l'infrastructure AWS en code (IaC) via des templates ?",
    options: ["AWS CloudFormation", "Amazon EventBridge", "AWS Control Tower", "Amazon QuickSight"],
    correctIndex: 0,
    explanation: "AWS CloudFormation permet de declarer l'infrastructure dans des templates (YAML/JSON) pour deploiements repetables et versionnes.",
    category: "AWS"
  },
  {
    id: "aws-27",
    text: "Quel service est le plus approprie pour une file de messages decouplant deux applications ?",
    options: ["Amazon SQS", "Amazon Route 53", "Amazon ECR", "AWS Global Accelerator"],
    correctIndex: 0,
    explanation: "Amazon SQS fournit des files de messages managées pour decoupler producteurs et consommateurs de facon fiable et scalable.",
    category: "AWS"
  },
  {
    id: "aws-28",
    text: "Quel service pub/sub est adapte pour diffuser un evenement vers plusieurs consommateurs (email, Lambda, HTTP, etc.) ?",
    options: ["Amazon SNS", "Amazon SQS", "AWS KMS", "AWS Backup"],
    correctIndex: 0,
    explanation: "Amazon SNS est un service pub/sub qui diffuse des messages a plusieurs abonnements et protocoles.",
    category: "AWS"
  },
  {
    id: "aws-29",
    text: "Quel service AWS permet une base NoSQL cle-valeur/document avec latence milliseconde a grande echelle ?",
    options: ["Amazon DynamoDB", "Amazon RDS", "Amazon Redshift", "Amazon Aurora"],
    correctIndex: 0,
    explanation: "Amazon DynamoDB est une base NoSQL serverless, tres scalable, avec performances rapides et previsibles en millisecondes.",
    category: "AWS"
  },
  {
    id: "aws-30",
    text: "Quel service sert principalement a visualiser et interroger les logs dans CloudWatch via un langage de requete ?",
    options: ["CloudWatch Logs Insights", "AWS X-Ray", "Amazon Athena", "AWS Config"],
    correctIndex: 0,
    explanation: "CloudWatch Logs Insights permet d'explorer les logs CloudWatch avec des requetes pour diagnostiquer rapidement incidents et tendances.",
    category: "AWS"
  },
  {
    id: "aws-31",
    text: "Quel service facilite la connectivite privee entre un VPC et des services AWS sans passer par Internet public ?",
    options: ["AWS PrivateLink", "Amazon CloudFront", "AWS Outposts", "AWS Snowcone"],
    correctIndex: 0,
    explanation: "AWS PrivateLink (via VPC endpoints) fournit une connectivite privee vers des services AWS ou partenaires sans exposition Internet.",
    category: "AWS"
  }
];

const funQuestions = [
  {
    id: "fun-0",
    text: "Ton appli tourne bien, puis a 2h du matin plus rien. Quel service AWS te raconte qui a appele quelle API ?",
    options: ["CloudTrail", "CloudWatch Logs", "X-Ray", "AWS Config"],
    correctIndex: 0,
    explanation: "CloudTrail enregistre les appels API. C'est le detective officiel quand tout le monde jure 'j'ai rien touche'.",
    category: "Fun"
  },
  {
    id: "fun-1",
    text: "Tu veux heberger des fichiers statiques avec un nom de domaine perso, HTTPS et un minimum de drama. Le combo le plus propre ?",
    options: ["S3 + CloudFront + Route 53 + ACM", "EC2 tout seul avec Apache", "RDS Multi-AZ", "Lambda sans stockage"],
    correctIndex: 0,
    explanation: "S3 stocke, CloudFront distribue en HTTPS, Route 53 pointe le domaine, ACM gere le certificat. Team propre, zero bricolage nocturne.",
    category: "Fun"
  },
  {
    id: "fun-2",
    text: "Ton manager dit: 'On paie trop cher EC2'. Quelle option est la plus logique pour baisser la facture d'une charge stable sur 1 an ?",
    options: ["Savings Plans ou Reserved Instances", "Tout passer en Dedicated Hosts", "Laisser en On-Demand et prier", "Supprimer CloudWatch"],
    correctIndex: 0,
    explanation: "Pour une charge previsible, Savings Plans / RI donnent des remises importantes. 'Prier' n'est pas encore un service managed AWS.",
    category: "Fun"
  },
  {
    id: "fun-3",
    text: "Question piege: quel service AWS t'aide a arreter de partager le meme compte root entre 12 personnes nommees 'admin2' ?",
    options: ["IAM Identity Center", "S3 Glacier", "AWS WAF", "Amazon SNS"],
    correctIndex: 0,
    explanation: "IAM Identity Center permet un acces centralise (SSO) et des permissions propres. Le compte root, c'est comme le piment: un tout petit peu, tres rarement.",
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
