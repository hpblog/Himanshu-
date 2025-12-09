import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { SavedItem } from "../types";

const AWS_CONFIG_KEY = 'VIDSCRIBE_AWS_CONFIG';

export interface AwsConfig {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucketName: string;
}

export const getAwsConfig = (): AwsConfig | null => {
    const stored = localStorage.getItem(AWS_CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
};

export const saveAwsConfig = (config: AwsConfig) => {
    localStorage.setItem(AWS_CONFIG_KEY, JSON.stringify(config));
};

export const clearAwsConfig = () => {
    localStorage.removeItem(AWS_CONFIG_KEY);
};

const getS3Client = (config: AwsConfig) => {
    return new S3Client({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });
};

export const testS3Connection = async (config: AwsConfig): Promise<boolean> => {
    try {
        const client = getS3Client(config);
        // Try to list 1 object just to verify permissions
        const command = new ListObjectsV2Command({
            Bucket: config.bucketName,
            MaxKeys: 1
        });
        await client.send(command);
        return true;
    } catch (error) {
        console.error("AWS Connection Test Failed:", error);
        throw error;
    }
};

export const uploadToS3 = async (item: SavedItem): Promise<void> => {
    const config = getAwsConfig();
    if (!config) throw new Error("AWS Config not found");

    const client = getS3Client(config);
    const key = `vidscribe/${item.type}/${item.id}.json`;

    try {
        const command = new PutObjectCommand({
            Bucket: config.bucketName,
            Key: key,
            Body: JSON.stringify(item),
            ContentType: "application/json"
        });
        await client.send(command);
        console.log(`Successfully uploaded ${key} to S3`);
    } catch (error) {
        console.error("Failed to upload to S3", error);
        throw error;
    }
};

export const listS3Items = async (): Promise<SavedItem[]> => {
    const config = getAwsConfig();
    if (!config) return [];

    const client = getS3Client(config);
    const items: SavedItem[] = [];

    try {
        const command = new ListObjectsV2Command({
            Bucket: config.bucketName,
            Prefix: 'vidscribe/'
        });
        
        const response = await client.send(command);
        
        if (response.Contents) {
            // In a real app, we might not fetch ALL bodies immediately, but for this demo size it's okay
            // Or we fetch them on demand. Let's fetch the most recent 20 for performance.
            const sortedContents = response.Contents.sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0)).slice(0, 20);

            for (const obj of sortedContents) {
                if (obj.Key && obj.Key.endsWith('.json')) {
                    const getCommand = new GetObjectCommand({
                        Bucket: config.bucketName,
                        Key: obj.Key
                    });
                    const getResponse = await client.send(getCommand);
                    const str = await getResponse.Body?.transformToString();
                    if (str) {
                        items.push(JSON.parse(str));
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error listing S3 items", error);
    }
    
    return items;
};

export const deleteFromS3 = async (id: string, type: string) => {
    const config = getAwsConfig();
    if (!config) return;

    const client = getS3Client(config);
    const key = `vidscribe/${type}/${id}.json`;

    try {
        const command = new DeleteObjectCommand({
            Bucket: config.bucketName,
            Key: key
        });
        await client.send(command);
    } catch (error) {
        console.error("Error deleting from S3", error);
    }
};
