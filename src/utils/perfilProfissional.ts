import { DiaSemana, PerfilPrestador } from '../models/usuario';

/** Dias na ordem da semana de trabalho (segunda primeiro). */
export const DIAS: { valor: DiaSemana; curto: string }[] = [
  { valor: 'SEG', curto: 'Seg' },
  { valor: 'TER', curto: 'Ter' },
  { valor: 'QUA', curto: 'Qua' },
  { valor: 'QUI', curto: 'Qui' },
  { valor: 'SEX', curto: 'Sex' },
  { valor: 'SAB', curto: 'Sáb' },
  { valor: 'DOM', curto: 'Dom' },
];

export const ATALHOS_DIAS: { rotulo: string; dias: DiaSemana[] }[] = [
  { rotulo: 'Seg a sex', dias: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'] },
  { rotulo: 'Seg a sáb', dias: ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'] },
  { rotulo: 'Todos os dias', dias: ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'] },
];

/** Bairros que o prestador pode marcar como região de atendimento (zona sul de SP e vizinhos). */
export const BAIRROS = [
  'Capão Redondo',
  'Jardim Ângela',
  'Campo Limpo',
  'Jardim São Luís',
  'Vila Andrade',
  'Santo Amaro',
  'Socorro',
  'Cidade Dutra',
  'Grajaú',
  'Parelheiros',
  'Cidade Ademar',
  'Jabaquara',
  'Morumbi',
  'Butantã',
  'Taboão da Serra',
  'Embu das Artes',
];

/** "SEG,TER,QUA,QUI,SEX" -> "Seg a sex"; dias soltos -> "Seg, qua e sáb". */
export function textoDosDias(dias: DiaSemana[]): string {
  const ordenados = DIAS.filter((d) => dias.includes(d.valor));
  if (!ordenados.length) return '';
  if (ordenados.length === 7) return 'Todos os dias';
  const indices = ordenados.map((d) => DIAS.indexOf(d));
  const seguidos = indices.every((v, i) => i === 0 || v === indices[i - 1] + 1);
  if (seguidos && ordenados.length >= 3) {
    return `${ordenados[0].curto} a ${ordenados[ordenados.length - 1].curto.toLowerCase()}`;
  }
  const nomes = ordenados.map((d, i) => (i === 0 ? d.curto : d.curto.toLowerCase()));
  return nomes.length === 1 ? nomes[0] : `${nomes.slice(0, -1).join(', ')} e ${nomes.at(-1)}`;
}

/** "Seg a sáb, das 08:00 às 18:00" (também é o texto guardado em "disponibilidade"). */
export function textoDisponibilidade(
  dias: DiaSemana[],
  inicio?: string | null,
  fim?: string | null,
): string {
  const textoDias = textoDosDias(dias);
  const horas = inicio && fim ? `das ${inicio} às ${fim}` : '';
  return [textoDias, horas].filter(Boolean).join(', ');
}

/** Disponibilidade para quem vê o perfil (estruturada quando existe; senão o texto antigo). */
export function disponibilidadeDoPerfil(p: PerfilPrestador): string {
  return (
    textoDisponibilidade(p.diasAtendimento ?? [], p.horarioInicio, p.horarioFim) ||
    p.disponibilidade ||
    'Combinar com o prestador'
  );
}

/** "Elétrica, Encanamento" (principal primeiro). */
export function servicosDoPerfil(p: PerfilPrestador): string {
  return [p.categoria, ...(p.outrasCategorias ?? [])].map((c) => c.nome).join(', ');
}

/** Bairros já gravados em "regiaoAtendimento" que estão na lista. */
export function bairrosDaRegiao(regiao: string | null | undefined): string[] {
  if (!regiao) return [];
  return BAIRROS.filter((b) => regiao.toLowerCase().includes(b.toLowerCase()));
}

/** "1 ano" / "12 anos" de experiência. */
export function textoExperiencia(anos: number | null | undefined): string | null {
  if (anos == null) return null;
  if (anos === 0) return 'Menos de 1 ano de experiência';
  return `${anos} ${anos === 1 ? 'ano' : 'anos'} de experiência`;
}

/** Soma ou subtrai horas em "HH:00", ficando entre 05:00 e 23:00. */
export function moverHora(hora: string, delta: number): string {
  const h = Math.min(23, Math.max(5, Number(hora.slice(0, 2)) + delta));
  return `${String(h).padStart(2, '0')}:00`;
}
