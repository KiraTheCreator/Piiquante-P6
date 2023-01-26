/* TOUT CE QUI CONCERNE LES SAUCES */

// 1 - IMPORTS

// Import de "Product" crée à partir du schéma mongoose
const { Product } = require("./mongoose");

// Import de "fs" (file system) permettant la suppression de fichiers dans le système
const { unlink } = require("fs");

// 2 - FONCTIONS

/* goToSauces récupère les sauces de la base de données
et envoie ces données en réponse de la requête HTTP */
function goToSauces(req, res) {
  Product.find({})
    .then((products) => res.send(products))
    .catch((error) => res.status(500).send(error));
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
  const fileName = file.fileName;
  const heat = sauce.heat;

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

/* goToUniqueSauce récupère l'id de la sauce de la requête,
puis utilise "findById" (méthode de mongoose) pour trouver la
sauce correspondante et renvoi la sauce en réponse */
function goToUniqueSauce(req, res) {
  // Stock l'id de la sauce de la requête dans une variable
  const id = req.params.id;

  // Trouve cette sauce grâce à son id dans la base de données
  Product.findById(id)
    .then((product) => {
      res.send(product);
    })
    .catch((error) => res.status(500).send(error));
}

/* deleteSauce récupère l'id de la sauce de la requête*/
function deleteSauce(req, res) {
  // Stock l'id de la sauce de la requete dans une variable
  const id = req.params.id;

  // Supprime la sauce grâce à son id (sauce = productToDelete)
  Product.findByIdAndDelete(id)
    .then((productToDelete) => {
      /* Appelle la fonction deleteImageFromFs (file system)
       avec la sauce à supprimer en argument */
      deleteImageFromFS(productToDelete);
    })
    .then(
      res.send({ message: `le produit ayant pour id ${id} a été supprimé` })
    )
    .catch((err) => res.status(500).send({ message: err }));
}

/* deleteImageFromFs est utilisée dans la fonction deleteSauce 
pour supprimer l'image de cette sauce dans le fichier /images */
function deleteImageFromFS(productToDelete) {
  // Récupère l'url de l'image de la sauce à supprimer et la stock dans la variable
  const imageUrl = productToDelete.imageUrl;

  // "Coupe" l'url de l'image afin de ne garder que le nom de l'image
  const imageToDelete = imageUrl.split("/").at(-1);

  // Supprime l'image du fichier /images en utilisant unlink
  unlink(`images/${imageToDelete}`, (err) => {
    console.error(err);
  });
  return productToDelete;
}

// 3 - EXPORTS

module.exports = { goToSauces, addSauce, goToUniqueSauce, deleteSauce };
