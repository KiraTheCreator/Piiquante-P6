const { Product } = require("./mongoose");

function goToSauces(req, res) {
  console.log("le token a été validé go to sauces");
  Product.find({}).then((products) => res.send(products));
}

function addSauce(req, res) {
  console.log(__dirname);
  console.log(req.protocol + "://" + req.get("host"));
  const body = req.body;
  const file = req.file;
  const sauce = JSON.parse(body.sauce); // Transforme la chaine de caractere du body en objet
  const userId = sauce.userId;
  const name = sauce.name;
  const manufacturer = sauce.manufacturer;
  const description = sauce.description;
  const mainPepper = sauce.mainPepper;
  const heat = sauce.heat;
  const fileName = file.fileName;
  console.log({ file });
  function makeImageUrl(req, fileName) {
    return req.protocol + "://" + req.get("host") + "/images/" + fileName;
  }
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
  product
    .save()
    .then(() => console.log("produit enregistré", product))
    .catch(console.error);
}

module.exports = { goToSauces, addSauce };
