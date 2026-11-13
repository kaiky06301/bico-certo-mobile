import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CadastroScreen } from '../screens/auth/CadastroScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { opcoesPilha } from './opcoes';
import { AuthStackParams } from './tipos';

const Pilha = createNativeStackNavigator<AuthStackParams>();

/** Rotas publicas: so aparecem para quem nao esta logado. */
export function AuthNavigator() {
  return (
    <Pilha.Navigator screenOptions={opcoesPilha}>
      <Pilha.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Pilha.Screen name="Cadastro" component={CadastroScreen} options={{ title: 'Criar conta' }} />
    </Pilha.Navigator>
  );
}
