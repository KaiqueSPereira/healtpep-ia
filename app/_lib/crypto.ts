import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

const algorithm = "aes-256-ctr";
const secretKey = process.env.ENCRYPTION_SECRET || "senha-supersecreta";
const ivLength = 16; // 16 bytes para AES

// Derivação da chave de 32 bytes (256 bits)
const key = scryptSync(secretKey, "salt", 32);

// Função para encriptar Buffers
export function encrypt(buffer: Buffer): Buffer {
  const iv = randomBytes(ivLength);
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([iv, encrypted]); // Concatena IV e dados criptografados
}

// Função para decriptar Buffers
export function decrypt(encryptedBuffer: Buffer): Buffer {
  if (encryptedBuffer.length < ivLength) {
    throw new Error("Buffer criptografado inválido: tamanho menor que o do IV.");
  }
  const iv = encryptedBuffer.subarray(0, ivLength);
  const encryptedData = encryptedBuffer.subarray(ivLength);
  const decipher = createDecipheriv(algorithm, key, iv);
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}

// Função de encriptação de strings usando formato IV:dados_criptografados
export function encryptString(text: string): string {
  const iv = randomBytes(ivLength);
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(text, "utf8")), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`; // Formato IV_em_hex:dados_criptografados_em_hex
}

// Função de decriptação de strings usando formato IV:dados_criptografados
export function decryptString(encryptedText: string): string {
  const parts = encryptedText.split(":");
  if (parts.length !== 2) {
    throw new Error("Formato de string criptografada inválido.");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encryptedData = Buffer.from(parts[1], "hex");

  if (iv.length !== ivLength) {
      throw new Error("Tamanho do IV inválido.");
  }

  const decipher = createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  return decrypted.toString("utf8");
}

// Função para decriptar de maneira segura (sem causar erros caso seja texto simples)
export function safeDecrypt(encryptedText: string): string {
  try {
    // Verifica se a string tem o formato esperado (IV:dados) antes de tentar decriptar
    const parts = encryptedText.split(":");
    if (parts.length === 2 && Buffer.from(parts[0], "hex").length === ivLength) {
        // Parece ser um texto criptografado no nosso formato
        return decryptString(encryptedText);
    } else {
        // Não parece ser um texto criptografado no nosso formato, retorna original
        return encryptedText;
    }
  } catch (error) {
    console.error("Erro ao decriptar:", error, "Valor:", encryptedText);
    return encryptedText; // Retorna o valor original em caso de erro
  }
}
