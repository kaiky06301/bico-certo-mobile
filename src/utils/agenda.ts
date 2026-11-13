/** Opcoes rapidas de data para agendar o servico (evita depender de um seletor de data externo). */
export function opcoesDeAgendamento(agora = new Date()) {
  const em = (dias: number, hora: number) => {
    const data = new Date(agora);
    data.setDate(data.getDate() + dias);
    data.setHours(hora, 0, 0, 0);
    return data;
  };
  const rotulo = (data: Date, prefixo: string) => `${prefixo} ${data.getHours()}h`;

  return [
    { valor: em(1, 9).toISOString(), rotulo: rotulo(em(1, 9), 'Amanhã') },
    { valor: em(1, 14).toISOString(), rotulo: rotulo(em(1, 14), 'Amanhã') },
    { valor: em(2, 9).toISOString(), rotulo: rotulo(em(2, 9), 'Em 2 dias,') },
    { valor: em(3, 14).toISOString(), rotulo: rotulo(em(3, 14), 'Em 3 dias,') },
  ];
}
