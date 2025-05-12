import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

const algorithm = "aes-256-ctr"; // Use "aes-256-ctr" ou outro algoritmo de sua escolha
const secretKey = process.env.ENCRYPTION_SECRET || "senha-supersecreta";
const ivLength = 16; // Tamanho do IV, normalmente 16 bytes

const key = scryptSync(secretKey, "salt", 32); // Deriva chave de 32 bytes

// Função para encriptar Buffers
export function encrypt(buffer: Buffer): Buffer {
  const iv = randomBytes(ivLength); // Gerando um IV aleatório
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([iv, encrypted]); // Concatenando o IV com os dados criptografados
}

// Função para decriptar Buffers
export function decrypt(encryptedBuffer: Buffer): Buffer {
  const iv = encryptedBuffer.subarray(0, ivLength); // Extraímos o IV da primeira parte
  const encryptedData = encryptedBuffer.subarray(ivLength); // Dados criptografados restantes
  const decipher = createDecipheriv(algorithm, key, iv);
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}

// Função de encriptação de strings, como já estava
export function encryptString(text: string): string {
  const buffer = Buffer.from(text, "utf8"); // Convertendo a string para Buffer
  const encryptedBuffer = encrypt(buffer);
  return encryptedBuffer.toString("hex"); // Convertendo para string hex
}

// Função de decriptação de strings
export function decryptString(encryptedText: string): string {
  const encryptedBuffer = Buffer.from(encryptedText, "hex"); // Convertendo de volta para Buffer
  const decryptedBuffer = decrypt(encryptedBuffer);
  return decryptedBuffer.toString("utf8"); // Convertendo de volta para string
}

// Função para decriptar de maneira segura (sem causar erros caso seja texto simples)
export function safeDecrypt(encryptedText: string): string {
  try {
    if (
      typeof encryptedText !== "string" ||
      !encryptedText.includes(":") ||
      encryptedText.split(":").length !== 2
    ) {
      return encryptedText; // Já é texto simples
    }
    return decryptString(encryptedText);
  } catch (error) {
    console.error("Erro ao decriptar:", error, "Valor:", encryptedText);
    return encryptedText; // Retorna o valor original em caso de erro
  }
}
