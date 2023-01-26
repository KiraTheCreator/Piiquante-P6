/* INDEX.JS EST LE FICHIER PRINCIPAL DE MON API */

// 1 - IMPORTS, MODULES ET VARIABLES GLOBALES

// Création d'un fichier .env et importe les variables d'environnement
require("dotenv").config();

// Import du module (framework) express, pour créer mon serveur
const express = require("express");

// Stockage de l'utilisation de express dans une variable
const app = express();

// Stockage du port serveur dans une variable
const port = 3000;

/* Import du module CORS (autorise les requêtes et les demandes d'accès
quand on utilise plusieurs domaines (ports) et ajoute les en-têtes
nécéssaires) */
const cors = require("cors");

/* Import du module path (gère les chemins d'accès, ici, est utilisé
pour créer un chemin adapté (url) au fichier images et à son contenu) */
const path = require("path");

// Import des fonctions et middlewares exterieurs nécessaires pour les routes
const { upload } = require("./multer");
const { newUserCreation, loginUser, verifyToken } = require("./user");
const {
  goToSauces,
  addSauce,
  goToUniqueSauce,
  deleteSauce,
} = require("./sauces");

// 2 - MIDDLEWARES

// Utilise le middleware CORS
app.use(cors());

// Utilise un middleware pour pouvoir traiter les données JSON
app.use(express.json());

// Utilise un middleware pour traiter les data form (html)
app.use(express.urlencoded({ extended: true }));

// 3 - ROUTES

/* Route de requête de type POST à l'url indiqué, appelle la fonction newUserCreation en réponse */
app.post("/api/auth/signup", newUserCreation);

/* Route de requête de type POST à l'url indiqué, appelle la fonction loginUser en réponse */
app.post("/api/auth/login", loginUser);

/* Route de reqûete de type GET à l'url indiqué, appelle les fonctions verifyToken et goToSauces */
app.get("/api/sauces", verifyToken, goToSauces);

/* Route de requête de type POST à l'url indiqué, appelle les fonctions 
verifyToken, puis upload.single (plutot un middleware) et enfin addSauce */
app.post("/api/sauces", verifyToken, upload.single("image"), addSauce);

/* Route de requête de type GET à l'url indiqué, appelle les fonctions
verifyToken, puis goToUniqueSauce */
app.get("/api/sauces/:id", verifyToken, goToUniqueSauce);

/* Route de requête de type DELETE à l'url indiqué, appelle les fonctions
verifyToken, puis deleteSauce */
app.delete("/api/sauces/:id", verifyToken, deleteSauce);

/* Route de requête de type GET vers le "début" de l'api, renvoi
une réponse pour être sur que le serveur tourne correctement */
app.get("/", (req, res) => {
  res.send("Le serveur tourne correctement");
});

// 4 - LISTEN / MIDDLESWARES

// Middleware pour accéder au fichier images
app.use("/images", express.static(path.join(__dirname, "images")));

// Le serveur écoute sur le port actuel : 3000
app.listen(port, () => console.log("Le port actuel est le port " + port));
