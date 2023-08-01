import {
  Command,
  EnumType,
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import * as path from "https://deno.land/std@0.196.0/path/mod.ts";
import { ensureDirSync } from "https://deno.land/std@0.196.0/fs/mod.ts";

// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.0/package/types/index.d.ts"
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs";
import { resolveInput } from "../lib.ts";

type ColumnType = "int" | "bool" | "string" | "[]" | "int[]";

interface Options {
  format: "json" | "xml";
  outDir?: string | undefined;
  headerRow: number;
}

class ExportCommand {
  #formatType;
  constructor() {
    this.#formatType = new EnumType(["json", "xml"]);
  }

  #validateOptions(options: Options) {
    if (options.headerRow < 1) {
      throw new RangeError("--header-row must be at latest 1");
    }
  }

  register(command: Command) {
    command
      .command("export", "Export sheet from ods or xlsx to json, xml")
      .type("format", this.#formatType)
      .option("-f, --format <value:format>", "Output format.", {
        default: "json" as const,
      })
      .option(
        "-o, --out-dir <dir:string>",
        "Output path. By default file will be converted in-place."
      )
      .option("--header-row <header:number>", "Row point to header.", {
        // =================================================
        // 默认第一行为header，如果导出为json，header行的每列将用于json的key
        // 如果导出为xml，header行的每列将用于节点的名称
        // =================================================
        default: 1,
      })
      .arguments("[input:string] [...restArgs:string]")
      .action(async (options, ...args) => {
        // console.log(options);
        this.#validateOptions(options);

        switch (options.format) {
          case "json":
            await this.#exportToJson(args as string[], options);
            break;
          case "xml":
            // exportToJson(args, options.outDir);
            break;
        }
      });
  }

  #tasks: Array<Promise<void>> = [];
  #pushTask(task: Promise<void>) {
    this.#tasks.push(task);
  }
  #waitTasks() {
    return Promise.all(this.#tasks);
  }

  async #exportToJson(inputArr: string[], options: Options) {
    const filePathArr = await resolveInput(inputArr);

    for (let i = 0; i < filePathArr.length; ++i) {
      const filePath = filePathArr[i];
      console.log("processing file: " + filePath);

      const workbook = XLSX.readFile(filePath);

      const out: Record<
        string,
        // sheet
        Array<Record<string, unknown>>
      > = {};

      for (let j = 0; j < workbook.SheetNames.length; ++j) {
        const sheetName = workbook.SheetNames[j];
        console.log("sheet: " + sheetName);

        if (!this.#validate(sheetName)) continue;

        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          blankrows: false,
          defval: null,
        });

        // empty sheet
        if (rows.length === 0) continue;

        const headerRow = rows.splice(options.headerRow - 1, 2)[0] as string[];

        const sheetRows: Array<Record<string, unknown>> = [];

        for (let m = 0; m < rows.length; ++m) {
          const row = rows[m] as unknown[];
          const rowJson: Record<string, unknown> = {};

          for (let n = 0; n < row.length; ++n) {
            const cellValue = row[n];
            const headerCell = headerRow[n];
            if (!this.#validate(headerCell)) continue;
            rowJson[this.#getColumnKey(headerCell)] = this.#convertColumnType(
              cellValue,
              headerCell
            );
          }

          sheetRows.push(rowJson);
        }

        out[sheetName] = sheetRows;
      }

      this.#pushTask(
        this.#writeToFile(this.#getOutFilePath(filePath, options), out)
      );

      console.log("process finished.");
    }

    await this.#waitTasks();
  }

  async #writeToFile(
    file_p: string,
    content: Record<string | number, unknown>
  ) {
    if (Object.keys(content).length === 1) {
      content = content[Object.keys(content)[0]] as typeof content;
    }

    const file = await Deno.open(file_p, {
      write: true,
      truncate: true,
      create: true,
    });
    await file.write(new TextEncoder().encode(JSON.stringify(content)));
  }

  #getOutFilePath(file_p: string, opts: Options) {
    const fileName = path.basename(file_p);

    const outFileName =
      fileName.substring(0, fileName.indexOf(path.extname(fileName))) +
      "." +
      opts.format;

    if (!opts.outDir) {
      return path.join(path.dirname(file_p), outFileName);
    }

    const outDir = path.resolve(opts.outDir);
    ensureDirSync(outDir);
    return path.join(outDir, outFileName);
  }

  #getColumnKey(headerCell: string): string {
    return headerCell.trim().split("#")[0];
  }

  #convertColumnType(cellValue: unknown, headerCell: string) {
    if (!cellValue) return cellValue;

    const columnType = headerCell.trim().split("#")[1] as ColumnType;

    switch (columnType) {
      case "int":
        return Number(cellValue);
      case "bool":
        return Boolean(cellValue);
      case "[]":
        return (cellValue as string).split(",");
      case "int[]":
        return (cellValue as string).split(",").map((val) => Number(val));
      case "string":
      default:
        return String(cellValue);
    }
  }

  #exportToXML() {}

  // 验证数据是否需要被导出，返回true则验证通过，false验证失败即数据不导出
  #validate(name: string) {
    // console.log("validate: " + name + " type: " + typeof name);
    if (name.trim().startsWith("!")) return false;
    return true;
  }
}

const exportCommand = new ExportCommand();

export default exportCommand;
