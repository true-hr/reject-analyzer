import { assertCareerCoreChangedFilesAllowed } from "../src/lib/career-core/__testUtils__/careerCoreChangedFileGuard.js";

function parseAllowedRuntimeFiles(argv) {
  const allowedRuntimeFiles = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--allow-runtime") {
      const file = argv[index + 1];
      if (!file || file.startsWith("--")) {
        throw new Error("--allow-runtime requires a file path");
      }
      allowedRuntimeFiles.push(file);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return allowedRuntimeFiles;
}

const allowedRuntimeFiles = parseAllowedRuntimeFiles(process.argv.slice(2));

assertCareerCoreChangedFilesAllowed({
  allowedRuntimeFiles,
  context: "career core changed-file guard",
});

console.log("PASS career-core changed-file guard checks");
