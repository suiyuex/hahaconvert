import { cliDesc, cliName, cliVersion } from "./env.ts";
import { RootCommand } from "./RootCommand.ts";
import { ExportCommand } from "./subcommand/ExportCommand.ts";

async function start() {
    const rootCmd = new RootCommand(cliName, cliVersion, cliDesc);
    rootCmd.register(new ExportCommand());

    await rootCmd.run();
}

if (import.meta.main) {
    await start();
}
