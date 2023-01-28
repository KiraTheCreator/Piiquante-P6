/* TOUT CE QUI CONCERNE LA BASE DE DONNÉ MONGOOSE */

// 1 - IMPORTS, MODULES ET VARIABLES

// Import du module "mongoose" utilisé pour créer et comuniquer avec une base de données
const mongoose = require("mongoose");

// Import du module "mongoose unique validator" pour exiger un modèle unique (email ici)
const uniqueValidator = require("mongoose-unique-validator");

// Variables utilisant les variables d'environnement pour "crypter" le user et le mdp de la base de données
const dataBasePassword = process.env.MONGOPASSWORD;
const dataBaseUser = process.env.MONGOUSER;

/* Variable uri contenant l'url de la connection à la base de données,
utilise ensuite la méthode connect() pour s'y connecter */
const uri = `mongodb+srv://${dataBaseUser}:${dataBasePassword}@cluster0.ye1skoa.mongodb.net/?retryWrites=true&w=majority`;
mongoose
  .connect(uri)
  .then(() => console.log("Connecté à mongo"))
  .catch((err) => console.error("Erreur : ", err));

// 2 - SCHÉMAS ET MODÈLES

// Définit le schéma d'utilisateur en utilisant mongoose
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Ajoute la propriété "unique" sur l'email
userSchema.plugin(uniqueValidator);

// Création d'un modèle user à l'aide du schéma, et stock dans une variable
const user = mongoose.model("user", userSchema);

// Définit le schéma de sauce en utilisant mongoose
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

// Création d'un modèle sauce à l'aide du schéma, et stock dans une variable
const Product = mongoose.model("Product", productSchema);

// 3 - EXPORTS

module.exports = { user, Product };
