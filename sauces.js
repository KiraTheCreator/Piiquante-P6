/* TOUT CE QUI CONCERNE LES SAUCES */

// 1 - IMPORTS

// Import de "Product" crée à partir du schéma mongoose
const { Product } = require("./mongoose");

// 2 - FONCTIONS

/* goToSauces récupère les sauces de la base de données
et envoie ces données en réponse de la requête HTTP */
function goToSauces(req, res) {
  Product.find({}).then((products) => res.send(products));
}

/* addSauce ajoute une nouvelle sauce dans la base de données
en utilisant le contenu de la requête */
function addSauce(req, res) {
  // Stock les données du body (JSON) de la requête dans des variables
  const body = req.body;
  const file = req.file;

  // Convertit les données JSON en objet JS
  const sauce = JSON.parse(body.sauce);

  // Extrait les propriétés de l'objet et les stock dans des variables
  const userId = sauce.userId;
  const name = sauce.name;
  const manufacturer = sauce.manufacturer;
  const description = sauce.description;
  const mainPepper = sauce.mainPepper;
  const heat = sauce.heat;
  const fileName = file.fileName;

  /* makeImageUrl existe uniquement dans addSauce, elle crée une URL
  pour chaques images téléchargées */
  function makeImageUrl(req, fileName) {
    /* Combine le protocole de la requête, l'hôte de la requête
    et le chemin vers le dossier correspondant aux images et retourne ce resultat */
    return req.protocol + "://" + req.get("host") + "/images/" + fileName;
  }

  // Crée un nouvel objet en remplaçant les propriétés par celles de la requête
  const product = new Product({
    userId: userId,
    name: name,
    manufacturer: manufacturer,
    description: description,
    mainPepper: mainPepper,
    imageUrl: makeImageUrl(req, fileName),
    heat: heat,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: [],
  });

  // Enregistre ce nouvel objet dans la base de données
  product
    .save()
    .then((resProduct) => {
      res.send({ message: resProduct });
      return console.log("Produit enregistré", resProduct);
    })
    .catch(console.error);
}

function goToUniqueSauce(req, res) {
  console.log(req.params);
}

// 3 - EXPORTS

module.exports = { goToSauces, addSauce, goToUniqueSauce };
