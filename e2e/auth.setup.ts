import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '.auth', 'user.json');

setup('authenticate', async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const testEmail = process.env.VITE_TEST_USER_EMAIL;
  const testPassword = process.env.VITE_TEST_USER_PASSWORD;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
  }
  if (!testEmail || !testPassword) {
    throw new Error('Missing VITE_TEST_USER_EMAIL or VITE_TEST_USER_PASSWORD env vars');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (error) {
    throw new Error(`Supabase auth failed: ${error.message}`);
  }

  if (!data.session) {
    throw new Error('No session returned from signInWithPassword');
  }

  // Extract project ref from URL (e.g. https://<ref>.supabase.co)
  const projectRef = supabaseUrl.replace(/https?:\/\//, '').split('.')[0];
  const storageKey = `sb-${projectRef}-auth-token`;

  const storageState = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:3000',
        localStorage: [
          {
            name: storageKey,
            value: JSON.stringify(data.session),
          },
        ],
      },
    ],
  };

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
});
