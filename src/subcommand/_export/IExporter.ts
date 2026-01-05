import { IExportResult } from "./_types/IExportResult.ts";

export interface IExporter {
    process(): Array<IExportResult>;
}
