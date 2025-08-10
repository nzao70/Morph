import { neon } from '@netlify/neon';
import { S3Client, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { checkAuth } from '../utils/auth';

const sql = neon();
const s3Client = new S3Client({ region: process.env.AWS_S3_REGION });

export const handler = async (event, context) => {
  if (!checkAuth(context)) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Accès non autorisé' }) };
  }

  const { path, type } = JSON.parse(event.body);

  try {
    if (type === 'file') {
      // Supprimer le fichier de S3
      await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: path }));
      // Supprimer de la DB
      await sql`DELETE FROM items WHERE path = ${path}`;
    } else if (type === 'folder') {
      // Lister tous les objets dans le dossier sur S3
      const listResponse = await s3Client.send(new ListObjectsV2Command({ Bucket: process.env.AWS_S3_BUCKET_NAME, Prefix: path + '/' }));
      if (listResponse.Contents && listResponse.Contents.length > 0) {
        // Supprimer tous les objets trouvés
        await s3Client.send(new DeleteObjectsCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Delete: { Objects: listResponse.Contents.map(obj => ({ Key: obj.Key })) },
        }));
      }
      // Supprimer le dossier et ses enfants de la DB
      await sql`DELETE FROM items WHERE path = ${path} OR path LIKE ${path + '/%'}`;
    }
    return { statusCode: 200, body: JSON.stringify({ message: 'Élément supprimé avec succès' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Erreur serveur', error: error.message }) };
  }
};