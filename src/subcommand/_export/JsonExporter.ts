// @ts-types="https://cdn.sheetjs.com/xlsx-latest/package/types/index.d.ts"
import * as XLSX from "XLSX";

import { IExporter } from "./IExporter.ts";
import { IExportOption } from "./_types/IExportOption.ts";
import { IExportResult } from "./_types/IExportResult.ts";
import { getFilenameNoExtension, readWorkbook, validateValue } from "../../lib.ts";
import { validateName } from "./ExportUtil.ts";
import { TColumnType } from "./_types/TColumnType.ts";
import { delimiter, refRegExp } from "../../env.ts";

export class JsonExporter implements IExporter {
    #option: IExportOption;
    #filePath: string;
    #workbook?: ReturnType<(typeof XLSX)["readFile"]>;

    constructor(option: IExportOption, filePath: string) {
        this.#option = option;
        this.#filePath = filePath;
    }

    public process(): Array<IExportResult> {
        const result: Array<IExportResult> = [];
        this.#workbook = readWorkbook(this.#filePath);

        for (let i = 0; i < this.#workbook.SheetNames.length; ++i) {
            const sheetName = this.#workbook.SheetNames[i];
            if (!validateName(sheetName)) continue;

            // console.log("sheet: " + sheetName);
            const sheetResult = this.#processSheet(sheetName);
            if (sheetResult !== undefined) {
                result.push(sheetResult);
            }
        }

        return result;
    }

    #processSheet(sheetName: string): IExportResult | undefined {
        const sheetOutputName = this.#getSheetOutputName(sheetName);
        return {
            content: JSON.stringify(this.#generateJson(sheetName)),
            fileName: sheetOutputName + "." + this.#option.format,
        };
    }

    #generateJson(sheetName: string): Array<Record<string, unknown>> | undefined {
        // console.log(sheetName)
        const sheet = this.#workbook!.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Array<string>>(sheet, {
            header: 1,
            blankrows: this.#option.keepBlankRows,
            defval: null,
        });

        // empty sheet
        if (rows.length === 0) {
            return undefined;
        }

        const keyRow = rows[this.#option.keyRow - 1] as Array<string>;
        const typeRow = rows[this.#option.typeRow - 1] as Array<TColumnType>;

        const jsonOutput: Array<Record<string, unknown>> = [];

        for (let i = this.#option.ignoreRows; i < rows.length; ++i) {
            const row = rows[i];
            const rowObject: (typeof jsonOutput)[0] = {};

            for (let j = 0; j < row.length; ++j) {
                const cellValue = String(row[j] === null ? "" : row[j]);
                // console.log(cellValue);
                const key = keyRow[j];
                if (!validateName(key)) continue;

                const matchResult = typeRow[j].match(refRegExp);
                // console.log(matchResult);
                if (matchResult !== null) {
                    const refSheetName = matchResult[2];
                    const refJson = this.#generateJson(matchResult[1] === undefined ? refSheetName : `${matchResult[1]}${refSheetName}`);
                    if (refJson === undefined) {
                        continue;
                    }

                    // console.log(refJson);

                    if (matchResult[4] === undefined) {
                        rowObject[key] = refJson;
                        continue;
                    }
                    const targetKey = matchResult[4];
                    const targetValues = matchResult[5] === undefined ? [cellValue] : cellValue.split(delimiter);
                    // console.log(targetKey,targetValues);
                    // console.log(refJson)
                    const result = refJson.filter((item) => targetValues.some((val) => val == item[targetKey]));
                    // console.log(result)
                    rowObject[key] = matchResult[5] === undefined ? result[0] : result;
                } else {
                    rowObject[key] = this.#getColumnValue(cellValue, typeRow[j]);
                }
            }

            jsonOutput.push(rowObject);
        }

        return jsonOutput;
    }

    #getSheetOutputName(sheetName: string) {
        if (this.#workbook!.SheetNames[0] === sheetName) {
            return getFilenameNoExtension(this.#filePath);
        }

        return sheetName;
    }

    #getColumnValue(cellValue: string, columnType: TColumnType) {
        switch (columnType) {
            case "int": {
                if (!validateValue(cellValue)) {
                    return 0;
                }

                return Math.floor(Number.parseInt(cellValue));
            }
            case "float": {
                if (!validateValue(cellValue)) {
                    return 0;
                }

                return Number.parseFloat(cellValue);
            }

            case "bool": {
                if (!validateValue(cellValue)) {
                    return false;
                }

                return Boolean(Number.parseInt(cellValue));
            }
            case "[]":
            case "string[]": {
                if (!validateValue(cellValue)) {
                    return [];
                }

                return String(cellValue).split(delimiter);
            }
            case "int[]": {
                if (!validateValue(cellValue)) {
                    return [];
                }

                return String(cellValue)
                    .split(delimiter)
                    .map((val) => Math.floor(Number.parseInt(val)));
            }
            case "float[]": {
                if (!validateValue(cellValue)) {
                    return [];
                }

                return String(cellValue)
                    .split(delimiter)
                    .map((val) => Number.parseFloat(val));
            }
            case "string":
            default:
                if (!validateValue(cellValue)) {
                    return "";
                }
                return String(cellValue);
        }
    }
}
