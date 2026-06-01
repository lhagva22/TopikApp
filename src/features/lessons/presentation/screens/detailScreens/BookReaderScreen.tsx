import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Ionicons';
import { WebView } from 'react-native-webview';

import type { RootDrawerParamList } from '../../../../../app/navigation/types';

type Props = DrawerScreenProps<RootDrawerParamList, 'BookReader'>;

const getIssuuReaderUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const docsIndex = parts.indexOf('docs');

    if (!parsed.hostname.includes('issuu.com') || docsIndex < 1 || !parts[docsIndex + 1]) {
      return url;
    }

    const user = parts[docsIndex - 1];
    const document = parts[docsIndex + 1];
    const page = parts[docsIndex + 2];
    const params = new URLSearchParams({
      u: user,
      d: document,
      hideIssuuLogo: 'true',
      hideShareButton: 'true',
    });

    if (page && /^\d+$/.test(page)) {
      params.set('pageNumber', page);
    }

    return `https://e.issuu.com/embed.html?${params.toString()}`;
  } catch {
    return url;
  }
};

const BookReaderScreen = ({ navigation, route }: Props) => {
  const { title, url } = route.params;
  const readerUrl = getIssuuReaderUrl(url);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <View style={styles.screen}>
      <View style={styles.readerHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.75} style={styles.iconButton}>
          <Icon name="chevron-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.readerBody}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#155DFC" />
            <Text style={styles.loadingText}>Ном ачааллаж байна...</Text>
          </View>
        )}

        {hasError ? (
          <View style={styles.errorState}>
            <Icon name="alert-circle-outline" size={30} color="#EF4444" />
            <Text style={styles.errorTitle}>Ном нээгдэхгүй байна</Text>
            <Text style={styles.errorDesc}>Issuu холбоосыг дахин шалгаад оролдоно уу.</Text>
            <TouchableOpacity
              onPress={() => {
                setHasError(false);
                setIsLoading(true);
              }}
              activeOpacity={0.75}
              style={styles.retryButton}
            >
              <Icon name="refresh-outline" size={16} color="#FFFFFF" />
              <Text style={styles.retryText}>Дахин ачааллах</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            source={{ uri: readerUrl }}
            style={styles.webView}
            originWhitelist={['*']}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            setSupportMultipleWindows={false}
            mixedContentMode="always"
            onLoadEnd={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  readerHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  title: { flex: 1, color: '#0F172A', fontSize: 15, fontWeight: '800' },
  readerBody: { flex: 1, backgroundColor: '#F8FAFC' },
  webView: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { color: '#64748B', fontSize: 13, fontWeight: '700' },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  errorTitle: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  errorDesc: { color: '#64748B', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  retryButton: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#155DFC',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  retryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});

export default BookReaderScreen;
