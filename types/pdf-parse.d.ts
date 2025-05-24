declare module "pdf-parse" {
  interface PDFInfo {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    version: string;
    text: string;
  }

  function pdf(buffer: Buffer): Promise<PDFInfo>;
  export = pdf;
}
