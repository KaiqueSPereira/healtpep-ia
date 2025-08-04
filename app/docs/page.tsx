import fs from 'fs';
import path from 'path';
import { remark } from 'remark';
import html from 'remark-html';
import DocsSidebar from '../_components/DocsSidebar'; // Importe o DocsSidebar
import Header from '../_components/header';

export default async function DocsPage() {
  const docsDirectory = path.join(process.cwd(), 'app', 'docs');
  const fullPath = path.join(docsDirectory, 'index.md');
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  const processedContent = await remark().use(html).process(fileContents);
  const contentHtml = processedContent.toString();

  return (
    <>
      <Header />
      <DocsSidebar />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="prose lg:prose-xl" dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </div>
    </>
  );
}
