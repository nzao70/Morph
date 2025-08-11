// Fichier : netlify/functions/lister-images.js

const fs = require('fs');
const path = require('path');

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
  } catch (error) { /* Ignorer les erreurs de lecture */ }
  return allFiles;
};

exports.handler = async function(event, context) {
  try {
    const searchRoot = path.resolve(__dirname, '../../');
    const imagesDir = path.join(searchRoot, 'images');

    if (!fs.existsSync(imagesDir)) {
      return { statusCode: 200, body: JSON.stringify({}) };
    }

    const allImageFiles = walk(imagesDir)
      .filter(file => /\.(jpe?g|png|gif|svg|webp)$/i.test(file));
      
    const groupedImages = {};
    const rootFolderName = "Images Principales";

    allImageFiles.forEach(file => {
      const relativePath = path.relative(imagesDir, file);
      const pathParts = relativePath.split(path.sep);
      let folderName = pathParts.length > 1 ? pathParts[0] : rootFolderName;

      if (!groupedImages[folderName]) groupedImages[folderName] = [];
      
      // NOUVEAU : On crée un objet avec le nom et le chemin
      groupedImages[folderName].push({
        name: path.basename(file), // ex: "plage.jpg"
        path: '/' + path.join('images', relativePath).replace(/\\/g, '/') // ex: "/images/Vacances/plage.jpg"
      });
    });
    
    // Trier les images par nom dans chaque dossier
    for (const folder in groupedImages) {
        groupedImages[folder].sort((a, b) => a.name.localeCompare(b.name));
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupedImages),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};