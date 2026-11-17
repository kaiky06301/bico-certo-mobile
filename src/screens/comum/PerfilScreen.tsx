import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Avatar } from '../../components/Avatar';
import { Cartao } from '../../components/Cartao';
import { ItemMenu } from '../../components/ItemMenu';
import { Selo } from '../../components/Selo';
import { useAuth } from '../../contexts/AuthContext';
import { chaves, useMeuPerfilPrestador, usePreferencias } from '../../hooks/consultas';
import { salvarPreferencias } from '../../services/preferenciasStorage';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';

type Navegacao = { navigate: (rota: string, params?: object) => void };

/**
 * Perfil com seções: Minha conta (os dois perfis), Perfil profissional (só prestador),
 * Minhas avaliações (só cliente) e Configurações.
 */
export function PerfilScreen() {
  const { usuario, sair } = useAuth();
  const navigation = useNavigation<Navegacao>();
  const queryClient = useQueryClient();
  const ehPrestador = usuario?.papel === 'PRESTADOR';
  const perfilPrestador = useMeuPerfilPrestador(ehPrestador);
  const preferencias = usePreferencias();
  const notificacoesLigadas = preferencias.data?.notificacoes ?? true;

  async function alternarNotificacoes(ligar: boolean) {
    await salvarPreferencias({ notificacoes: ligar });
    await queryClient.invalidateQueries({ queryKey: chaves.preferencias });
  }

  function confirmarSaida() {
    Alert.alert('Sair da conta?', 'Você precisará entrar de novo para usar o app.', [
      { text: 'Ficar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void sair() },
    ]);
  }

  if (!usuario) return null;
  const perfil = perfilPrestador.data;

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo}>
      <Cartao estilo={estilos.cabecalho}>
        <Avatar nome={usuario.nome} />
        <View style={estilos.identificacao}>
          <Text style={estilos.nome}>{usuario.nome}</Text>
          <Text style={estilos.email}>{usuario.email}</Text>
          <View style={estilos.selos}>
            <Selo texto={ehPrestador ? 'Prestador' : 'Cliente'} tom="primario" />
            {perfil?.verificado && <Selo texto="Verificado" tom="sucesso" />}
          </View>
          {ehPrestador && perfil && perfil.totalAvaliacoes > 0 && (
            <Text style={estilos.nota}>
              ★ {perfil.notaMedia.toFixed(1).replace('.', ',')} ({perfil.totalAvaliacoes}{' '}
              avaliações)
            </Text>
          )}
        </View>
      </Cartao>

      <Text style={estilos.secao}>Minha conta</Text>
      <Cartao>
        <ItemMenu
          icone="person-outline"
          titulo="Dados pessoais"
          descricao="Nome, telefone, bairro e endereço"
          aoPressionar={() => navigation.navigate('DadosPessoais')}
        />
        <ItemMenu
          icone="lock-closed-outline"
          titulo="Alterar senha"
          aoPressionar={() => navigation.navigate('AlterarSenha')}
        />
        {!ehPrestador && (
          <ItemMenu
            icone="star-outline"
            titulo="Minhas avaliações"
            descricao="Prestadores que você avaliou"
            aoPressionar={() => navigation.navigate('MinhasAvaliacoes')}
          />
        )}
      </Cartao>

      {ehPrestador && (
        <>
          <Text style={estilos.secao}>Perfil profissional</Text>
          <Cartao>
            <ItemMenu
              icone="briefcase-outline"
              titulo="Editar perfil profissional"
              descricao="Serviço, experiência, região e disponibilidade"
              aoPressionar={() => navigation.navigate('PerfilProfissional')}
            />
            <ItemMenu
              icone="eye-outline"
              titulo="Ver como o cliente vê"
              descricao="Seu perfil público e as avaliações recebidas"
              aoPressionar={() => navigation.navigate('PerfilPrestador', { usuarioId: usuario.id })}
            />
            <ItemMenu
              icone={perfil?.verificado ? 'shield-checkmark' : 'shield-outline'}
              titulo={perfil?.verificado ? 'Identidade verificada' : 'Verificação de identidade'}
              descricao={
                perfil?.verificado
                  ? 'Seu perfil mostra o selo "Verificado pelo Bico Certo"'
                  : 'Em análise: a equipe confere seus documentos e libera o selo'
              }
            />
          </Cartao>
        </>
      )}

      <Text style={estilos.secao}>Configurações</Text>
      <Cartao>
        <ItemMenu
          icone="notifications-outline"
          titulo="Notificações"
          descricao={notificacoesLigadas ? 'Avisos novos ligados' : 'Avisos novos desligados'}
          direita={
            <Switch
              accessibilityLabel="Ligar ou desligar notificações"
              value={notificacoesLigadas}
              onValueChange={(valor) => void alternarNotificacoes(valor)}
              trackColor={{ true: cores.primaria, false: cores.borda }}
              thumbColor={cores.branco}
            />
          }
        />
        <ItemMenu
          icone="document-text-outline"
          titulo="Termos de uso"
          aoPressionar={() => navigation.navigate('TextoLegal', { tipo: 'termos' })}
        />
        <ItemMenu
          icone="shield-half-outline"
          titulo="Privacidade"
          descricao="Como usamos seus dados (LGPD)"
          aoPressionar={() => navigation.navigate('TextoLegal', { tipo: 'privacidade' })}
        />
        <ItemMenu
          icone="information-circle-outline"
          titulo="Sobre o app"
          aoPressionar={() => navigation.navigate('Sobre')}
        />
        <ItemMenu
          icone="trash-outline"
          titulo="Excluir conta"
          perigo
          aoPressionar={() => navigation.navigate('ExcluirConta')}
        />
      </Cartao>

      <Cartao estilo={estilos.cartaoSair}>
        <ItemMenu
          icone="log-out-outline"
          titulo="Sair da conta"
          perigo
          aoPressionar={confirmarSaida}
        />
      </Cartao>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacos.md, paddingBottom: espacos.xl * 2 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: espacos.md },
  identificacao: { flex: 1, gap: 2 },
  nome: { fontFamily: fontes.seminegrito, fontSize: tamanhos.grande, color: cores.texto },
  email: { fontFamily: fontes.regular, fontSize: tamanhos.pequeno, color: cores.textoSuave },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.xs, marginTop: espacos.xs },
  nota: { fontFamily: fontes.media, fontSize: tamanhos.pequeno, color: cores.alerta, marginTop: 2 },
  secao: {
    fontFamily: fontes.seminegrito,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
    textTransform: 'uppercase',
    marginTop: espacos.lg,
    marginBottom: espacos.sm,
  },
  cartaoSair: { marginTop: espacos.lg },
});
