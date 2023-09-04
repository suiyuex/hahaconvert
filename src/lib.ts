import * as path from "https://deno.land/std@0.196.0/path/mod.ts";
import * as fs from "https://deno.land/std@0.196.0/fs/mod.ts";

// @deno-types="https://cdn.sheetjs.com/xlsx-latest/package/types/index.d.ts"
import * as XLSX from "https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs";

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

// @ts-expect-error
async function resolveFilePath(inputPath: string): Promise<string[]> {
  const absInputPath = path.resolve(Deno.cwd(), inputPath);

  const statInfo = await Deno.stat(absInputPath);

  if (statInfo.isFile) return [absInputPath];
  if (statInfo.isDirectory) return await resolveFolderPath(absInputPath);
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
