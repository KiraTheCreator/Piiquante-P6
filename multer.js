/* TOUT CE QUI CONCERNE MULTER (GÈRE LES FICHIERS TÉLÉCHARGÉS
  PAR LES UTILISATEURS DANS L'API, ICI DES IMAGES) */

// 1 - MODULES ET VARIABLES

// Import du module "multer" qui va gérer les images téléchargées
const multer = require("multer");

/* Définit la méthode de stockage des fichiers (destination et nom),
la destination des fichiers téléchargés seront stockés dans 
un dossier "images", appelle la fonction multerFilename */
const storage = multer.diskStorage({
  destination: "images/",
  filename: function (req, file, cb) {
    cb(null, multerFilename(req, file));
  },
});

/* Création du middleware "upload" qui va utiliser
la méthode définie et stock ce middleware dans une
variable (ce middleware va traiter la requète contenant
les images téléchargées */
const upload = multer({ storage: storage });

// 2 - FONCTIONS

/* mutlerFilename va générer un nom pour le fichier téléchargé,
ici, des images */
function multerFilename(req, file) {
  // Génère une chaine de caractère à l'aide de la date et du nom du fichier
  const fileName = Date.now() + "-" + file.originalname;

  // Ajoute la propriété fileName au fichier
  file.fileName = fileName;

  // Retourne ce fileName
  return fileName;
}

// 3 - EXPORTS

module.exports = { upload };
