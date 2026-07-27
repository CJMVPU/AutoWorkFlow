import * as fs from 'fs';
import * as path from 'path';
import * as fernet from 'fernet';

const keyPath = path.resolve(process.cwd(), 'assets', '.key');

export function getDecryptor(): fernet.Token | null {
  if (!fs.existsSync(keyPath)) {
    console.warn('[WARN] .key file not found.');
    return null;
  }
  const keyBase64 = fs.readFileSync(keyPath, 'utf-8').trim();
  const secret = new fernet.Secret(keyBase64);
  // @ts-ignore - The fernet types might be slightly off
  return new fernet.Token({ secret, time: 0 });
}

export function decrypt(tokenString: string): string | null {
  const token = getDecryptor();
  if (!token) return null;

  const tokenObj = new fernet.Token({
    secret: token.secret,
    token: tokenString,
    ttl: 0
  });

  return tokenObj.decode();
}

export function encrypt(text: string): string | null {
  const token = getDecryptor();
  if (!token) return null;

  const tokenObj = new fernet.Token({
    secret: token.secret,
    time: 0
  });

  return tokenObj.encode(text);
}
