import myCommand from "./command.ts";

if (import.meta.main) {
  await myCommand.run();
}
