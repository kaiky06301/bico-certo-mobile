import Constants from 'expo-constants';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Cartao } from '../../components/Cartao';
import { JAVA_API_URL, NET_API_URL } from '../../config/api';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';

const integrantes = [
  'Erick Bernardes Bradaschia - RM565733',
  'Gabriel Santos Claudino - RM564054',
  'Kaiky de Oliveira Silva - RM566067',
  'Lucas Fortes de Lima - RM559523',
  'Jonathan Moreira Gomes - RM565060',
];

/** Exigencia da GS: mostrar o hash do commit de onde a versao publicada foi gerada. */
export function SobreScreen() {
  const commit = String(Constants.expoConfig?.extra?.commit ?? 'desconhecido');
  const versao = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo}>
      <Image
        source={require('../../../assets/images/logo.png')}
        style={estilos.logo}
        accessibilityLabel="Logo"
      />
      <Text style={estilos.nome}>Bico Certo</Text>
      <Text style={estilos.texto}>
        Conecta moradores a prestadores de servico do proprio bairro, com triagem inteligente do
        problema e preco justo. Global Solution 2026/2 - CitizenTech (FIAP).
      </Text>

      <Cartao>
        <Info rotulo="Versao" valor={versao} />
        <Info rotulo="Commit de referencia" valor={commit} destaque />
        <Info rotulo="API Java" valor={JAVA_API_URL} />
        <Info rotulo="API .NET" valor={NET_API_URL} />
      </Cartao>

      <Cartao>
        <Text style={estilos.rotulo}>Integrantes</Text>
        {integrantes.map((nome) => (
          <Text key={nome} style={estilos.texto}>
            {nome}
          </Text>
        ))}
      </Cartao>
    </ScrollView>
  );
}

function Info({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <View style={estilos.info}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <Text selectable style={[estilos.valor, destaque && estilos.destaque]}>
        {valor}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.lg },
  logo: { width: 80, height: 80, alignSelf: 'center' },
  nome: {
    fontFamily: fontes.negrito,
    fontSize: tamanhos.titulo,
    color: cores.secundaria,
    textAlign: 'center',
    marginVertical: espacos.sm,
  },
  texto: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
    marginBottom: espacos.sm,
  },
  info: { marginBottom: espacos.md },
  rotulo: { fontFamily: fontes.seminegrito, fontSize: tamanhos.pequeno, color: cores.texto },
  valor: { fontFamily: fontes.regular, fontSize: tamanhos.normal, color: cores.textoSuave },
  destaque: { fontFamily: fontes.media, color: cores.primariaEscura },
});
