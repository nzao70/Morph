import { neon } from '@netlify/neon';
import { checkAuth } from '../utils/auth';

const sql = neon();

export const handler = async (event, context) => {
  if (!checkAuth(context)) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Accès non autorisé' }) };
  }

  const { path, type } = JSON.parse(event.body);

  if (!path || !type || (type !== 'file' && type !== 'folder')) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Chemin ou type manquant/invalide' }) };
  }

  try {
    await sql`INSERT INTO items (path, type) VALUES (${path}, ${type})`;
    return { statusCode: 201, body: JSON.stringify({ message: `${type === 'folder' ? 'Dossier' : 'Fichier'} créé avec succès` }) };
  } catch (error) {
    if (error.message.includes('duplicate key value violates unique constraint')) {
        return { statusCode: 409, body: JSON.stringify({ message: 'Un élément avec ce nom existe déjà.' }) };
    }
    return { statusCode: 500, body: JSON.stringify({ message: 'Erreur serveur', error: error.message }) };
  }
};