import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Botao } from '../../components/Botao';
import { CampoTexto } from '../../components/CampoTexto';
import { TelaFormulario } from '../../components/TelaFormulario';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParams } from '../../navigation/tipos';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { esquemaLogin, validar } from '../../validation/esquemas';

type Props = NativeStackScreenProps<AuthStackParams, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function aoEntrar() {
    setErroGeral('');
    const dados = { email: email.trim(), senha };
    const encontrados = await validar(esquemaLogin, dados);
    setErros(encontrados);
    if (Object.keys(encontrados).length) return;

    setEnviando(true);
    try {
      await entrar(dados);
    } catch (erro) {
      setErroGeral(mensagemDeErro(erro));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TelaFormulario>
      <View style={estilos.topo}>
        <Image
          source={require('../../../assets/images/logo.png')}
          style={estilos.logo}
          accessibilityLabel="Logo do Bico Certo"
        />
        <Text style={estilos.marca}>Bico Certo</Text>
        <Text style={estilos.slogan}>O serviço certo, no seu bairro, pelo preço justo.</Text>
      </View>

      <CampoTexto
        rotulo="E-mail"
        placeholder="seuemail@exemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        value={email}
        onChangeText={(texto) => {
          setEmail(texto);
          setErros((atual) => ({ ...atual, email: '' }));
        }}
        erro={erros.email}
      />
      <CampoTexto
        rotulo="Senha"
        placeholder="Sua senha"
        secureTextEntry
        value={senha}
        onChangeText={(texto) => {
          setSenha(texto);
          setErros((atual) => ({ ...atual, senha: '' }));
        }}
        erro={erros.senha}
        onSubmitEditing={aoEntrar}
      />

      {!!erroGeral && <Text style={estilos.erroGeral}>{erroGeral}</Text>}

      <Botao titulo="Entrar" aoPressionar={aoEntrar} carregando={enviando} />

      <Pressable
        accessibilityRole="link"
        onPress={() => navigation.navigate('Cadastro')}
        style={estilos.link}
      >
        <Text style={estilos.linkTexto}>
          Ainda não tem conta? <Text style={estilos.linkDestaque}>Criar conta</Text>
        </Text>
      </Pressable>
    </TelaFormulario>
  );
}

const estilos = StyleSheet.create({
  topo: { alignItems: 'center', marginTop: espacos.xl, marginBottom: espacos.xl },
  logo: { width: 96, height: 96, marginBottom: espacos.md },
  marca: { fontFamily: fontes.negrito, fontSize: tamanhos.titulo + 4, color: cores.secundaria },
  slogan: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
    textAlign: 'center',
    marginTop: espacos.xs,
  },
  erroGeral: {
    fontFamily: fontes.media,
    color: cores.perigo,
    backgroundColor: cores.perigoClaro,
    padding: espacos.sm,
    borderRadius: 8,
    marginBottom: espacos.md,
    textAlign: 'center',
  },
  link: { marginTop: espacos.lg, alignItems: 'center', padding: espacos.sm },
  linkTexto: { fontFamily: fontes.regular, fontSize: tamanhos.normal, color: cores.textoSuave },
  linkDestaque: { fontFamily: fontes.seminegrito, color: cores.primaria },
});
