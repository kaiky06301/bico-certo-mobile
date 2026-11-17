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
  return `${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/** "Hoje às 10:30", "Ontem às 18:05" ou "14/11 às 09:00". */
export function formatarQuando(iso: string): string {
  const data = new Date(iso);
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  if (data.toDateString() === hoje.toDateString()) return `Hoje às ${hora}`;
  if (data.toDateString() === ontem.toDateString()) return `Ontem às ${hora}`;
  return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${hora}`;
}

/** Gera um identificador unico (UUID v4) para o header Idempotency-Key. */
export function gerarChaveUnica(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
