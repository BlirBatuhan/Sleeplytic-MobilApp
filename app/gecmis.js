import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';

export default function Gecmis() {
  const router = useRouter();
  const [kayitlar, setKayitlar] = useState([]);
  const [sound, setSound] = useState(null);

  useEffect(() => {
    kayitlariYukle();
    return () => {
      if (sound) {
        sound.unloadAsync().catch(error => {
          console.error('Ses temizleme hatası:', error);
        });
      }
    };
  }, []);

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

      // Kayıtların geçerli bir dizi olduğunu kontrol et
      if (!Array.isArray(kayitlar)) {
        console.error('Kayıtlar dizi formatında değil');
        setKayitlar([]);
        return;
      }

      // Her kaydın gerekli alanları içerdiğini kontrol et
      const gecerliKayitlar = kayitlar.filter(kayit => {
        return (
          typeof kayit === 'object' &&
          kayit !== null &&
          typeof kayit.id === 'string' &&
          typeof kayit.tarih === 'string' &&
          typeof kayit.sesKaydi === 'string' &&
          typeof kayit.uykuSuresi === 'number'
        );
      });

      // Kayıtları tarihe göre sırala (en yeniden en eskiye)
      gecerliKayitlar.sort((a, b) => {
        try {
          return new Date(b.tarih) - new Date(a.tarih);
        } catch (error) {
          console.error('Tarih sıralama hatası:', error);
          return 0;
        }
      });

      setKayitlar(gecerliKayitlar);
    } catch (error) {
      console.error('Kayıtlar yüklenirken hata:', error);
      Alert.alert('Hata', 'Kayıtlar yüklenirken bir hata oluştu');
      setKayitlar([]);
    }
  };

  const sesCal = async (uri) => {
    try {
      if (!uri) {
        Alert.alert('Hata', 'Ses dosyası bulunamadı');
        return;
      }

      // Dosyanın var olup olmadığını kontrol et
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        Alert.alert('Hata', 'Ses dosyası bulunamadı');
        return;
      }

      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (error) {
          console.error('Önceki ses temizleme hatası:', error);
        }
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      if (!newSound) {
        throw new Error('Ses oluşturulamadı');
      }
      
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error('Ses çalınırken hata:', error);
      Alert.alert('Hata', 'Ses çalınırken bir hata oluştu');
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (unloadError) {
          console.error('Ses temizleme hatası:', unloadError);
        }
      }
      setSound(null);
    }
  };

  const kayitSil = async (id) => {
    try {
      Alert.alert(
        'Kayıt Sil',
        'Bu kaydı silmek istediğinizden emin misiniz?',
        [
          {
            text: 'İptal',
            style: 'cancel',
          },
          {
            text: 'Sil',
            style: 'destructive',
            onPress: async () => {
              const kayit = kayitlar.find(k => k.id === id);
              if (kayit) {
                // Ses dosyasını sil
                try {
                  const fileInfo = await FileSystem.getInfoAsync(kayit.sesKaydi);
                  if (fileInfo.exists) {
                    await FileSystem.deleteAsync(kayit.sesKaydi);
                  }
                } catch (error) {
                  console.error('Dosya silme hatası:', error);
                }
              }

              const yeniKayitlar = kayitlar.filter(kayit => kayit.id !== id);
              await AsyncStorage.setItem('uyku_kayitlari', JSON.stringify(yeniKayitlar));
              setKayitlar(yeniKayitlar);
              Alert.alert('Başarılı', 'Kayıt başarıyla silindi');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Kayıt silinirken hata:', error);
      Alert.alert('Hata', 'Kayıt silinirken bir hata oluştu');
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

  const renderKayit = ({ item }) => (
    <View style={styles.kayitContainer}>
      <View style={styles.kayitBilgi}>
        <Text style={styles.tarih}>
          {formatTarih(item.tarih)}
        </Text>
        <Text style={styles.sure}>Uyku Süresi: {item.uykuSuresi} saat</Text>
      </View>
      <View style={styles.butonlar}>
        <TouchableOpacity
          style={[styles.buton, styles.calButon]}
          onPress={() => sesCal(item.sesKaydi)}
        >
          <Text style={styles.butonText}>Çal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buton, styles.silButon]}
          onPress={() => kayitSil(item.id)}
        >
          <Text style={styles.butonText}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Geçmiş Kayıtlar</Text>
      </View>
      {kayitlar.length === 0 ? (
        <Text style={styles.bosText}>Henüz kayıt bulunmuyor</Text>
      ) : (
        <FlatList
          data={kayitlar}
          renderItem={renderKayit}
          keyExtractor={(item) => {
            if (!item || typeof item.id === 'undefined') {
              console.error('Geçersiz kayıt ID:', item);
              return Date.now().toString();
            }
            return String(item.id);
          }}
          contentContainerStyle={styles.listeContainer}
        />
      )}
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
  listeContainer: {
    padding: 20,
  },
  kayitContainer: {
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  kayitBilgi: {
    marginBottom: 10,
  },
  tarih: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  sure: {
    fontSize: 14,
    color: '#ccc',
  },
  butonlar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  buton: {
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  calButon: {
    backgroundColor: '#e94560',
  },
  silButon: {
    backgroundColor: '#ff0000',
  },
  butonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bosText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
}); 