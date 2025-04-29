import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as FileSystem from 'expo-file-system';
import voskService from './services/voskService';
import geminiService from './services/geminiService';

export default function AIAnaliz() {
  const router = useRouter();
  const [kayitlar, setKayitlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [analizSonucu, setAnalizSonucu] = useState(null);
  const [modelYukleniyor, setModelYukleniyor] = useState(true);
  const [analizDurumu, setAnalizDurumu] = useState('');
  const [geminiAnaliz, setGeminiAnaliz] = useState('');
  const [soru, setSoru] = useState('');
  const [cevap, setCevap] = useState('');
  const [soruYukleniyor, setSoruYukleniyor] = useState(false);

  useEffect(() => {
    kayitlariYukle();
    initVoskModel();
  }, []);

  const initVoskModel = async () => {
    try {
      setModelYukleniyor(true);
      setAnalizDurumu('AI modeli yükleniyor...');
      const modelLoaded = await voskService.initModel();
      if (!modelLoaded) {
        Alert.alert('Hata', 'AI modeli yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
      } else {
        setAnalizDurumu('AI modeli başarıyla yüklendi');
      }
    } catch (error) {
      console.error('Model yükleme hatası:', error);
      Alert.alert('Hata', 'AI modeli yüklenirken bir hata oluştu.');
    } finally {
      setModelYukleniyor(false);
    }
  };

  const kayitlariYukle = async () => {
    try {
      const kayitlarString = await AsyncStorage.getItem('uyku_kayitlari');
      if (!kayitlarString) {
        setKayitlar([]);
        return;
      }

      let kayitlar;
      try {
        kayitlar = JSON.parse(kayitlarString);
      } catch (parseError) {
        console.error('JSON parse hatası:', parseError);
        setKayitlar([]);
        return;
      }

      if (!Array.isArray(kayitlar)) {
        console.error('Kayıtlar dizi formatında değil');
        setKayitlar([]);
        return;
      }

      const gecerliKayitlar = kayitlar.filter(kayit => {
        return (
          typeof kayit === 'object' &&
          kayit !== null &&
          typeof kayit.id === 'string' &&
          typeof kayit.tarih === 'string' &&
          typeof kayit.sesKaydi === 'string'
        );
      });

      setKayitlar(gecerliKayitlar);
    } catch (error) {
      console.error('Kayıtlar yüklenirken hata:', error);
      Alert.alert('Hata', 'Kayıtlar yüklenirken bir hata oluştu');
      setKayitlar([]);
    }
  };

  const formatTarih = (tarihString) => {
    try {
      const tarih = parseISO(tarihString);
      return format(tarih, 'dd MMMM yyyy HH:mm', { locale: tr });
    } catch (error) {
      console.error('Tarih formatlama hatası:', error);
      return 'Geçersiz Tarih';
    }
  };

  const sesAnaliziYap = async (kayit) => {
    try {
      if (modelYukleniyor) {
        Alert.alert('Uyarı', 'AI modeli hala yükleniyor. Lütfen bekleyin.');
        return;
      }

      setYukleniyor(true);
      setAnalizDurumu('Ses dosyası kontrol ediliyor...');

      const fileInfo = await FileSystem.getInfoAsync(kayit.sesKaydi);
      if (!fileInfo.exists) {
        Alert.alert('Hata', 'Ses dosyası bulunamadı');
        return;
      }

      setAnalizDurumu('Ses analizi başlatılıyor...');
      
      const analiz = await voskService.analyzeAudio(kayit.sesKaydi);
      
      setAnalizDurumu('AI analizi yapılıyor...');
      const geminiSonuc = await geminiService.analyzeSleepData({
        ...analiz,
        uykuSuresi: kayit.uykuSuresi
      });
      
      setAnalizDurumu('Analiz tamamlandı');
      setAnalizSonucu(analiz);
      setGeminiAnaliz(geminiSonuc);
    } catch (error) {
      console.error('Analiz hatası:', error);
      Alert.alert('Hata', 'Ses analizi yapılırken bir hata oluştu');
      setAnalizDurumu('Analiz sırasında hata oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  const soruSor = async () => {
    if (!soru.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir soru girin');
      return;
    }

    if (!analizSonucu) {
      Alert.alert('Uyarı', 'Önce bir kayıt analiz edin');
      return;
    }

    try {
      setSoruYukleniyor(true);
      const yanit = await geminiService.answerUserQuestion(soru, {
        ...analizSonucu,
        uykuSuresi: kayitlar.find(k => k.id === analizSonucu.id)?.uykuSuresi || 0
      });
      setCevap(yanit);
    } catch (error) {
      console.error('Soru yanıtlama hatası:', error);
      Alert.alert('Hata', 'Soru yanıtlanırken bir hata oluştu');
    } finally {
      setSoruYukleniyor(false);
    }
  };

  const renderAnalizSonucu = () => {
    if (!analizSonucu) return null;

    return (
      <View style={styles.analizContainer}>
        <Text style={styles.analizTitle}>AI Analiz Sonuçları</Text>
        
        <View style={styles.analizItem}>
          <Text style={styles.analizLabel}>Horlama Durumu:</Text>
          <Text style={[styles.analizValue, analizSonucu.horlama ? styles.uyariText : styles.normalText]}>
            {analizSonucu.horlama ? 'Var' : 'Yok'}
          </Text>
        </View>

        <View style={styles.analizItem}>
          <Text style={styles.analizLabel}>Horlama Seviyesi:</Text>
          <Text style={[styles.analizValue, analizSonucu.horlamaSeviyesi > 2 ? styles.uyariText : styles.normalText]}>
            {analizSonucu.horlamaSeviyesi}/3
          </Text>
        </View>

        <View style={styles.analizItem}>
          <Text style={styles.analizLabel}>Nefes Alma Problemleri:</Text>
          <Text style={[styles.analizValue, analizSonucu.nefesAlmaProblemleri ? styles.uyariText : styles.normalText]}>
            {analizSonucu.nefesAlmaProblemleri ? 'Var' : 'Yok'}
          </Text>
        </View>

        <View style={styles.analizItem}>
          <Text style={styles.analizLabel}>Uyku Kalitesi:</Text>
          <Text style={[styles.analizValue, analizSonucu.uykuKalitesi < 3 ? styles.uyariText : styles.normalText]}>
            {analizSonucu.uykuKalitesi}/5
          </Text>
        </View>

        {geminiAnaliz && (
          <View style={styles.geminiAnalizContainer}>
            <Text style={styles.geminiTitle}>Detaylı Analiz</Text>
            <Text style={styles.geminiText}>{geminiAnaliz}</Text>
          </View>
        )}

        <View style={styles.soruContainer}>
          <Text style={styles.soruTitle}>Soru Sor</Text>
          <TextInput
            style={styles.soruInput}
            value={soru}
            onChangeText={setSoru}
            placeholder="Uyku kaliteniz hakkında soru sorun..."
            placeholderTextColor="#666"
          />
          <TouchableOpacity
            style={styles.soruButton}
            onPress={soruSor}
            disabled={soruYukleniyor}
          >
            <Text style={styles.soruButtonText}>
              {soruYukleniyor ? 'Yanıtlanıyor...' : 'Sor'}
            </Text>
          </TouchableOpacity>
        </View>

        {cevap && (
          <View style={styles.cevapContainer}>
            <Text style={styles.cevapTitle}>AI Yanıtı</Text>
            <Text style={styles.cevapText}>{cevap}</Text>
          </View>
        )}
      </View>
    );
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
        <Text style={styles.title}>AI Analiz</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.durumContainer}>
          <Text style={styles.durumText}>{analizDurumu}</Text>
        </View>

        <View style={styles.kayitlarContainer}>
          <Text style={styles.kayitlarTitle}>Kayıtlar</Text>
          {kayitlar.length === 0 ? (
            <Text style={styles.bosText}>Henüz kayıt bulunmuyor</Text>
          ) : (
            kayitlar.map((kayit) => (
              <TouchableOpacity
                key={kayit.id}
                style={styles.kayitItem}
                onPress={() => sesAnaliziYap(kayit)}
              >
                <Text style={styles.kayitTarih}>{formatTarih(kayit.tarih)}</Text>
                <Text style={styles.kayitSure}>Uyku Süresi: {kayit.uykuSuresi} saat</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {yukleniyor && (
          <View style={styles.yukleniyorContainer}>
            <ActivityIndicator size="large" color="#e94560" />
            <Text style={styles.yukleniyorText}>Analiz yapılıyor...</Text>
          </View>
        )}

        {renderAnalizSonucu()}
      </ScrollView>
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
  kayitTarih: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
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
  yukleniyorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  yukleniyorText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  analizContainer: {
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
  analizTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  analizItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  analizLabel: {
    fontSize: 16,
    color: '#fff',
  },
  analizValue: {
    fontSize: 16,
    color: '#e94560',
    fontWeight: 'bold',
  },
  onerilerContainer: {
    marginTop: 20,
  },
  onerilerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  oneriText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5,
  },
  durumContainer: {
    backgroundColor: '#16213e',
    margin: 20,
    padding: 15,
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
  durumText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  normalText: {
    color: '#4CAF50',
  },
  uyariText: {
    color: '#e94560',
  },
  geminiAnalizContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
  },
  geminiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  geminiText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  soruContainer: {
    marginTop: 20,
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
    marginBottom: 10,
  },
  soruButton: {
    backgroundColor: '#e94560',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  soruButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cevapContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
  },
  cevapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  cevapText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
}); 