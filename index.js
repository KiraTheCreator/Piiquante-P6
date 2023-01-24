// 1 - VARIABLES GLOBALES

require("dotenv").config(); // Création d'un fichier .env pour crypter des informations
const express = require("express"); // Utilisation du module express
const app = express(); // Appelle express
const port = 3000; // Port utilisé par le serveur
const cors = require("cors"); // Utilisation du module CORS (en-tête necessaires dans le corps de la requete)
const dataBasePassword = process.env.MONGOPASSWORD; // Mdp mongo crypté
const dataBaseUser = process.env.MONGOUSER; // User mongo crypté
const bcrypt = require("bcrypt"); // Utilise bcrypt pour le hashage du password
const jwt = require("jsonwebtoken"); // Utilise jsonwebtoken pour créer/manipuler un token attribué à l'utilisateur

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

// Deuxième requete de type post concernant le log in
app.post("/api/auth/login", loginUser); // Appelle la fonction loginUser (voir fonctions en bas de page)

// Troisième requete de type get, concernant l'accès à la page sauces
app.get("/api/sauces", goToSauces); // Appelle la fonction goToSauces (voir fonctions en bas de page)

// Quatrième requete de type post, concernant l'ajout de sauces dans le array et donc sur la page, appelle la fonction addSauces (voir fonctions en bas de page)
app.post("/api/sauces", createSaute);

app.get("/", (req, res) => {
  res.send("Salut tout le monde");
});

app.listen(port, () => console.log("Le port actuel est le : " + port));

// 5 - SAUCES

const productSchema = new mongoose.Schema({
  userId: String,
  name: String,
  manufacturer: String,
  description: String,
  mainPepper: String,
  imageUrl: String,
  heat: Number,
  likes: Number,
  dislikes: Number,
  usersLiked: [String],
  usersDisliked: [String],
});
const Product = mongoose.model("Product", productSchema);

// FONCTIONS

/* newUserCreation est une fonction qui va stocker un nouvel utilisateur dans
la base de données si celui ci sign-up sur le site, si tout est ok, renvoie la réponse attendue :
{ message: string } */
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
    res.status(409).send({
      message: "Utilisateur non enregistré ou Utilisateur déja inscrit " + err,
    }); // Si l'utilisateur est déja enregistré(email unique) ou pas enregistré envoie un message d'erreur
  }
}

/* hashPassword est une fonction qui va, à partir du password crée dans la fonction newUserCreation,
le crypter à l'aide du module bcrypt et créer un nouveau password indéchiffrable */
function hashPassword(password) {
  const saltRounds = 10; // Nombre de "cycle de hashage"
  return bcrypt.hash(password, saltRounds);
}

/* loginUser est une fonction qui va vérifier si l'utilisateur qui essaie de se log in
est déja enregistré dans la base de données, si oui, il va vérifier si le password
qu'il entre correspond au password dans la base de données (les deux sont cryptés)
Si tout est ok, renvoie la réponse attendue :
{ userId: string, token: string }
 */
async function loginUser(req, res) {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userToLog = await user.findOne({ email: email }); // Cherche dans la base de donnée si l'email utilisé est deja dedans
    const passwordIsCorrect = await bcrypt.compare(
      password,
      userToLog.password // Compare si le mdp crypté est bien égal au mdp crypté deja associé à ce compte
    );
    if (!passwordIsCorrect) {
      res.status(403).send({ message: "Mot de passe incorrect" });
    } // Si le mdp est incorrect, envoie une erreur 403
    const token = createToken(email);
    res.status(200).send({ userId: userToLog._id, token: token }); // Si tout correspond, attribut un token unique à l'utilisateur avec la fonction createToken
    console.log("user: ", userToLog);
    console.log("passwordIsCorrect: ", passwordIsCorrect);
  } catch (err) {
    console.error(err);
    res.status(401).send({ message: "Utilisateur non enregistré" });
  } // Sinon envoie une erreur 401
}

/* createToken est une fonction qui va à partir des informations du compte utilisateur,
créer un token unique à attribuer à ce compte permettant le log in (utilise le module 
  jsonwebtoken */
function createToken(email) {
  const tokenPassword = process.env.TOKENPASSWORD;
  const token = jwt.sign({ email: email }, tokenPassword, { expiresIn: "24h" });
  console.log("token", token);
  return token;
}

/* La fonction goToSauces est une fonction qui va vérifier si l'accès a la page sauce est authorisée :
- Réccupère le token de l'utilisateur
- Vérifie si il correspond à celui créer précédemment
- Appelle la fonction de call-back verifyToken
- Si tout est ok, renvoie la réponse attendu : le Array de sauces */
function goToSauces(req, res) {
  const headerToRecover = req.header("Authorization"); // Réccupère le header "Authorization" qui correspond au token
  const tokenToRecover = headerToRecover.split(" ")[1]; // "Coupe" le header pour enlever la partie bearer et séléctionner uniquement le token
  if (headerToRecover == null) {
    return res.status(403).send({ message: "Token invalide ou introuvable" });
  }
  if (tokenToRecover == null) {
    return res.status(403).send({ message: "Token invalide ou introuvable" });
  }
  jwt.verify(tokenToRecover, process.env.TOKENPASSWORD, (err, tokenToDecrypt) =>
    verifyToken(err, tokenToDecrypt, res)
  );
}

/* La fonction verifyToken est une fonction qui va effectuer les dernieres vérifications
pour accéder a la page sauce, si tout est ok, applique la fonction goToSauces */
function verifyToken(err, tokenToDecrypt, res) {
  if (err) res.status(403).send({ message: "Token invalide ou introuvable" });
  else {
    console.log("tout est ok", tokenToDecrypt);
    Product.find({}).then((products) => res.send(products));
  }
}

function createSaute(req, res) {
  const product = new Product({
    userId: "oui",
    name: "oui",
    manufacturer: "oui",
    description: "oui",
    mainPepper: "oui",
    imageUrl: "oui",
    heat: 2,
    likes: 2,
    dislikes: 2,
    usersLiked: ["oui"],
    usersDisliked: ["oui"],
  });
  product
    .save()
    .then(() => console.log("produit enregistré"))
    .catch(console.error);
}
//   product
//     .save()
//     .then((res) => console.log("sauce enregistrée", res))
//     .catch(console.error);
// }
