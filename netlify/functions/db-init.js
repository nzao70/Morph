// Fichier : netlify/functions/db-init.js
import { neon } from '@netlify/neon';

export default async (req, context) => {
  try {
    const sql = neon();
    
    // Crée la table 'links' si elle n'existe pas
    await sql`
      CREATE TABLE IF NOT EXISTS links (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return new Response("Table 'links' initialisée avec succès.", { status: 200 });
  } catch (error) {
    return new Response(`Erreur lors de l'initialisation de la table: ${error.message}`, { status: 500 });
  }
};

export const config = {
  path: "/.netlify/functions/db-init"
};
