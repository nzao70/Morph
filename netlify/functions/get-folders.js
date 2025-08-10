import { neon } from '@netlify/neon';
import { checkAuth } from '../utils/auth';

const sql = neon();

export const handler = async (event, context) => {
  if (!checkAuth(context)) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Accès non autorisé' }) };
  }

  try {
    const folders = await sql`SELECT path FROM items WHERE type = 'folder' ORDER BY path ASC`;
    return {
      statusCode: 200,
      body: JSON.stringify(folders.map(f => f.path)),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Erreur serveur' }) };
  }
};