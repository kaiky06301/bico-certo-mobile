import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../../components/Avatar';
import { Cartao } from '../../components/Cartao';
import { CartaoAvaliacao } from '../../components/CartaoAvaliacao';
import { Carregando, MensagemErro } from '../../components/Estados';
import { GaleriaTrabalhos } from '../../components/GaleriaTrabalhos';
import { Selo } from '../../components/Selo';
import { Subtitulo, Titulo } from '../../components/Titulo';
import { useAvaliacoesPrestador, usePerfilPrestador } from '../../hooks/consultas';
import { cores } from '../../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { formatarData } from '../../utils/formatacao';
import {
  disponibilidadeDoPerfil,
  servicosDoPerfil,
  textoExperiencia,
} from '../../utils/perfilProfissional';

/**
 * Perfil público do prestador: o cliente abre pelo orçamento antes de contratar
 * (e o próprio prestador abre em "Ver como o cliente vê").
 */
export function PerfilPrestadorScreen() {
  const route = useRoute();
  const { usuarioId } = route.params as { usuarioId: number };
  const perfil = usePerfilPrestador(usuarioId);
  const avaliacoes = useAvaliacoesPrestador(perfil.data?.id);

  if (perfil.isLoading) return <Carregando />;
  if (perfil.isError || !perfil.data) {
    return (
      <MensagemErro
        mensagem={mensagemDeErro(perfil.error)}
        aoTentarDeNovo={() => void perfil.refetch()}
      />
    );
  }

  const p = perfil.data;
  const lista = avaliacoes.data?.conteudo ?? [];

  return (
    <ScrollView
      style={estilos.tela}
      contentContainerStyle={estilos.conteudo}
      refreshControl={
        <RefreshControl
          refreshing={perfil.isRefetching}
          onRefresh={() => {
            void perfil.refetch();
            void avaliacoes.refetch();
          }}
          tintColor={cores.primaria}
        />
      }
    >
      <Cartao estilo={estilos.cabecalho}>
        <Avatar nome={p.nome} foto={p.foto} tamanho={80} />
        <View style={estilos.identificacao}>
          <Text style={estilos.nome}>{p.nome}</Text>
          <Text style={estilos.categoria}>{servicosDoPerfil(p)}</Text>
          {!!textoExperiencia(p.anosExperiencia) && (
            <Text style={estilos.categoria}>{textoExperiencia(p.anosExperiencia)}</Text>
          )}
          <Text style={estilos.nota}>
            {p.totalAvaliacoes > 0
              ? `★ ${p.notaMedia.toFixed(1).replace('.', ',')} (${p.totalAvaliacoes} avaliações)`
              : 'Ainda sem avaliações'}
          </Text>
          {p.verificado ? (
            <Selo texto="Verificado pelo Bico Certo" tom="sucesso" />
          ) : (
            <Selo texto="Identidade em análise" tom="neutro" />
          )}
          {p.atendeEmergencia && <Selo texto="Atende emergências" tom="alerta" />}
        </View>
      </Cartao>

      <View style={estilos.numeros}>
        <Numero
          valor={String(p.servicosConcluidos ?? 0)}
          rotulo={p.servicosConcluidos === 1 ? 'serviço feito' : 'serviços feitos'}
        />
        <Numero
          valor={p.totalAvaliacoes > 0 ? `★ ${p.notaMedia.toFixed(1).replace('.', ',')}` : '–'}
          rotulo="nota média"
        />
        <Numero
          valor={String(p.totalAvaliacoes)}
          rotulo={p.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}
        />
      </View>

      <Cartao estilo={estilos.detalhes}>
        <Info
          icone="construct-outline"
          titulo={p.outrasCategorias?.length ? 'Serviços' : 'Serviço'}
          texto={servicosDoPerfil(p)}
        />
        {!!p.especialidades && (
          <Info icone="build-outline" titulo="Especialidades" texto={p.especialidades} />
        )}
        {!!p.diferenciais && (
          <Info icone="ribbon-outline" titulo="Diferenciais" texto={p.diferenciais} />
        )}
        <Info
          icone="chatbox-ellipses-outline"
          titulo="Sobre o trabalho"
          texto={p.descricao || 'O prestador ainda não escreveu sobre a experiência dele.'}
        />
        <Info
          icone="map-outline"
          titulo="Região de atendimento"
          texto={p.regiaoAtendimento || p.bairro}
        />
        <Info
          icone="time-outline"
          titulo="Disponibilidade"
          texto={
            disponibilidadeDoPerfil(p) +
            (p.atendeEmergencia ? '\nAtende emergências fora desse horário' : '')
          }
        />
        <Info
          icone="calendar-outline"
          titulo="No Bico Certo desde"
          texto={formatarData(p.membroDesde)}
        />
      </Cartao>

      {p.quantidadeFotos > 0 && (
        <>
          <Titulo>Trabalhos realizados</Titulo>
          <GaleriaTrabalhos prestadorId={p.id} quantidade={p.quantidadeFotos} />
        </>
      )}

      <Titulo>Avaliações recebidas</Titulo>
      {avaliacoes.isLoading && <Subtitulo>Carregando avaliações...</Subtitulo>}
      {!avaliacoes.isLoading && lista.length === 0 && (
        <Subtitulo>Quando um cliente avaliar o serviço, a avaliação aparece aqui.</Subtitulo>
      )}
      {lista.map((avaliacao) => (
        <CartaoAvaliacao
          key={avaliacao.id}
          avaliacao={avaliacao}
          titulo={`${avaliacao.cliente} · ${avaliacao.servico}`}
        />
      ))}
    </ScrollView>
  );
}

function Info({
  icone,
  titulo,
  texto,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  texto: string;
}) {
  return (
    <View style={estilos.info}>
      <View style={estilos.icone}>
        <Ionicons name={icone} size={18} color={cores.secundaria} />
      </View>
      <View style={estilos.infoTextos}>
        <Text style={estilos.infoTitulo}>{titulo}</Text>
        <Text style={estilos.infoTexto}>{texto}</Text>
      </View>
    </View>
  );
}

function Numero({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <View style={estilos.numero} accessible accessibilityLabel={`${valor} ${rotulo}`}>
      <Text style={estilos.numeroValor}>{valor}</Text>
      <Text style={estilos.numeroRotulo}>{rotulo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.md, paddingBottom: espacos.xl * 2 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: espacos.md },
  identificacao: { flex: 1, gap: 4, alignItems: 'flex-start' },
  nome: { fontFamily: fontes.seminegrito, fontSize: tamanhos.grande, color: cores.texto },
  categoria: { fontFamily: fontes.regular, fontSize: tamanhos.normal, color: cores.textoSuave },
  nota: { fontFamily: fontes.media, fontSize: tamanhos.normal, color: cores.alerta },
  detalhes: { marginTop: espacos.md, gap: espacos.md },
  numeros: { flexDirection: 'row', gap: espacos.sm, marginTop: espacos.md },
  numero: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: espacos.md,
    backgroundColor: cores.superficie,
    borderRadius: raio.medio,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  numeroValor: { fontFamily: fontes.negrito, fontSize: tamanhos.grande, color: cores.texto },
  numeroRotulo: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.textoSuave },
  info: { flexDirection: 'row', gap: espacos.sm },
  icone: {
    width: 32,
    height: 32,
    borderRadius: raio.pequeno,
    backgroundColor: cores.secundariaClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextos: { flex: 1 },
  infoTitulo: { fontFamily: fontes.seminegrito, fontSize: tamanhos.normal, color: cores.texto },
  infoTexto: { fontFamily: fontes.regular, fontSize: tamanhos.normal, color: cores.textoSuave },
});
