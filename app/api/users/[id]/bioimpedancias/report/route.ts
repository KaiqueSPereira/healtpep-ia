'use server';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PDFDocument, rgb, StandardFonts, PDFImage } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

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

const parseValue = (value: string | null | undefined): number | null => {
    if (value === null || value === undefined || value.trim() === '-' || value.trim() === '') return null;
    const parsed = parseFloat(value.replace(',', '.'));
    return isNaN(parsed) ? null : parsed;
};

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const userId = pathParts[3];
        const recordIdsParam = url.searchParams.get('recordIds');

        if (!userId) {
            return NextResponse.json({ error: 'ID do usuário não fornecido na URL.' }, { status: 400 });
        }

        const whereClause: any = { userId: userId };
        if (recordIdsParam) {
            const recordIds = recordIdsParam.split(',').filter(id => id.trim() !== '');
            if (recordIds.length > 0) {
                whereClause.id = { in: recordIds };
            }
        }

        const bioimpedancias = await prisma.bioimpedancia.findMany({
            where: whereClause,
            orderBy: { data: 'asc' },
        });

        if (bioimpedancias.length === 0) {
            return NextResponse.json({ error: 'Nenhum dado de bioimpedância selecionado ou encontrado.' }, { status: 404 });
        }

        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([841.89, 595.28]); // A4 Landscape
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const margin = 50;

        const logoImage = await embedImage(pdfDoc, 'public/iconprontuario.png');
        if (logoImage) {
            page.drawImage(logoImage, { x: margin, y: height - margin - 40, width: 50, height: 50 });
        }

        page.drawText('HealthPEP', { x: margin + 60, y: height - margin - 20, font: boldFont, size: 20, color: rgb(0.1, 0.1, 0.5) });

        const sparkleImage = await embedImage(pdfDoc, 'public/sparkle.png');
        if (sparkleImage) {
            page.drawImage(sparkleImage, { x: margin + 165, y: height - margin - 15, width: 15, height: 15 });
        }

        page.drawText('www.healtpep.com.br', { x: margin + 60, y: height - margin - 35, font, size: 10, color: rgb(0.5, 0.5, 0.5) });

        page.drawText('Relatório de Evolução da Bioimpedância', { x: margin, y: height - margin - 80, font: boldFont, size: 16, color: rgb(0, 0, 0) });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        page.drawText(`Paciente: ${user?.name || 'Desconhecido'}`!, { x: margin, y: height - margin - 100, font, size: 12 });

        let yPosition = height - margin - 140;
        const headers = ['Data', 'Gordura Corporal', 'Gordura Visceral', 'Massa Muscular', 'Água Corporal', 'Massa Óssea', 'Metabolismo Basal', 'Idade Corporal'];
        const colWidths = [80, 100, 100, 100, 100, 100, 100, 100];
        const rowHeight = 40;
        const deltaYOffset = 15;
        const headerFontSize = 9;
        const dataFontSize = 10;
        const deltaFontSize = 8;

        const green = rgb(0.1, 0.6, 0.1);
        const red = rgb(0.8, 0.1, 0.1);
        const gray = rgb(0.5, 0.5, 0.5);

        const drawHeaders = () => {
            let xPosition = margin;
            headers.forEach((header, i) => {
                page.drawText(header, { x: xPosition, y: yPosition, font: boldFont, size: headerFontSize, color: rgb(0.2, 0.2, 0.2) });
                xPosition += colWidths[i];
            });
            yPosition -= 20;
        };

        drawHeaders();

        for (let i = 0; i < bioimpedancias.length; i++) {
            const record = bioimpedancias[i];
            const prevRecord = i > 0 ? bioimpedancias[i - 1] : null;

            if (yPosition < margin + rowHeight) {
                page = pdfDoc.addPage([841.89, 595.28]);
                yPosition = height - margin - 30;
                drawHeaders();
            }

            const currentValues = {
                gorduraCorporal: parseValue(record.gorduraCorporal),
                gorduraVisceral: parseValue(record.gorduraVisceral),
                massaMuscular: parseValue(record.massaMuscular),
                aguaCorporal: parseValue(record.aguaCorporal),
                massaOssea: parseValue(record.massaOssea),
                taxaMetabolica: parseValue(record.taxaMetabolica),
                idadeCorporal: parseValue(record.idadeCorporal),
            };

            const rowData = [
                new Date(record.data).toLocaleDateString('pt-BR'),
                currentValues.gorduraCorporal !== null ? `${currentValues.gorduraCorporal.toFixed(1)} %` : '-',
                currentValues.gorduraVisceral !== null ? currentValues.gorduraVisceral.toFixed(1) : '-',
                currentValues.massaMuscular !== null ? `${currentValues.massaMuscular.toFixed(1)} kg` : '-',
                currentValues.aguaCorporal !== null ? `${currentValues.aguaCorporal.toFixed(1)} %` : '-',
                currentValues.massaOssea !== null ? `${currentValues.massaOssea.toFixed(1)} kg` : '-',
                currentValues.taxaMetabolica !== null ? `${currentValues.taxaMetabolica} kcal` : '-',
                currentValues.idadeCorporal !== null ? `${currentValues.idadeCorporal} anos` : '-',
            ];

            let currentX = margin;
            rowData.forEach((cell, j) => {
                page.drawText(cell, { x: currentX + 2, y: yPosition, font, size: dataFontSize });
                currentX += colWidths[j];
            });

            if (prevRecord) {
                const prevValues = {
                    gorduraCorporal: parseValue(prevRecord.gorduraCorporal),
                    gorduraVisceral: parseValue(prevRecord.gorduraVisceral),
                    massaMuscular: parseValue(prevRecord.massaMuscular),
                    aguaCorporal: parseValue(prevRecord.aguaCorporal),
                    massaOssea: parseValue(prevRecord.massaOssea),
                    taxaMetabolica: parseValue(prevRecord.taxaMetabolica),
                    idadeCorporal: parseValue(prevRecord.idadeCorporal),
                };

                const getDelta = (key: keyof typeof currentValues) => {
                    const current = currentValues[key];
                    const prev = prevValues[key];
                    if (current === null || prev === null) return null;
                    return current - prev;
                };

                const deltas = [
                    null, // No delta for Date
                    { value: getDelta('gorduraCorporal'), unit: '%', good: 'decrease' },
                    { value: getDelta('gorduraVisceral'), unit: '', good: 'decrease' },
                    { value: getDelta('massaMuscular'), unit: 'kg', good: 'increase' },
                    { value: getDelta('aguaCorporal'), unit: '%', good: 'neutral' },
                    { value: getDelta('massaOssea'), unit: 'kg', good: 'increase' },
                    { value: getDelta('taxaMetabolica'), unit: 'kcal', good: 'increase' },
                    { value: getDelta('idadeCorporal'), unit: 'anos', good: 'decrease' },
                ];

                let deltaColumnX = margin;
                for (let j = 0; j < deltas.length; j++) {
                    const deltaConfig = deltas[j];
                    if (deltaConfig) {
                        const { value, unit, good } = deltaConfig;
                        if (value !== null && !isNaN(value) && value !== 0) {
                            const sign = value > 0 ? '+' : '';
                            const text = `(${sign}${value.toFixed(1)} ${unit})`.trim();
                            let color = gray;
                            if (good === 'increase') color = value > 0 ? green : red;
                            else if (good === 'decrease') color = value < 0 ? green : red;

                            const textWidth = font.widthOfTextAtSize(text, deltaFontSize);
                            const centeringOffset = (colWidths[j] / 2) - (textWidth / 2);

                            page.drawText(text, {
                                x: deltaColumnX + centeringOffset,
                                y: yPosition - deltaYOffset,
                                font,
                                size: deltaFontSize,
                                color,
                            });
                        }
                    }
                    deltaColumnX += colWidths[j];
                }
            }

            yPosition -= rowHeight;
        }

        const footerText = 'HealthPEP | contato@healtpep.com.br';
        page.drawText(footerText, { x: margin, y: margin - 20, font, size: 8, color: rgb(0.5, 0.5, 0.5) });

        const pdfBytes = await pdfDoc.save();

        return new NextResponse(Buffer.from(pdfBytes), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="relatorio_bioimpedancia_${userId}.pdf"`,
            },
        });

    } catch (error) {
        console.error('Erro ao gerar relatório de bioimpedância:', error);
        return NextResponse.json({ error: 'Erro interno do servidor ao gerar o relatório.' }, { status: 500 });
    }
}
