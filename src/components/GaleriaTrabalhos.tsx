import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { chaves, useGaleria } from '../hooks/consultas';
import { adicionarFotoNaGaleria, removerFotoDaGaleria } from '../services/contaService';
import { cores } from '../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../theme/tipografia';
import { mensagemDeErro } from '../utils/erros';
import { escolherFotos, OrigemFoto } from '../utils/fotos';

export const MAXIMO_FOTOS_GALERIA = 6;

interface Props {
  prestadorId: number;
  quantidade: number;
  /** O próprio prestador: pode adicionar e apagar fotos. */
  editavel?: boolean;
}

/** "Trabalhos realizados": fotos que o prestador mostra para ganhar a confiança do cliente. */
export function GaleriaTrabalhos({ prestadorId, quantidade, editavel = false }: Props) {
  const queryClient = useQueryClient();
  const galeria = useGaleria(prestadorId, editavel ? 1 : quantidade);
  const [aberta, setAberta] = useState<string | null>(null);
  const fotos = galeria.data ?? [];
  const restantes = MAXIMO_FOTOS_GALERIA - fotos.length;

  function atualizar() {
    void queryClient.invalidateQueries({ queryKey: chaves.galeria(prestadorId) });
    void queryClient.invalidateQueries({ queryKey: chaves.meuPerfilPrestador });
  }

  const enviar = useMutation({
    mutationFn: async (origem: OrigemFoto) => {
      const escolhidas = await escolherFotos(origem, { limite: restantes });
      for (const foto of escolhidas) await adicionarFotoNaGaleria(foto.dados);
    },
    onSettled: atualizar,
    onError: (erro) => Alert.alert('Não foi possível enviar', mensagemDeErro(erro)),
  });

  const apagar = useMutation({
    mutationFn: removerFotoDaGaleria,
    onSettled: atualizar,
    onError: (erro) => Alert.alert('Não foi possível apagar', mensagemDeErro(erro)),
  });

  function perguntarOrigem() {
    Alert.alert('Adicionar foto de trabalho', 'Mostre um serviço que você já fez.', [
      { text: 'Tirar foto', onPress: () => enviar.mutate('camera') },
      { text: 'Escolher da galeria', onPress: () => enviar.mutate('galeria') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function confirmarExclusao(id: number) {
    Alert.alert('Apagar esta foto?', 'Ela sai do seu perfil.', [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => apagar.mutate(id) },
    ]);
  }

  if (!editavel && quantidade === 0) return null;

  return (
    <View>
      {galeria.isLoading ? (
        <ActivityIndicator color={cores.primaria} style={estilos.carregando} />
      ) : galeria.isError ? (
        <Text style={estilos.erro}>Não foi possível carregar as fotos.</Text>
      ) : (
        <View style={estilos.grade}>
          {fotos.map((foto, i) => (
            <View key={foto.id} style={estilos.item}>
              <Pressable
                accessibilityRole="imagebutton"
                accessibilityLabel={foto.legenda ?? `Abrir foto de trabalho ${i + 1}`}
                onPress={() => setAberta(foto.imagem)}
              >
                <Image source={{ uri: foto.imagem }} style={estilos.imagem} />
              </Pressable>
              {editavel && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Apagar foto ${i + 1}`}
                  hitSlop={8}
                  onPress={() => confirmarExclusao(foto.id)}
                  style={estilos.remover}
                >
                  <Ionicons name="trash-outline" size={14} color={cores.branco} />
                </Pressable>
              )}
            </View>
          ))}
          {editavel && restantes > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Adicionar foto de trabalho"
              onPress={perguntarOrigem}
              disabled={enviar.isPending}
              style={({ pressed }) => [
                estilos.item,
                estilos.adicionar,
                pressed && { opacity: 0.6 },
              ]}
            >
              {enviar.isPending ? (
                <ActivityIndicator color={cores.secundaria} />
              ) : (
                <>
                  <Ionicons name="add" size={26} color={cores.secundaria} />
                  <Text style={estilos.adicionarTexto}>Adicionar</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      )}
      {editavel && (
        <Text style={estilos.ajuda}>
          {fotos.length}/{MAXIMO_FOTOS_GALERIA} fotos · Serviços que você já fez (antes e depois
          ajudam muito). As fotos são salvas na hora.
        </Text>
      )}

      <Modal
        visible={!!aberta}
        transparent
        animationType="fade"
        onRequestClose={() => setAberta(null)}
      >
        <View style={estilos.fundoModal}>
          {aberta && (
            <Image source={{ uri: aberta }} style={estilos.imagemCheia} resizeMode="contain" />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar foto"
            onPress={() => setAberta(null)}
            style={estilos.fechar}
          >
            <Ionicons name="close" size={28} color={cores.branco} />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const LADO = 98;

const estilos = StyleSheet.create({
  carregando: { marginVertical: espacos.md },
  erro: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.perigo },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.sm },
  item: { width: LADO, height: LADO },
  imagem: { width: LADO, height: LADO, borderRadius: raio.medio, backgroundColor: cores.borda },
  remover: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(30,42,68,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adicionar: {
    borderRadius: raio.medio,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: cores.secundaria,
    backgroundColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adicionarTexto: { fontFamily: fontes.media, fontSize: tamanhos.pequeno, color: cores.secundaria },
  ajuda: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginTop: espacos.sm,
  },
  fundoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagemCheia: { width: '100%', height: '80%' },
  fechar: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
