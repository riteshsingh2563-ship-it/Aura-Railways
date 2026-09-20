import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Security Audit: .gitignore contains .env and .env.local', () => {
  const gitignorePath = path.resolve('.gitignore');
  assert.ok(fs.existsSync(gitignorePath), '.gitignore must exist');

  const content = fs.readFileSync(gitignorePath, 'utf8');
  assert.ok(content.includes('.env.local'), '.gitignore must explicitly include .env.local');
  assert.ok(content.includes('.env*.local'), '.gitignore must include .env*.local wildcard');
});

test('Security Audit: client components do not contain hardcoded secret API keys', () => {
  const SECRET_KEY = 'rg_cf62fe7da6e0437d911ca27ef39485fa';
  const dirsToScan = ['components', 'app', 'public'];

  for (const dir of dirsToScan) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir, { recursive: true });
    for (const f of files) {
      const fullPath = path.join(dir, f.toString());
      if (fs.statSync(fullPath).isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.js'))) {
        // Skip API routes which run on the server
        if (fullPath.includes('app/api')) continue;

        const fileContent = fs.readFileSync(fullPath, 'utf8');
        assert.ok(
          !fileContent.includes(SECRET_KEY),
          `CRITICAL SECURITY VIOLATION: Secret API key leaked in client file: ${fullPath}`
        );
      }
    }
  }
});

test('Firestore Security Model: verifies tenant isolation rule structure', () => {
  const rulesPath = path.resolve('firestore.rules');
  assert.ok(fs.existsSync(rulesPath), 'firestore.rules must exist');

  const rules = fs.readFileSync(rulesPath, 'utf8');
  assert.ok(rules.includes('request.auth.uid == userId'), 'Must enforce request.auth.uid == userId');
  assert.ok(rules.includes('match /users/{userId}'), 'Must partition by /users/{userId}');
  assert.ok(rules.includes('allow read, write: if false;'), 'Must have default deny rule');
});
