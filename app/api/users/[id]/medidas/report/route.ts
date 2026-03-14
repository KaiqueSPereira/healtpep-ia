'use server';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { addHeader, addFooter } from '@/app/lib/pdf-utils';
import { decryptString } from '@/app/_lib/crypto';

const prisma = new PrismaClient();

const calculateAge = (birthDateString: string | null): string => {
    if (!birthDateString) return 'Idade não informada';
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return 'Data inválida';

    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
        months--;
        days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }
    return `${years} anos, ${months} meses e ${days} dias`;
};

const decryptField = (value: string | null | undefined): string | null => {
    if (value === null || value === undefined) return null;
    try {
        return decryptString(value);
    } catch (e) {
        return value;
    }
};

const parseAndDecrypt = (value: string | null | undefined): number | null => {
    const decryptedValue = decryptField(value);
    if (decryptedValue === null || decryptedValue.trim() === '') return null;
    const number = parseFloat(decryptedValue.replace(',', '.'));
    return isNaN(number) ? null : number;
};

const generateChart = async (labels: string[], data: (number | null)[], title: string, yLabel: string): Promise<Buffer> => {
    const chartConfig = { type: 'line', data: { labels: labels, datasets: [{ label: yLabel, data: data.map(d => d ?? null), borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.5)', tension: 0.1 }] }, options: { plugins: { title: { display: true, text: title, font: { size: 16, family: 'Helvetica' } }, legend: { display: false } }, scales: { y: { beginAtZero: false, title: { display: true, text: yLabel } }, x: { title: { display: true, text: 'Data' } } } } };
    const response = await fetch('https://quickchart.io/chart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chart: chartConfig, width: 700, height: 350 }) });
    if (!response.ok) { const errorBody = await response.text(); throw new Error(`QuickChart API responded with status: ${response.status}. Body: ${errorBody}`); }
    return Buffer.from(await response.arrayBuffer());
};

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.pathname.split('/')[3];
        const { searchParams } = request.nextUrl;
        const period = searchParams.get('period');

        if (!userId) return NextResponse.json({ error: 'ID do usuário não fornecido.' }, { status: 400 });

        let dateFilter: { gte?: Date } = {};
        let periodText: string | null = null;
        if (period) {
            const endDate = new Date();
            let startDate = new Date();
            if (period === '1m') { startDate.setMonth(endDate.getMonth() - 1); periodText = 'Último Mês'; }
            else if (period === '3m') { startDate.setMonth(endDate.getMonth() - 3); periodText = 'Últimos 3 Meses'; }
            else if (period === '1y') { startDate.setFullYear(endDate.getFullYear() - 1); periodText = 'Último Ano'; }
            dateFilter.gte = startDate;
        }

        const [user, acompanhamentos] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId }, include: { dadosSaude: true } }),
            prisma.acompanhamentoCorporal.findMany({ where: { userId, ...(period && { data: dateFilter }) }, orderBy: { data: 'asc' } })
        ]);

        if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
        if (acompanhamentos.length === 0) { return NextResponse.json({ error: period ? 'Nenhum dado encontrado para o período selecionado.' : 'Nenhum dado de medidas encontrado.' }, { status: 404 }); }

        const decryptedBirthDate = decryptField(user.dadosSaude?.dataNascimento);
        const decryptedSexo = decryptField(user.dadosSaude?.sexo);
        const decryptedAltura = parseAndDecrypt(user.dadosSaude?.altura);

        const ageString = calculateAge(decryptedBirthDate);
        const heightInCm = decryptedAltura ? (decryptedAltura * 100).toFixed(0) : null;

        const pdfDoc = await PDFDocument.create();
        const pageLayout = { width: 841.89, height: 595.28 };
        let page = pdfDoc.addPage([pageLayout.width, pageLayout.height]);
        const { width, height } = page.getSize();
        const margin = 40;
        // --- FIX: Increased top margin to prevent overlap with header --- 
        const topMargin = 110;

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        await addHeader(pdfDoc, page, { regular: font, bold: boldFont });
        
        let yPosition = height - topMargin;

        page.drawText('Relatório de Medidas Corporais', { x: margin, y: yPosition, font: boldFont, size: 16 });
        yPosition -= 25;

        const patientName = `Paciente: ${user.name || 'Desconhecido'} (${ageString})`;
        const patientDetails = `Sexo: ${decryptedSexo || 'Não informado'} | Altura: ${heightInCm ? `${heightInCm} cm` : 'Não informada'}`;
        page.drawText(patientName, { x: margin, y: yPosition, font: font, size: 11 });
        yPosition -= 15;
        page.drawText(patientDetails, { x: margin, y: yPosition, font: font, size: 11 });
        yPosition -= 20;

        if(periodText) { page.drawText(`Período: ${periodText}`, { x: margin, y: yPosition, font, size: 10 }); yPosition -= 15; }

        const decryptedData = acompanhamentos.map(record => ({ data: record.data, peso: parseAndDecrypt(record.peso), imc: parseAndDecrypt(record.imc), pescoco: parseAndDecrypt(record.pescoco), torax: parseAndDecrypt(record.torax), cintura: parseAndDecrypt(record.cintura), quadril: parseAndDecrypt(record.quadril), bracoE: parseAndDecrypt(record.bracoE), bracoD: parseAndDecrypt(record.bracoD), pernaE: parseAndDecrypt(record.pernaE), pernaD: parseAndDecrypt(record.pernaD), pantE: parseAndDecrypt(record.pantE), pantD: parseAndDecrypt(record.pantD) }));

        yPosition -= 10;
        const labels = decryptedData.map(m => new Date(m.data).toLocaleDateString('pt-BR'));
        const chartPadding = 20;

        const drawChart = async (data: (number | null)[], title: string, yLabel: string) => {
            if (data.some(d => d !== null)) {
                const chartImage = await generateChart(labels, data, title, yLabel);
                const embeddedChart = await pdfDoc.embedPng(chartImage);
                const chartDims = embeddedChart.scale(0.4);
                if (yPosition < margin + chartDims.height) {
                    page = pdfDoc.addPage([pageLayout.width, pageLayout.height]);
                    await addHeader(pdfDoc, page, { regular: font, bold: boldFont });
                    yPosition = height - topMargin;
                }
                page.drawImage(embeddedChart, { x: (width - chartDims.width) / 2, y: yPosition - chartDims.height, width: chartDims.width, height: chartDims.height });
                yPosition -= (chartDims.height + chartPadding);
            }
        };

        await drawChart(decryptedData.map(m => m.peso), 'Histórico de Peso', 'Peso (kg)');
        await drawChart(decryptedData.map(m => m.imc), 'Histórico de IMC', 'IMC');
        
        page = pdfDoc.addPage([pageLayout.width, pageLayout.height]);
        await addHeader(pdfDoc, page, { regular: font, bold: boldFont });
        yPosition = height - topMargin; // Reset yPosition with safe margin
        page.drawText('Registros Detalhados', { x: margin, y: yPosition, font: boldFont, size: 14 });
        yPosition -= 30;
        
        const tableFontSize = 8;
        const headers = ['Data', 'Peso', 'IMC', 'Pescoço', 'Tórax', 'Cintura', 'Quadril', 'Braço Esq.', 'Braço Dir.', 'Perna Esq.', 'Perna Dir.', 'Pant. Esq.', 'Pant. Dir.'];
        const colWidths = [65, 45, 45, 55, 50, 55, 55, 65, 65, 65, 65, 70, 70];
        let xPos = margin;
        headers.forEach((h, i) => { page.drawText(h, { x: xPos, y: yPosition, font: boldFont, size: tableFontSize }); xPos += colWidths[i]; });
        yPosition -= (tableFontSize + 7);

        for (const record of decryptedData) {
            if (yPosition < margin + 20) {
                 page = pdfDoc.addPage([pageLayout.width, pageLayout.height]);
                 await addHeader(pdfDoc, page, { regular: font, bold: boldFont });
                 yPosition = height - topMargin;
                 xPos = margin;
                 headers.forEach((h, i) => { page.drawText(h, { x: xPos, y: yPosition, font: boldFont, size: tableFontSize }); xPos += colWidths[i]; });
                 yPosition -= (tableFontSize + 7);
            }
            
            const row = [ new Date(record.data).toLocaleDateString('pt-BR'), record.peso ? `${record.peso.toFixed(1)} kg` : '-', record.imc ? record.imc.toFixed(2) : '-', record.pescoco ? `${record.pescoco.toFixed(1)} cm` : '-', record.torax ? `${record.torax.toFixed(1)} cm` : '-', record.cintura ? `${record.cintura.toFixed(1)} cm` : '-', record.quadril ? `${record.quadril.toFixed(1)} cm` : '-', record.bracoE ? `${record.bracoE.toFixed(1)} cm` : '-', record.bracoD ? `${record.bracoD.toFixed(1)} cm` : '-', record.pernaE ? `${record.pernaE.toFixed(1)} cm` : '-', record.pernaD ? `${record.pernaD.toFixed(1)} cm` : '-', record.pantE ? `${record.pantE.toFixed(1)} cm` : '-', record.pantD ? `${record.pantD.toFixed(1)} cm` : '-' ];
            xPos = margin;
            row.forEach((cell, i) => { if (cell) page.drawText(cell, { x: xPos, y: yPosition, font: font, size: tableFontSize }); xPos += colWidths[i]; });
            yPosition -= (tableFontSize + 7);
        }

        await addFooter(pdfDoc.getPages()[pdfDoc.getPageCount() - 1], font);
        const pdfBytes = await pdfDoc.save();

        return new NextResponse(Buffer.from(pdfBytes), { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="relatorio_medidas_${userId}.pdf"` } });

    } catch (error) {
        console.error('Erro ao gerar relatório de medidas:', error);
        const errorMessage = error instanceof Error ? error.message : 'Um erro inesperado ocorreu.';
        return NextResponse.json({ error: `Erro interno do servidor: ${errorMessage}` }, { status: 500 });
    }
}