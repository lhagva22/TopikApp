import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { CardHeader, CardTitle } from './card';

const CardTitleWithIcon = ({ icon, image, title, iconBgColor, description }: any) => (
  <View style={styles.container}>
    <View style={styles.iconColumn}>
      <View
        style={[styles.iconBox, { backgroundColor: iconBgColor || '#95caff' }]}
      >
        {icon ? icon : image ? <Image source={image} style={styles.image} /> : null}
      </View>
    </View>

    <View style={styles.content}>
      <CardHeader variant="small">{title}</CardHeader>
      <CardTitle>{description}</CardTitle>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconColumn: {
    width: '15%',
    alignItems: 'center',
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    borderRadius: 10,
    width: 40,
    height: 40,
  },
  image: {
    width: 25,
    height: 25,
  },
  content: {
    width: '85%',
    paddingLeft: 10,
  },
});

export default CardTitleWithIcon;
