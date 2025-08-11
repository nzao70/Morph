// Fichier : netlify/functions/lister-images.js (Version de débogage)

const fs = require('fs');
const path = require('path');

// La fonction 'walk' est modifiée pour logger les erreurs si un dossier est inaccessible
const walk = (dir, allFiles = []) => {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        walk(filePath, allFiles);
      } else {
        allFiles.push(filePath);
      }
    });
  } catch (error) {
    // !! IMPORTANT POUR LE DÉBOGAGE !!
    // Si on ne trouve pas un dossier, on va le savoir dans les logs Netlify
    console.error(`[WALK_ERROR] Impossible de lire le dossier : ${dir}`, error.message);
  }
  return allFiles;
};

exports.handler = async function(event, context) {
  try {
    // Tentative de chemin plus robuste. Les 'included_files' sont souvent placés 
    // à la racine du répertoire de la fonction.
    const searchRoot = path.resolve(__dirname, '../../');
    const imagesDir = path.join(searchRoot, 'images');

    // !! LOGS DE DÉBOGAGE !!
    console.log(`[INFO] __dirname: ${__dirname}`);
    console.log(`[INFO] Racine de recherche calculée (searchRoot): ${searchRoot}`);
    console.log(`[INFO] Dossier images cible (imagesDir): ${imagesDir}`);

    // On vérifie si le dossier 'images' existe avant de continuer
    if (!fs.existsSync(imagesDir)) {
      console.error(`[FATAL_ERROR] Le dossier images n'existe pas à l'emplacement attendu: ${imagesDir}`);
      // On liste ce qu'on trouve à la racine pour aider au débogage
      const rootContent = fs.readdirSync(searchRoot);
      console.log(`[INFO] Contenu trouvé à la racine de recherche : ${rootContent.join(', ')}`);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // On renvoie un objet vide comme avant
      };
    }

    const allImageFiles = walk(imagesDir)
      .filter(file => /\.(jpe?g|png|gif|svg|webp)$/i.test(file));
      
    console.log(`[INFO] Nombre total de fichiers image trouvés: ${allImageFiles.length}`);

    const groupedImages = {};
    const rootFolderName = "Images Principales";

    allImageFiles.forEach(file => {
      const relativePath = path.relative(imagesDir, file);
      const pathParts = relativePath.split(path.sep);
      let folderName = pathParts.length > 1 ? pathParts[0] : rootFolderName;

      if (!groupedImages[folderName]) groupedImages[folderName] = [];
      
      const urlPath = '/' + path.join('images', relativePath).replace(/\\/g, '/');
      groupedImages[folderName].push(urlPath);
    });

    console.log('[SUCCESS] Groupement des images terminé. Envoi de la réponse.');
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupedImages),
    };
  } catch (error) {
    console.error('[HANDLER_ERROR] Une erreur est survenue dans la fonction:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};