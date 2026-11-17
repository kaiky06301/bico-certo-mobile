import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { usePerfilPrestador } from '../hooks/consultas';
import { cores } from '../theme/cores';
import { espacos, fontes, tamanhos } from '../theme/tipografia';
import { Avatar } from './Avatar';

interface Props {
  /** Id de usuário do prestador (o mesmo que a API .NET chama de prestadorId). */
  usuarioId: number;
  nome: string;
  tamanhoAvatar?: number;
}

/** Foto (iniciais), nome, nota média e área do prestador: gera confiança antes de contratar. */
export function ResumoPrestador({ usuarioId, nome, tamanhoAvatar = 52 }: Props) {
  const perfil = usePerfilPrestador(usuarioId);
  const p = perfil.data;

  return (
    <View style={estilos.linha}>
      <Avatar nome={nome} tamanho={tamanhoAvatar} />
      <View style={estilos.textos}>
        <View style={estilos.nomeLinha}>
          <Text style={estilos.nome} numberOfLines={1}>
            {nome}
          </Text>
          {p?.verificado && (
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={cores.sucesso}
              accessibilityLabel="Identidade verificada"
            />
          )}
        </View>
        {p && (
          <View style={estilos.nota}>
            <Ionicons name="star" size={14} color="#F5A524" />
            <Text style={estilos.textoSuave}>
              {p.totalAvaliacoes > 0
                ? `${p.notaMedia.toFixed(1).replace('.', ',')} (${p.totalAvaliacoes} ${
                    p.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'
                  })`
                : 'Ainda sem avaliações'}
            </Text>
          </View>
        )}
        {p && (
          <Text style={estilos.textoSuave} numberOfLines={1}>
            {p.categoria.nome} · {p.regiaoAtendimento || p.bairro}
          </Text>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espacos.md, flex: 1 },
  textos: { flex: 1, gap: 2 },
  nomeLinha: { flexDirection: 'row', alignItems: 'center', gap: espacos.xs },
  nome: {
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.medio,
    color: cores.texto,
    flexShrink: 1,
  },
  nota: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  textoSuave: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.textoSuave },
});
