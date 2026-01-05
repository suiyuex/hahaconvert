import { Command } from "@cliffy/command";

export interface ISubcommand {
    register(command: Command): void;
}
