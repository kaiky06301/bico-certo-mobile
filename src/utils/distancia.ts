/**
 * Distância aproximada entre bairros (em linha reta, pelo centro de cada bairro).
 * O app não usa a localização exata de ninguém: o endereço completo só aparece depois da contratação.
 */
const centros: Record<string, [number, number]> = {
  'capao redondo': [-23.6719, -46.7794],
  'jardim angela': [-23.7106, -46.771],
  'campo limpo': [-23.6489, -46.7597],
  'jardim sao luis': [-23.6766, -46.7417],
  'vila andrade': [-23.6303, -46.7335],
  'santo amaro': [-23.6539, -46.7105],
  socorro: [-23.6847, -46.7039],
  'cidade dutra': [-23.7225, -46.699],
  grajau: [-23.7853, -46.6669],
  parelheiros: [-23.8268, -46.7276],
  'cidade ademar': [-23.6696, -46.6511],
  jabaquara: [-23.6466, -46.6414],
  morumbi: [-23.6, -46.72],
  butanta: [-23.5711, -46.7083],
  pinheiros: [-23.5673, -46.7019],
  'itaim bibi': [-23.5845, -46.6758],
  'vila mariana': [-23.5891, -46.6343],
  ipiranga: [-23.5925, -46.61],
  consolacao: [-23.5534, -46.6595],
  centro: [-23.5489, -46.6388],
  'taboao da serra': [-23.6094, -46.7586],
  'embu das artes': [-23.6489, -46.8521],
};

function normalizar(bairro: string): string {
  return bairro.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Distância em km entre dois bairros conhecidos (null se algum não estiver na tabela). */
export function distanciaKm(de?: string | null, ate?: string | null): number | null {
  if (!de || !ate) return null;
  if (normalizar(de) === normalizar(ate)) return 0;
  const a = centros[normalizar(de)];
  const b = centros[normalizar(ate)];
  if (!a || !b) return null;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function textoDistancia(km: number | null): string {
  if (km === null) return 'Distância não informada';
  if (km === 0) return 'No seu bairro';
  return `Aproximadamente ${Math.max(1, Math.round(km))} km`;
}
