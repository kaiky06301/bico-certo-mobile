import { isAxiosError } from 'axios';

/** Transforma o erro de qualquer uma das APIs em uma mensagem amigavel para o usuario. */
export function mensagemDeErro(erro: unknown): string {
  if (isAxiosError(erro)) {
    if (!erro.response) {
      return 'Sem conexao com o servidor. Verifique sua internet e tente de novo.';
    }
    const dados = erro.response.data as Record<string, unknown> | undefined;
    // API Java: { mensagem, campos: [{campo, mensagem}] } | API .NET (ProblemDetails): { detail, errors }
    const campos = dados?.campos as { mensagem: string }[] | undefined;
    if (campos?.length) return campos.map((c) => c.mensagem).join('\n');
    const errors = dados?.errors as Record<string, string[]> | undefined;
    if (errors) return Object.values(errors).flat().join('\n');
    if (typeof dados?.mensagem === 'string') return dados.mensagem;
    if (typeof dados?.detail === 'string') return dados.detail;
    if (erro.response.status === 429) return 'Muitas tentativas seguidas. Aguarde um minuto.';
    return `Erro ${erro.response.status}. Tente novamente.`;
  }
  return 'Algo deu errado. Tente novamente.';
}
