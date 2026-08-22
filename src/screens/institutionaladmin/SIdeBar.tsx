import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { 
  Ionicons, 
  MaterialCommunityIcons, 
  Feather 
} from '@expo/vector-icons';

type IconType = 'Ionicons' | 'MaterialCommunityIcons' | 'Feather';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  type: IconType;
}

const menuItems: MenuItem[] = [
  { id: '1', title: 'Form Builder', icon: 'clipboard-outline', type: 'Ionicons' },
  { id: '2', title: 'Trial Logging', icon: 'bar-chart-outline', type: 'Ionicons' },
  { id: '3', title: 'ABC Dropdowns', icon: 'list', type: 'Feather' },
  { id: '4', title: 'Session Schedule', icon: 'calendar-outline', type: 'Ionicons' },
  { id: '5', title: 'Goal Domains', icon: 'bullseye', type: 'MaterialCommunityIcons' },
  { id: '6', title: 'Task Analysis', icon: 'layers-outline', type: 'Ionicons' },
];

export default function SideBar() {
  const [activeId, setActiveId] = useState<string>('1');

  // Fix: Explicitly typing parameters (type, name, color)
  const renderIcon = (type: IconType, name: string, color: string) => {
    switch (type) {
      case 'Ionicons':
        return <Ionicons name={name as keyof typeof Ionicons.glyphMap} size={20} color={color} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={name as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color={color} />;
      case 'Feather':
        return <Feather name={name as keyof typeof Feather.glyphMap} size={20} color={color} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brandTitle}>MELU'E</Text>
        <Text style={styles.brandSubtitle}>Administration</Text>
      </View>

      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>CLINICAL CONFIGURATION</Text>

        {menuItems.map((item) => {
          const isActive = item.id === activeId;
          const contentColor = isActive ? '#000000' : '#FFFFFF';

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, isActive && styles.activeMenuItem]}
              onPress={() => setActiveId(item.id)}
              activeOpacity={0.7}
            >
              {renderIcon(item.type, item.icon, contentColor)}
              <Text style={[styles.menuText, { color: contentColor, fontWeight: isActive ? '700' : '600' }]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.userName}>Admin A</Text>
        <Text style={styles.userEmail}>admin@melue.org</Text>
        <Text style={styles.userRole}>INSTITUTIONAL_ADMIN</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: '100%',
    backgroundColor: '#1E2836',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  header: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2B3748',
    marginBottom: 20,
  },
  brandTitle: {
    color: '#FFC83B',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: '#8B9BB4',
    fontSize: 14,
    marginTop: 2,
  },
  menuContainer: {
    flex: 1,
  },
  sectionHeader: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
  },
  activeMenuItem: {
    backgroundColor: '#FFC83B',
  },
  menuText: {
    fontSize: 15,
    marginLeft: 12,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#2B3748',
    paddingTop: 16,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#8B9BB4',
    fontSize: 13,
    marginVertical: 4,
  },
  userRole: {
    color: '#FFC83B',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 8,
  },
});