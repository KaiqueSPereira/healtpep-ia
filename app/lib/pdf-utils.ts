'use server';

import { PDFDocument, PDFPage, PDFFont, PDFImage, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

async function embedImage(pdfDoc: PDFDocument, imagePath: string): Promise<PDFImage | null> {
    try {
        const fullPath = path.join(process.cwd(), imagePath);
        const imageBytes = await fs.readFile(fullPath);
        if (imagePath.endsWith('.png')) {
            return await pdfDoc.embedPng(imageBytes);
        } else if (imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg')) {
            return await pdfDoc.embedJpg(imageBytes);
        }
        return null;
    } catch (error) {
        console.error(`Error embedding image at ${imagePath}:`, error);
        return null;
    }
}

export async function addHeader(doc: PDFDocument, page: PDFPage, fonts: { bold: PDFFont, regular: PDFFont }) {
    const { height } = page.getSize();
    const margin = 50;

    const logoImage = await embedImage(doc, 'public/iconprontuario.png');
    if (logoImage) {
        page.drawImage(logoImage, { x: margin, y: height - margin - 40, width: 50, height: 50 });
    }

    page.drawText('HealthPEP', { x: margin + 60, y: height - margin - 20, font: fonts.bold, size: 20, color: rgb(0.1, 0.1, 0.5) });

    const sparkleImage = await embedImage(doc, 'public/sparkle.png');
    if (sparkleImage) {
        page.drawImage(sparkleImage, { x: margin + 165, y: height - margin - 15, width: 15, height: 15 });
    }

    page.drawText('www.healtpep.com.br', { x: margin + 60, y: height - margin - 35, font: fonts.regular, size: 10, color: rgb(0.5, 0.5, 0.5) });
}

export async function addFooter(page: PDFPage, font: PDFFont) {
    const margin = 50;
    page.drawText('HealthPEP | contato@healtpep.com.br', {
        x: margin,
        y: margin - 20,
        font,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
    });
}