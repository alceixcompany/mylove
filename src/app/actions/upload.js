"use server";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(formData) {
    const file = formData.get('file');
    if (!file) {
        throw new Error('No file uploaded');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { resource_type: 'auto', folder: 'ask_app' },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result.secure_url);
            }
        ).end(buffer);
    });
}

export async function getYoutubeMetadata(url) {
    try {
        const response = await fetch(`https://www.youtube.com/oembed?url=${url}&format=json`);
        if (!response.ok) return null;

        const data = await response.json();

        // YouTube oEmbed doesn't always give clean artist - title
        // We can try to split the title if it contains '-'
        let title = data.title;
        let artist = data.author_name;

        if (title.includes(' - ')) {
            const parts = title.split(' - ');
            artist = parts[0].trim();
            title = parts[1].trim();
        }

        return {
            title: title,
            artist: artist,
            thumbnail: data.thumbnail_url
        };
    } catch (error) {
        console.error('YouTube Metadata Error:', error);
        return null;
    }
}
