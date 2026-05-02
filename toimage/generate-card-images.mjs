import { generateCards } from "./cardImageGenerator.mjs";

const options = parseArgs(process.argv.slice(2));

try {
  const manifest = await generateCards(options);
  for (const item of manifest) {
    console.log(`${item.studentId} ${item.studentName} -> ${item.file}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2).replace(/-([a-z])/g, (_match, char) => char.toUpperCase());
    const value = args[index + 1] && !args[index + 1].startsWith("--")
      ? args[++index]
      : true;
    options[key] = value;
  }
  return options;
}
