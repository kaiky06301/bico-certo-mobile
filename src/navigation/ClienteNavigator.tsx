import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useNaoLidas } from '../hooks/consultas';
import { DetalhePedidoScreen } from '../screens/cliente/DetalhePedidoScreen';
import { EditarPedidoScreen } from '../screens/cliente/EditarPedidoScreen';
import { MinhasAvaliacoesScreen } from '../screens/cliente/MinhasAvaliacoesScreen';
import { MeusPedidosScreen } from '../screens/cliente/MeusPedidosScreen';
import { NovoPedidoScreen } from '../screens/cliente/NovoPedidoScreen';
import { AlterarSenhaScreen } from '../screens/comum/AlterarSenhaScreen';
import { AvisosScreen } from '../screens/comum/AvisosScreen';
import { DadosPessoaisScreen } from '../screens/comum/DadosPessoaisScreen';
import { EnderecoFormScreen } from '../screens/comum/EnderecoFormScreen';
import { MeusEnderecosScreen } from '../screens/comum/MeusEnderecosScreen';
import { ExcluirContaScreen } from '../screens/comum/ExcluirContaScreen';
import { PerfilPrestadorScreen } from '../screens/comum/PerfilPrestadorScreen';
import { PerfilScreen } from '../screens/comum/PerfilScreen';
import { SobreScreen } from '../screens/comum/SobreScreen';
import { TextoLegalScreen } from '../screens/comum/TextoLegalScreen';
import { opcoesAbas, opcoesPilha } from './opcoes';
import { ClienteAbasParams, ClienteStackParams } from './tipos';

const Abas = createBottomTabNavigator<ClienteAbasParams>();
const Pilha = createNativeStackNavigator<ClienteStackParams>();

function ClienteAbas() {
  const naoLidas = useNaoLidas();
  return (
    <Abas.Navigator screenOptions={opcoesAbas}>
      <Abas.Screen
        name="NovoPedido"
        component={NovoPedidoScreen}
        options={{
          title: 'Novo pedido',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Abas.Screen
        name="MeusPedidos"
        component={MeusPedidosScreen}
        options={{
          title: 'Meus pedidos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" color={color} size={size} />
          ),
        }}
      />
      <Abas.Screen
        name="Avisos"
        component={AvisosScreen}
        options={{
          tabBarBadge: naoLidas.data ? naoLidas.data : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" color={color} size={size} />
          ),
        }}
      />
      <Abas.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Abas.Navigator>
  );
}

/** Rotas protegidas do cliente: so existem depois do login com papel CLIENTE. */
export function ClienteNavigator() {
  return (
    <Pilha.Navigator screenOptions={opcoesPilha}>
      <Pilha.Screen name="ClienteAbas" component={ClienteAbas} options={{ headerShown: false }} />
      <Pilha.Screen
        name="DetalhePedido"
        component={DetalhePedidoScreen}
        options={{ title: 'Detalhe do pedido' }}
      />
      <Pilha.Screen
        name="EditarPedido"
        component={EditarPedidoScreen}
        options={{ title: 'Editar pedido' }}
      />
      <Pilha.Screen
        name="MinhasAvaliacoes"
        component={MinhasAvaliacoesScreen}
        options={{ title: 'Minhas avaliações' }}
      />
      <Pilha.Screen name="Sobre" component={SobreScreen} options={{ title: 'Sobre o app' }} />
      <Pilha.Screen
        name="DadosPessoais"
        component={DadosPessoaisScreen}
        options={{ title: 'Dados pessoais' }}
      />
      <Pilha.Screen
        name="MeusEnderecos"
        component={MeusEnderecosScreen}
        options={{ title: 'Meus endereços' }}
      />
      <Pilha.Screen
        name="EnderecoForm"
        component={EnderecoFormScreen}
        options={({ route }) => ({ title: route.params?.id ? 'Editar endereço' : 'Novo endereço' })}
      />
      <Pilha.Screen
        name="AlterarSenha"
        component={AlterarSenhaScreen}
        options={{ title: 'Alterar senha' }}
      />
      <Pilha.Screen
        name="ExcluirConta"
        component={ExcluirContaScreen}
        options={{ title: 'Excluir conta' }}
      />
      <Pilha.Screen name="TextoLegal" component={TextoLegalScreen} options={{ title: '' }} />
      <Pilha.Screen
        name="PerfilPrestador"
        component={PerfilPrestadorScreen}
        options={{ title: 'Perfil do prestador' }}
      />
    </Pilha.Navigator>
  );
}
