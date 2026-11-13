import { StyleSheet, Text, View } from 'react-native';

import { cores } from '../theme/cores';
import { espacos, fontes, tamanhos } from '../theme/tipografia';

export type TomSelo = 'neutro' | 'primario' | 'sucesso' | 'alerta' | 'perigo';

const paleta: Record<TomSelo, { fundo: string; texto: string }> = {
  neutro: { fundo: cores.secundariaClara, texto: cores.secundaria },
  primario: { fundo: cores.primariaClara, texto: cores.primariaEscura },
  sucesso: { fundo: cores.sucessoClaro, texto: cores.sucesso },
  alerta: { fundo: cores.alertaClaro, texto: cores.alerta },
  perigo: { fundo: cores.perigoClaro, texto: cores.perigo },
};

export function Selo({ texto, tom = 'neutro' }: { texto: string; tom?: TomSelo }) {
  return (
    <View style={[estilos.selo, { backgroundColor: paleta[tom].fundo }]}>
      <Text style={[estilos.texto, { color: paleta[tom].texto }]}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  selo: {
    alignSelf: 'flex-start',
    paddingHorizontal: espacos.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  texto: { fontFamily: fontes.seminegrito, fontSize: tamanhos.pequeno },
});
