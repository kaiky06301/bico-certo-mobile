import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Botao } from '../../components/Botao';
import { CampoTexto } from '../../components/CampoTexto';
import { TelaFormulario } from '../../components/TelaFormulario';
import { useAuth } from '../../contexts/AuthContext';
import { excluirConta } from '../../services/contaService';
import { cores } from '../../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';

/** Exclusão da conta (LGPD): pede a senha e uma confirmação antes de apagar os dados pessoais. */
export function ExcluirContaScreen() {
  const { sair } = useAuth();
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string>();

  const excluir = useMutation({
    mutationFn: () => excluirConta(senha),
    onSuccess: async () => {
      Alert.alert('Conta excluída', 'Seus dados pessoais foram apagados. Até logo!');
      await sair();
    },
  });

  function confirmar() {
    if (!senha) {
      setErro('Confirme sua senha');
      return;
    }
    setErro(undefined);
    Alert.alert('Excluir conta?', 'Essa ação não pode ser desfeita.', [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => excluir.mutate() },
    ]);
  }

  return (
    <TelaFormulario>
      <View style={estilos.aviso}>
        <Text style={estilos.avisoTitulo}>O que acontece ao excluir</Text>
        <Text style={estilos.avisoTexto}>
          • Seu nome, e-mail, telefone e endereço são apagados.{'\n'}• Você não consegue mais entrar
          com esta conta.{'\n'}• Pedidos e avaliações antigos continuam no histórico, sem os seus
          dados.{'\n'}• Se houver pedido ou serviço em andamento, conclua ou cancele antes.
        </Text>
      </View>
      <CampoTexto
        rotulo="Confirme sua senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
        erro={erro}
      />
      {excluir.isError && <Text style={estilos.erro}>{mensagemDeErro(excluir.error)}</Text>}
      <Botao
        titulo="Excluir minha conta"
        variante="perigo"
        carregando={excluir.isPending}
        aoPressionar={confirmar}
      />
    </TelaFormulario>
  );
}

const estilos = StyleSheet.create({
  aviso: {
    backgroundColor: cores.perigoClaro,
    borderRadius: raio.medio,
    padding: espacos.md,
    marginBottom: espacos.lg,
  },
  avisoTitulo: { fontFamily: fontes.seminegrito, color: cores.perigo, marginBottom: espacos.xs },
  avisoTexto: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.texto,
    lineHeight: 22,
  },
  erro: {
    fontFamily: fontes.media,
    color: cores.perigo,
    textAlign: 'center',
    marginBottom: espacos.sm,
  },
});
