import * as Yup from 'yup';

export const esquemaLogin = Yup.object({
  email: Yup.string().trim().required('Informe o e-mail').email('E-mail inválido'),
  senha: Yup.string().required('Informe a senha'),
});

export const esquemaCadastro = Yup.object({
  nome: Yup.string().trim().required('Informe seu nome').min(3, 'Nome muito curto'),
  email: Yup.string().trim().required('Informe o e-mail').email('E-mail inválido'),
  senha: Yup.string()
    .required('Crie uma senha')
    .min(6, 'A senha precisa ter pelo menos 6 caracteres'),
  telefone: Yup.string()
    .trim()
    .matches(/^[0-9()+\- ]{8,20}$/, { message: 'Telefone inválido', excludeEmptyString: true }),
  bairro: Yup.string().trim().required('Informe seu bairro'),
  papel: Yup.mixed<'CLIENTE' | 'PRESTADOR'>().oneOf(['CLIENTE', 'PRESTADOR']).required(),
  categoriaId: Yup.number().when('papel', {
    is: 'PRESTADOR',
    then: (s) => s.required('Escolha o serviço que você faz'),
    otherwise: (s) => s.notRequired(),
  }),
});

export const esquemaPedido = Yup.object({
  descricao: Yup.string()
    .trim()
    .required('Descreva o problema')
    .min(10, 'Conte um pouco mais (mínimo de 10 caracteres)')
    .max(1000, 'Máximo de 1000 caracteres'),
});

export const esquemaOrcamento = Yup.object({
  valor: Yup.number()
    .typeError('Informe o valor em reais')
    .required('Informe o valor')
    .min(1, 'O valor deve ser maior que zero'),
  prazoDias: Yup.number()
    .typeError('Informe o prazo em dias')
    .required('Informe o prazo')
    .integer('Use dias inteiros')
    .min(1, 'Mínimo de 1 dia')
    .max(60, 'Máximo de 60 dias'),
});

export const esquemaProposta = Yup.object({
  valor: Yup.number()
    .typeError('Informe o valor em reais')
    .required('Informe o valor')
    .min(1, 'O valor deve ser maior que zero'),
  comentario: Yup.string().trim().max(300, 'Máximo de 300 caracteres'),
});

/**
 * A faixa de referência da triagem não é um teto: dá para cobrar ou propor mais,
 * mas aí é preciso explicar o motivo. Devolve a mensagem de erro ou undefined.
 */
export function exigirJustificativa(valor: number, maximo: number | undefined, texto: string) {
  if (!maximo || !(valor > maximo) || texto.trim()) return undefined;
  return 'Valor acima da faixa de referência: explique o motivo';
}

/** Valida e devolve um mapa campo -> primeira mensagem de erro (vazio quando esta tudo certo). */
export async function validar<T extends object>(esquema: Yup.Schema<T>, dados: unknown) {
  try {
    await esquema.validate(dados, { abortEarly: false });
    return {} as Record<string, string>;
  } catch (erro) {
    const erros: Record<string, string> = {};
    if (erro instanceof Yup.ValidationError) {
      erro.inner.forEach((e) => {
        if (e.path && !erros[e.path]) erros[e.path] = e.message;
      });
    }
    return erros;
  }
}
