import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { listarFotos } from '../services/solicitacaoService';
import { cores } from '../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../theme/tipografia';

interface Props {
  solicitacaoId: number;
  quantidade: number;
}

/** Fotos do problema no detalhe do pedido; tocar abre a foto em tela cheia. */
export function GaleriaFotos({ solicitacaoId, quantidade }: Props) {
  const [aberta, setAberta] = useState<string | null>(null);
  const fotos = useQuery({
    queryKey: ['solicitacoes', solicitacaoId, 'fotos', quantidade],
    queryFn: () => listarFotos(solicitacaoId),
    enabled: quantidade > 0,
  });

  if (quantidade === 0) return null;

  return (
    <View style={estilos.container}>
      <Text style={estilos.rotulo}>Fotos do problema</Text>
      {fotos.isLoading ? (
        <ActivityIndicator color={cores.primaria} />
      ) : fotos.isError ? (
        <Text style={estilos.erro}>Não foi possível carregar as fotos.</Text>
      ) : (
        <View style={estilos.miniaturas}>
          {fotos.data?.map((foto) => (
            <Pressable
              key={foto.id}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Abrir foto ${foto.ordem}`}
              onPress={() => setAberta(foto.imagem)}
            >
              <Image source={{ uri: foto.imagem }} style={estilos.imagem} />
            </Pressable>
          ))}
        </View>
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

const estilos = StyleSheet.create({
  container: { marginTop: espacos.md },
  rotulo: {
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.normal,
    color: cores.texto,
    marginBottom: espacos.sm,
  },
  erro: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.perigo },
  miniaturas: { flexDirection: 'row', gap: espacos.sm },
  imagem: { width: 96, height: 96, borderRadius: raio.medio, backgroundColor: cores.borda },
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
