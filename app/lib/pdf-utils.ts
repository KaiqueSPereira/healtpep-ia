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

    const healthText = 'Health';
    const pepText = 'PEP';
    const fontSize = 20;
    const xStart = margin + 60;
    const yPos = height - margin - 20;

    page.drawText(healthText, { 
        x: xStart, 
        y: yPos, 
        font: fonts.bold, 
        size: fontSize, 
        color: rgb(0, 0, 0) // Black
    });

    const healthWidth = fonts.bold.widthOfTextAtSize(healthText, fontSize);

    // Corrected Color: PDF-lib's rgb() uses values from 0 to 1.
    page.drawText(pepText, { 
        x: xStart + healthWidth, 
        y: yPos, 
        font: fonts.bold, 
        size: fontSize, 
        color: rgb(1, 0, 0) // Pure Red
    });

    const sparkleImage = await embedImage(doc, 'public/sparkle.png');
    if (sparkleImage) {
        const pepWidth = fonts.bold.widthOfTextAtSize(pepText, fontSize);
        const sparkleX = xStart + healthWidth + pepWidth + 2; // Position after PEP
        page.drawImage(sparkleImage, { x: sparkleX, y: yPos + 5, width: 15, height: 15 });
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