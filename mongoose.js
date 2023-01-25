const mongoose = require("mongoose");
const dataBasePassword = process.env.MONGOPASSWORD; // Mdp mongo crypté
const dataBaseUser = process.env.MONGOUSER; // User mongo crypté
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

module.exports = { user, Product };
