import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from '../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../theme/tipografia';

interface Opcao<T> {
  valor: T;
  rotulo: string;
}

interface Props<T> {
  opcoes: Opcao<T>[];
  selecionados: T[];
  aoMudar: (selecionados: T[]) => void;
  /** Máximo de itens marcados (os outros ficam desabilitados ao atingir). */
  maximo?: number;
  /** Mostra um selo "Principal" no primeiro marcado. */
  destacarPrimeiro?: boolean;
}

/** Chips que podem ser marcados juntos (serviços, dias da semana, bairros). */
export function OpcoesMultiplas<T extends string | number>({
  opcoes,
  selecionados,
  aoMudar,
  maximo,
  destacarPrimeiro,
}: Props<T>) {
  const cheio = maximo !== undefined && selecionados.length >= maximo;

  function alternar(valor: T) {
    if (selecionados.includes(valor)) aoMudar(selecionados.filter((v) => v !== valor));
    else if (!cheio) aoMudar([...selecionados, valor]);
  }

  return (
    <View style={estilos.grupo}>
      {opcoes.map((opcao) => {
        const ativo = selecionados.includes(opcao.valor);
        const principal = destacarPrimeiro && selecionados[0] === opcao.valor;
        const desabilitado = !ativo && cheio;
        return (
          <Pressable
            key={String(opcao.valor)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: ativo, disabled: desabilitado }}
            accessibilityLabel={principal ? `${opcao.rotulo}, serviço principal` : opcao.rotulo}
            onPress={() => alternar(opcao.valor)}
            style={[estilos.chip, ativo && estilos.chipAtivo, desabilitado && estilos.desabilitado]}
          >
            <Text style={[estilos.texto, ativo && estilos.textoAtivo]}>
              {ativo ? '✓ ' : ''}
              {opcao.rotulo}
            </Text>
            {principal && <Text style={estilos.principal}>Principal</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.sm, marginBottom: espacos.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.xs,
    paddingHorizontal: espacos.md,
    paddingVertical: espacos.sm,
    borderRadius: raio.grande,
    borderWidth: 1.5,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  chipAtivo: { borderColor: cores.primaria, backgroundColor: cores.primariaClara },
  desabilitado: { opacity: 0.45 },
  texto: { fontFamily: fontes.media, fontSize: tamanhos.normal, color: cores.textoSuave },
  textoAtivo: { color: cores.primariaEscura },
  principal: {
    fontFamily: fontes.seminegrito,
    fontSize: 10,
    color: cores.branco,
    backgroundColor: cores.primaria,
    borderRadius: raio.pequeno,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: 'hidden',
  },
});
