/* TOUT CE QUI CONCERNE LES SAUCES */

// 1 - IMPORTS

// Import de "Product" crée à partir du schéma mongoose
const { Product } = require("./mongoose");

// Import de "fs" (file system) permettant la suppression de fichiers dans le système
const { unlink } = require("fs");

// 2 - FONCTIONS SAUCES

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

/* makeImageUrl crée une URL pour chaques images téléchargées */
function makeImageUrl(req, fileName) {
  /* Combine le protocole de la requête, l'hôte de la requête
    et le chemin vers le dossier correspondant aux images et retourne ce resultat */
  return req.protocol + "://" + req.get("host") + "/images/" + fileName;
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

/* deleteSauce récupère l'id de la sauce de la requête et supprime celle ci
de la base de données */
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
      res.send({ message: `Le produit ayant pour id ${id} a été supprimé` })
    )
    .catch((err) => res.status(500).send({ message: err }));
}

/* modifySauce récupère l'id de la sauce de la requête et la modifie, 
selon la modification, elle agira en fonction */
function modifySauce(req, res) {
  // Stock l'id de la sauce de la requete dans une variable
  const {
    params: { id },
  } = req;

  // hasNewImage est un booléen qui est true si l'image de la sauce a été modifié
  const hasNewImage = req.file != null;

  // payload contient les "charges utiles" de la requête en appellant la fonction makePayload
  const payload = makePayload(hasNewImage, req);

  // Méthode findByIdAndUpdate de mongoose pour mettre la jour la sauce modifiée
  Product.findByIdAndUpdate(id, payload)

    // Vérifie au cas ou, si la sauce existe bien dans la base de données en appellant la fonction checkIfSauceExists
    .then((productFromData) => checkIfSauceExists(productFromData, res))
    // Si la modification contient une image on appelle la fonction deleteImageFromFS
    .then((product) => {
      if (hasNewImage) {
        deleteImageFromFS(product);
      }
    })
    .catch((err) => console.error("Erreur avec la modification: ", err));
}

/* makePayload va créer la "charge utile" de la sauce à modifier,
selon son contenu elle agira différement : 
- si uniquement les "textes" ont été modifiés, retourne le contenu
du body
- si une image a été ajoutée, JSON.parse le contenu pour y ajouter la
nouvelle image */
function makePayload(hasNewImage, req) {
  // Si il n'y a pas d'image modifiée
  if (!hasNewImage) return req.body;

  // Si il y a une image modifiée, on parse pour obtenir un objet
  const payload = JSON.parse(req.body.sauce);

  // Ajoute l'url de la nouvelle image
  payload.imageUrl = makeImageUrl(req, req.file.fileName);

  // Retourne ce payload
  return payload;
}

/* checkIfSauceExists vérifie si les modifications se sont bien passées,
si il y a un problème avec la sauce dans la base de données, renvoi une
erreur 404 */
function checkIfSauceExists(product, res) {
  // Vérifie si la sauce existe bien
  if (product == null) {
    return res.status(404).send({
      message: "Pas de sauce à modifier trouvée dans la base de données",
    });
  }
  // Retourne la modification réussie dans une promise
  return Promise.resolve(
    res.status(200).send({ message: "Modifications réussies" })
  ).then(() => product);
}

/* deleteImageFromFs est utilisée dans les fonction deleteSauce 
et modifySauce (si elle est nécéssaire) pour supprimer
l'image de cette sauce dans le fichier /images */
function deleteImageFromFS(product) {
  // Récupère l'url de l'image de la sauce à supprimer et la stock dans la variable
  const imageUrl = product.imageUrl;

  // "Coupe" l'url de l'image afin de ne garder que le nom de l'image
  const imageToDelete = imageUrl.split("/").at(-1);

  // Supprime l'image du fichier /images en utilisant unlink
  unlink(`images/${imageToDelete}`, (err) => {
    console.error(err);
  });
  return product;
}

// - 3 FONCTIONS LIKE / DISLIKE

/* likeSauce récupère dans la requête l'id de la sauce, et l'id de l'utilisateur
afin de prendre en compte ou non (selon les autres fonctions appellées à 
l'interieur de celle ci), le like/dislike/reset like de l'utilisateur */
function likeSauce(req, res) {
  // Récupère l'id de la sauce dans les params de la requête et le stock dans une variable
  const id = req.params.id;

  // Récupère l'userId et le like/dislike/reset like dans le body de la requête
  const { like, userId } = req.body;

  // Vérifie si la valeur du like est bien acceptée, sinon renvoi un message d'erreur
  if (![0, -1, 1].includes(like))
    return res.status(403).send({ message: "Mauvaise requête" });

  // Utilise la méthode findById de mongoose pour récupérer la sauce grâce à son id dans la base de données
  Product.findById(id)
    // Appelle la fonction updateLike pour mettre à jour ces likes
    .then((product) => updateLike(product, like, userId))
    // Traite le résultat de cette mise à jour
    .then((prod) => {
      if (prod == null) {
        return res
          .status(404)
          .send({ message: "La sauce a liker ou disliker n'existe pas" });
      }
      // Si tout est ok jusque la, envoi un statut 200 et {message: string}
      return res
        .status(200)
        .send({ message: "Le like à bien été prit en compte" });
    })
    .catch((err) => res.status(500).send(err));
}

/* updateLike met à jour les likes/dislikes de la sauce de la requête */
function updateLike(product, like, userId) {
  // Si c'est un like, appelle la fonction addLike
  if (like === 1) addLike(product, userId);

  // Si c'est un dislike, appelle la fonction addDislike
  if (like === -1) addDislike(product, userId);

  // Si c'est un reset like (enleve soit le dislike soit le like), appelle la fonction resetLike
  if (like === 0) resetLike(product, userId);

  // Enregistre les modifications de like/dislike sur la sauce
  return product.save();
}

/* addLike ajoute un like sur une sauce spécifiée avec l'id de l'utilisateur connecté */
function addLike(product, userId) {
  // Récupère les users qui ont like la sauce et stock ça dans une variable
  const usersLiked = product.usersLiked;

  // Vérifie si l'utilisateur à deja like la sauce, return si c'est le cas
  if (usersLiked.includes(userId)) return;

  // Ajoute l'userId de l'utilisateur dans le array des users qui ont like
  usersLiked.push(userId);

  // Ajoute un like au nombre de like (incrémente)
  product.likes++;

  // Vérifie si l'utiliateur à déja dislike la sauce et stock ça dans une variable
  const index = product.usersDisliked.indexOf(userId);

  // Si c'est le cas, on enleve l'userId en question dans le array des dislikes
  if (index !== -1) {
    product.usersDisliked.splice(index, 1);
    // Et enlève le dislike dans le nombre de dislike
    product.dislikes--;
  }
}

/* addDislike ajoute un dislike sur une sauce spécifiée avec l'id de l'utilisateur connecté */
function addDislike(product, userId) {
  // Récupère les users qui ont dislike la sauce et stock ça dans une variable
  const usersDisliked = product.usersDisliked;

  // Vérifie si l'utilisateur à deja dislike la sauce, return si c'est le cas
  if (usersDisliked.includes(userId)) return;

  // Ajoute l'userId de l'utilisateur dans le array des users qui ont dislike
  usersDisliked.push(userId);

  // Ajoute un like au nombre de dislike (incrémente)
  product.dislikes++;

  // Vérifie si l'utiliateur à déja like la sauce et stock ça dans une variable
  const index = product.usersLiked.indexOf(userId);

  // Si c'est le cas, on enleve l'userId en question dans le array des likes
  if (index !== -1) {
    product.usersLiked.splice(index, 1);

    // Et enlève le like dans le nombre de like
    product.likes--;
  }
}

/* resetLike réinitialise le like ou le dislike d'un utilisateur quand
il re-clique sur celui ci */
function resetLike(product, userId) {
  // Récupère les array des utilisateurs ayant like ou dislike et les stock dans une variable
  const { usersDisliked, usersLiked } = product;

  // Trouve l'userId dans le array des utilisateurs qui ont like et renvoi son index
  const indexLiked = usersLiked.indexOf(userId);

  // Si il y est, on le retire du array
  if (indexLiked !== -1) {
    product.usersLiked.splice(indexLiked, 1);

    // Et on enleve un like
    product.likes--;
  }

  // Trouve l'userId dans le array des utilisateurs qui ont dislike et renvoi son index
  const indexDisliked = usersDisliked.indexOf(userId);

  // Si il y est, on le retire du array
  if (indexDisliked !== -1) {
    product.usersDisliked.splice(indexDisliked, 1);

    // Et on enleve un dislike
    product.dislikes--;
  }
}

// 4 - EXPORTS

module.exports = {
  goToSauces,
  addSauce,
  goToUniqueSauce,
  deleteSauce,
  modifySauce,
  likeSauce,
};
