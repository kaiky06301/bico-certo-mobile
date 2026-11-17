import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, View } from 'react-native';

import { cores } from '../theme/cores';
import { espacos, fontes, raio, tamanhos } from '../theme/tipografia';
import { Botao } from './Botao';
import { CampoTexto } from './CampoTexto';
import { Opcoes } from './Opcoes';

const MOTIVOS = [
  'Resolvi de outra forma',
  'Os valores ficaram acima do esperado',
  'Demorou para chegar orçamento',
  'Pedido duplicado ou errado',
  'Outro motivo',
];

interface Props {
  visivel: boolean;
  carregando: boolean;
  aoFechar: () => void;
  aoConfirmar: (motivo: string) => void;
}

/** Pergunta o motivo antes de cancelar (o motivo aparece no detalhe e no histórico). */
export function ModalCancelamento({ visivel, carregando, aoFechar, aoConfirmar }: Props) {
  const [motivo, setMotivo] = useState<string>();
  const [outro, setOutro] = useState('');
  const texto = motivo === 'Outro motivo' ? outro.trim() : motivo;

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={aoFechar}>
      <KeyboardAvoidingView
        style={estilos.fundo}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={estilos.folha}>
          <Text style={estilos.titulo}>Por que você quer cancelar?</Text>
          <Text style={estilos.subtitulo}>
            Os prestadores deixam de ver este pedido. Se já houver contratação, ela também é
            cancelada.
          </Text>
          <Opcoes<string>
            opcoes={MOTIVOS.map((m) => ({ valor: m, rotulo: m }))}
            selecionado={motivo}
            aoSelecionar={setMotivo}
          />
          {motivo === 'Outro motivo' && (
            <CampoTexto
              rotulo="Conte o motivo"
              value={outro}
              onChangeText={setOutro}
              maxLength={200}
            />
          )}
          <Botao
            titulo="Cancelar pedido"
            variante="perigo"
            desabilitado={!texto}
            carregando={carregando}
            aoPressionar={() => texto && aoConfirmar(texto)}
          />
          <Botao
            titulo="Voltar"
            variante="contorno"
            aoPressionar={aoFechar}
            estilo={estilos.voltar}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fundo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  folha: {
    backgroundColor: cores.fundo,
    borderTopLeftRadius: raio.grande,
    borderTopRightRadius: raio.grande,
    padding: espacos.lg,
    paddingBottom: espacos.xl * 1.5,
  },
  titulo: { fontFamily: fontes.negrito, fontSize: tamanhos.grande, color: cores.texto },
  subtitulo: {
    fontFamily: fontes.regular,
    fontSize: tamanhos.normal,
    color: cores.textoSuave,
    marginVertical: espacos.sm,
  },
  voltar: { marginTop: espacos.sm },
});
