import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export function createLogger(logPath) {
  let chain = Promise.resolve();
  return {
    write(entry) {
      const line = `${JSON.stringify(entry)}\n`;
      chain = chain.then(async () => {
        await mkdir(dirname(logPath), { recursive: true });
        await appendFile(logPath, line, { encoding: 'utf8', mode: 0o600, flag: 'a' });
      }).catch((error) => console.error('Gateway logging failure:', error.message));
      return chain;
    },
    flush() { return chain; }
  };
}
