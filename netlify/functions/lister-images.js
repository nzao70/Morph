// Fichier : netlify/functions/lister-images.js

const fs = require('fs');
const path = require('path');

// La fonction walk reste la même
const walk = (dir) => {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(walk(filePath));
      } else {
        results.push(filePath);
      }
    });
  } catch (err) { /* Ignorer les erreurs */ }
  return results;
};

exports.handler = async function(event, context) {
  try {
    const projectRoot = path.resolve(__dirname, '../../../');
    const imagesRoot = path.join(projectRoot, 'images'); // On se concentre sur le dossier images

    // On ne cherche les images que dans le dossier 'images'
    const allImageFiles = walk(imagesRoot)
      .filter(file => /\.(jpe?g|png|gif|svg|webp)$/i.test(file));

    // NOUVELLE LOGIQUE : On groupe les images par dossier
    const groupedImages = {};
    const rootFolderName = "Images Principales"; // Nom pour les images à la racine de /images

    allImageFiles.forEach(file => {
      // On calcule le chemin relatif par rapport au dossier 'images'
      const relativePath = path.relative(imagesRoot, file);
      const pathParts = relativePath.split(path.sep); // Sépare le chemin en morceaux

      let folderName = rootFolderName;

      if (pathParts.length > 1) {
        // L'image est dans un sous-dossier
        folderName = pathParts[0];
      }

      // On crée le tableau pour ce dossier s'il n'existe pas
      if (!groupedImages[folderName]) {
        groupedImages[folderName] = [];
      }
      
      // On ajoute le chemin URL de l'image
      const urlPath = '/' + path.join('images', relativePath).replace(/\\/g, '/');
      groupedImages[folderName].push(urlPath);
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupedImages),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erreur lors du groupement des images.', message: error.message }),
    };
  }
};