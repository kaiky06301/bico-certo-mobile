import { NavigationContainer } from '@react-navigation/native';

import { Carregando } from '../components/Estados';
import { useAuth } from '../contexts/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { ClienteNavigator } from './ClienteNavigator';
import { PrestadorNavigator } from './PrestadorNavigator';

/**
 * Protecao de rotas: sem usuario logado so existem as telas de login e cadastro.
 * Depois do login, as rotas dependem do papel que veio no JWT (CLIENTE ou PRESTADOR).
 * Ao sair, o usuario e removido e o app volta automaticamente para o login.
 */
export function RaizNavigator() {
  const { usuario, carregandoSessao } = useAuth();

  if (carregandoSessao) return <Carregando texto="Abrindo o Bico Certo..." />;

  return (
    <NavigationContainer>
      {!usuario ? (
        <AuthNavigator />
      ) : usuario.papel === 'PRESTADOR' ? (
        <PrestadorNavigator />
      ) : (
        <ClienteNavigator />
      )}
    </NavigationContainer>
  );
}
