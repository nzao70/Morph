import { neon } from '@netlify/neon';
import { S3Client, CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { checkAuth } from '../utils/auth';

const sql = neon();
const s3Client = new S3Client({ region: process.env.AWS_S3_REGION });

export const handler = async (event, context) => {
    if (!checkAuth(context)) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Accès non autorisé' }) };
    }

    const { source, destination, type } = JSON.parse(event.body);

    const sourceName = source.split('/').pop();
    const newPath = destination ? `${destination}/${sourceName}` : sourceName;

    if (source === destination || source === newPath.substring(0, newPath.lastIndexOf('/'))) {
        return { statusCode: 400, body: JSON.stringify({ message: "Le déplacement n'est pas nécessaire." }) };
    }
    
    try {
        if (type === 'file') {
            await s3Client.send(new CopyObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, CopySource: `${process.env.AWS_S3_BUCKET_NAME}/${source}`, Key: newPath }));
            await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: source }));
            await sql`UPDATE items SET path = ${newPath} WHERE path = ${source}`;
        } else if (type === 'folder') {
            const listResponse = await s3Client.send(new ListObjectsV2Command({ Bucket: process.env.AWS_S3_BUCKET_NAME, Prefix: source + '/' }));

            if (listResponse.Contents) {
                for (const item of listResponse.Contents) {
                    const newKey = item.Key.replace(source, newPath);
                    await s3Client.send(new CopyObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, CopySource: `${process.env.AWS_S3_BUCKET_NAME}/${item.Key}`, Key: newKey }));
                }
                await s3Client.send(new DeleteObjectsCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Delete: { Objects: listResponse.Contents.map(obj => ({ Key: obj.Key })) } }));
            }
            
            // Mettre à jour en BDD
            const itemsToUpdate = await sql`SELECT path FROM items WHERE path LIKE ${source + '/%'}`;
            const db_updates = itemsToUpdate.map(item =>
                sql`UPDATE items SET path = ${item.path.replace(source, newPath)} WHERE path = ${item.path}`
            );
            await sql`UPDATE items SET path = ${newPath} WHERE path = ${source}`;
            await Promise.all(db_updates);
        }

        return { statusCode: 200, body: JSON.stringify({ message: 'Élément déplacé/renommé avec succès' }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: 'Erreur serveur', error: error.message }) };
    }
};