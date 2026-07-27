import * as readline from 'readline';
import { ExcelDataSource } from './data/adapters/ExcelDataSource';
import { FileMaker } from './core/FileMaker';
import { output, outputErr } from './utils/logger';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  try {
    output("Starting application...");

    // Ensure DB is seeded properly

    const filePath = await prompt("‖drag file here: ");
    if (!filePath) {
      throw new Error("No file path provided.");
    }

    const excelSource = new ExcelDataSource();
    const tasks = await excelSource.getTasks(filePath);

    if (tasks.length > 0) {
      const fileMaker = FileMaker.getInstance();
      await fileMaker.init();

      // Perform whatever automation logic using `tasks` and `fileMaker.getPage()` here...

      await fileMaker.close();
    }
  } catch (error) {
    if (error instanceof Error) {
      outputErr(`Application Error: ${error.message}`);
    } else {
      outputErr(`Unknown Error occurred.`);
    }
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}
