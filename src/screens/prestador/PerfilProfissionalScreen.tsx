import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { Botao } from '../../components/Botao';
import { CampoTexto } from '../../components/CampoTexto';
import { Carregando, MensagemErro } from '../../components/Estados';
import { Opcoes } from '../../components/Opcoes';
import { TelaFormulario } from '../../components/TelaFormulario';
import { useAuth } from '../../contexts/AuthContext';
import { chaves, useCategorias, useMeuPerfilPrestador } from '../../hooks/consultas';
import { atualizarMeuPerfilPrestador } from '../../services/contaService';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { PerfilPrestador } from '../../models/usuario';
import { esquemaPerfilProfissional, validar } from '../../validation/esquemas';

/** O prestador monta o perfil que o cliente vê antes de contratar. */
export function PerfilProfissionalScreen() {
  const perfil = useMeuPerfilPrestador(true);

  if (perfil.isLoading) return <Carregando />;
  if (perfil.isError || !perfil.data) {
    return (
      <MensagemErro
        mensagem={mensagemDeErro(perfil.error)}
        aoTentarDeNovo={() => void perfil.refetch()}
      />
    );
  }
  return <Formulario perfil={perfil.data} />;
}

function Formulario({ perfil }: { perfil: PerfilPrestador }) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  const categorias = useCategorias();

  const [categoriaId, setCategoriaId] = useState<number | undefined>(perfil.categoria.id);
  const [descricao, setDescricao] = useState(perfil.descricao ?? '');
  const [regiao, setRegiao] = useState(perfil.regiaoAtendimento ?? '');
  const [disponibilidade, setDisponibilidade] = useState(perfil.disponibilidade ?? '');
  const [erros, setErros] = useState<Record<string, string>>({});

  const salvar = useMutation({
    mutationFn: () =>
      atualizarMeuPerfilPrestador({
        categoriaId: categoriaId!,
        descricao: descricao.trim() || undefined,
        regiaoAtendimento: regiao.trim() || undefined,
        disponibilidade: disponibilidade.trim() || undefined,
        bairro: usuario!.bairro,
        telefone: usuario!.telefone ?? undefined,
      }),
    onSuccess: (atualizado) => {
      queryClient.setQueryData(chaves.meuPerfilPrestador, atualizado);
      queryClient.invalidateQueries({ queryKey: ['prestadores'] });
      Alert.alert('Perfil atualizado!', 'É assim que os clientes vão ver você.');
      navigation.goBack();
    },
  });

  async function aoSalvar() {
    const dados = {
      categoriaId,
      descricao,
      regiaoAtendimento: regiao,
      disponibilidade,
      bairro: usuario?.bairro,
      telefone: usuario?.telefone ?? '',
    };
    const encontrados = await validar(esquemaPerfilProfissional, dados);
    setErros(encontrados);
    if (!Object.keys(encontrados).length) salvar.mutate();
  }

  return (
    <TelaFormulario>
      <Text style={estilos.rotulo}>Serviço que você faz</Text>
      <Opcoes<number>
        opcoes={(categorias.data ?? []).map((c) => ({ valor: c.id, rotulo: c.nome }))}
        selecionado={categoriaId}
        aoSelecionar={setCategoriaId}
      />
      {!!erros.categoriaId && <Text style={estilos.erro}>{erros.categoriaId}</Text>}
      <Text style={estilos.dica}>Você recebe os pedidos desse tipo de serviço.</Text>

      <CampoTexto
        rotulo="Sobre o seu trabalho"
        multiline
        placeholder="Ex.: eletricista há 12 anos, especialista em chuveiros e quadros de luz"
        value={descricao}
        onChangeText={setDescricao}
        maxLength={500}
        erro={erros.descricao}
      />
      <CampoTexto
        rotulo="Região de atendimento"
        placeholder="Ex.: Capão Redondo e bairros próximos"
        value={regiao}
        onChangeText={setRegiao}
        maxLength={200}
        erro={erros.regiaoAtendimento}
      />
      <CampoTexto
        rotulo="Disponibilidade"
        placeholder="Ex.: segunda a sábado, das 8h às 18h"
        value={disponibilidade}
        onChangeText={setDisponibilidade}
        maxLength={200}
        erro={erros.disponibilidade}
      />
      {salvar.isError && <Text style={estilos.erro}>{mensagemDeErro(salvar.error)}</Text>}
      <Botao titulo="Salvar perfil" carregando={salvar.isPending} aoPressionar={aoSalvar} />
    </TelaFormulario>
  );
}

const estilos = StyleSheet.create({
  rotulo: {
    fontFamily: fontes.media,
    fontSize: tamanhos.normal,
    color: cores.texto,
    marginBottom: espacos.sm,
  },
  dica: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginTop: espacos.xs,
    marginBottom: espacos.md,
  },
  erro: {
    fontFamily: fontes.media,
    color: cores.perigo,
    textAlign: 'center',
    marginVertical: espacos.sm,
  },
});
