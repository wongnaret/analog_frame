declare module 'piexifjs' {
  export type ExifValue = string | number | number[] | number[][];
  export interface ExifData {
    '0th'?: Record<number, ExifValue>;
    Exif?: Record<number, ExifValue>;
    GPS?: Record<number, ExifValue>;
    Interop?: Record<number, ExifValue>;
    '1st'?: Record<number, ExifValue>;
    thumbnail?: string | null;
  }

  const piexif: {
    TagValues: {
      ImageIFD: Record<string, number>;
      ExifIFD: Record<string, number>;
      GPSIFD: Record<string, number>;
    };
    ImageIFD: Record<string, number>;
    ExifIFD: Record<string, number>;
    load(jpegDataUrl: string): ExifData;
    dump(exifObj: ExifData): string;
    insert(exifBytes: string, jpegDataUrl: string): string;
    remove(jpegDataUrl: string): string;
  };

  export default piexif;
}
