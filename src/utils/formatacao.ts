export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarFaixa(minimo: number, maximo: number): string {
  return `${formatarMoeda(minimo)} a ${formatarMoeda(maximo)}`;
}

export function formatarData(iso: string): string {
  // API Java envia hora local sem fuso; API .NET envia UTC com "Z": o Date trata os dois corretamente
  const data = new Date(iso);
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatarDataHora(iso: string): string {
  const data = new Date(iso);
  return `${data.toLocaleDateString('pt-BR')} as ${data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/** Gera um identificador unico (UUID v4) para o header Idempotency-Key. */
export function gerarChaveUnica(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
