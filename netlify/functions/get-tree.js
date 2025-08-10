import { neon } from '@netlify/neon';
import { checkAuth } from '../utils/auth';

const sql = neon();

function buildTree(items) {
  const tree = [];
  const map = new Map();

  // Initialiser la map avec tous les dossiers
  items.forEach(item => {
    map.set(item.path, { ...item, children: item.type === 'folder' ? [] : undefined });
  });

  items.forEach(item => {
    const parts = item.path.split('/');
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/');
      const parentNode = map.get(parentPath);
      if (parentNode && parentNode.children) {
        parentNode.children.push(map.get(item.path));
      }
    } else {
      tree.push(map.get(item.path));
    }
  });

  // Fonction pour trier les enfants : dossiers d'abord, puis par ordre alphabétique
  const sortNodes = (nodes) => {
    nodes.sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return a.path.localeCompare(b.path);
    });
    nodes.forEach(node => {
        if (node.children) sortNodes(node.children);
    });
  };

  sortNodes(tree);
  return tree.map(node => {
    const parts = node.path.split('/');
    return {...node, name: parts[parts.length - 1]};
  });
}

export const handler = async (event, context) => {
  if (!checkAuth(context)) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Accès non autorisé' }) };
  }

  try {
    const items = await sql`SELECT path, type FROM items ORDER BY path ASC`;
    const tree = buildTree(items);
    return { statusCode: 200, body: JSON.stringify(tree) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Erreur serveur', error: error.message }) };
  }
};