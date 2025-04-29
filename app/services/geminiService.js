import { GoogleGenerativeAI } from '@google/generative-ai';

// API anahtarını güncelle ve yapılandırmayı belirt
const genAI = new GoogleGenerativeAI('AIzaSyDQEKhlOfSkvcBiEso2FHoilNngMzxUJa8', {
  apiEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
});

class GeminiService {
  constructor() {
    try {
      this.model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      });
    } catch (error) {
      console.error('Gemini model başlatma hatası:', error);
    }
  }

  async analyzeSleepData(sleepData) {
    try {
      if (!this.model) {
        throw new Error('Gemini model başlatılamadı');
      }

      const prompt = `
        Aşağıdaki uyku verilerini analiz edip, kişinin uyku kalitesi ve sağlık durumu hakkında detaylı bir değerlendirme yap:
        
        Horlama Durumu: ${sleepData.horlama ? 'Var' : 'Yok'}
        Horlama Seviyesi: ${sleepData.horlamaSeviyesi}/3
        Nefes Alma Problemleri: ${sleepData.nefesAlmaProblemleri ? 'Var' : 'Yok'}
        Uyku Kalitesi: ${sleepData.uykuKalitesi}/5
        Uyku Süresi: ${sleepData.uykuSuresi} saat
        
        Lütfen şu başlıklar altında değerlendirme yap:
        1. Genel Uyku Kalitesi Değerlendirmesi
        2. Sağlık Durumu Analizi
        3. Öneriler ve İyileştirmeler
        4. Dikkat Edilmesi Gereken Noktalar
      `;

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      return result.response.text();
    } catch (error) {
      console.error('Gemini analiz hatası:', error);
      return this.generateDefaultAnalysis(sleepData);
    }
  }

  async answerUserQuestion(question, sleepData) {
    try {
      if (!this.model) {
        throw new Error('Gemini model başlatılamadı');
      }

      const prompt = `
        Kullanıcının uyku verileri:
        Horlama Durumu: ${sleepData.horlama ? 'Var' : 'Yok'}
        Horlama Seviyesi: ${sleepData.horlamaSeviyesi}/3
        Nefes Alma Problemleri: ${sleepData.nefesAlmaProblemleri ? 'Var' : 'Yok'}
        Uyku Kalitesi: ${sleepData.uykuKalitesi}/5
        Uyku Süresi: ${sleepData.uykuSuresi} saat

        Kullanıcının sorusu: ${question}

        Lütfen bu veriler ışığında kullanıcının sorusunu yanıtla.
      `;

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      return result.response.text();
    } catch (error) {
      console.error('Gemini soru yanıtlama hatası:', error);
      return this.generateDefaultAnswer(question, sleepData);
    }
  }

  generateDefaultAnalysis(sleepData) {
    return `
1. Genel Uyku Kalitesi Değerlendirmesi:
${sleepData.uykuKalitesi >= 4 ? 'İyi' : sleepData.uykuKalitesi >= 2 ? 'Orta' : 'Kötü'} bir uyku kalitesine sahipsiniz.

2. Sağlık Durumu Analizi:
• ${sleepData.horlama ? 'Horlama tespit edildi' : 'Horlama tespit edilmedi'}
• ${sleepData.nefesAlmaProblemleri ? 'Nefes alma problemleri tespit edildi' : 'Nefes alma normal'}
• Uyku Süresi: ${sleepData.uykuSuresi} saat

3. Öneriler ve İyileştirmeler:
${this.generateOneriler(sleepData).join('\n')}

4. Dikkat Edilmesi Gereken Noktalar:
• Düzenli uyku saatleri oluşturun
• Yatak odanızı karanlık ve sessiz tutun
• Yatmadan önce elektronik cihazlardan uzak durun
• Stres yönetimi için meditasyon yapın
`;
  }

  generateDefaultAnswer(question, sleepData) {
    const yanitlar = {
      'uyku kalitem nasıl': `Uyku kaliteniz ${sleepData.uykuKalitesi}/5 seviyesinde. ${
        sleepData.uykuKalitesi >= 4 ? 'İyi bir uyku kalitesine sahipsiniz.' :
        sleepData.uykuKalitesi >= 2 ? 'Orta seviyede bir uyku kalitesine sahipsiniz.' :
        'Uyku kalitenizi artırmak için önerilerimizi dikkate alın.'
      }`,
      'horluyor muyum': sleepData.horlama ? 
        'Evet, horlama tespit edildi. Yatış pozisyonunuzu değiştirmeyi ve bir uzmana başvurmayı düşünebilirsiniz.' :
        'Hayır, horlama tespit edilmedi.',
      'nefes alma problemim var mı': sleepData.nefesAlmaProblemleri ?
        'Evet, nefes alma problemleri tespit edildi. Burun tıkanıklığınız varsa tedavi olmanızı öneririz.' :
        'Hayır, nefes alma problemleri tespit edilmedi.',
      'ne kadar uyudum': `Toplam ${sleepData.uykuSuresi} saat uyumuşsunuz. ${
        sleepData.uykuSuresi >= 7 ? 'Bu süre ideal bir uyku süresidir.' :
        sleepData.uykuSuresi >= 5 ? 'Bu süre kabul edilebilir bir uyku süresidir.' :
        'Uyku sürenizi artırmanızı öneririz.'
      }`,
      'önerileriniz neler': this.generateOneriler(sleepData).join('\n')
    };

    // Soruya en uygun yanıtı bul
    const yanit = Object.entries(yanitlar).find(([key]) => 
      question.toLowerCase().includes(key)
    );

    return yanit ? yanit[1] : 'Bu konuda size yardımcı olabilirim. Lütfen sorunuzu daha detaylı bir şekilde sorun.';
  }

  generateOneriler(sleepData) {
    const oneriler = [];
    
    if (sleepData.horlama) {
      oneriler.push('• Yatış pozisyonunuzu değiştirmeyi deneyin');
      oneriler.push('• Yastık yüksekliğinizi ayarlayın');
      oneriler.push('• Kilo vermeyi düşünün');
    }
    
    if (sleepData.nefesAlmaProblemleri) {
      oneriler.push('• Burun tıkanıklığınız varsa tedavi olun');
      oneriler.push('• Yatak odanızı havalandırın');
      oneriler.push('• Alerjenlerden uzak durun');
    }
    
    if (sleepData.uykuKalitesi < 3) {
      oneriler.push('• Düzenli egzersiz yapın');
      oneriler.push('• Kafein tüketimini azaltın');
      oneriler.push('• Uyku düzeninizi koruyun');
    }
    
    if (sleepData.uykuSuresi < 6) {
      oneriler.push('• Uyku sürenizi artırın');
      oneriler.push('• Erken yatmayı deneyin');
      oneriler.push('• Günlük aktivitelerinizi düzenleyin');
    }

    return oneriler;
  }
}

export default new GeminiService(); 