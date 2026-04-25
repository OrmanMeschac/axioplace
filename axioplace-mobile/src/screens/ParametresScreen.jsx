import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Switch,
    ScrollView, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ChevronLeft, Bell, Shield, Globe, HelpCircle, Info,
    ChevronRight, Moon, Mail, Phone,
} from 'lucide-react-native';
import { Colors } from '../constants/Colors';

export default function ParametresScreen({ navigation }) {
    const [notifMessages, setNotifMessages] = useState(true);
    const [notifAnnonces, setNotifAnnonces] = useState(true);
    const [notifPromos, setNotifPromos] = useState(false);

    const GroupTitle = ({ title }) => (
        <Text style={styles.groupTitle}>{title}</Text>
    );

    const SettingRow = ({ icon: Icon, label, value, onPress, toggle, toggleValue, onToggle, last }) => (
        <TouchableOpacity
            style={[styles.row, last && styles.rowLast]}
            onPress={onPress}
            activeOpacity={toggle ? 1 : 0.7}
        >
            <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                    <Icon size={18} color={Colors.axioVert} />
                </View>
                <Text style={styles.rowLabel}>{label}</Text>
            </View>
            {toggle ? (
                <Switch
                    value={toggleValue}
                    onValueChange={onToggle}
                    trackColor={{ false: Colors.gray200, true: Colors.axioJaune }}
                    thumbColor={Colors.white}
                    ios_backgroundColor={Colors.gray200}
                />
            ) : (
                <View style={styles.rowRight}>
                    {value ? <Text style={styles.rowValue}>{value}</Text> : null}
                    <ChevronRight size={16} color={Colors.gray300} />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[Colors.axioJaune, Colors.axioJauneDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradient}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <ChevronLeft size={22} color="#1f2937" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Paramètres</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Notifications */}
                <GroupTitle title="Notifications" />
                <View style={styles.group}>
                    <SettingRow
                        icon={Bell}
                        label="Nouveaux messages"
                        toggle toggleValue={notifMessages}
                        onToggle={setNotifMessages}
                    />
                    <SettingRow
                        icon={Bell}
                        label="Nouvelles annonces"
                        toggle toggleValue={notifAnnonces}
                        onToggle={setNotifAnnonces}
                    />
                    <SettingRow
                        icon={Bell}
                        label="Offres et promotions"
                        toggle toggleValue={notifPromos}
                        onToggle={setNotifPromos}
                        last
                    />
                </View>

                {/* Confidentialité */}
                <GroupTitle title="Confidentialité & Sécurité" />
                <View style={styles.group}>
                    <SettingRow
                        icon={Shield}
                        label="Politique de confidentialité"
                        onPress={() => Linking.openURL('https://axioplace.com/privacy')}
                    />
                    <SettingRow
                        icon={Shield}
                        label="Conditions d'utilisation"
                        onPress={() => Linking.openURL('https://axioplace.com/terms')}
                        last
                    />
                </View>

                {/* Aide */}
                <GroupTitle title="Aide" />
                <View style={styles.group}>
                    <SettingRow
                        icon={HelpCircle}
                        label="Centre d'aide"
                        onPress={() => Alert.alert('Centre d\'aide', 'Fonctionnalité à venir.')}
                    />
                    <SettingRow
                        icon={Mail}
                        label="Nous contacter"
                        value="contact@axioplace.com"
                        onPress={() => Linking.openURL('mailto:contact@axioplace.com')}
                    />
                    <SettingRow
                        icon={Phone}
                        label="Support téléphonique"
                        value="+242 XX XXX XXXX"
                        onPress={() => Linking.openURL('tel:+242000000000')}
                        last
                    />
                </View>

                {/* À propos */}
                <GroupTitle title="À propos" />
                <View style={styles.group}>
                    <SettingRow
                        icon={Info}
                        label="Version de l'application"
                        value="1.0.0"
                        onPress={() => {}}
                        last
                    />
                </View>

                {/* Version badge */}
                <View style={styles.versionBadge}>
                    <LinearGradient
                        colors={[Colors.axioJaune, '#f5b800']}
                        style={styles.versionInner}
                    >
                        <Text style={styles.versionLogo}>Axio<Text style={{ color: '#1f2937' }}>place</Text></Text>
                        <Text style={styles.versionText}>Version 1.0.0 • Fait avec ❤️ au Congo</Text>
                    </LinearGradient>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    headerGradient: { paddingBottom: 4 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.08)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18, fontWeight: '800', color: '#1f2937',
    },

    scroll: { flex: 1, paddingTop: 12 },

    groupTitle: {
        fontSize: 11, fontWeight: '700', color: Colors.gray400,
        textTransform: 'uppercase', letterSpacing: 1,
        paddingHorizontal: 20, marginBottom: 8, marginTop: 16,
    },
    group: {
        backgroundColor: Colors.white, marginHorizontal: 16,
        borderRadius: 16, overflow: 'hidden',
        borderWidth: 1, borderColor: Colors.border,
    },
    row: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: Colors.gray50,
    },
    rowLast: { borderBottomWidth: 0 },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowIcon: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: Colors.axioVertLight,
        alignItems: 'center', justifyContent: 'center',
    },
    rowLabel: { fontSize: 15, fontWeight: '600', color: Colors.gray800 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rowValue: { fontSize: 13, color: Colors.textSecondary },

    versionBadge: {
        marginHorizontal: 16, marginTop: 24,
        borderRadius: 18, overflow: 'hidden',
    },
    versionInner: {
        padding: 20, alignItems: 'center',
    },
    versionLogo: {
        fontSize: 22, fontWeight: '900', color: Colors.white, marginBottom: 4,
    },
    versionText: {
        fontSize: 12, color: 'rgba(31,41,55,0.7)', fontWeight: '600',
    },
});
