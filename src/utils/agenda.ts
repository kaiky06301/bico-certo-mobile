export const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];
export const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Início do dia (00:00) no horário do celular. */
export function inicioDoDia(data: Date): Date {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Diferença em dias de calendário entre hoje e a data (0 = hoje, 1 = amanhã). */
export function diasAte(data: Date, agora = new Date()): number {
  return Math.round((inicioDoDia(data).getTime() - inicioDoDia(agora).getTime()) / 86400000);
}

/** "Hoje · quarta-feira, 19/11", "Amanhã · ...", "Sexta-feira, 21/11". */
export function tituloDoDia(data: Date, agora = new Date()): string {
  const dia = `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`;
  const semana = DIAS_SEMANA[data.getDay()];
  const n = diasAte(data, agora);
  if (n === 0) return `Hoje · ${semana.toLowerCase()}, ${dia}`;
  if (n === 1) return `Amanhã · ${semana.toLowerCase()}, ${dia}`;
  if (n === -1) return `Ontem · ${semana.toLowerCase()}, ${dia}`;
  return `${semana}, ${dia}`;
}

export function horario(data: Date): string {
  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}

/** Opções rápidas de data e hora para agendar ou reagendar (sem depender de um seletor externo). */
export function opcoesDeAgendamento(agora = new Date()) {
  const em = (dias: number, hora: number) => {
    const data = new Date(agora);
    data.setDate(data.getDate() + dias);
    data.setHours(hora, 0, 0, 0);
    return data;
  };
  const rotulo = (data: Date, dias: number) =>
    `${dias === 1 ? 'Amanhã' : `${DIAS_CURTOS[data.getDay()]} ${data.getDate()}/${data.getMonth() + 1}`} ${data.getHours()}h`;

  const opcoes = [];
  for (const dias of [1, 2, 3, 4]) {
    for (const hora of [9, 14, 17]) {
      const data = em(dias, hora);
      opcoes.push({ valor: data.toISOString(), rotulo: rotulo(data, dias) });
    }
  }
  return opcoes;
}
