import { Command } from "@cliffy/command";
import { ISubcommand } from "./subcommand/_export/_types/ISubcommand.ts";

export class RootCommand {
    #command: Command;

    constructor(name: string, version: string, desc: string) {
        this.#command = new Command().name(name).version(version).description(desc);
    }

    public register(command: ISubcommand) {
        command.register(this.#command);
    }

    public async run() {
        await this.#command.parse(Deno.args);
    }
}
