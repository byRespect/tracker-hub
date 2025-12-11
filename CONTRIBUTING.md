# Tracker Hub'a Katkıda Bulunma

Tracker Hub'a katkıda bulunmak istediğiniz için teşekkürler! 🎉

## 📋 Başlamadan Önce

1. Bu repository'yi fork'layın
2. Lokal makinenize klonlayın
3. `pnpm install` ile bağımlılıkları yükleyin

## 🔧 Geliştirme Ortamı

```bash
# Bağımlılıkları yükle
pnpm install

# Tüm paketleri derle
pnpm build

# Development modunda çalıştır
pnpm --filter dashboard dev
pnpm --filter backend start:dev
```

## 📝 Commit Mesajları

[Conventional Commits](https://www.conventionalcommits.org/) formatını kullanıyoruz:

```
<tip>(<kapsam>): <açıklama>

[isteğe bağlı gövde]

[isteğe bağlı dipnot]
```

### Tipler

- `feat`: Yeni özellik
- `fix`: Bug düzeltmesi
- `docs`: Dokümantasyon değişiklikleri
- `style`: Kod formatı değişiklikleri
- `refactor`: Refactoring
- `test`: Test ekleme/düzeltme
- `chore`: Build, araç değişiklikleri

### Örnekler

```bash
feat(dashboard): session filtreleme özelliği eklendi
fix(backend): pagination offset hatası düzeltildi
docs(readme): kurulum adımları güncellendi
```

## 🌿 Branch Stratejisi

- `main` - Production-ready kod
- `develop` - Geliştirme branch'i
- `feature/*` - Yeni özellikler
- `fix/*` - Bug düzeltmeleri
- `docs/*` - Dokümantasyon

## 🔍 Pull Request Süreci

1. `develop` branch'inden yeni bir branch oluşturun
2. Değişikliklerinizi yapın
3. Testlerin geçtiğinden emin olun
4. `pnpm build` ile build'in başarılı olduğunu doğrulayın
5. Pull Request açın

### PR Kontrol Listesi

- [ ] Kod standartlarına uygun
- [ ] Build başarılı
- [ ] Testler geçiyor
- [ ] Dokümantasyon güncellendi (gerekiyorsa)
- [ ] Commit mesajları Conventional Commits formatında

## 📁 Proje Yapısı

```
packages/
├── core/       # Tracker SDK
├── dashboard/  # Admin paneli
├── backend/    # API sunucusu
└── frontend/   # Demo uygulaması
```

## 🎨 Kod Standartları

- TypeScript strict mode
- Türkçe yorumlar, İngilizce teknik terimler
- React component'leri için `React.FC<Props>` pattern
- API çağrıları `api/` klasöründen
- State yönetimi `store/` klasöründen

## ❓ Sorular

Sorularınız için GitHub Issues kullanabilir veya tartışma başlatabilirsiniz.

---

Katkılarınız için teşekkürler! 🙏
