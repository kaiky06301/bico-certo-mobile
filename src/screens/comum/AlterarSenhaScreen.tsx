import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { Botao } from '../../components/Botao';
import { CampoTexto } from '../../components/CampoTexto';
import { TelaFormulario } from '../../components/TelaFormulario';
import { alterarSenha } from '../../services/contaService';
import { cores } from '../../theme/cores';
import { espacos, fontes } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { esquemaSenha, validar } from '../../validation/esquemas';

export function AlterarSenhaScreen() {
  const navigation = useNavigation();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});

  const trocar = useMutation({
    mutationFn: () => alterarSenha({ senhaAtual, novaSenha }),
    onSuccess: () => {
      Alert.alert('Senha alterada!', 'Use a nova senha no próximo login.');
      navigation.goBack();
    },
  });

  async function aoSalvar() {
    const encontrados = await validar(esquemaSenha, { senhaAtual, novaSenha, confirmacao });
    setErros(encontrados);
    if (!Object.keys(encontrados).length) trocar.mutate();
  }

  return (
    <TelaFormulario>
      <CampoTexto
        rotulo="Senha atual"
        secureTextEntry
        value={senhaAtual}
        onChangeText={setSenhaAtual}
        erro={erros.senhaAtual}
      />
      <CampoTexto
        rotulo="Nova senha"
        secureTextEntry
        value={novaSenha}
        onChangeText={setNovaSenha}
        erro={erros.novaSenha}
      />
      <CampoTexto
        rotulo="Repita a nova senha"
        secureTextEntry
        value={confirmacao}
        onChangeText={setConfirmacao}
        erro={erros.confirmacao}
      />
      {trocar.isError && <Text style={estilos.erro}>{mensagemDeErro(trocar.error)}</Text>}
      <Botao titulo="Alterar senha" carregando={trocar.isPending} aoPressionar={aoSalvar} />
    </TelaFormulario>
  );
}

const estilos = StyleSheet.create({
  erro: {
    fontFamily: fontes.media,
    color: cores.perigo,
    textAlign: 'center',
    marginBottom: espacos.sm,
  },
});
