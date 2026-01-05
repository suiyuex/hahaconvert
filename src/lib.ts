import * as path from "https://deno.land/std@0.196.0/path/mod.ts";
import * as fs from "https://deno.land/std@0.196.0/fs/mod.ts";

// @ts-types="https://cdn.sheetjs.com/xlsx-latest/package/types/index.d.ts"
import * as XLSX from "XLSX";
import { TColumnType } from "./subcommand/_export/_types/TColumnType.ts";

// 将 snake_case转换成 PascalCase
export function snakeToPascal(snakeVarName: string) {
    if (!snakeVarName.includes("_")) return snakeVarName;

    return snakeVarName
        .split("_")
        .map((substr, index) => {
            if (index == 0) {
                return substr.toLowerCase();
            }
            return substr.charAt(0).toUpperCase() + substr.slice(1);
        })
        .join("");
}

export function capitalizeFirstLetter(str: string) {
    if (!str) return str;
    return str[0].toUpperCase() + str.substring(1);
}

export function readWorkbook(filePath: string): XLSX.WorkBook {
    const workbook = XLSX.readFile(filePath);
    return workbook;
}

export async function resolveInput(inputArr: string[]) {
    const filePathArr = [];

    for (let i = 0; i < inputArr.length; ++i) {
        const input = inputArr[i];
        filePathArr.push(...(await resolveFilePath(input)));
    }

    return filePathArr;
}

async function resolveFilePath(inputPath: string): Promise<string[]> {
    const absInputPath = path.resolve(Deno.cwd(), inputPath);

    const statInfo = await Deno.stat(absInputPath);

    if (statInfo.isFile) return [absInputPath];
    if (statInfo.isDirectory) return await resolveFolderPath(absInputPath);
    return [];
}

async function resolveFolderPath(folderPath: string): Promise<string[]> {
    // 默认递归读取目录下所有 ods xls xlsx文件

    const globArr = ["**/*.ods", "**/*.xls", "**/*.xlsx"];

    const filePathArr = [];
    for await (const fileEntry of fs.walk(folderPath, {
        match: globArr.map((glob) => path.globToRegExp(glob, { globstar: true })),
    })) {
        filePathArr.push(fileEntry.path);
    }
    return filePathArr;
}

export function getFilenameNoExtension(filePath: string) {
    const fileName = path.basename(filePath);
    const outFileName = fileName.substring(0, fileName.indexOf(path.extname(fileName)));
    return outFileName;
}

export function validateValue(value: string | undefined | null) {
    return !(value === null || value === undefined || String(value).trim() === "");
}

// export function getRefSheetName(regExp: RegExp, type: TColumnType) {
//     const matchResult = type.match(regExp);
//     if (matchResult !== null && matchResult[1] === undefined) {
//         return matchResult[2];
//     }
//     return undefined;
// }
