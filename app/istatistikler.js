import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Animated } from 'react-native';

export default function Istatistikler() {
  const router = useRouter();
  const [kayitlar, setKayitlar] = useState([]);
  const [haftalikOzet, setHaftalikOzet] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    kayitlariYukle();
    // Sayfa açılış animasyonu
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const kayitlariYukle = async () => {
    try {
      const kayitlarString = await AsyncStorage.getItem('uyku_kayitlari');
      const kayitlar = kayitlarString ? JSON.parse(kayitlarString) : [];
      setKayitlar(kayitlar);
      hesaplaHaftalikOzet(kayitlar);
    } catch (error) {
      console.error('Kayıtlar yükleme hatası:', error);
      Alert.alert('Hata', 'Kayıtlar yüklenirken bir hata oluştu.');
    }
  };

  const hesaplaHaftalikOzet = (kayitlar) => {
    const bugun = new Date();
    const haftaninBaslangici = startOfWeek(bugun, { locale: tr });
    const haftaninSonu = endOfWeek(bugun, { locale: tr });

    const haftalikKayitlar = kayitlar.filter(kayit => {
      const kayitTarihi = parseISO(kayit.tarih);
      return isWithinInterval(kayitTarihi, { start: haftaninBaslangici, end: haftaninSonu });
    });

    const toplamSure = haftalikKayitlar.reduce((acc, kayit) => acc + kayit.uykuSuresi, 0);
    const ortalamaSure = haftalikKayitlar.length > 0 ? toplamSure / haftalikKayitlar.length : 0;

    setHaftalikOzet({
      toplamKayit: haftalikKayitlar.length,
      toplamSure,
      ortalamaSure,
      enUzunSure: Math.max(...haftalikKayitlar.map(k => k.uykuSuresi), 0),
      enKisaSure: Math.min(...haftalikKayitlar.map(k => k.uykuSuresi), 0),
    });
  };

  const formatTarih = (tarihString) => {
    try {
      return format(parseISO(tarihString), 'dd MMMM yyyy HH:mm', { locale: tr });
    } catch (error) {
      console.error('Tarih formatlama hatası:', error);
      return tarihString;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>İstatistikler</Text>
      </View>

      <Animated.View style={[
        styles.content,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <ScrollView>
          <View style={styles.haftalikOzetContainer}>
            <Text style={styles.haftalikOzetTitle}>Haftalık Özet</Text>
            
            <View style={styles.istatistikGrid}>
              <View style={styles.istatistikCard}>
                <Text style={styles.istatistikValue}>{haftalikOzet?.toplamKayit || 0}</Text>
                <Text style={styles.istatistikLabel}>Toplam Kayıt</Text>
              </View>

              <View style={styles.istatistikCard}>
                <Text style={styles.istatistikValue}>{haftalikOzet?.toplamSure.toFixed(1) || 0}</Text>
                <Text style={styles.istatistikLabel}>Toplam Süre (Saat)</Text>
              </View>

              <View style={styles.istatistikCard}>
                <Text style={styles.istatistikValue}>{haftalikOzet?.ortalamaSure.toFixed(1) || 0}</Text>
                <Text style={styles.istatistikLabel}>Ortalama Süre (Saat)</Text>
              </View>

              <View style={styles.istatistikCard}>
                <Text style={styles.istatistikValue}>{haftalikOzet?.enUzunSure || 0}</Text>
                <Text style={styles.istatistikLabel}>En Uzun Süre (Saat)</Text>
              </View>

              <View style={styles.istatistikCard}>
                <Text style={styles.istatistikValue}>{haftalikOzet?.enKisaSure || 0}</Text>
                <Text style={styles.istatistikLabel}>En Kısa Süre (Saat)</Text>
              </View>
            </View>
          </View>

          <View style={styles.kayitlarContainer}>
            <Text style={styles.kayitlarTitle}>Son Kayıtlar</Text>
            {kayitlar.length === 0 ? (
              <Text style={styles.bosText}>Henüz kayıt bulunmuyor</Text>
            ) : (
              kayitlar.map((kayit) => (
                <TouchableOpacity 
                  key={kayit.id}
                  style={styles.kayitItem}
                >
                  <View style={styles.kayitHeader}>
                    <Text style={styles.kayitTarih}>{formatTarih(kayit.tarih)}</Text>
                    <Text style={styles.kayitSure}>{kayit.uykuSuresi} saat</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  backButton: {
    marginRight: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  haftalikOzetContainer: {
    backgroundColor: '#16213e',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  haftalikOzetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  istatistikGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  istatistikCard: {
    width: '48%',
    backgroundColor: '#1a1a2e',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  istatistikValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 5,
  },
  istatistikLabel: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
  kayitlarContainer: {
    backgroundColor: '#16213e',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  kayitlarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  kayitItem: {
    backgroundColor: '#1a1a2e',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  kayitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kayitTarih: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  kayitSure: {
    fontSize: 14,
    color: '#ccc',
  },
  bosText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
}); 