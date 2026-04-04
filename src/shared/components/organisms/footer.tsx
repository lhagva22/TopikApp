
import React, {useState} from 'react';
import { View, Text, StyleSheet, TouchableOpacity  } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type MenuItemType = {
  id: number;
  label: string;
  icon: string;
  onPress: () => void;
  route?: string;
};

const menuItems: MenuItemType[] = [
  { id: 1, label: 'Үндсэн', icon: 'document-outline', onPress: () => { } },
  { id: 2, label: 'Видео', icon: 'videocam-outline', onPress: () => { } },
  { id: 3, label: 'Хичээл', icon: 'book-outline', onPress: () => { } },
  { id: 4, label: 'Шалгалт', icon: 'document-text-outline', onPress: () => { } },
  { id: 5, label: 'Үгийн сан', icon: 'library-outline', onPress: () => { } },
];

const MenuItem = ({ icon, label }: { icon: string; label: string }) => (
    
    <View style={styles.menuItem}>
      
      <Icon name={icon} size={20} color="#000000" />
      <Text style={styles.menuText}>{label}</Text>
    </View>
  )


const Footer = () => {

  const [selectedId, setSelectedId] = useState(1); 
   return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {menuItems.map(item => {
          const isActive = selectedId === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => setSelectedId(item.id)}
              activeOpacity={0.7}
            >
              {isActive && <View style={styles.activeLine} />}

              <Icon
                name={item.icon}
                size={22}
                color={isActive ? '#0000FF' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.menuText,
                  { color: isActive ? '#0000FF' : '#9CA3AF' },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 70,
    justifyContent: 'space-around',
    alignItems: 'center',

    // Shadow (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,

    // Shadow (Android)
    elevation: 8,
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  activeLine: {
    position: 'absolute',
    top: -10,
    width: 40,
    height: 3,
    backgroundColor: '#0000FF',
    borderRadius: 2,
  },
});

export default Footer;