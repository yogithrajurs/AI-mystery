import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
const [{ connectDatabase }, { env }, { default: app }] = await Promise.all([
  import('./config/database.js'),
  import('./config/env.js'),
  import('./app.js')
]);

try {
  await connectDatabase();
  app.listen(env.PORT, () => console.log(`AI Mystery Room API listening on port ${env.PORT}`));
} catch (error) {
  console.error('Unable to connect to MongoDB. Check MONGODB_URI and confirm the database is available.');
  process.exitCode = 1;
}

