import crypto from 'crypto';

export const encrypt = (text) => {
    const iv = Buffer.alloc(16, 0);
    const key = crypto.scryptSync(text, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}
