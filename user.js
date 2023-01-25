const { user } = require("./mongoose");
const bcrypt = require("bcrypt"); // Utilise bcrypt pour le hashage du password
const jwt = require("jsonwebtoken"); // Utilise jsonwebtoken pour créer/manipuler un token attribué à l'utilisateur
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
    // Sauvegarde/enregistrement de chaque nouvel utilisateur (sign up) dans la base de données
    const newUser = new user({ email: email, password: hashedPassword });
    await newUser.save();
    res.status(201).send({ message: "Utilisateur enregistré !" }); // Si tout s'est passé correctement renvoi status 201
  } catch (err) {
    res.status(409).send({ message: "Utilisateur déja enregistré : " + err }); // Si l'utilisateur est déja enregistré(email unique) ou pas enregistré envoie un message d'erreur
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
  } catch (err) {
    console.error(err);
    res.status(401).send({ message: "Problème avec l'utilisateur" });
  } // Sinon envoie une erreur 401
}

/* createToken est une fonction qui va à partir des informations du compte utilisateur,
créer un token unique à attribuer à ce compte permettant le log in (utilise le module 
  jsonwebtoken */
function createToken(email) {
  const tokenPassword = process.env.TOKENPASSWORD;
  const token = jwt.sign({ email: email }, tokenPassword, { expiresIn: "24h" });
  return token;
}

/* La fonction verifyToken est une fonction qui va effectuer les dernieres vérifications
pour accéder a la page sauce, si tout est ok, applique la fonction goToSauces */
function verifyToken(req, res, next) {
  console.log("Authenticate user");
  const headerToRecover = req.header("Authorization"); // Réccupère le header "Authorization" qui correspond au token
  const tokenToRecover = headerToRecover.split(" ")[1]; // "Coupe" le header pour enlever la partie bearer et séléctionner uniquement le token
  if (headerToRecover == null)
    return res.status(403).send({ message: "Token invalide" });
  if (tokenToRecover == null)
    return res.status(403).send({ message: "Token innexistant" });
  jwt.verify(tokenToRecover, process.env.TOKENPASSWORD, (err) => {
    if (err) return res.status(403).send({ message: "Token invalide " + err });
    console.log("Le token est bien valide, on continue");
    next();
  });
}

module.exports = { newUserCreation, loginUser, verifyToken };
