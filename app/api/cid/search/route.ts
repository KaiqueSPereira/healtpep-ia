import { NextResponse } from 'next/server';

/**
 * Searches for ICD-10 codes using the public API from the U.S. National Library of Medicine (NLM).
 * This provides a simple, unauthenticated way to look up codes.
 * @param {string} term The search term (can be a code or a description).
 * @returns {Promise<{codigo: string, descricao: string}[]>} A promise that resolves to an array of matching codes and their descriptions.
 */
async function searchCIDOnline(term: string): Promise<{ codigo: string; descricao: string }[]> {
    // Using the NLM ICD-10 CM API. It's public and doesn't require authentication.
    // API documentation: https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/documentation.html
    const url = `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=${encodeURIComponent(term)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error("NLM API request failed with status:", response.status);
            throw new Error('Falha ao conectar com o serviço de busca de CID.');
        }

        // The NLM API returns data in a specific array format: [totalCount, [code1, name1], [code2, name2], ...]
        const data = await response.json();

        if (data && data.length > 1) {
            // The first element is the count, the rest are the results.
            const results = data[1]; 
            // Map the array-of-arrays to a more friendly array-of-objects.
            return results.map((item: [string, string]) => ({
                codigo: item[0],
                descricao: item[1],
            }));
        }

        return []; // Return empty if no results are found
    } catch (error) {
        console.error("Error fetching from NLM API:", error);
        // We throw the error so it can be caught by the main handler and return a 500 status
        throw error;
    }
}

/**
 * API route handler for GET requests to /api/cid/search.
 * Expects a 'term' query parameter.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('term');

    if (!searchTerm) {
        return NextResponse.json({ error: 'Search term is required' }, { status: 400 });
    }

    try {
        const results = await searchCIDOnline(searchTerm);
        return NextResponse.json(results);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}
