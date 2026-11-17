import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Avatar } from '../../components/Avatar';
import { Botao } from '../../components/Botao';
import { CampoTexto } from '../../components/CampoTexto';
import { Cartao } from '../../components/Cartao';
import { Carregando, MensagemErro } from '../../components/Estados';
import { GaleriaTrabalhos } from '../../components/GaleriaTrabalhos';
import { OpcoesMultiplas } from '../../components/OpcoesMultiplas';
import { TelaFormulario } from '../../components/TelaFormulario';
import { useAuth } from '../../contexts/AuthContext';
import { chaves, useCategorias, useMeuPerfilPrestador } from '../../hooks/consultas';
import { DiaSemana, PerfilPrestador } from '../../models/usuario';
import { PrestadorStackParams } from '../../navigation/tipos';
import { atualizarMeuPerfilPrestador, definirFotoDePerfil } from '../../services/contaService';
import { cores } from '../../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { textoServicos } from '../../utils/formatacao';
import { escolherFotos, OrigemFoto } from '../../utils/fotos';
import {
  ATALHOS_DIAS,
  BAIRROS,
  bairrosDaRegiao,
  DIAS,
  moverHora,
  textoDisponibilidade,
} from '../../utils/perfilProfissional';
import { esquemaPerfilProfissional, validar } from '../../validation/esquemas';

type Navegacao = NativeStackNavigationProp<PrestadorStackParams>;

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

/** Estado do formulário a partir do perfil salvo (usado também para saber se algo mudou). */
function valoresIniciais(perfil: PerfilPrestador, bairroDoUsuario?: string) {
  const bairros = bairrosDaRegiao(perfil.regiaoAtendimento);
  return {
    categorias: [perfil.categoria.id, ...(perfil.outrasCategorias ?? []).map((c) => c.id)],
    anos: perfil.anosExperiencia,
    especialidades: perfil.especialidades ?? '',
    diferenciais: perfil.diferenciais ?? '',
    descricao: perfil.descricao ?? '',
    bairros: bairros.length ? bairros : bairrosDaRegiao(bairroDoUsuario),
    dias: perfil.diasAtendimento ?? [],
    inicio: perfil.horarioInicio ?? '08:00',
    fim: perfil.horarioFim ?? '18:00',
    emergencia: perfil.atendeEmergencia ?? false,
  };
}

function Formulario({ perfil }: { perfil: PerfilPrestador }) {
  const navigation = useNavigation<Navegacao>();
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  const categorias = useCategorias();

  const [inicial] = useState(() => valoresIniciais(perfil, usuario?.bairro));
  const [categoriaIds, setCategoriaIds] = useState<number[]>(inicial.categorias);
  const [anos, setAnos] = useState<number | null>(inicial.anos);
  const [especialidades, setEspecialidades] = useState(inicial.especialidades);
  const [diferenciais, setDiferenciais] = useState(inicial.diferenciais);
  const [descricao, setDescricao] = useState(inicial.descricao);
  const [bairros, setBairros] = useState<string[]>(inicial.bairros);
  const [dias, setDias] = useState<DiaSemana[]>(inicial.dias);
  const [inicio, setInicio] = useState(inicial.inicio);
  const [fim, setFim] = useState(inicial.fim);
  const [emergencia, setEmergencia] = useState(inicial.emergencia);
  const [erros, setErros] = useState<Record<string, string>>({});

  const atual = {
    categorias: categoriaIds,
    anos,
    especialidades,
    diferenciais,
    descricao,
    bairros,
    dias,
    inicio,
    fim,
    emergencia,
  };
  const alterado = JSON.stringify(atual) !== JSON.stringify(inicial);

  const salvar = useMutation({
    mutationFn: () =>
      atualizarMeuPerfilPrestador({
        categoriaId: categoriaIds[0],
        outrasCategoriaIds: categoriaIds.slice(1),
        descricao: descricao.trim() || undefined,
        anosExperiencia: anos ?? undefined,
        especialidades: especialidades.trim() || undefined,
        diferenciais: diferenciais.trim() || undefined,
        regiaoAtendimento: bairros.join(', '),
        diasAtendimento: DIAS.map((d) => d.valor).filter((d) => dias.includes(d)),
        horarioInicio: inicio,
        horarioFim: fim,
        atendeEmergencia: emergencia,
        disponibilidade: textoDisponibilidade(dias, inicio, fim),
        bairro: usuario!.bairro,
        telefone: usuario!.telefone ?? undefined,
      }),
    onSuccess: (atualizado) => {
      queryClient.setQueryData(chaves.meuPerfilPrestador, atualizado);
      void queryClient.invalidateQueries({ queryKey: ['prestadores'] });
      void queryClient.invalidateQueries({ queryKey: ['solicitacoes'] });
      Alert.alert('Perfil atualizado!', 'É assim que os clientes vão ver você.');
      navigation.goBack();
    },
  });

  const foto = useMutation({
    mutationFn: async (acao: OrigemFoto | 'remover') => {
      if (acao === 'remover') return definirFotoDePerfil(null);
      const [escolhida] = await escolherFotos(acao, { quadrada: true });
      return escolhida ? definirFotoDePerfil(escolhida.dados) : null;
    },
    onSuccess: (atualizado) => {
      if (!atualizado) return;
      queryClient.setQueryData(chaves.meuPerfilPrestador, atualizado);
      void queryClient.invalidateQueries({ queryKey: ['prestadores', 'usuario'] });
    },
    onError: (erro) => Alert.alert('Não foi possível trocar a foto', mensagemDeErro(erro)),
  });

  function trocarFoto() {
    Alert.alert('Foto de perfil', 'Uma foto do rosto passa mais confiança para o cliente.', [
      { text: 'Tirar foto', onPress: () => foto.mutate('camera') },
      { text: 'Escolher da galeria', onPress: () => foto.mutate('galeria') },
      ...(perfil.foto
        ? [
            {
              text: 'Remover foto',
              style: 'destructive' as const,
              onPress: () => foto.mutate('remover'),
            },
          ]
        : []),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  }

  async function aoSalvar() {
    const encontrados = await validar(esquemaPerfilProfissional, {
      categorias: categoriaIds,
      descricao,
      especialidades,
      diferenciais,
      bairros,
      dias,
      horarioInicio: inicio,
      horarioFim: fim,
      bairro: usuario?.bairro,
      telefone: usuario?.telefone ?? '',
    });
    setErros(encontrados);
    if (Object.keys(encontrados).length) {
      Alert.alert('Confira o perfil', Object.values(encontrados)[0]);
      return;
    }
    salvar.mutate();
  }

  return (
    <TelaFormulario>
      {/* 1. Quem é o prestador: o que o cliente vê primeiro */}
      <Cartao estilo={estilos.cabecalho}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Trocar foto de perfil"
          onPress={trocarFoto}
          disabled={foto.isPending}
        >
          <Avatar nome={perfil.nome} foto={perfil.foto} tamanho={84} />
          <View style={estilos.camera}>
            {foto.isPending ? (
              <ActivityIndicator size="small" color={cores.branco} />
            ) : (
              <Ionicons name="camera" size={16} color={cores.branco} />
            )}
          </View>
        </Pressable>
        <View style={estilos.identificacao}>
          <Text style={estilos.nome}>{perfil.nome}</Text>
          <Text style={estilos.nota}>
            {perfil.totalAvaliacoes > 0
              ? `★ ${perfil.notaMedia.toFixed(1).replace('.', ',')} (${perfil.totalAvaliacoes} ${
                  perfil.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'
                })`
              : 'Ainda sem avaliações'}
          </Text>
          <Text style={estilos.suave}>{textoServicos(perfil.servicosConcluidos)}</Text>
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => navigation.navigate('PerfilPrestador', { usuarioId: perfil.usuarioId })}
          >
            <Text style={estilos.link}>Ver como o cliente vê ›</Text>
          </Pressable>
        </View>
      </Cartao>
      {!perfil.foto && (
        <Text style={estilos.dica}>
          Toque no círculo para colocar sua foto. O nome é alterado em Perfil › Dados pessoais.
        </Text>
      )}

      <Secao titulo="Serviços que você faz" icone="construct-outline">
        <OpcoesMultiplas<number>
          opcoes={(categorias.data ?? []).map((c) => ({ valor: c.id, rotulo: c.nome }))}
          selecionados={categoriaIds}
          aoMudar={setCategoriaIds}
          destacarPrimeiro
        />
        <Erro texto={erros.categorias} />
        <Text style={estilos.dica}>
          Marque todos os serviços que você faz. O primeiro marcado é o principal; você recebe os
          pedidos de todos eles.
        </Text>
      </Secao>

      <Secao titulo="Experiência" icone="ribbon-outline">
        <Text style={estilos.rotulo}>Tempo de experiência</Text>
        <Contador
          rotulo={
            anos == null
              ? 'Não informado'
              : anos === 0
                ? 'Menos de 1 ano'
                : `${anos} ${anos === 1 ? 'ano' : 'anos'}`
          }
          aoDiminuir={() => setAnos((a) => (a == null || a === 0 ? null : a - 1))}
          aoAumentar={() => setAnos((a) => Math.min(60, a == null ? 0 : a + 1))}
          descricao="anos de experiência"
        />
        <CampoTexto
          rotulo="Especialidades"
          placeholder="Ex.: chuveiros, quadros de luz, tomadas"
          value={especialidades}
          onChangeText={setEspecialidades}
          maxLength={200}
          contador
          erro={erros.especialidades}
        />
        <CampoTexto
          rotulo="Diferenciais"
          placeholder="Ex.: garantia de 90 dias, levo o material, atendo no mesmo dia"
          value={diferenciais}
          onChangeText={setDiferenciais}
          maxLength={300}
          multiline
          contador
          erro={erros.diferenciais}
        />
        <CampoTexto
          rotulo="Sobre o seu trabalho"
          multiline
          placeholder="Conte como você trabalha e há quanto tempo atende o bairro"
          value={descricao}
          onChangeText={setDescricao}
          maxLength={500}
          contador
          erro={erros.descricao}
        />
      </Secao>

      <Secao titulo="Região de atendimento" icone="map-outline">
        <Text style={estilos.dica}>Toque nos bairros onde você atende.</Text>
        <OpcoesMultiplas<string>
          opcoes={BAIRROS.map((b) => ({ valor: b, rotulo: b }))}
          selecionados={bairros}
          aoMudar={setBairros}
        />
        <Erro texto={erros.bairros} />
      </Secao>

      <Secao titulo="Disponibilidade" icone="time-outline">
        <View style={estilos.atalhos}>
          {ATALHOS_DIAS.map((atalho) => (
            <Pressable
              key={atalho.rotulo}
              accessibilityRole="button"
              onPress={() => setDias(atalho.dias)}
              style={({ pressed }) => [estilos.atalho, pressed && { opacity: 0.6 }]}
            >
              <Text style={estilos.atalhoTexto}>{atalho.rotulo}</Text>
            </Pressable>
          ))}
        </View>
        <OpcoesMultiplas<DiaSemana>
          opcoes={DIAS.map((d) => ({ valor: d.valor, rotulo: d.curto }))}
          selecionados={dias}
          aoMudar={setDias}
        />
        <Erro texto={erros.dias} />

        <View style={estilos.horarios}>
          <View style={estilos.horario}>
            <Text style={estilos.rotulo}>Começa às</Text>
            <Contador
              rotulo={inicio}
              descricao="horário de início"
              aoDiminuir={() => setInicio((h) => moverHora(h, -1))}
              aoAumentar={() => setInicio((h) => (moverHora(h, 1) < fim ? moverHora(h, 1) : h))}
            />
          </View>
          <View style={estilos.horario}>
            <Text style={estilos.rotulo}>Termina às</Text>
            <Contador
              rotulo={fim}
              descricao="horário de término"
              aoDiminuir={() => setFim((h) => (moverHora(h, -1) > inicio ? moverHora(h, -1) : h))}
              aoAumentar={() => setFim((h) => moverHora(h, 1))}
            />
          </View>
        </View>
        <Erro texto={erros.horarioFim} />
        {dias.length > 0 && (
          <Text style={estilos.resumo}>
            O cliente vê: {textoDisponibilidade(dias, inicio, fim)}
          </Text>
        )}

        <View style={estilos.emergencia}>
          <View style={estilos.emergenciaTextos}>
            <Text style={estilos.rotulo}>Atende emergências</Text>
            <Text style={estilos.suave}>Aparece um selo no seu perfil.</Text>
          </View>
          <Switch
            accessibilityLabel="Atende emergências"
            value={emergencia}
            onValueChange={setEmergencia}
            trackColor={{ true: cores.primaria, false: cores.borda }}
            thumbColor={cores.branco}
          />
        </View>
      </Secao>

      <Secao titulo="Trabalhos realizados" icone="images-outline">
        <GaleriaTrabalhos prestadorId={perfil.id} quantidade={perfil.quantidadeFotos} editavel />
      </Secao>

      {salvar.isError && <Text style={estilos.erro}>{mensagemDeErro(salvar.error)}</Text>}
      {alterado && <Text style={estilos.pendente}>Você tem alterações não salvas.</Text>}
      <Botao titulo="Salvar perfil" carregando={salvar.isPending} aoPressionar={aoSalvar} />
    </TelaFormulario>
  );
}

function Secao({
  titulo,
  icone,
  children,
}: {
  titulo: string;
  icone: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
}) {
  return (
    <View style={estilos.secao}>
      <View style={estilos.secaoTitulo}>
        <Ionicons name={icone} size={18} color={cores.secundaria} />
        <Text accessibilityRole="header" style={estilos.secaoTexto}>
          {titulo}
        </Text>
      </View>
      {children}
    </View>
  );
}

function Erro({ texto }: { texto?: string }) {
  return texto ? <Text style={estilos.erroCampo}>{texto}</Text> : null;
}

/** Botões − e + em volta de um valor (anos de experiência, horários). */
function Contador({
  rotulo,
  descricao,
  aoDiminuir,
  aoAumentar,
}: {
  rotulo: string;
  descricao: string;
  aoDiminuir: () => void;
  aoAumentar: () => void;
}) {
  return (
    <View style={estilos.contador}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Diminuir ${descricao}`}
        onPress={aoDiminuir}
        style={({ pressed }) => [estilos.contadorBotao, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="remove" size={20} color={cores.secundaria} />
      </Pressable>
      <Text style={estilos.contadorValor} accessibilityLiveRegion="polite">
        {rotulo}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Aumentar ${descricao}`}
        onPress={aoAumentar}
        style={({ pressed }) => [estilos.contadorBotao, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="add" size={20} color={cores.secundaria} />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: espacos.md },
  camera: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: cores.secundaria,
    borderWidth: 2,
    borderColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identificacao: { flex: 1, gap: 2 },
  nome: { fontFamily: fontes.seminegrito, fontSize: tamanhos.grande, color: cores.texto },
  nota: { fontFamily: fontes.media, fontSize: tamanhos.normal, color: cores.alerta },
  suave: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.textoSuave },
  link: {
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.normal,
    color: cores.primariaEscura,
    marginTop: espacos.xs,
  },
  secao: {
    marginTop: espacos.lg,
    paddingTop: espacos.md,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  secaoTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.sm,
    marginBottom: espacos.sm,
  },
  secaoTexto: { fontFamily: fontes.seminegrito, fontSize: tamanhos.medio, color: cores.texto },
  rotulo: {
    fontFamily: fontes.media,
    fontSize: tamanhos.normal,
    color: cores.texto,
    marginBottom: espacos.xs,
  },
  dica: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.textoSuave,
    marginTop: espacos.xs,
    marginBottom: espacos.sm,
  },
  contador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.sm,
    marginBottom: espacos.md,
  },
  contadorBotao: {
    width: 44,
    height: 44,
    borderRadius: raio.medio,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorValor: {
    minWidth: 60,
    textAlign: 'center',
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.medio,
    color: cores.texto,
  },
  atalhos: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.sm, marginBottom: espacos.sm },
  atalho: {
    paddingHorizontal: espacos.md,
    paddingVertical: 6,
    borderRadius: raio.grande,
    backgroundColor: cores.secundariaClara,
  },
  atalhoTexto: { fontFamily: fontes.media, fontSize: tamanhos.pequeno, color: cores.secundaria },
  horarios: { flexDirection: 'row', gap: espacos.md, marginTop: espacos.sm },
  horario: { flex: 1 },
  resumo: {
    fontFamily: fontes.media,
    fontSize: tamanhos.pequeno,
    color: cores.secundaria,
    marginBottom: espacos.md,
  },
  emergencia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacos.md,
  },
  emergenciaTextos: { flex: 1 },
  erroCampo: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.perigo,
    marginBottom: espacos.sm,
  },
  erro: {
    fontFamily: fontes.media,
    color: cores.perigo,
    textAlign: 'center',
    marginVertical: espacos.sm,
  },
  pendente: {
    fontFamily: fontes.media,
    fontSize: tamanhos.pequeno,
    color: cores.alerta,
    textAlign: 'center',
    marginTop: espacos.lg,
    marginBottom: espacos.sm,
  },
});
