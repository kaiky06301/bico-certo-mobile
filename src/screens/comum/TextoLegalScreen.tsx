import { useRoute } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';

type Tipo = 'termos' | 'privacidade';

const textos: Record<Tipo, { titulo: string; secoes: [string, string][] }> = {
  termos: {
    titulo: 'Termos de uso',
    secoes: [
      [
        'O que é o Bico Certo',
        'Um espaço para moradores encontrarem prestadores de serviço do próprio bairro. O Bico Certo aproxima as pessoas, mas o serviço é combinado diretamente entre cliente e prestador.',
      ],
      [
        'Faixa de referência de preço',
        'A análise do pedido mostra uma faixa de referência calculada a partir do tipo e da complexidade do serviço. Ela não é um preço fixo: valores acima da faixa são permitidos, desde que o prestador explique o motivo.',
      ],
      [
        'Responsabilidades',
        'O cliente descreve o problema com sinceridade e trata o prestador com respeito. O prestador cumpre o que combinou no orçamento e cuida da segurança do serviço.',
      ],
      [
        'Avaliações',
        'As avaliações devem refletir o serviço realizado. Ofensas e avaliações falsas podem ser removidas.',
      ],
      [
        'Conta',
        'Você pode alterar seus dados ou excluir sua conta a qualquer momento pelo Perfil.',
      ],
    ],
  },
  privacidade: {
    titulo: 'Política de privacidade',
    secoes: [
      [
        'Quais dados usamos',
        'Nome, e-mail, telefone, bairro, endereço (opcional) e a descrição dos seus pedidos.',
      ],
      [
        'Para quê',
        'Para encontrar prestadores do seu bairro, calcular a faixa de referência e permitir o contato entre você e o prestador.',
      ],
      [
        'Quem vê',
        'Os prestadores da categoria do seu pedido veem seu nome, seu bairro e a descrição do problema. O telefone só aparece depois que um prestador assume o pedido. O endereço completo fica só no seu perfil, e outros clientes nunca veem seus dados.',
      ],
      [
        'Seus direitos (LGPD)',
        'Você pode ver e corrigir seus dados em "Dados pessoais" e apagar sua conta em "Excluir conta". Ao excluir, seus dados pessoais são removidos.',
      ],
      [
        'Segurança',
        'Sua senha é guardada criptografada e o acesso ao app usa token com prazo de validade.',
      ],
    ],
  },
};

export function TextoLegalScreen() {
  const route = useRoute();
  const { tipo } = route.params as { tipo: Tipo };
  const texto = textos[tipo];

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo}>
      <Text accessibilityRole="header" style={estilos.titulo}>
        {texto.titulo}
      </Text>
      {texto.secoes.map(([subtitulo, paragrafo]) => (
        <Text key={subtitulo} style={estilos.paragrafo}>
          <Text style={estilos.subtitulo}>
            {subtitulo}
            {'\n'}
          </Text>
          {paragrafo}
        </Text>
      ))}
      <Text style={estilos.rodape}>Global Solution 2026/2 · CitizenTech · FIAP</Text>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.lg },
  titulo: {
    fontFamily: fontes.negrito,
    fontSize: tamanhos.titulo,
    color: cores.texto,
    marginBottom: espacos.md,
  },
  paragrafo: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
    lineHeight: 22,
    marginBottom: espacos.md,
  },
  subtitulo: { fontFamily: fontes.seminegrito, fontSize: tamanhos.medio, color: cores.texto },
  rodape: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginTop: espacos.lg,
  },
});
