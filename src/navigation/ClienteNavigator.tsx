import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useNaoLidas } from '../hooks/consultas';
import { DetalhePedidoScreen } from '../screens/cliente/DetalhePedidoScreen';
import { EditarPedidoScreen } from '../screens/cliente/EditarPedidoScreen';
import { MeusPedidosScreen } from '../screens/cliente/MeusPedidosScreen';
import { NovoPedidoScreen } from '../screens/cliente/NovoPedidoScreen';
import { AvisosScreen } from '../screens/comum/AvisosScreen';
import { PerfilScreen } from '../screens/comum/PerfilScreen';
import { SobreScreen } from '../screens/comum/SobreScreen';
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
      <Pilha.Screen name="Sobre" component={SobreScreen} options={{ title: 'Sobre o app' }} />
    </Pilha.Navigator>
  );
}
