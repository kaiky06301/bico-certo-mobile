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

const telefone = Yup.string()
  .trim()
  .matches(/^[0-9()+\- ]{8,20}$/, { message: 'Telefone inválido', excludeEmptyString: true });

export const esquemaDadosPessoais = Yup.object({
  nome: Yup.string().trim().required('Informe seu nome').min(3, 'Nome muito curto'),
  telefone,
  bairro: Yup.string().trim().required('Informe seu bairro'),
});

export const esquemaEndereco = Yup.object({
  apelido: Yup.string()
    .trim()
    .required('Dê um nome (ex.: Casa, Trabalho)')
    .max(40, 'Máximo de 40 caracteres'),
  logradouro: Yup.string()
    .trim()
    .required('Informe a rua e o número')
    .max(200, 'Máximo de 200 caracteres'),
  complemento: Yup.string().trim().max(100, 'Máximo de 100 caracteres'),
  bairro: Yup.string().trim().required('Informe o bairro').max(80, 'Máximo de 80 caracteres'),
  cidade: Yup.string().trim().required('Informe a cidade').max(60, 'Máximo de 60 caracteres'),
  uf: Yup.string()
    .trim()
    .required('Informe a UF')
    .matches(/^[A-Za-z]{2}$/, 'Use a sigla do estado (ex.: SP)'),
});

export const esquemaSenha = Yup.object({
  senhaAtual: Yup.string().required('Informe a senha atual'),
  novaSenha: Yup.string()
    .required('Crie a nova senha')
    .min(6, 'A senha precisa ter pelo menos 6 caracteres')
    .notOneOf([Yup.ref('senhaAtual')], 'A nova senha deve ser diferente da atual'),
  confirmacao: Yup.string()
    .required('Repita a nova senha')
    .oneOf([Yup.ref('novaSenha')], 'As senhas não conferem'),
});

export const esquemaPerfilProfissional = Yup.object({
  categorias: Yup.array()
    .of(Yup.number().required())
    .min(1, 'Escolha pelo menos um serviço que você faz')
    .max(3, 'Escolha no máximo 3 serviços'),
  descricao: Yup.string().trim().max(500, 'Máximo de 500 caracteres'),
  especialidades: Yup.string().trim().max(200, 'Máximo de 200 caracteres'),
  diferenciais: Yup.string().trim().max(300, 'Máximo de 300 caracteres'),
  bairros: Yup.array().of(Yup.string()).min(1, 'Marque pelo menos um bairro onde você atende'),
  dias: Yup.array().of(Yup.string()).min(1, 'Marque pelo menos um dia de atendimento'),
  horarioInicio: Yup.string().required(),
  horarioFim: Yup.string()
    .required()
    .test('depois', 'O horário de término deve ser depois do início', function (fim) {
      return !fim || fim > this.parent.horarioInicio;
    }),
  bairro: Yup.string().trim().required('Informe seu bairro'),
  telefone,
});

export const esquemaPedido = Yup.object({
  descricao: Yup.string()
    .trim()
    .required('Descreva o problema')
    .min(10, 'Conte um pouco mais (mínimo de 10 caracteres)')
    .max(1000, 'Máximo de 1000 caracteres'),
  observacao: Yup.string().trim().max(500, 'Máximo de 500 caracteres'),
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
