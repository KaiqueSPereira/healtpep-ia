
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { logErrorToDb } from '@/app/_lib/logger';
import { safeDecrypt, safeEncrypt } from '@/app/_lib/crypto';
import { getBiomarkerRule } from '@/app/_lib/biomarkerUtils';
import { z } from 'zod';

// Helper to define a consistent component name for logging
const COMPONENT_NAME = 'API /api/exames/biomarcadores';

// ========== GET Handler: Fetching Data ===========

interface CategorizedBiomarkers {
  [category: string]: string[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get('action');
  const category = searchParams.get('category');

  try {
    if (action === 'diagnose') {
      const examResults = await prisma.resultadoExame.findMany({ select: { nome: true }, distinct: ['nome'] });
      const decryptedResultNames = new Set(examResults.map(r => safeDecrypt(r.nome)));
      const biomarkerRules = await prisma.biomarkerRule.findMany({ select: { standardizedName: true }, distinct: ['standardizedName'] });
      const ruleNames = new Set(biomarkerRules.map(r => r.standardizedName));
      const orphanMarkers = [...decryptedResultNames].filter(name => name && !ruleNames.has(name));
      return NextResponse.json(orphanMarkers);
    }

    if (category) {
      const rules = await prisma.biomarkerRule.findMany({
        where: { category },
        select: { standardizedName: true },
        distinct: ['standardizedName'],
      });
      const names = rules.map(rule => rule.standardizedName);
      return NextResponse.json(names);
    }

    const allRules = await prisma.biomarkerRule.findMany({
      select: { standardizedName: true, category: true },
      distinct: ['standardizedName', 'category'],
    });
    const categorized = allRules.reduce<CategorizedBiomarkers>((acc, rule) => {
      if (!rule.category) rule.category = 'Pendente'; // Fallback for null/empty categories
      if (!acc[rule.category]) acc[rule.category] = [];
      if (!acc[rule.category].includes(rule.standardizedName)) acc[rule.category].push(rule.standardizedName);
      return acc;
    }, {});
    for (const cat in categorized) categorized[cat].sort();
    return NextResponse.json(categorized);

  } catch (error) {
    await logErrorToDb('Error processing GET request', error instanceof Error ? error : String(error), COMPONENT_NAME);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// ========== POST Handler: Creating Data ===========

const createRulesSchema = z.object({
  names: z.array(z.string().min(1, "Biomarker name cannot be empty"))
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = createRulesSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(JSON.stringify(validation.error.format()), { status: 400 });
    }

    const { names } = validation.data;
    const creationPromises = names.map(name => getBiomarkerRule(name));
    await Promise.all(creationPromises);

    return NextResponse.json({ message: `${names.length} rules were created or verified.` });

  } catch (error) {
    await logErrorToDb('Error processing POST request', error instanceof Error ? error : String(error), COMPONENT_NAME);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// ========== PUT Handler: Updating Data ===========

const unifySchema = z.object({ action: z.literal('unify'), sourceName: z.string(), targetName: z.string() });
const categorizeSchema = z.object({ action: z.literal('categorize'), standardizedName: z.string(), newCategory: z.string() });
const renameBiomarkerSchema = z.object({ action: z.literal('rename_biomarker'), oldName: z.string(), newName: z.string() });
const renameCategorySchema = z.object({ action: z.literal('rename_category'), oldCategory: z.string(), newCategory: z.string() });

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'unify': {
        const { sourceName, targetName } = unifySchema.parse(body);
        if (sourceName === targetName) return new NextResponse('Source and target names cannot be the same.', { status: 400 });
        const uniqueRawNames = await prisma.resultadoExame.findMany({ select: { nome: true }, distinct: ['nome'], where: { nome: { not: '' } } });
        const rawSourceNamesToUpdate = uniqueRawNames.filter(r => safeDecrypt(r.nome) === sourceName).map(r => r.nome);
        if (rawSourceNamesToUpdate.length === 0) return new NextResponse(`Source biomarker '${sourceName}' not found.`, { status: 404 });
        const encryptedTargetName = safeEncrypt(targetName);
        const result = await prisma.resultadoExame.updateMany({ where: { nome: { in: rawSourceNamesToUpdate } }, data: { nome: encryptedTargetName } });
        await prisma.biomarkerRule.updateMany({ where: { standardizedName: sourceName }, data: { standardizedName: targetName }});
        return NextResponse.json({ message: `Biomarker unified successfully.`, count: result.count });
      }

      case 'categorize': {
        const { standardizedName, newCategory } = categorizeSchema.parse(body);
        const result = await prisma.biomarkerRule.updateMany({ where: { standardizedName }, data: { category: newCategory } });
        return NextResponse.json({ message: `Category updated successfully.`, count: result.count });
      }

      case 'rename_biomarker': {
        const { oldName, newName } = renameBiomarkerSchema.parse(body);
        if (oldName === newName) return new NextResponse('Old and new names cannot be the same.', { status: 400 });
        const result = await prisma.biomarkerRule.updateMany({ where: { standardizedName: oldName }, data: { standardizedName: newName }});
        return NextResponse.json({ message: `Biomarker renamed successfully.`, count: result.count });
      }

      case 'rename_category': {
        const { oldCategory, newCategory } = renameCategorySchema.parse(body);
        if (oldCategory === newCategory) return new NextResponse('Old and new category names cannot be the same.', { status: 400 });
        const result = await prisma.biomarkerRule.updateMany({ where: { category: oldCategory }, data: { category: newCategory }});
        return NextResponse.json({ message: `Category renamed successfully.`, count: result.count });
      }

      default:
        return new NextResponse(`Invalid action: ${action}`, { status: 400 });
    }
  } catch (error) {
    await logErrorToDb('Error processing PUT request', error instanceof Error ? error : String(error), COMPONENT_NAME);
    if (error instanceof z.ZodError) return new NextResponse(JSON.stringify(error.format()), { status: 400 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


// ========== DELETE Handler: Deleting Data ===========

export async function DELETE(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const categoryToDelete = searchParams.get('category');

    if (!categoryToDelete) {
        return new NextResponse('Category to delete must be specified.', { status: 400 });
    }

    if (categoryToDelete === 'Pendente') {
        return new NextResponse('Cannot delete the default "Pendente" category.', { status: 400 });
    }

    try {
        const result = await prisma.biomarkerRule.updateMany({
            where: { category: categoryToDelete },
            data: { category: 'Pendente' },
        });

        if (result.count === 0) {
             return new NextResponse(`Category '${categoryToDelete}' not found or was already empty.`, { status: 404 });
        }

        return NextResponse.json({ 
            message: `Category '${categoryToDelete}' was deleted. ${result.count} biomarker(s) were moved to \'Pendente\'.`
        });

    } catch (error) {
        await logErrorToDb('Error processing DELETE request', error instanceof Error ? error : String(error), COMPONENT_NAME);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
