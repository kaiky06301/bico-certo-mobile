import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Botao } from '../../components/Botao';
import { Cartao } from '../../components/Cartao';
import { Selo } from '../../components/Selo';
import { useAuth } from '../../contexts/AuthContext';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';

const nomesDosPapeis = {
  CLIENTE: 'Cliente',
  PRESTADOR: 'Prestador de servico',
  ADMIN: 'Administrador',
};

export function PerfilScreen() {
  const { usuario, sair } = useAuth();
  const navigation = useNavigation<{ navigate: (rota: string) => void }>();

  function confirmarSaida() {
    Alert.alert('Sair da conta?', 'Voce precisara entrar de novo para usar o app.', [
      { text: 'Ficar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void sair() },
    ]);
  }

  if (!usuario) return null;

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo}>
      <View style={estilos.avatar}>
        <Text style={estilos.inicial}>{usuario.nome.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={estilos.nome}>{usuario.nome}</Text>
      <View style={estilos.centro}>
        <Selo texto={nomesDosPapeis[usuario.papel]} tom="primario" />
      </View>

      <Cartao estilo={estilos.cartao}>
        <Linha icone="mail-outline" texto={usuario.email} />
        <Linha icone="call-outline" texto={usuario.telefone ?? 'Telefone nao informado'} />
        <Linha icone="location-outline" texto={usuario.bairro} />
      </Cartao>

      <Botao
        titulo="Sobre o app"
        variante="contorno"
        aoPressionar={() => navigation.navigate('Sobre')}
      />
      <Botao
        titulo="Sair da conta"
        variante="perigo"
        aoPressionar={confirmarSaida}
        estilo={estilos.sair}
      />
    </ScrollView>
  );
}

function Linha({ icone, texto }: { icone: keyof typeof Ionicons.glyphMap; texto: string }) {
  return (
    <View style={estilos.linha}>
      <Ionicons name={icone} size={20} color={cores.secundaria} />
      <Text style={estilos.linhaTexto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.lg },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  inicial: { fontFamily: fontes.negrito, fontSize: 36, color: cores.branco },
  nome: {
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.grande,
    color: cores.texto,
    textAlign: 'center',
    marginTop: espacos.md,
  },
  centro: { alignItems: 'center', marginTop: espacos.xs },
  cartao: { marginTop: espacos.lg, gap: espacos.md },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espacos.sm },
  linhaTexto: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.texto,
    flex: 1,
  },
  sair: { marginTop: espacos.sm },
});
