import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { cores } from '../theme/cores';
import { fontes } from '../theme/tipografia';

/** Visual padrao dos cabecalhos e das abas, igual em todas as pilhas. */
export const opcoesPilha: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: cores.superficie },
  headerTintColor: cores.secundaria,
  headerTitleStyle: { fontFamily: fontes.seminegrito },
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: { backgroundColor: cores.fundo },
};

export const opcoesAbas: BottomTabNavigationOptions = {
  headerStyle: { backgroundColor: cores.superficie },
  headerTintColor: cores.secundaria,
  headerTitleStyle: { fontFamily: fontes.seminegrito },
  tabBarActiveTintColor: cores.primaria,
  tabBarInactiveTintColor: cores.textoSuave,
  tabBarLabelStyle: { fontFamily: fontes.media, fontSize: 11 },
  tabBarStyle: { backgroundColor: cores.superficie, borderTopColor: cores.borda },
};
