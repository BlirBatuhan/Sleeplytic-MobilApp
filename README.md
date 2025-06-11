# 🌙 Sleeplytic - Uyku Takip ve Analiz Uygulaması

**Sleeplytic**, kullanıcıların uyku kalitesini takip etmesi, AI destekli analiz alması ve uyku alışkanlıklarını iyileştirmesi için geliştirilmiş modern bir mobil uygulamadır.

## 📱 Özellikler

### 🎯 Ana Özellikler
- **Uyku Ses Kaydı**: Gerçek zamanlı uyku süresi takibi ve ses kaydı
- **AI Destekli Analiz**: Vosk ve Gemini AI ile uyku kalitesi analizi
- **Kişiselleştirilmiş Danışmanlık**: AI tabanlı uyku tavsiyeleri
- **İstatistik Raporları**: Detaylı uyku verileri ve trendler
- **Günlük Tavsiyeler**: Rastgele uyku sağlığı önerileri

### 🤖 AI Teknolojileri
- **Vosk AI**: Offline ses analizi (horlama, nefes sorunları)
- **Google Gemini API**: Kullanıcı sorularına yanıt ve kişisel tavsiyeler
- **Akıllı Analiz**: Uyku kalitesi skorlama ve öneriler

## 🛠️ Teknoloji Stack

- **Framework**: React Native + Expo
- **Platform**: iOS & Android
- **Veritabanı**: AsyncStorage (Local Storage)
- **AI Servisleri**: Vosk, Google Gemini API
- **Ses İşleme**: expo-av
- **Tarih İşlemleri**: date-fns
- **Navigasyon**: Expo Router

## 📸 Uygulama Görüntüleri

### Ana Sayfa
<img src="screenshots/ana-sayfa.png" width="300" alt="Ana Sayfa">

*Ana sayfa - Ay ve yıldız animasyonları, günlük tavsiyeler ve navigasyon butonları*

### AI Danışman
<img src="screenshots/ai-danisma.png" width="300" alt="AI Danışman">

*AI Danışman - Uyku kayıtları seçimi ve soru-cevap sistemi*

### İstatistikler
<img src="screenshots/istatistikler.png" width="300" alt="İstatistikler">

*İstatistikler - Haftalık özet ve detaylı uyku verileri*

### AI Analiz
<img src="screenshots/ai-analiz.png" width="300" alt="AI Analiz">

*AI Analiz - Ses kayıtlarının yapay zeka ile analizi*

## 🚀 Kurulum

### Gereksinimler
- Node.js (v16 veya üzeri)
- npm veya yarn
- Expo CLI
- Expo Go uygulaması (mobil test için)

### Kurulum Adımları

1. **Projeyi klonlayın**
```bash
git clone https://github.com/BlirBatuhan/Sleeplytic-MobilApp.git
cd Sleeplytic-MobilApp
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Uygulamayı başlatın**
```bash
npm start
```

4. **Mobil cihazda test edin**
   - Expo Go uygulamasını indirin
   - QR kodu tarayın veya bağlantıyı kullanın

## ⚙️ Konfigürasyon

### Gemini API Anahtarı
`app/services/geminiService.js` dosyasında API anahtarınızı güncelleyin:

```javascript
const API_KEY = 'YOUR_GEMINI_API_KEY';
```

### İzinler
Uygulama aşağıdaki izinleri gerektirir:
- Mikrofon erişimi (ses kaydı için)
- Dosya sistemi erişimi (kayıt saklama için)

## 📚 Kullanım

1. **Kayıt Başlatma**: Ana sayfadan "Kayıt Başlat" butonuna basın
2. **Uyku Takibi**: Uygulama otomatik olarak süreyi takip eder
3. **AI Analizi**: Kayıtlarınızı analiz ettirmek için "AI Analiz" sayfasını kullanın
4. **Danışmanlık**: "AI Danışman" ile uyku konularında soru sorun
5. **İstatistikler**: "İstatistikler" sayfasında gelişiminizi takip edin

## 🎨 Özellikler

### Animasyonlar
- Ay ve yıldız animasyonları (ana sayfa)
- AI robot animasyonu (danışman sayfası)
- Yumuşak geçiş efektleri

### Tema
- Modern karanlık tema
- Uyku dostu renk paleti
- Kullanıcı dostu arayüz

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👨‍💻 Geliştirici

**Batuhan Bir**
- GitHub: [@BlirBatuhan](https://github.com/BlirBatuhan)

## 🔮 Gelecek Özellikler

- [ ] Cloud sync (bulut senkronizasyonu)
- [ ] Çoklu kullanıcı desteği
- [ ] Apple Health/Google Fit entegrasyonu
- [ ] Detaylı uyku aşaması analizi
- [ ] Sosyal özellikler ve paylaşım

## 📞 Destek

Herhangi bir sorun veya öneriniz için:
- Issues açın
- E-posta gönderin
- Pull request oluşturun

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
