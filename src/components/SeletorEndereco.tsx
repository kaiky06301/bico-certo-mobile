import { Ionicons } from '@expo/vector-icons';
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

/** "Onde será realizado o serviço?": cartões com os endereços salvos e o atalho para adicionar outro. */
export function SeletorEndereco({ enderecos, selecionado, aoSelecionar, aoAdicionar }: Props) {
  return (
    <View style={estilos.container} accessibilityRole="radiogroup">
      <Text style={estilos.titulo}>Onde será realizado o serviço?</Text>
      {enderecos.map((endereco) => {
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
  adicionar: { flexDirection: 'row', alignItems: 'center', gap: espacos.sm, minHeight: 48 },
  adicionarTexto: { fontFamily: fontes.media, fontSize: tamanhos.normal, color: cores.secundaria },
});
