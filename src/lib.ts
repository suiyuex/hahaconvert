import * as path from "https://deno.land/std@0.196.0/path/mod.ts";
import * as fs from "https://deno.land/std@0.196.0/fs/mod.ts";

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
