import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { checkAuth } from '../utils/auth';

const s3Client = new S3Client({ region: process.env.AWS_S3_REGION });

export const handler = async (event, context) => {
    if (!checkAuth(context)) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Accès non autorisé' }) };
    }
    
    const { path, contentType } = JSON.parse(event.body);
    if (!path || !contentType) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Chemin ou type de contenu manquant' }) };
    }

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: path,
        ContentType: contentType
    });

    try {
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL valide 1 heure
        return {
            statusCode: 200,
            body: JSON.stringify({ uploadUrl })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: "Erreur lors de la création de l'URL d'upload", error: error.message }) };
    }
};