import DocsSidebar from '@/app/_components/DocsSidebar';
import Header from '@/app/_components/header';
import fs from 'fs';
import path from 'path';
import { remark } from 'remark';
import html from 'remark-html';


interface DocsPageProps {
  params: {
    slug: string;
  };
}

export default async function DocsPage({ params }: DocsPageProps) {
  const docsDirectory = path.join(process.cwd(), 'app', 'docs');
  const fullPath = path.join(docsDirectory, `${params.slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  const processedContent = await remark().use(html).process(fileContents);
  const contentHtml = processedContent.toString();

  return (
    <>
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8 flex">
        <DocsSidebar />
        <div className="prose lg:prose-xl ml-8" dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </div>
    </>
  );
}