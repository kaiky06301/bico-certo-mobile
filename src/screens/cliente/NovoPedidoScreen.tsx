import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Botao } from '../../components/Botao';
import { CampoTexto } from '../../components/CampoTexto';
import { Cartao } from '../../components/Cartao';
import { CartaoTriagem } from '../../components/CartaoTriagem';
import { FotoEscolhida, FotosProblema } from '../../components/FotosProblema';
import { SeletorEndereco } from '../../components/SeletorEndereco';
import { TelaFormulario } from '../../components/TelaFormulario';
import { useAuth } from '../../contexts/AuthContext';
import { chaves, useEnderecos } from '../../hooks/consultas';
import { Triagem } from '../../models/solicitacao';
import { ClienteAbasParams, ClienteStackParams } from '../../navigation/tipos';
import { criarSolicitacao, simularTriagem } from '../../services/solicitacaoService';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { esquemaPedido, validar } from '../../validation/esquemas';

type Props = CompositeScreenProps<
  BottomTabScreenProps<ClienteAbasParams, 'NovoPedido'>,
  NativeStackScreenProps<ClienteStackParams>
>;

const LIMITE_DESCRICAO = 1000;
const LIMITE_OBSERVACAO = 500;

/**
 * Passo 1: o morador descreve o problema (com fotos e observação opcionais) e escolhe o local.
 * Passo 2: confere o que a IA entendeu e só então publica o pedido para os prestadores.
 */
export function NovoPedidoScreen({ navigation }: Props) {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const [descricao, setDescricao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [fotos, setFotos] = useState<FotoEscolhida[]>([]);
  const [bairro, setBairro] = useState(usuario?.bairro ?? '');
  const enderecos = useEnderecos();
  const listaEnderecos = enderecos.data ?? [];
  const [enderecoEscolhido, setEnderecoEscolhido] = useState<number>();
  // sem escolha manual, vale o endereco principal
  const enderecoId = enderecoEscolhido ?? listaEnderecos.find((e) => e.principal)?.id;
  const endereco = listaEnderecos.find((e) => e.id === enderecoId);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [triagem, setTriagem] = useState<Triagem | null>(null);

  const analisar = useMutation({ mutationFn: simularTriagem, onSuccess: setTriagem });

  const publicar = useMutation({
    mutationFn: criarSolicitacao,
    onSuccess: (pedido) => {
      queryClient.invalidateQueries({ queryKey: chaves.minhasSolicitacoes });
      setDescricao('');
      setObservacao('');
      setFotos([]);
      setTriagem(null);
      navigation.navigate('DetalhePedido', { id: pedido.id });
    },
  });

  async function aoAnalisar() {
    const encontrados = await validar(esquemaPedido, { descricao, observacao });
    setErros(encontrados);
    if (Object.keys(encontrados).length) return;
    analisar.mutate({ descricao: descricao.trim(), observacao: observacao.trim() || undefined });
  }

  function aoPublicar() {
    const base = {
      descricao: descricao.trim(),
      observacao: observacao.trim() || undefined,
      fotos: fotos.length ? fotos.map((f) => f.dados) : undefined,
    };
    publicar.mutate(enderecoId ? { ...base, enderecoId } : { ...base, bairro: bairro.trim() });
  }

  // ---------- passo 2: análise da IA antes de publicar ----------
  if (triagem) {
    return (
      <TelaFormulario key="analise">
        <Text style={estilos.titulo}>Confira a análise</Text>
        <Text style={estilos.subtitulo}>
          Veja se entendemos bem o seu problema antes de avisar os prestadores.
        </Text>

        {triagem.origem !== 'IA' && (
          <View style={estilos.aviso}>
            <Ionicons name="information-circle-outline" size={20} color={cores.alerta} />
            <Text style={estilos.avisoTexto}>
              A inteligência artificial não conseguiu analisar agora, então usamos uma análise
              automática. Confira se o tipo de serviço está certo; se não estiver, edite a descrição
              com mais detalhes.
            </Text>
          </View>
        )}

        <CartaoTriagem
          categoria={triagem.categoria.nome}
          urgencia={triagem.urgencia}
          precoMinimo={triagem.precoMinimo}
          precoMaximo={triagem.precoMaximo}
          resumo={triagem.resumo}
          dicaSeguranca={triagem.dicaSeguranca}
          origem={triagem.origem}
          prestadoresDisponiveis={triagem.prestadoresDisponiveis}
        />

        <Cartao estilo={estilos.resumoPedido}>
          <Text style={estilos.secao}>SEU PEDIDO</Text>
          <Text style={estilos.textoPedido}>{descricao.trim()}</Text>
          {!!observacao.trim() && (
            <Text style={estilos.textoSuave}>
              <Text style={estilos.negrito}>Informação adicional: </Text>
              {observacao.trim()}
            </Text>
          )}
          {fotos.length > 0 && (
            <View style={estilos.miniaturas}>
              {fotos.map((f, i) => (
                <Image
                  key={f.uri}
                  source={{ uri: f.uri }}
                  style={estilos.miniatura}
                  accessibilityLabel={`Foto ${i + 1}`}
                />
              ))}
            </View>
          )}
          <View style={estilos.local}>
            <Ionicons name="location-outline" size={16} color={cores.textoSuave} />
            <Text style={estilos.textoSuave}>
              {endereco ? `${endereco.apelido} · ${endereco.bairro}` : bairro || usuario?.bairro}
            </Text>
          </View>
          <Text style={estilos.privacidade}>
            Os prestadores veem só o bairro. A rua e o número aparecem para quem você contratar.
          </Text>
        </Cartao>

        {publicar.isError && <Text style={estilos.erro}>{mensagemDeErro(publicar.error)}</Text>}
        <Botao
          titulo="Confirmar e publicar pedido"
          aoPressionar={aoPublicar}
          carregando={publicar.isPending}
        />
        <Botao
          titulo="Editar pedido"
          variante="contorno"
          aoPressionar={() => setTriagem(null)}
          estilo={estilos.botaoSecundario}
        />
      </TelaFormulario>
    );
  }

  // ---------- passo 1: descrever o problema ----------
  return (
    <TelaFormulario key="formulario">
      <Text style={estilos.ola}>Olá, {usuario?.nome.split(' ')[0]}!</Text>
      <Text style={estilos.titulo}>O que precisa de conserto?</Text>
      <Text style={estilos.subtitulo}>
        Conte com suas palavras. A gente identifica o tipo de serviço, a urgência e quanto é justo
        pagar.
      </Text>

      <CampoTexto
        rotulo="Descreva o problema"
        multiline
        placeholder="Ex.: a tomada da cozinha está soltando faísca quando ligo a geladeira"
        value={descricao}
        onChangeText={setDescricao}
        erro={erros.descricao}
        maxLength={LIMITE_DESCRICAO}
        style={estilos.semMargem}
      />
      <Text style={estilos.contador}>
        {descricao.length}/{LIMITE_DESCRICAO}
      </Text>

      <FotosProblema fotos={fotos} aoMudar={setFotos} />

      <CampoTexto
        rotulo="Tem alguma informação adicional que possa ajudar? (opcional)"
        multiline
        placeholder="Ex.: acontece só quando chove; o prédio é antigo; tem cachorro em casa"
        value={observacao}
        onChangeText={setObservacao}
        erro={erros.observacao}
        maxLength={LIMITE_OBSERVACAO}
      />

      {listaEnderecos.length > 0 ? (
        <SeletorEndereco
          enderecos={listaEnderecos}
          selecionado={enderecoId}
          aoSelecionar={setEnderecoEscolhido}
          aoAdicionar={() => navigation.navigate('EnderecoForm', {})}
        />
      ) : (
        <>
          <CampoTexto rotulo="Bairro do serviço" value={bairro} onChangeText={setBairro} />
          <Text
            accessibilityRole="button"
            style={estilos.salvarEndereco}
            onPress={() => navigation.navigate('EnderecoForm', {})}
          >
            Salvar um endereço completo (casa, trabalho, casa dos pais...)
          </Text>
        </>
      )}

      <Botao
        titulo="Analisar meu problema"
        aoPressionar={aoAnalisar}
        carregando={analisar.isPending}
      />
      {analisar.isPending && (
        <Text style={estilos.aguarde}>
          Analisando o problema... isso pode levar alguns segundos.
        </Text>
      )}
      {analisar.isError && <Text style={estilos.erro}>{mensagemDeErro(analisar.error)}</Text>}
    </TelaFormulario>
  );
}

const estilos = StyleSheet.create({
  ola: { fontFamily: fontes.media, fontSize: tamanhos.medio, color: cores.primaria },
  titulo: { fontFamily: fontes.negrito, fontSize: tamanhos.titulo, color: cores.texto },
  subtitulo: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
    marginBottom: espacos.lg,
  },
  salvarEndereco: {
    fontFamily: fontes.media,
    fontSize: tamanhos.pequeno,
    color: cores.secundaria,
    textDecorationLine: 'underline',
    marginTop: -espacos.sm,
    marginBottom: espacos.md,
    paddingVertical: espacos.xs,
  },
  aguarde: {
    fontFamily: fontes.regular,
    color: cores.textoSuave,
    textAlign: 'center',
    marginTop: espacos.sm,
  },
  erro: {
    fontFamily: fontes.media,
    color: cores.perigo,
    textAlign: 'center',
    marginVertical: espacos.sm,
  },
  botaoSecundario: { marginTop: espacos.sm },
  semMargem: { marginBottom: 0 },
  contador: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    textAlign: 'right',
    marginTop: -espacos.sm,
    marginBottom: espacos.md,
  },
  aviso: {
    flexDirection: 'row',
    gap: espacos.sm,
    backgroundColor: cores.alertaClaro,
    borderRadius: 12,
    padding: espacos.md,
    marginBottom: espacos.md,
  },
  avisoTexto: {
    flex: 1,
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.texto,
  },
  resumoPedido: { marginVertical: espacos.md },
  secao: {
    fontFamily: fontes.media,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    letterSpacing: 0.5,
    marginBottom: espacos.xs,
  },
  textoPedido: { fontFamily: fontes.regular, fontSize: tamanhos.normal, color: cores.texto },
  textoSuave: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
    marginTop: espacos.xs,
  },
  negrito: { fontFamily: fontes.seminegrito, color: cores.texto },
  miniaturas: { flexDirection: 'row', gap: espacos.sm, marginTop: espacos.sm },
  miniatura: { width: 72, height: 72, borderRadius: 10, backgroundColor: cores.borda },
  local: { flexDirection: 'row', alignItems: 'center', gap: espacos.xs, marginTop: espacos.sm },
  privacidade: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginTop: espacos.xs,
  },
});
