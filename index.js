// 1 - VARIABLES GLOBALES

require("dotenv").config(); // Création d'un fichier .env pour crypter des informations
const express = require("express"); // Utilisation du module express
const app = express(); // Appelle express
const port = 3000; // Port utilisé par le serveur
const cors = require("cors"); // Utilisation du module CORS (en-tête necessaires dans le corps de la requete)
const dataBasePassword = process.env.MONGOPASSWORD; // Mdp mongo crypté
const dataBaseUser = process.env.MONGOUSER; // User mongo crypté
const bcrypt = require("bcrypt"); // Utilise bcrypt pour le hashage du password
const jwt = require("jsonwebtoken");

// 2 - MIDDLEWARES

app.use(cors()); // Utilise le module CORS
app.use(express.json()); // Fonction pour traiter les payloads des requetes en JSON

// 3 - BASE DE DONNÉES MONGO

const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator"); // Module pour validateur unique dans mongoose
const uri = `mongodb+srv://${dataBaseUser}:${dataBasePassword}@cluster0.ye1skoa.mongodb.net/?retryWrites=true&w=majority`;
mongoose
  .connect(uri)
  .then(() => console.log("Connecté à mongo"))
  .catch((err) => console.error("Error : ", err));

// Création du schema d'un utilisateur
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, // L'email doit etre unique
  password: { type: String, required: true },
});
userSchema.plugin(uniqueValidator); // Applique à userSchema la contrainte du validateur unique (email)

// Création du modèle utilisateur à l'aide du schema
const user = mongoose.model("user", userSchema);

// 4 - ROUTES

// Première requete de type post concernant le sign up
app.post("/api/auth/signup", newUserCreation); // Appelle la fonction newUserCreation (voir fonctions en bas de page)

app.post("/api/auth/login", loginUser);

app.get("/", (req, res) => {
  res.send("Salut tout le monde");
});

app.listen(port, () => console.log("Le port actuel est le : " + port));

// FONCTIONS

/* newUserCreation est une fonction qui va stocker un nouvel utilisateur dans
la base de données si celui ci sign-up sur le site */
async function newUserCreation(req, res) {
  try {
    console.log("Signup request :", req.body);
    //   Stockage des paramètres email et password de la requete dans des variables
    const email = req.body.email;
    const password = req.body.password;
    const hashedPassword = await hashPassword(password); // Appelle la fonction hashPassword
    console.log("password: ", password);
    console.log("hashedPassword: ", hashedPassword);
    // Sauvegarde/enregistrement de chaque nouvel utilisateur (sign up) dans la base de données
    const newUser = new user({ email: email, password: hashedPassword });
    await newUser.save();
    res.status(201).send({ message: "Utilisateur enregistré" }); // Si tout s'est passé correctement renvoi status 201
  } catch (err) {
    res.status(409).send({ message: "Utilisateur non enregistré" + err }); // Si l'utilisateur est déja enregistré (email unique) envoie un message d'erreur
  }
}

/* hashPassword est une fonction qui va, à partir du password crée dans la fonction newUserCreation,
le crypter à l'aide du module bcrypt et créer un nouveau password indéchiffrable */
function hashPassword(password) {
  const saltRounds = 10; // Nombre de "cycle de hashage"
  return bcrypt.hash(password, saltRounds);
}

/* loginUser est une fonction qui va vérifier si l'utilisateur qui essaie de se log in
est déja enregistré dans la base de données, et si oui, il va vérifier si le password
qu'il entre correspond au password dans la base de données (les deux sont cryptés) */
async function loginUser(req, res) {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userToLog = await user.findOne({ email: email });
    const passwordIsCorrect = await bcrypt.compare(
      password,
      userToLog.password
    );
    if (!passwordIsCorrect) {
      res.status(403).send({ message: "Mot de passe incorrect" });
    }
    const token = createToken(email);
    res.status(200).send({ userId: userToLog._id, token: token });
    console.log("user: ", userToLog);
    console.log("passwordIsCorrect: ", passwordIsCorrect);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Erreur" });
  }
}

function createToken(email) {
  const tokenPassword = process.env.TOKENPASSWORD;
  const token = jwt.sign({ email: email }, tokenPassword, { expiresIn: "24h" });
  console.log("token", token);
  return token;
}
