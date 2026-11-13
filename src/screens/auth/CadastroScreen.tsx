import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Botao } from '../../components/Botao';
import { CampoTexto } from '../../components/CampoTexto';
import { Opcoes } from '../../components/Opcoes';
import { TelaFormulario } from '../../components/TelaFormulario';
import { useAuth } from '../../contexts/AuthContext';
import { useCategorias } from '../../hooks/consultas';
import { cores } from '../../theme/cores';
import { espacos, fontes, tamanhos } from '../../theme/tipografia';
import { mensagemDeErro } from '../../utils/erros';
import { esquemaCadastro, validar } from '../../validation/esquemas';

type TipoConta = 'CLIENTE' | 'PRESTADOR';

export function CadastroScreen() {
  const { cadastrar } = useAuth();
  const categorias = useCategorias();
  const [papel, setPapel] = useState<TipoConta>('CLIENTE');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [bairro, setBairro] = useState('');
  const [categoriaId, setCategoriaId] = useState<number>();
  const [descricao, setDescricao] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function aoCadastrar() {
    setErroGeral('');
    const dados = {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha,
      telefone: telefone.trim() || undefined,
      bairro: bairro.trim(),
      papel,
      categoriaId: papel === 'PRESTADOR' ? categoriaId : undefined,
      descricaoServicos: papel === 'PRESTADOR' ? descricao.trim() || undefined : undefined,
    };
    const encontrados = await validar(esquemaCadastro, dados);
    setErros(encontrados);
    if (Object.keys(encontrados).length) return;

    setEnviando(true);
    try {
      await cadastrar(dados);
    } catch (erro) {
      setErroGeral(mensagemDeErro(erro));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TelaFormulario>
      <Text style={estilos.titulo}>Crie sua conta</Text>
      <Text style={estilos.subtitulo}>
        Voce quer contratar um servico ou oferecer o seu trabalho?
      </Text>

      <Opcoes<TipoConta>
        opcoes={[
          { valor: 'CLIENTE', rotulo: 'Preciso de um servico' },
          { valor: 'PRESTADOR', rotulo: 'Sou prestador' },
        ]}
        selecionado={papel}
        aoSelecionar={setPapel}
      />

      <CampoTexto rotulo="Nome completo" value={nome} onChangeText={setNome} erro={erros.nome} />
      <CampoTexto
        rotulo="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        erro={erros.email}
      />
      <CampoTexto
        rotulo="Senha"
        secureTextEntry
        placeholder="Minimo de 6 caracteres"
        value={senha}
        onChangeText={setSenha}
        erro={erros.senha}
      />
      <CampoTexto
        rotulo="Telefone (opcional)"
        keyboardType="phone-pad"
        placeholder="(11) 90000-0000"
        value={telefone}
        onChangeText={setTelefone}
        erro={erros.telefone}
      />
      <CampoTexto
        rotulo="Bairro"
        placeholder="Ex.: Capao Redondo"
        value={bairro}
        onChangeText={setBairro}
        erro={erros.bairro}
      />

      {papel === 'PRESTADOR' && (
        <>
          <Text style={estilos.rotulo}>Qual servico voce faz?</Text>
          {categorias.isLoading && <Text style={estilos.ajuda}>Carregando servicos...</Text>}
          {categorias.isError && (
            <Text style={estilos.erroCampo}>
              Nao foi possivel carregar os servicos. Verifique a conexao.
            </Text>
          )}
          <Opcoes<number>
            opcoes={(categorias.data ?? []).map((c) => ({ valor: c.id, rotulo: c.nome }))}
            selecionado={categoriaId}
            aoSelecionar={setCategoriaId}
          />
          {!!erros.categoriaId && <Text style={estilos.erroCampo}>{erros.categoriaId}</Text>}
          <CampoTexto
            rotulo="Conte sobre seu trabalho (opcional)"
            multiline
            placeholder="Ex.: Eletricista ha 10 anos, atendo emergencias."
            value={descricao}
            onChangeText={setDescricao}
          />
        </>
      )}

      {!!erroGeral && <Text style={estilos.erroGeral}>{erroGeral}</Text>}
      <Botao titulo="Criar conta" aoPressionar={aoCadastrar} carregando={enviando} />
    </TelaFormulario>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontFamily: fontes.negrito, fontSize: tamanhos.titulo, color: cores.texto },
  subtitulo: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
    marginBottom: espacos.lg,
  },
  rotulo: {
    fontFamily: fontes.media,
    fontSize: tamanhos.normal,
    color: cores.texto,
    marginBottom: espacos.sm,
  },
  ajuda: { fontFamily: fontes.regular, color: cores.textoSuave, marginBottom: espacos.sm },
  erroCampo: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.pequeno,
    color: cores.perigo,
    marginTop: -espacos.sm,
    marginBottom: espacos.md,
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
});
