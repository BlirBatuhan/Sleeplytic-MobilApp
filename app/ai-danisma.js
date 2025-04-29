import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Animated } from 'react-native';
import geminiService from './services/geminiService';

export default function AIDanisma() {
  const router = useRouter();
  const [kayitlar, setKayitlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [kayitYukleniyor, setKayitYukleniyor] = useState(false);
  const [seciliKayit, setSeciliKayit] = useState(null);
  const [soru, setSoru] = useState('');
  const [cevap, setCevap] = useState('');
  const [soruYukleniyor, setSoruYukleniyor] = useState(false);
  const [robotAnim] = useState(new Animated.Value(-100));
  const [robotScale] = useState(new Animated.Value(0.8));
  const [robotOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    kayitlariYukle();
  }, []);

  const kayitlariYukle = async () => {
    try {
      setYukleniyor(true);
      const kayitlarString = await AsyncStorage.getItem('uyku_kayitlari');
      const kayitlar = kayitlarString ? JSON.parse(kayitlarString) : [];
      setKayitlar(kayitlar);
    } catch (error) {
      console.error('Kayıtlar yükleme hatası:', error);
      Alert.alert('Hata', 'Kayıtlar yüklenirken bir hata oluştu.');
    } finally {
      setYukleniyor(false);
    }
  };

  const formatTarih = (tarihString) => {
    try {
      return format(parseISO(tarihString), 'dd MMMM yyyy HH:mm', { locale: tr });
    } catch (error) {
      console.error('Tarih formatlama hatası:', error);
      return tarihString;
    }
  };

  const kayitSec = (kayit) => {
    setSeciliKayit(kayit);
    setCevap('');
    // Robot animasyonunu başlat
    Animated.parallel([
      Animated.timing(robotAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(robotScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(robotOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  };

  const soruSor = async () => {
    if (!soru.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir soru girin.');
      return;
    }

    if (!seciliKayit) {
      Alert.alert('Uyarı', 'Lütfen önce bir kayıt seçin.');
      return;
    }

    try {
      setSoruYukleniyor(true);
      // Robot animasyonunu güncelle
      Animated.sequence([
        Animated.timing(robotScale, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(robotScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();

      const yanit = await geminiService.answerUserQuestion(soru, {
        ...seciliKayit,
        uykuSuresi: seciliKayit.uykuSuresi || 0
      });
      setCevap(yanit);
    } catch (error) {
      console.error('Soru sorma hatası:', error);
      Alert.alert('Hata', 'Soru sorulurken bir hata oluştu.');
      setSoruYukleniyor(false);
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
        <Text style={styles.title}>AI Danışman</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.kayitlarContainer}>
          <Text style={styles.kayitlarTitle}>Kayıtlar</Text>
          {yukleniyor ? (
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : kayitlar.length === 0 ? (
            <Text style={styles.bosText}>Henüz kayıt bulunmuyor</Text>
          ) : (
            kayitlar.map((kayit) => (
              <TouchableOpacity 
                key={kayit.id}
                style={[
                  styles.kayitItem,
                  seciliKayit?.id === kayit.id && styles.seciliKayit
                ]}
                onPress={() => kayitSec(kayit)}
              >
                <Text style={styles.kayitTarih}>{formatTarih(kayit.tarih)}</Text>
                <Text style={styles.kayitSure}>Süre: {kayit.uykuSuresi} saat</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {seciliKayit && (
          <View style={styles.soruContainer}>
            <Text style={styles.soruTitle}>Sorunuzu Sorun</Text>
            <TextInput
              style={styles.soruInput}
              value={soru}
              onChangeText={setSoru}
              placeholder="Uyku kaliteniz hakkında soru sorun..."
              placeholderTextColor="#666"
              multiline
            />
            <TouchableOpacity 
              style={[styles.soruButton, soruYukleniyor && styles.soruButtonDisabled]}
              onPress={soruSor}
              disabled={soruYukleniyor}
            >
              <Text style={styles.soruButtonText}>
                {soruYukleniyor ? 'Yanıt Bekleniyor...' : 'Sor'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {cevap && (
          <View style={styles.cevapContainer}>
            <Text style={styles.cevapTitle}>AI Yanıtı</Text>
            <Text style={styles.cevapText}>{cevap}</Text>
          </View>
        )}
      </ScrollView>

      <Animated.View style={[
        styles.robotContainer,
        {
          transform: [
            { translateX: robotAnim },
            { scale: robotScale }
          ],
          opacity: robotOpacity
        }
      ]}>
        <View style={styles.robot}>
          <View style={styles.robotHead}>
            <View style={styles.robotEye} />
            <View style={styles.robotEye} />
            <View style={styles.robotMouth} />
          </View>
          <View style={styles.robotBody}>
            <View style={styles.robotArm} />
            <View style={styles.robotArm} />
            <View style={styles.robotLeg} />
            <View style={styles.robotLeg} />
          </View>
        </View>
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
    padding: 20,
  },
  kayitlarContainer: {
    marginBottom: 30,
  },
  kayitlarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  kayitItem: {
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  seciliKayit: {
    borderColor: '#2196F3',
    backgroundColor: '#1a2a3e',
  },
  kayitTarih: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  kayitSure: {
    fontSize: 14,
    color: '#4CAF50',
  },
  soruContainer: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  soruTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  soruInput: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  soruButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  soruButtonDisabled: {
    backgroundColor: '#2a3a2a',
  },
  soruButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cevapContainer: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  cevapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  cevapText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  bosText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  robotContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 100,
    height: 100,
  },
  robot: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotHead: {
    width: 40,
    height: 40,
    backgroundColor: '#2196F3',
    borderRadius: 20,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  robotEye: {
    width: 8,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  robotMouth: {
    width: 20,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
    position: 'absolute',
    bottom: 5,
  },
  robotBody: {
    width: 30,
    height: 40,
    backgroundColor: '#2196F3',
    borderRadius: 5,
    position: 'relative',
  },
  robotArm: {
    width: 8,
    height: 30,
    backgroundColor: '#2196F3',
    position: 'absolute',
    top: 5,
  },
  robotLeg: {
    width: 8,
    height: 30,
    backgroundColor: '#2196F3',
    position: 'absolute',
    bottom: -25,
  },
  'robotArm:first-child': {
    left: -10,
  },
  'robotArm:last-child': {
    right: -10,
  },
  'robotLeg:first-child': {
    left: 5,
  },
  'robotLeg:last-child': {
    right: 5,
  },
}); 