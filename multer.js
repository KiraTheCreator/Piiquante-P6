const multer = require("multer");
const storage = multer.diskStorage({
  destination: "images/",
  filename: function (req, file, cb) {
    cb(null, multerFilename(req, file));
  },
});
const upload = multer({ storage: storage });
function multerFilename(req, file) {
  const fileName = Date.now() + "-" + file.originalname;
  file.fileName = fileName;
  return fileName;
}

module.exports = { upload };
