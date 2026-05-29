declare module 'xlsx' {
  export function utils_book_new(): WorkBook;

  export const utils: {
    book_new(): WorkBook;
    aoa_to_sheet(data: unknown[][]): WorkSheet;
    book_append_sheet(wb: WorkBook, ws: WorkSheet, name: string): void;
  };

  export function write(wb: WorkBook, opts: { type: string; bookType: string }): Buffer;

  interface WorkBook {
    SheetNames: string[];
    Sheets: Record<string, WorkSheet>;
  }
  interface WorkSheet {
    [key: string]: unknown;
    '!cols'?: { wch: number }[];
  }
}
