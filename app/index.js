import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { Animated } from 'react-native';

const uykuTavsiyeleri = [
  "Uyku öncesi mavi ışık yayan cihazlardan uzak durmak, melatonin hormonunun daha iyi salgılanmasını sağlar.",
  "Düzenli uyku saatleri, vücudun biyolojik saatini düzenleyerek daha kaliteli uyku sağlar.",
  "Uyku öncesi 15-20 dakika meditasyon yapmak, uyku kalitesini artırır.",
  "Yatak odasının sıcaklığının 18-22°C arasında olması, ideal uyku için önerilir.",
  "Uyku öncesi ağır yemeklerden kaçınmak, daha rahat bir uyku sağlar.",
  "Düzenli egzersiz yapmak, uyku kalitesini artırır ancak yatmadan 3 saat önce yapılmalıdır.",
  "Uyku öncesi kafein tüketiminden kaçınmak, daha hızlı uykuya dalmayı sağlar.",
  "Yatak odasında sadece uyku ve cinsellik aktivitelerinin yapılması, beynin uyku ile ilişkilendirmesini güçlendirir.",
  "Uyku öncesi ılık bir duş almak, vücut sıcaklığını düşürerek uykuya dalmayı kolaylaştırır.",
  "Uyku süresinin 7-9 saat arasında olması, optimal sağlık için önerilir.",
  "Uyku öncesi rahatlatıcı müzik dinlemek, stres seviyesini düşürür.",
  "Yatak odasının karanlık olması, melatonin hormonunun daha iyi salgılanmasını sağlar.",
  "Uyku öncesi günlük tutmak, zihinsel rahatlama sağlar.",
  "Düzenli uyku saatleri, bağışıklık sistemini güçlendirir.",
  "Uyku öncesi yoga yapmak, kas gerginliğini azaltır.",
  "Uyku sırasında vücut, günlük hasarları onarır ve yeniler.",
  "Uyku eksikliği, kilo alımına ve metabolik bozukluklara yol açabilir.",
  "Uyku öncesi su içmek önemlidir, ancak çok fazla içmek uykuyu bölebilir.",
  "Uyku sırasında beyin, günlük bilgileri işler ve hafızayı güçlendirir.",
  "Uyku öncesi rahatlatıcı bitki çayları içmek, uyku kalitesini artırır."
];

export default function App() {
  const router = useRouter();
  const recordingRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [gecenSure, setGecenSure] = useState(0);
  const timerRef = useRef(null);
  const [kayitlar, setKayitlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [kayitYukleniyor, setKayitYukleniyor] = useState(false);
  const [kayitDurumu, setKayitDurumu] = useState('beklemede'); // beklemede, kaydediliyor, kaydedildi
  const [kayitSuresi, setKayitSuresi] = useState(0);
  const [timer, setTimer] = useState(null);
  const [moonAnim] = useState(new Animated.Value(0));
  const [starAnim] = useState(new Animated.Value(0));
  const [rastgeleTavsiye, setRastgeleTavsiye] = useState('');

  useEffect(() => {
    kayitlariYukle();
    // Ay ve yıldız animasyonları
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(moonAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(moonAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(starAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(starAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Rastgele tavsiye seç
    const randomIndex = Math.floor(Math.random() * uykuTavsiyeleri.length);
    setRastgeleTavsiye(uykuTavsiyeleri[randomIndex]);

    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const checkPermissions = async () => {
    const { status } = await Audio.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Audio.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert('Hata', 'Mikrofon izni verilmedi.');
        return false;
      }
    }
    return true;
  };

  const startRecording = async () => {
    try {
      if (isRecording) {
        Alert.alert('Uyarı', 'Zaten bir kayıt devam ediyor');
        return;
      }

      if (!(await checkPermissions())) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const recordingObject = new Audio.Recording();
      await recordingObject.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recordingObject.startAsync();

      recordingRef.current = recordingObject;
      setIsRecording(true);
      setGecenSure(0);
      
      timerRef.current = setInterval(() => {
        setGecenSure(onceki => onceki + 1);
      }, 1000);
      
      Alert.alert('Başarılı', 'Kayıt başlatıldı');
    } catch (error) {
      console.error('Kayıt başlatma hatası:', error);
      Alert.alert('Hata', `Kayıt başlatılamadı: ${error.message}`);
    }
  };

  const stopRecording = async () => {
    try {
      if (!isRecording || !recordingRef.current) {
        Alert.alert('Uyarı', 'Aktif bir kayıt bulunmuyor');
        return;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      if (uri) {
        // Dosya adını oluştur
        const timestamp = new Date().getTime();
        const fileName = `uyku_kaydi_${timestamp}.m4a`;
        
        // Kayıtlar klasörünü oluştur
        const kayitlarDir = `${FileSystem.documentDirectory}kayitlar/`;
        const dirInfo = await FileSystem.getInfoAsync(kayitlarDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(kayitlarDir);
        }

        // Dosyayı kaydet
        const destinationUri = `${kayitlarDir}${fileName}`;
        await FileSystem.moveAsync({
          from: uri,
          to: destinationUri
        });

        const yeniKayit = {
          id: timestamp.toString(),
          tarih: new Date().toISOString(),
          uykuSuresi: Math.floor(gecenSure / 3600),
          sesKaydi: destinationUri
        };

        try {
          const kayitlarString = await AsyncStorage.getItem('uyku_kayitlari');
          const kayitlar = kayitlarString ? JSON.parse(kayitlarString) : [];
          kayitlar.push(yeniKayit);
          await AsyncStorage.setItem('uyku_kayitlari', JSON.stringify(kayitlar));

          Alert.alert('Başarılı', 'Kayıt başarıyla kaydedildi!', [
            {
              text: 'Geçmiş Kayıtlar',
              onPress: () => router.push('/gecmis')
            }
          ]);
        } catch (error) {
          console.error('Kayıt kaydetme hatası:', error);
          Alert.alert('Hata', 'Kayıt kaydedilirken bir hata oluştu.');
        }
      }

      recordingRef.current = null;
      setIsRecording(false);
    } catch (error) {
      console.error('Kayıt durdurma hatası:', error);
      Alert.alert('Hata', 'Kayıt durdurulurken bir hata oluştu.');
    }
  };

  const formatSure = (saniye) => {
    const saat = Math.floor(saniye / 3600);
    const dakika = Math.floor((saniye % 3600) / 60);
    const kalanSaniye = saniye % 60;
    return `${saat.toString().padStart(2, '0')}:${dakika.toString().padStart(2, '0')}:${kalanSaniye.toString().padStart(2, '0')}`;
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Uyku Takip</Text>
      </View>
      
      <View style={styles.animationContainer}>
        <Animated.View style={[
          styles.moon,
          {
            transform: [
              { translateY: moonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -20]
              })},
              { scale: moonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.1]
              })}
            ],
            opacity: moonAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1]
            })
          }
        ]}>
          <View style={styles.moonInner} />
        </Animated.View>
        
        {[...Array(5)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.star,
              {
                top: `${20 + index * 15}%`,
                left: `${20 + index * 15}%`,
                opacity: starAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8]
                }),
                transform: [{
                  scale: starAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2]
                  })
                }]
              }
            ]}
          />
        ))}
      </View>

      <View style={styles.tavsiyeContainer}>
        <Text style={styles.tavsiyeTitle}>Günün Uyku Tavsiyesi</Text>
        <Text style={styles.tavsiyeText}>{rastgeleTavsiye}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.kayitButton]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={kayitDurumu === 'kaydediliyor'}
        >
          <Text style={styles.buttonText}>
            {isRecording ? 'Kaydı Durdur' : 'Kayıt Başlat'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.gecmisButton]}
          onPress={() => router.push('/gecmis')}
        >
          <Text style={styles.buttonText}>Geçmiş</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.aiButton]}
          onPress={() => router.push('/ai-analiz')}
        >
          <Text style={styles.buttonText}>AI Analiz</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.aiDanismaButton]}
          onPress={() => router.push('/ai-danisma')}
        >
          <Text style={styles.buttonText}>AI Danışman</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.statsButton]}
          onPress={() => router.push('/istatistikler')}
        >
          <Text style={styles.buttonText}>İstatistikler</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.kayitlarContainer}>
          <Text style={styles.kayitlarTitle}>Son Kayıtlar</Text>
          {kayitlar.length === 0 ? (
            <Text style={styles.bosText}>Henüz kayıt bulunmuyor</Text>
          ) : (
            kayitlar.slice(0, 3).map((kayit) => (
              <TouchableOpacity 
                key={kayit.id}
                style={styles.kayitItem}
                onPress={() => router.push(`/kayit/${kayit.id}`)}
              >
                <Text style={styles.kayitTarih}>{formatTarih(kayit.tarih)}</Text>
                <Text style={styles.kayitSure}>Süre: {kayit.uykuSuresi} saat</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
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
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  animationContainer: {
    height: 200,
    position: 'relative',
    marginBottom: 20,
  },
  moon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700',
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 5,
  },
  moonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFE55C',
    position: 'absolute',
    top: 10,
    left: 10,
  },
  star: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    position: 'absolute',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonContainer: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  kayitButton: {
    backgroundColor: '#e94560',
  },
  gecmisButton: {
    backgroundColor: '#4CAF50',
  },
  aiButton: {
    backgroundColor: '#2196F3',
  },
  aiDanismaButton: {
    backgroundColor: '#9C27B0',
  },
  statsButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    marginBottom: 10,
  },
  bosText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  kayitItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 5,
    marginBottom: 10,
  },
  kayitTarih: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  kayitSure: {
    color: '#fff',
    fontSize: 14,
  },
  tavsiyeContainer: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 10,
    margin: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  tavsiyeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
    textAlign: 'center',
  },
  tavsiyeText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 