import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, Heart, PlusCircle, MessageSquare, User } from 'lucide-react-native';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { Colors } from './src/constants/Colors';
import NotificationToast from './src/components/NotificationToast';

/** Importation des écrans de l'application */
import HomeScreen from './src/screens/HomeScreen';
import AnnoncesScreen from './src/screens/AnnoncesScreen';
import AnnonceDetailScreen from './src/screens/AnnonceDetailScreen';
import FavorisScreen from './src/screens/FavorisScreen';
import PublierScreen from './src/screens/PublierScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfilScreen from './src/screens/ProfilScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ParametresScreen from './src/screens/ParametresScreen';
import EditerAnnonceScreen from './src/screens/EditerAnnonceScreen';
import SellerProfileScreen from './src/screens/SellerProfileScreen';
import NotificationsAdminScreen from './src/screens/NotificationsAdminScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/** Composant d'icône pour la barre de navigation */
function TabIcon({ Icon, focused, color }) {
    return <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />;
}

/** Piles de navigation (Stacks) pour chaque domaine de l'application */
function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Annonces" component={AnnoncesScreen} />
            <Stack.Screen name="AnnonceDetail" component={AnnonceDetailScreen} />
            <Stack.Screen name="EditerAnnonce" component={EditerAnnonceScreen} />
            <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
        </Stack.Navigator>
    );
}

function MessagesStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MessagesList" component={MessagesScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="AnnonceDetail" component={AnnonceDetailScreen} />
            <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
        </Stack.Navigator>
    );
}

function ProfilStack() {
    const { isAuthenticated } = useAuth();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
                <>
                    <Stack.Screen name="ProfilMain" component={ProfilScreen} />
                    <Stack.Screen name="Parametres" component={ParametresScreen} />
                    <Stack.Screen name="MesAnnonces" component={AnnoncesScreen} />
                    <Stack.Screen name="AnnonceDetail" component={AnnonceDetailScreen} />
                    <Stack.Screen name="EditerAnnonce" component={EditerAnnonceScreen} />
                    <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
                    <Stack.Screen name="NotificationsAdmin" component={NotificationsAdminScreen} />
                </>
            ) : (
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}

function FavorisStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="FavorisList" component={FavorisScreen} />
            <Stack.Screen name="AnnonceDetail" component={AnnonceDetailScreen} />
            <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
        </Stack.Navigator>
    );
}

/** Composant de la barre d'onglets principale (Bottom Tabs) */
function MainTabs({ unreadMessages, adminNotifs }) {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.axioJaune,
                tabBarInactiveTintColor: Colors.gray400,
                tabBarStyle: {
                    backgroundColor: Colors.white,
                    borderTopColor: Colors.border,
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios' ? 88 : 64,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
                    paddingTop: 8,
                    elevation: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -3 },
                    shadowOpacity: 0.08,
                    shadowRadius: 10,
                },
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
            }}
        >
            <Tab.Screen
                name="HomeTab" component={HomeStack}
                options={{
                    tabBarLabel: 'Accueil',
                    tabBarIcon: ({ focused, color }) => <TabIcon Icon={Home} focused={focused} color={color} />,
                }}
            />
            <Tab.Screen
                name="FavorisTab" component={FavorisStack}
                options={{
                    tabBarLabel: 'Favoris',
                    tabBarIcon: ({ focused, color }) => <TabIcon Icon={Heart} focused={focused} color={color} />,
                }}
            />
            <Tab.Screen
                name="PublierTab" component={PublierScreen}
                options={{
                    tabBarLabel: '',
                    tabBarIcon: () => (
                        <View style={{
                            width: 52, height: 52, borderRadius: 16, marginTop: -22,
                            overflow: 'hidden',
                            shadowColor: Colors.axioJaune,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.4, shadowRadius: 8, elevation: 10,
                        }}>
                            <LinearGradient
                                colors={[Colors.axioJaune, '#f5b800']}
                                style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <PlusCircle size={24} color="#1f2937" strokeWidth={2.2} />
                            </LinearGradient>
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="MessagesTab" component={MessagesStack}
                options={{
                    tabBarLabel: 'Messages',
                    // Indicateur pastille rouge pour les messages non lus
                    tabBarBadge: unreadMessages > 0 ? unreadMessages : undefined,
                    tabBarBadgeStyle: { backgroundColor: Colors.red, fontSize: 10, minWidth: 18, height: 18 },
                    tabBarIcon: ({ focused, color }) => <TabIcon Icon={MessageSquare} focused={focused} color={color} />,
                }}
            />
            <Tab.Screen
                name="ProfilTab" component={ProfilStack}
                options={{
                    tabBarLabel: 'Profil',
                    // Indicateur pastille rouge pour les notifications administratives
                    tabBarBadge: adminNotifs > 0 ? adminNotifs : undefined,
                    tabBarBadgeStyle: { backgroundColor: Colors.red, fontSize: 10, minWidth: 18, height: 18 },
                    tabBarIcon: ({ focused, color }) => <TabIcon Icon={User} focused={focused} color={color} />,
                }}
            />
        </Tab.Navigator>
    );
}

/** Écran de chargement initial (Splash Screen) */
function SplashScreen() {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <LinearGradient
                colors={[Colors.axioJaune, Colors.axioVert]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View style={{
                width: 80, height: 80, borderRadius: 24,
                backgroundColor: 'rgba(255,255,255,0.25)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 20,
            }}>
                <Home size={40} color="#fff" strokeWidth={2} />
            </View>
            <ActivityIndicator size="large" color="#fff" />
        </View>
    );
}

/** Composant de navigation racine incluant le gestionnaire de notifications Toast */
function RootNavigator() {
    const { isLoading, toast, hideToast, unreadCount, adminNotifCount } = useAuth();

    if (isLoading) return <SplashScreen />;

    return (
        <View style={{ flex: 1 }}>
            <NavigationContainer>
                <StatusBar style="dark" />
                <MainTabs unreadMessages={unreadCount} adminNotifs={adminNotifCount} />
            </NavigationContainer>

            {/* Notification globale superposée en absolu au-dessus des écrans */}
            <NotificationToast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onDismiss={hideToast}
            />
        </View>
    );
}

/** Point d'entrée principal de l'application mobile React Native */
export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <AuthProvider>
                    <RootNavigator />
                </AuthProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
