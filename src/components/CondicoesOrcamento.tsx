import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Orcamento } from '../models/contratacao';
import { cores } from '../theme/cores';
import { espacos, fontes, tamanhos } from '../theme/tipografia';
import { formatarData } from '../utils/formatacao';

/** O que o orçamento cobre (mão de obra, material, deslocamento, adicionais) e até quando vale. */
export function CondicoesOrcamento({ orcamento: o }: { orcamento: Orcamento }) {
  const itens: [string, boolean][] = [
    ['Mão de obra', o.incluiMaoDeObra],
    ['Material', o.incluiMaterial],
    ['Deslocamento', o.incluiDeslocamento],
  ];
  return (
    <View style={estilos.container}>
      <Text style={estilos.secao}>O QUE ESTÁ INCLUSO</Text>
      {itens.map(([nome, incluso]) => (
        <View
          key={nome}
          style={estilos.item}
          accessible
          accessibilityLabel={`${nome}: ${incluso ? 'incluso' : 'não incluso'}`}
        >
          <Ionicons
            name={incluso ? 'checkmark-circle' : 'close-circle-outline'}
            size={18}
            color={incluso ? cores.sucesso : cores.textoSuave}
          />
          <Text style={[estilos.texto, !incluso && estilos.naoIncluso]}>
            {nome}
            {incluso ? '' : ' (não incluso)'}
          </Text>
        </View>
      ))}
      {!!o.adicionais && (
        <View style={estilos.item}>
          <Ionicons name="add-circle-outline" size={18} color={cores.secundaria} />
          <Text style={estilos.texto}>Adicionais: {o.adicionais}</Text>
        </View>
      )}
      {o.validoAte && (
        <Text style={[estilos.validade, o.expirado && estilos.vencida]}>
          {o.expirado
            ? `Proposta expirou em ${formatarData(o.validoAte)}`
            : `Proposta válida até ${formatarData(o.validoAte)}`}
        </Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { marginTop: espacos.sm, gap: 4 },
  secao: {
    fontFamily: fontes.media,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    letterSpacing: 0.5,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: espacos.xs },
  texto: { flex: 1, fontFamily: fontes.regular, fontSize: tamanhos.normal, color: cores.texto },
  naoIncluso: { color: cores.textoSuave },
  validade: {
    fontFamily: fontes.media,
    fontSize: tamanhos.pequeno,
    color: cores.secundaria,
    marginTop: espacos.xs,
  },
  vencida: { color: cores.perigo },
});
