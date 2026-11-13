const { execSync } = require('child_process');

/**
 * Commit de onde o app foi gerado, exibido na tela "Sobre o App".
 * No EAS Build a variavel EAS_BUILD_GIT_COMMIT_HASH ja vem preenchida;
 * na maquina local o hash e lido direto do git.
 */
function commitAtual() {
  if (process.env.EAS_BUILD_GIT_COMMIT_HASH) return process.env.EAS_BUILD_GIT_COMMIT_HASH;
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch {
    return 'desconhecido';
  }
}

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    commit: commitAtual(),
  },
});
