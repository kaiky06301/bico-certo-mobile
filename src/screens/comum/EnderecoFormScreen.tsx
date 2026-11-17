import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { Botao } from '../../components/Botao';
import { CampoTexto } from '../../components/CampoTexto';
import { Carregando } from '../../components/Estados';
import { TelaFormulario } from '../../components/TelaFormulario';
import { useAuth } from '../../contexts/AuthContext';
import { chaves, useEnderecos } from '../../hooks/consultas';
import { Endereco } from '../../models/usuario';
import { atualizarEndereco, criarEndereco, excluirEndereco } from '../../services/contaService';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { esquemaEndereco, validar } from '../../validation/esquemas';

/** Cadastro e edição de endereço (aberto pelo Perfil ou pelo Novo pedido). */
export function EnderecoFormScreen() {
  const route = useRoute();
  const { id } = (route.params ?? {}) as { id?: number };
  const enderecos = useEnderecos();

  if (id && enderecos.isLoading) return <Carregando />;
  const existente = id ? enderecos.data?.find((e) => e.id === id) : undefined;
  return <Formulario key={existente?.id ?? 'novo'} existente={existente} />;
}

function Formulario({ existente }: { existente?: Endereco }) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { usuario } = useAuth();

  const [apelido, setApelido] = useState(existente?.apelido ?? '');
  const [logradouro, setLogradouro] = useState(existente?.logradouro ?? '');
  const [complemento, setComplemento] = useState(existente?.complemento ?? '');
  const [bairro, setBairro] = useState(existente?.bairro ?? usuario?.bairro ?? '');
  const [cidade, setCidade] = useState(existente?.cidade ?? 'São Paulo');
  const [uf, setUf] = useState(existente?.uf ?? 'SP');
  const [principal, setPrincipal] = useState(existente?.principal ?? false);
  const [erros, setErros] = useState<Record<string, string>>({});

  function concluir() {
    queryClient.invalidateQueries({ queryKey: chaves.enderecos });
    navigation.goBack();
  }

  const salvar = useMutation({
    mutationFn: () => {
      const dados = {
        apelido: apelido.trim(),
        logradouro: logradouro.trim(),
        complemento: complemento.trim() || undefined,
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        uf: uf.trim().toUpperCase(),
        principal,
      };
      return existente ? atualizarEndereco(existente.id, dados) : criarEndereco(dados);
    },
    onSuccess: concluir,
  });

  const excluir = useMutation({
    mutationFn: () => excluirEndereco(existente!.id),
    onSuccess: concluir,
  });

  async function aoSalvar() {
    const encontrados = await validar(esquemaEndereco, {
      apelido,
      logradouro,
      complemento,
      bairro,
      cidade,
      uf,
    });
    setErros(encontrados);
    if (!Object.keys(encontrados).length) salvar.mutate();
  }

  function confirmarExclusao() {
    Alert.alert(`Excluir "${existente?.apelido}"?`, 'Pedidos já feitos não são afetados.', [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => excluir.mutate() },
    ]);
  }

  return (
    <TelaFormulario>
      <CampoTexto
        rotulo="Nome do endereço"
        placeholder="Ex.: Casa, Trabalho, Casa da vó"
        value={apelido}
        onChangeText={setApelido}
        maxLength={40}
        erro={erros.apelido}
      />
      <CampoTexto
        rotulo="Rua e número"
        placeholder="Ex.: Rua das Flores, 120"
        value={logradouro}
        onChangeText={setLogradouro}
        maxLength={200}
        erro={erros.logradouro}
      />
      <CampoTexto
        rotulo="Complemento (opcional)"
        placeholder="Ex.: apto 12, bloco B"
        value={complemento}
        onChangeText={setComplemento}
        maxLength={100}
        erro={erros.complemento}
      />
      <CampoTexto rotulo="Bairro" value={bairro} onChangeText={setBairro} erro={erros.bairro} />
      <View style={estilos.duasColunas}>
        <View style={estilos.cidade}>
          <CampoTexto rotulo="Cidade" value={cidade} onChangeText={setCidade} erro={erros.cidade} />
        </View>
        <View style={estilos.uf}>
          <CampoTexto
            rotulo="UF"
            autoCapitalize="characters"
            maxLength={2}
            value={uf}
            onChangeText={setUf}
            erro={erros.uf}
          />
        </View>
      </View>

      {!existente?.principal && (
        <View style={estilos.principal}>
          <Text style={estilos.principalTexto}>Usar como endereço principal</Text>
          <Switch
            accessibilityLabel="Usar como endereço principal"
            value={principal}
            onValueChange={setPrincipal}
            trackColor={{ true: cores.primaria, false: cores.borda }}
            thumbColor={cores.branco}
          />
        </View>
      )}
      <Text style={estilos.dica}>
        Antes da contratação, os prestadores veem só o bairro. A rua e o número aparecem para o
        prestador depois que você aceita o orçamento dele.
      </Text>

      {(salvar.isError || excluir.isError) && (
        <Text style={estilos.erro}>{mensagemDeErro(salvar.error ?? excluir.error)}</Text>
      )}
      <Botao titulo="Salvar endereço" carregando={salvar.isPending} aoPressionar={aoSalvar} />
      {existente && (
        <Botao
          titulo="Excluir endereço"
          variante="perigo"
          estilo={estilos.excluir}
          carregando={excluir.isPending}
          aoPressionar={confirmarExclusao}
        />
      )}
    </TelaFormulario>
  );
}

const estilos = StyleSheet.create({
  duasColunas: { flexDirection: 'row', gap: espacos.sm },
  cidade: { flex: 1 },
  uf: { width: 80 },
  principal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espacos.sm,
  },
  principalTexto: { fontFamily: fontes.media, fontSize: tamanhos.normal, color: cores.texto },
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
  excluir: { marginTop: espacos.sm },
});
