import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import exportCommand from "./sub-command/export/export-command.ts";

class MyCommand {
  #command;

  constructor() {
    this.#command = new Command()
      .name("hahaconvert")
      .version("0.1.0")
      .description("Command line framework for Deno");

    this.#registerSubCommand();
  }

  #registerSubCommand() {
    exportCommand.register(this.#command);
  }

  public async run() {
    await this.#command.parse(Deno.args);
  }
}

const myCommand = new MyCommand();

export default myCommand;
