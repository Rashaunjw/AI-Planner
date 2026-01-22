declare module "pdf-parse/lib/pdf-parse" {
  type PdfParseResult = {
    text: string
  }

  type PdfParseOptions = {
    max?: number
  }

  const pdf: (dataBuffer: Buffer, options?: PdfParseOptions) => Promise<PdfParseResult>

  export default pdf
}

