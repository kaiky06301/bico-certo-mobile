import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useNaoLidas } from '../hooks/consultas';
import { AvisosScreen } from '../screens/comum/AvisosScreen';
import { PerfilScreen } from '../screens/comum/PerfilScreen';
import { SobreScreen } from '../screens/comum/SobreScreen';
import { AgendaScreen } from '../screens/prestador/AgendaScreen';
import { DetalheServicoScreen } from '../screens/prestador/DetalheServicoScreen';
import { PedidosAbertosScreen } from '../screens/prestador/PedidosAbertosScreen';
import { opcoesAbas, opcoesPilha } from './opcoes';
import { PrestadorAbasParams, PrestadorStackParams } from './tipos';

const Abas = createBottomTabNavigator<PrestadorAbasParams>();
const Pilha = createNativeStackNavigator<PrestadorStackParams>();

function PrestadorAbas() {
  const naoLidas = useNaoLidas();
  return (
    <Abas.Navigator screenOptions={opcoesAbas}>
      <Abas.Screen
        name="PedidosAbertos"
        component={PedidosAbertosScreen}
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hammer-outline" color={color} size={size} />
          ),
        }}
      />
      <Abas.Screen
        name="Agenda"
        component={AgendaScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
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

/** Rotas protegidas do prestador: so existem depois do login com papel PRESTADOR. */
export function PrestadorNavigator() {
  return (
    <Pilha.Navigator screenOptions={opcoesPilha}>
      <Pilha.Screen
        name="PrestadorAbas"
        component={PrestadorAbas}
        options={{ headerShown: false }}
      />
      <Pilha.Screen
        name="DetalheServico"
        component={DetalheServicoScreen}
        options={{ title: 'Detalhe do servico' }}
      />
      <Pilha.Screen name="Sobre" component={SobreScreen} options={{ title: 'Sobre o app' }} />
    </Pilha.Navigator>
  );
}
