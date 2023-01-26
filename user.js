/* TOUT CE QUI CONCERNE LES USERS (SIGN UP, LOG IN, HASHAGE DU PASSWORD,
   ATTRIBUTION DU TOKEN, VERIFICATION DE LA VALIDITÉ DU TOKEN. */

// 1 - IMPORTS ET MODULES

// Import de "user" crée à partir du schema mongoose
const { user } = require("./mongoose");

// Import du module "bcrypt" pour le hashage des password
const bcrypt = require("bcrypt");

// Import du module "jsonwebtoken" pour créer et attribuer un token unique aux users
const jwt = require("jsonwebtoken");

// 2 - FONCTIONS

/* newUserCreation prend en entrée les demandes et réponses HTTP
de la première route de sign-up. Utilise les données email
et mdp, hash le mdp, crée un compte utilisateur et l'enregistre dans 
la base de données */
async function newUserCreation(req, res) {
  try {
    // Récupère les données email, mdp
    const email = req.body.email;
    const password = req.body.password;

    // Hash le mdp grâce à la fonction
    const hashedPassword = await hashPassword(password);

    // Créer un utilisateur à l'aide des données (email et mdp hashé)
    const newUser = new user({ email: email, password: hashedPassword });

    // Save l'utilisateur dans la base de données
    await newUser.save();

    // Envoi des réponses selon le cas
    res.status(201).send({ message: "Utilisateur enregistré !" });
  } catch (err) {
    res.status(409).send({ message: "Utilisateur déja enregistré : " + err });
  }
}

/* hashPassword utilise bcrypt pour hasher le mdp en entrée*/
function hashPassword(password) {
  // Nombre de "cycle de hashage"
  const saltRounds = 10;

  // Retourne le mpd hashé à l'aide du module bcrypt
  return bcrypt.hash(password, saltRounds);
}

/* loginUser réccupère l'email et le mdp de la requète puis trouve 
l'email correspondant dans la base de données (méthode findOne de mongoose)
et compare les mdp hashés (bcrypt.compare). Si le mdp est ok, appelle la
fonction createToken */
async function loginUser(req, res) {
  try {
    // Récupère l'email et le mdp de la requète
    const email = req.body.email;
    const password = req.body.password;

    // Récupère l'utilisateur correspondant à l'email de la requète
    const userToLog = await user.findOne({ email: email });

    // Compare le mdp fourni avec celui stocké pour cet utilisateur
    const passwordIsCorrect = await bcrypt.compare(
      password,
      userToLog.password
    );

    // Si le mdp est inccorect
    if (!passwordIsCorrect) {
      res.status(403).send({ message: "Mot de passe incorrect" });
    }

    // Si le mdp est correct, crée un token à partir de l'email utilisateur
    const token = createToken(email);

    // Envoi la réponse avec les infos demandées (ID et token)
    res.status(200).send({ userId: userToLog._id, token: token });
  } catch (err) {
    console.error(err);

    // Si une erreur est constatée
    res.status(401).send({ message: "Problème avec l'utilisateur" });
  }
}

/* createToken utilise jwt pour créer un token signé pour l'utilisateur
le token sera valide 24h dans ce cas */
function createToken(email) {
  // Récupère le mdp dans le dossier .env
  const tokenPassword = process.env.TOKENPASSWORD;

  // Utilise jwt pour créer un token unique avec l'email user et le mdp du token
  const token = jwt.sign({ email: email }, tokenPassword, { expiresIn: "24h" });

  // Retourne le token crée
  return token;
}

/* verifyToken vérifie si le token d'authenfication est valide si c'est le cas,
appelle la fonction suivante */
function verifyToken(req, res, next) {
  // Récupère le header "Authorization" du token
  const headerToRecover = req.header("Authorization");

  // Enlève la partie "Bearer" afin de selectionner uniquement le token
  const tokenToRecover = headerToRecover.split(" ")[1];

  // Si le header est null
  if (headerToRecover == null)
    return res.status(403).send({ message: "Token invalide" });

  // Si le token est null
  if (tokenToRecover == null)
    return res.status(403).send({ message: "Token innexistant" });

  // Utilise jwt pour vérifier si le token est valide
  jwt.verify(tokenToRecover, process.env.TOKENPASSWORD, (err) => {
    if (err) return res.status(403).send({ message: "Token invalide " + err });
    console.log("Le token est bien valide, on continue");

    // Appelle la fonction suivante
    next();
  });
}

// 3 - EXPORTS

module.exports = { newUserCreation, loginUser, verifyToken };
