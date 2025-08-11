// Fichier : netlify/functions/lister-images.js (Version unifiée "Edge Function")
import { promises as fs } from 'fs';
import path from 'path';

// Note : 'walk' doit être réécrit avec des promesses pour être asynchrone
async function walk(dir, allFiles = []) {
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        await walk(filePath, allFiles);
      } else {
        allFiles.push(filePath);
      }
    }
  } catch (error) {
    console.error(`Erreur de lecture dans walk: ${dir}`, error.message);
  }
  return allFiles;
}

export default async (req, context) => {
  try {
    // Le chemin est plus simple à calculer avec les Edge Functions
    const imagesDir = path.resolve(context.site.path, 'images');

    // On vérifie si le dossier existe, sinon on renvoie un objet vide
    try {
      await fs.access(imagesDir);
    } catch {
      console.warn(`Le dossier images n'a pas été trouvé à l'emplacement : ${imagesDir}`);
      return new Response(JSON.stringify({}), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const allImageFiles = (await walk(imagesDir))
      .filter(file => /\.(jpe?g|png|gif|svg|webp)$/i.test(file));

    const groupedImages = {};
    const rootFolderName = "Images Principales";

    allImageFiles.forEach(file => {
      const relativePath = path.relative(imagesDir, file);
      const pathParts = relativePath.split(path.sep);
      let folderName = pathParts.length > 1 ? pathParts[0] : rootFolderName;

      if (!groupedImages[folderName]) groupedImages[folderName] = [];
      
      groupedImages[folderName].push({
        name: path.basename(file),
        path: '/' + path.join('images', relativePath).replace(/\\/g, '/')
      });
    });

    for (const folder in groupedImages) {
      groupedImages[folder].sort((a, b) => a.name.localeCompare(b.name));
    }

    return new Response(JSON.stringify(groupedImages), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const config = {
  path: "/.netlify/functions/lister-images"
};