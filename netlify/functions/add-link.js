// Fichier : netlify/functions/add-link.js
import { neon } from '@netlify/neon';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }

  try {
    const { url, description } = await req.json();
    if (!url) {
      return new Response('Le champ URL est obligatoire', { status: 400 });
    }

    const sql = neon();
    const [newLink] = await sql`
      INSERT INTO links (url, description) 
      VALUES (${url}, ${description}) 
      RETURNING *;
    `;

    return new Response(JSON.stringify(newLink), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(`Erreur lors de l'ajout du lien: ${error.message}`, { status: 500 });
  }
};
// La section 'config' a été supprimée