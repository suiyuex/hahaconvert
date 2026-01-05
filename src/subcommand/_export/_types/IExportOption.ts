export interface IExportOption {
    format: "json" | "cs";
    outDir?: string;
    keyRow: number;
    typeRow: number;
    descRow: number;
    ignoreRows: number;
    csharpNs?: string;
    csharpSuffix?: string;
    keepCase?: boolean;
    keepBlankRows?: boolean;
}
