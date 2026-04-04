import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Login from '../../../features/auth/Login';
import About from '../../../features/pages/About';
import Contact from '../../../features/pages/Contact';

const CustomDrawerContent = ({ navigation }) => {
  const menuItems = [
    { name: 'Нэвтрэх', icon: 'log-in-outline', screen: Login },
    { name: 'Төлбөр төлөх', icon: 'card-outline', screen: 'Payment' },
    { name: 'Ахиц харах', icon: 'stats-chart-outline', screen: 'Progress' },
    { name: 'Бидний тухай', icon: 'information-circle-outline', screen: About },
    { name: 'Холбоо барих', icon: 'call-outline', screen: Contact },
  ];

  return (
    <View style={styles.container}>

    <TouchableOpacity 
        onPress={() => {navigation.closeDrawer()}} >
      <View style={styles.header}>
        <Text >ТОРИК</Text>
        <Icon name='arrow-forward-outline' size={24} style={styles.iconButton}/>
      </View>
    </TouchableOpacity>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Icon name={item.icon} size={20} color="#333" style={styles.menuIcon} />
            <Text style={styles.menuText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', 
  },

  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuIcon: {
    marginRight: 15,
    width: 24,
  },
  menuText: {
    color: '#333',
    fontWeight: '500',
  },
});

export default CustomDrawerContent;