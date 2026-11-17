import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Endereco } from '../models/usuario';
import { cores } from '../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../theme/tipografia';

interface Props {
  enderecos: Endereco[];
  selecionado: number | undefined;
  aoSelecionar: (id: number) => void;
  aoAdicionar: () => void;
}

/**
 * "Onde será realizado o serviço?": mostra no máximo dois cartões (o principal e mais um).
 * Os demais ficam em "Ver outros endereços"; o escolhido lá passa a aparecer abaixo do principal.
 */
export function SeletorEndereco({ enderecos, selecionado, aoSelecionar, aoAdicionar }: Props) {
  const [aberto, setAberto] = useState(false);
  const [extraId, setExtraId] = useState<number>();

  const principal = enderecos.find((e) => e.principal) ?? enderecos[0];
  const demais = enderecos.filter((e) => e.id !== principal?.id);
  const segundoId = selecionado !== principal?.id ? selecionado : extraId;
  const segundo = demais.find((e) => e.id === segundoId) ?? demais[0];
  const visiveis = [principal, segundo].filter((e): e is Endereco => !!e);
  const outros = demais.filter((e) => e.id !== segundo?.id);

  function escolherOutro(id: number) {
    setExtraId(id);
    setAberto(false);
    aoSelecionar(id);
  }

  return (
    <View style={estilos.container} accessibilityRole="radiogroup">
      <Text style={estilos.titulo}>Onde será realizado o serviço?</Text>
      {visiveis.map((endereco) => {
        const ativo = endereco.id === selecionado;
        return (
          <Pressable
            key={endereco.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={`${endereco.apelido}, ${endereco.bairro}`}
            onPress={() => aoSelecionar(endereco.id)}
            style={[estilos.opcao, ativo && estilos.opcaoAtiva]}
          >
            <View style={estilos.textos}>
              <Text style={estilos.apelido}>{endereco.apelido}</Text>
              <Text style={estilos.detalhe}>
                {endereco.bairro} · {endereco.cidade}/{endereco.uf}
              </Text>
            </View>
            <Ionicons
              name={ativo ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={ativo ? cores.sucesso : cores.borda}
            />
          </Pressable>
        );
      })}

      {outros.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: aberto }}
          onPress={() => setAberto(!aberto)}
          style={({ pressed }) => [estilos.verOutros, pressed && { opacity: 0.6 }]}
        >
          <Text style={estilos.verOutrosTexto}>
            {aberto ? 'Esconder outros endereços' : `Ver outros endereços (${outros.length})`}
          </Text>
          <Ionicons
            name={aberto ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={cores.secundaria}
          />
        </Pressable>
      )}

      {aberto && (
        <View style={estilos.lista}>
          {outros.map((endereco, i) => (
            <Pressable
              key={endereco.id}
              accessibilityRole="button"
              accessibilityLabel={`Usar ${endereco.apelido}, ${endereco.bairro}`}
              onPress={() => escolherOutro(endereco.id)}
              style={({ pressed }) => [
                estilos.itemLista,
                i > 0 && estilos.itemDivisor,
                pressed && { opacity: 0.6 },
              ]}
            >
              <View style={estilos.textos}>
                <Text style={estilos.apelidoLista}>{endereco.apelido}</Text>
                <Text style={estilos.detalhe}>
                  {endereco.bairro} · {endereco.cidade}/{endereco.uf}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={aoAdicionar}
        style={({ pressed }) => [estilos.adicionar, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="add-circle-outline" size={22} color={cores.secundaria} />
        <Text style={estilos.adicionarTexto}>Adicionar outro endereço</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { marginBottom: espacos.md },
  titulo: {
    fontFamily: fontes.media,
    fontSize: tamanhos.normal,
    color: cores.texto,
    marginBottom: espacos.sm,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    padding: espacos.md,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.medio,
    backgroundColor: cores.superficie,
    marginBottom: espacos.sm,
  },
  opcaoAtiva: { borderColor: cores.sucesso, borderWidth: 2 },
  textos: { flex: 1 },
  apelido: { fontFamily: fontes.seminegrito, fontSize: tamanhos.medio, color: cores.texto },
  detalhe: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.textoSuave },
  verOutros: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacos.xs,
    minHeight: 44,
  },
  verOutrosTexto: { fontFamily: fontes.media, fontSize: tamanhos.normal, color: cores.secundaria },
  lista: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.medio,
    backgroundColor: cores.superficie,
    marginBottom: espacos.sm,
  },
  itemLista: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: espacos.md,
    paddingVertical: espacos.sm,
  },
  itemDivisor: { borderTopWidth: 1, borderTopColor: cores.borda },
  apelidoLista: { fontFamily: fontes.media, fontSize: tamanhos.normal, color: cores.texto },
  adicionar: { flexDirection: 'row', alignItems: 'center', gap: espacos.sm, minHeight: 48 },
  adicionarTexto: { fontFamily: fontes.media, fontSize: tamanhos.normal, color: cores.secundaria },
});
