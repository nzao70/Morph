// Fichier : netlify/functions/get-links.js
import { neon } from '@netlify/neon';

export default async (req, context) => {
  try {
    const sql = neon();
    const links = await sql`
      SELECT id, url, description, created_at 
      FROM links 
      ORDER BY created_at DESC;
    `;

    return new Response(JSON.stringify(links), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(`Erreur lors de la récupération des liens: ${error.message}`, { status: 500 });
  }
};

export const config = {
  path: "/.netlify/functions/get-links"
};
