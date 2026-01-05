import { Command, EnumType } from "@cliffy/command";
// @deno-types="https://cdn.sheetjs.com/xlsx-latest/package/types/index.d.ts"
import * as XLSX from "https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs";
import { resolveInput, snakeToPascal } from "../lib.ts";
import { IExportOption } from "../subcommand/_export/_types/IExportOption.ts";
import { JsonExporter } from "../subcommand/_export/JsonExporter.ts";
import { IExportResult } from "../subcommand/_export/_types/IExportResult.ts";
import { IExporter } from "../subcommand/_export/IExporter.ts";
import { CSharpExporter } from "../subcommand/_export/CSharpExporter.ts";
import { ISubcommand } from "../subcommand/_export/_types/ISubcommand.ts";
import path from "node:path";
import { ensureDirSync } from "https://deno.land/std@0.196.0/fs/mod.ts";
import process from "node:process";

export class ExportCommand implements ISubcommand {
    #formatType: EnumType<IExportOption["format"]>;

    constructor() {
        this.#formatType = new EnumType(["json", "cs"]);
    }

    #validateOptions(options: IExportOption) {
        if (options.keyRow < 1) {
            throw new RangeError("--key-row must be at latest 1");
        }

        if (options.typeRow < 1) {
            throw new RangeError("--type-row must be at latest 1");
        }
    }

    #option: IExportOption = null!;

    public register(command: Command) {
        command
            .command("export", "Export sheet from ods or xlsx to json, cs")
            .type("format", this.#formatType)
            .option("-f, --format <value:format>", "Output format.", {
                default: "json" as const,
            })
            .option("--csharp-ns <ns:string>", "Specify namespace of output csharp file.")
            .option("--csharp-suffix <suffix:string>", "Output class/file suffix, Default: Config, eg. Job -> JobConfig", { default: "Config" })
            // .option("--keep-case", "snake_case will be converted to PascalCase by default. use this option prevent default action.")
            .option("--keep-blank-rows", "Keep blank rows in output.", { default: false })
            .option("-o, --out-dir <dir:string>", "Output path. By default file will be converted in-place.")
            .option("--key-row <keyRow:number>", "The row pointing to the key", {
                default: 1,
            })
            .option("--type-row <typeRow:number>", "The row pointing to the type.", { default: 2 })
            .option("--desc-row <descRow:number>", "The row pointing to the desc.", { default: 3 })
            .option("--ignore-rows <ignoreRows:number>", "Ignore the first n rows.", { default: 2 })
            .arguments("[input:string] [...restArgs:string]")
            .action(async (options, ...args) => {
                // console.log(options);
                this.#validateOptions(options);

                this.#option = options;
                await this.#doAction(args as string[]);

                // switch (options.format) {
                //     case "json":
                //         await this.#exportToJson(args as string[]);
                //         break;
                //     case "cs":
                //         await this.#exportToCSharp(args as string[]);
                //         break;
                // }
            });
    }

    async #doAction(inputArr: string[]) {
        const results: Array<IExportResult> = [];
        let exporter: IExporter = null!;

        const filePathArr = await resolveInput(inputArr);
        for (let i = 0; i < filePathArr.length; ++i) {
            const filePath = filePathArr[i];
            console.log("processing file: " + filePath);
            switch (this.#option.format) {
                case "json":
                    exporter = new JsonExporter(this.#option, filePath);
                    break;
                case "cs":
                    exporter = new CSharpExporter(this.#option, filePath);
                    break;
            }
            if (exporter !== null) {
                results.push(...exporter.process());
            }
        }

        // 处理输出
        const tasks = results.map((result) => {
            return this.#writeFile(this.#getOutFilePath(result.fileName), result.content);
        });

        await Promise.all(tasks);
    }

    #getOutFilePath(fileName: string) {
        if (!this.#option.outDir) {
            return path.join(process.cwd(), fileName);
        }

        const outDir = path.resolve(this.#option.outDir);
        ensureDirSync(outDir);
        return path.join(outDir, fileName);
    }

    async #writeFile(filePath: string, content: string) {
        const file = await Deno.open(filePath, {
            write: true,
            truncate: true,
            create: true,
        });

        await file.write(new TextEncoder().encode(content));
    }
}
