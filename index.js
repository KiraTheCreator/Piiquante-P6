// 1 - VARIABLES GLOBALES

require("dotenv").config(); // Création d'un fichier .env pour crypter des informations
const express = require("express"); // Utilisation du module express
const app = express(); // Appelle express
const port = 3000; // Port utilisé par le serveur
const cors = require("cors"); // Utilisation du module CORS (en-tête necessaires dans le corps de la requete)
const path = require("path");
const { upload } = require("./multer");
const { newUserCreation, loginUser, verifyToken } = require("./user");
const { goToSauces, addSauce } = require("./sauces");
// 2 - MIDDLEWARES

app.use(cors()); // Utilise le module CORS
app.use(express.json()); // Fonction pour traiter les payloads des requetes en JSON
app.use(express.urlencoded({ extended: true }));

// 4 - ROUTES

// Première requete de type post concernant le sign up
app.post("/api/auth/signup", newUserCreation); // Appelle la fonction newUserCreation (voir fonctions en bas de page)

// Deuxième requete de type post concernant le log in
app.post("/api/auth/login", loginUser); // Appelle la fonction loginUser (voir fonctions en bas de page)

// Troisième requete de type get, concernant l'accès à la page sauces
app.get("/api/sauces", verifyToken, goToSauces); // Appelle la fonction goToSauces (voir fonctions en bas de page)

// Quatrième requete de type post, concernant l'ajout de sauces dans le array et donc sur la page, appelle la fonction addSauces (voir fonctions en bas de page)
app.post("/api/sauces", verifyToken, upload.single("image"), addSauce);

app.get("/", (req, res) => {
  res.send("Salut tout le monde");
});
app.use("/images", express.static(path.join(__dirname, "images")));
app.listen(port, () => console.log("Le port actuel est le : " + port));
