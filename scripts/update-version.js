// scripts/update-version.js
const fs = require('fs');
const { execSync } = require('child_process');

try {
  // Pega o número total de commits (versão incremental)
  const commitCount = execSync('git rev-list --count HEAD').toString().trim();
  
  // Pega o hash curto do último commit
  const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  
  // Pega a branch atual
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  
  // Data do build
  const buildDate = new Date().toISOString();
  
  const version = {
    version: commitCount,
    hash: commitHash,
    branch: branch,
    buildDate: buildDate,
    fullVersion: `${commitCount}.${commitHash}`
  };
  
  // Salva em um arquivo JSON
  fs.writeFileSync(
    './public/version.json',
    JSON.stringify(version, null, 2)
  );
  
  console.log('✅ Versão atualizada:', version.fullVersion);
} catch (error) {
  console.log('⚠️ Modo dev - versão não atualizada');
  // Em dev, cria versão padrão
  const version = {
    version: '0',
    hash: 'dev',
    branch: 'local',
    buildDate: new Date().toISOString(),
    fullVersion: '0.dev'
  };
  fs.writeFileSync(
    './public/version.json',
    JSON.stringify(version, null, 2)
  );
}