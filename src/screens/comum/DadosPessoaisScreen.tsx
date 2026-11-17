import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { Botao } from '../../components/Botao';
import { CampoTexto } from '../../components/CampoTexto';
import { Carregando, MensagemErro } from '../../components/Estados';
import { TelaFormulario } from '../../components/TelaFormulario';
import { useAuth } from '../../contexts/AuthContext';
import { chaves, useConta } from '../../hooks/consultas';
import { atualizarConta } from '../../services/contaService';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { Usuario } from '../../models/usuario';
import { esquemaDadosPessoais, validar } from '../../validation/esquemas';

/** Dados pessoais (cliente e prestador): o e-mail é o login e não muda. */
export function DadosPessoaisScreen() {
  const conta = useConta();

  if (conta.isLoading) return <Carregando />;
  if (conta.isError || !conta.data) {
    return (
      <MensagemErro
        mensagem={mensagemDeErro(conta.error)}
        aoTentarDeNovo={() => void conta.refetch()}
      />
    );
  }
  // o formulario so monta com os dados da API (valores iniciais vem por props)
  return <Formulario conta={conta.data} />;
}

function Formulario({ conta }: { conta: Usuario }) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { atualizarUsuario } = useAuth();

  const [nome, setNome] = useState(conta.nome);
  const [telefone, setTelefone] = useState(conta.telefone ?? '');
  const [bairro, setBairro] = useState(conta.bairro);
  const [erros, setErros] = useState<Record<string, string>>({});

  const salvar = useMutation({
    mutationFn: () =>
      atualizarConta({
        nome: nome.trim(),
        telefone: telefone.trim() || undefined,
        bairro: bairro.trim(),
      }),
    onSuccess: async (usuario) => {
      await atualizarUsuario(usuario);
      queryClient.setQueryData(chaves.conta, usuario);
      Alert.alert('Dados atualizados!');
      navigation.goBack();
    },
  });

  async function aoSalvar() {
    const encontrados = await validar(esquemaDadosPessoais, { nome, telefone, bairro });
    setErros(encontrados);
    if (!Object.keys(encontrados).length) salvar.mutate();
  }

  return (
    <TelaFormulario>
      <CampoTexto rotulo="E-mail (login)" value={conta.email} editable={false} />
      <CampoTexto rotulo="Nome completo" value={nome} onChangeText={setNome} erro={erros.nome} />
      <CampoTexto
        rotulo="Telefone (opcional)"
        keyboardType="phone-pad"
        placeholder="(11) 90000-0000"
        value={telefone}
        onChangeText={setTelefone}
        erro={erros.telefone}
      />
      <CampoTexto rotulo="Bairro" value={bairro} onChangeText={setBairro} erro={erros.bairro} />
      <Text style={estilos.dica}>
        Para pedir serviços em outros lugares, cadastre em Perfil → Meus endereços.
      </Text>
      {salvar.isError && <Text style={estilos.erro}>{mensagemDeErro(salvar.error)}</Text>}
      <Botao titulo="Salvar" carregando={salvar.isPending} aoPressionar={aoSalvar} />
    </TelaFormulario>
  );
}

const estilos = StyleSheet.create({
  dica: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginBottom: espacos.md,
  },
  erro: {
    fontFamily: fontes.media,
    color: cores.perigo,
    textAlign: 'center',
    marginBottom: espacos.sm,
  },
});
