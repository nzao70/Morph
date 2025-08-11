// On a besoin des modules 'fs' (file system) et 'path' pour naviguer dans les fichiers
const fs = require('fs');
const path = require('path');

// Une fonction qui parcourt les dossiers de manière récursive
const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      // Si c'est un dossier, on continue à chercher dedans
      results = results.concat(walk(filePath));
    } else {
      // Si c'est un fichier, on l'ajoute à la liste
      results.push(filePath);
    }
  });
  return results;
};

exports.handler = async function(event, context) {
  try {
    // On part de la racine du projet au moment du déploiement
    const projectDir = process.cwd();
    const allFiles = walk(projectDir);

    // On filtre pour ne garder que les images
    const imageFiles = allFiles
      .filter(file => /\.(jpe?g|png|gif|svg|webp)$/i.test(file))
      .map(file => {
        // On nettoie le chemin pour qu'il soit utilisable dans une URL
        // en retirant la partie locale du chemin (ex: /var/task/src/...)
        return '/' + path.relative(projectDir, file);
      });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(imageFiles),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erreur lors de la lecture des fichiers.' }),
    };
  }
};