# Test planı

Katmanlar: **unit → API/rol → integration → E2E**. Bu belge şu an yalnızca unit katmanının
1. batch'ini kapsıyor; her batch kendi bölümünü ekler.

Kapsam ölçütü LINE coverage, hedef %90. Batch 1'in sonucu:

| Sınıf | LINE | BRANCH | Test |
|---|---|---|---|
| `KeysetCursorCodec` | 100.0% | 100% | 23 |
| `AuditCursorCodec` | 100.0% | — | 5 |
| `RevertValues` | 100.0% | 97% | 37 |
| `AdminBootstrapPolicy` | 100.0% | 100% | 18 |
| `OtpService` | 100.0% | 100% | 13 |
| `RateLimitService` | 98.2% | 93% | 26 |
| `AuditRevertService` | 100.0% | 92% | 30 |
| `LoginLocationService` | 98.8% | 91% | 39 |

**Toplam 191 test (good 80 / bad 111).** Tüm suite: 359 test, 0 hata.
Sayılar parametreli testlerin açılmış hâlidir.

Ortak kurallar: saf JUnit + AssertJ + Mockito, Spring context yok, veritabanı/ağ/dosya
sistemi yok, saat enjekte edildiği her yerde `Clock.fixed`. Testler mirror paketlerde —
`RateLimitService.validateConfiguration()` ve `LoginLocationService.warnIfTokenMissing()`
paket-private olduğu için gerekli.

---

## Bulgular

### BUG-1 — "Backend'de cursor çalışıyor mu?"

**Backend'de yeniden üretilemedi.** Uçtan uca izlendi ve her adım doğru bulundu: wire formatı
(`base64url_nopad("1|<Instant>|<UUID>")`), `decode`'un yedi ayrı reddi, `AuditLogService`
içindeki keyset predicate'i (`createdAt < c.createdAt OR (createdAt = c.createdAt AND id <
c.id)`) ile `ORDER BY createdAt DESC, id DESC` sıralamasının uyumu, `limit + 1` sonda-satır
sondası, controller `@RequestParam cursor` bağlantısı ve DTO'daki `nextCursor` alanı.
`AuditLog.createdAt` bir `Instant` ve `Instant` overload'ını kullanıyor; `LocalDateTime`
saklayan iki moderasyon listesi ise doğru şekilde `Cursor.createdAtLocal()` çağırıyor —
karışık tip karşılaştırması hiçbir yerde yok. `096a484` numaralı çıkarma commit'i de birebir
sadık.

Karar: kırmızı test yok, karakterizasyon testleri var. Format ve her ret bir regresyon ağı
olarak sabitlendi; sorun büyük olasılıkla panel tarafında.

### BUG-2 — "Yaklaşık konum artık çalışmıyor"

Üç bulgu:

1. **Sağlayıcı zinciri yok.** Geoapify yalnızca statik harita görselini üretiyor
   (`createStaticMapUrl`); hiçbir zaman bir geolokasyon yedeği değil. Tek yedek
   `catch (Exception) → LoginLocation("Unknown", null, null)`.
2. **En olası üretim nedeni:** `ipinfo.token=${IPINFO_TOKEN:}` boşa düşüyor ve
   `getLoginLocation`, `ipInfoToken.isBlank()` üzerinden hiç HTTP çağrısı yapmadan
   `"Unknown"` dönüyor. Bu yol istek başına hâlâ sessiz, ama artık açılışta bir kez
   `warnIfTokenMissing()` (`@PostConstruct`) WARN düşüyor — token ayarlanmamışsa hiçbir iz
   bırakmayan tek başarısızlık olmaktan çıktı.
3. **Yutulan exception loglanıyor.** `LOGGER.warn("Could not determine location for IP {}",
   ip, exception)` stack trace ile birlikte yazıyor (`8d18abb` bunu ekledi). Yani 401/403/429
   ve timeout loglardan ayırt edilebiliyor; istek sırasında sessiz olan tek yol boş token
   yolu, o da açılıştaki uyarıdan tanınıyor.

### Yeni bulunan kusur — `normalizeIp` çöküyordu (düzeltildi)

`","` (yalnızca virgülden oluşan bir `X-Forwarded-For`) `normalizeIp`'i
`ArrayIndexOutOfBoundsException` ile düşürüyordu: Java `split(",")` sonucundaki sondaki boş
parçaları attığı için dizi boş kalıyor ve `[0]` patlıyordu. `normalizeIp`, `try` bloğundan
**önce** çalıştığı için bu, geniş `catch`'in yakalamadığı tek girdiydi — exception
`getLoginLocation`'dan dışarı çıkıp `AFTER_COMMIT` dinleyicisindeki login e-postasında
yakalanmamış hata olarak yüzeye vuruyordu. Login'in kendisi başarılı olmaya devam ediyordu.

Düzeltme: `rawIp.split(",", -1)`. Negatif limit boş parçaları koruduğu için sonuç `[""]`
oluyor ve mevcut boşluk kontrolüne düşüyor. İşaretleyici test
`getLoginLocation_addressOfOnlyCommas_returnsUnknownWithoutCallingIpInfo` adıyla artık
düzeltilmiş davranışı sabitliyor.

### Prompt/kod uyuşmazlıkları

Hepsinde kod esas alındı: `AuditCursorCodec` `com.pse.audit.service` içinde;
`AuditRevertService` `com.pse.audit.revert` içinde ve `Map` değil `List<AuditRevertHandler>`
alıyor; `RateLimitService` `TransactionTemplate` değil `PlatformTransactionManager` alıyor;
`LoginLocationService` `RestClient`'ı enjekte etmiyordu.

---

## Açık sorular

### BUG-1 nanosaniye hipotezi

**Hipotez.** `AuditLog.@PrePersist` `Instant.now()` ile nanosaniye hassasiyeti yazıyor;
Postgres `timestamptz` sütunu ise mikrosaniyeye kırpıyor. Persistence context'te duran, DB'den
yeniden okunmamış bir entity'den üretilen cursor `…123456789` taşırken satır `…123456`
tutar. `.123456 < .123456789` doğru olduğu için keyset predicate'i aynı satırı bir daha
eşler ve satır sonraki sayfanın başında **tekrar eder**.

**Neden unit testle doğrulanamaz.** Kırpma codec'in değil, JDBC sürücüsünün ve sütun tipinin
davranışı. `KeysetCursorCodec` nanosaniyeyi kayıpsız round-trip ediyor — bir unit test
yalnızca bunu kanıtlayabilir. Kusuru üretmek gerçek bir yazma, gerçek bir sütun ve gerçek bir
geri okuma gerektiriyor.

**Nerede test edilecek.** Integration batch'inde, Testcontainers ile gerçek Postgres'e karşı:
tek transaction içinde iki satır yaz, `limit=1` ile sayfala, hiçbir satırın iki sayfada birden
görünmediğini doğrula.

**Önce çözülmesi gereken gerilim:** Testcontainers şu an bağımlılık değil ve `CLAUDE.md`
testlerin bilinçli olarak Docker gerektirmediğini söylüyor (H2, `ddl-auto=create-drop`,
`test` profili). H2, PostgreSQL modunda `timestamptz` hassasiyetini aynı şekilde modellemiyor,
yani mevcut test profili bu soruyu karara bağlayamaz. Bağımlılığı eklemek CI sözleşmesini
değiştirir — integration batch'inin kararı.

---

## Sınıflar

### KeysetCursorCodec

- **Sorumluluk:** `(createdAt DESC, id DESC)` sıralaması üzerinde keyset sayfalaması için
  opak cursor'u kodlar ve çözer.
- **Test edilen davranışlar:**
  - `encode → decode` round-trip'i, nanosaniye hassasiyeti dâhil
  - Wire formatı: `1|<Instant>|<UUID>`, URL-safe ve padding'siz base64
  - `LocalDateTime` overload'ının UTC `Instant` overload'ı ile aynı sonucu vermesi ve
    `Cursor.createdAtLocal()`'ın tam tersi olması
  - Yedi ret yolu: null, boş, 512 karakter sınırı, base64 olmayan, yanlış sürüm, yanlış parça
    sayısı, çözülemeyen `Instant`/`UUID` — hepsi 400
  - Hata mesajının çağıranın verdiği metin olması
- **Bilinçli test edilmeyenler:** Cursor'un veritabanı sorgusundaki etkisi — bu bir Criteria
  predicate'i ve integration katmanına ait. Nanosaniye/mikrosaniye kırpması (yukarıdaki açık
  soru).
- **Kullanılan mock'lar:** Yok; sınıfın bağımlılığı yok.
- **Kalan risk:** Cursor'un doğru üretilmesi ile doğru *uygulanması* ayrı şeyler; predicate
  ve sayfa sınırı integration katmanında.
- **Test sayısı:** 23 (good: 6, bad: 17)

### AuditCursorCodec

- **Sorumluluk:** Paylaşılan codec'in audit'e özel hata mesajını bağlayan ince bir delege.
- **Test edilen davranışlar:** `encode`/`decode`'un değiştirmeden iletilmesi, `decode`'a
  `"Invalid audit cursor"` mesajının geçirilmesi, delegenin fırlattığı `ApiException`'ın
  sarılmadan yayılması, gerçek codec üzerinden round-trip.
- **Bilinçli test edilmeyenler:** Codec mantığının kendisi — `KeysetCursorCodecTests`'te.
  `encode(LocalDateTime, …)` overload'ı bu sınıfta açığa çıkmıyor.
- **Kullanılan mock'lar:** `KeysetCursorCodec` — delegasyonun gerçekten olduğunu ancak
  mock'layarak doğrulayabiliyoruz; iki test ise gerçek codec ile uçtan uca bakıyor.
- **Kalan risk:** Yok denecek kadar az; sınıf 5 satır.
- **Test sayısı:** 5 (good: 3, bad: 2)

### RevertValues

- **Sorumluluk:** Audit girdisinin JSON sütunundan dönen `before`/`after` değerlerini tip
  duyarsız biçimde okur ve karşılaştırır.
- **Test edilen davranışlar:**
  - `sameValue`: iki null, tek null, enum ↔ adı, `Integer` ↔ `Long`, sayı ↔ metin, sıralı
    liste eşitliği, sıra değişiminin fark sayılması
  - `asString` / `asInteger` / `asBoolean` / `asEnum` / `asIds`: mevcut, eksik, yanlış tip,
    bozuk değer
  - Exception'lar: `NumberFormatException`, `IllegalArgumentException` (`No enum constant`,
    `Invalid UUID string`)
- **Bilinçli test edilmeyenler:** Gerçek Jackson serileştirmesi — burada girdi zaten
  deserialize edilmiş `Map`. Hangi handler hangi alanı okuyor sorusu handler'ların kendi işi.
- **Kullanılan mock'lar:** Yok; statik yardımcı sınıf.
- **Kalan risk:** İki davranış bilinçli olarak "olduğu gibi" sabitlendi ve gerçekten
  istenmiyor olabilir: sayı karşılaştırması `longValue()` üzerinden yapıldığı için `1` ile
  `1.9` eşit sayılıyor; `Boolean.valueOf` `"yes"` değerini sessizce `false` yapıyor. Bugün
  kayıtlı hiçbir alan kesirli değil ve hiçbir alan `"yes"` yazmıyor, ama yeni bir alan bunu
  değiştirebilir.
- **Test sayısı:** 37 (good: 20, bad: 17)

### AdminBootstrapPolicy

- **Sorumluluk:** Yapılandırılan `email` / `email:Ad` listesini çözerek hangi hesapların
  başlangıçta yönetici yapılacağını söyler.
- **Test edilen davranışlar:** Boş yapılandırma, adlı/adsız giriş, birden çok giriş,
  büyük/küçük harf normalizasyonu, boşluk kırpma, boş girişlerin atılması, ilk iki nokta ile
  bölme, e-postasız giriş, yinelenen e-posta, dönen kümenin değiştirilemezliği.
- **Bilinçli test edilmeyenler:** `AdminBootstrapRunner`'ın hesabı gerçekten oluşturması —
  başka bir sınıf ve integration konusu. `Map.copyOf` sıralamayı korumadığı için
  `bootstrapEmails()` sırası test edilmiyor; sözleşmenin parçası değil.
- **Kullanılan mock'lar:** Yok; tek `String` parametreli constructor.
- **Kalan risk:** Argüman normalize **edilmiyor** — `shouldBootstrap` tam eşleşme yapıyor, bu
  yüzden normalize edilmemiş bir adres sessizce ıskalar. Sözleşme parametre adında
  (`normalizedEmail`) ve çağıran `AuthService` küçük harfe çeviriyor; test bunu sabitliyor.
  `null` argüman `Map.copyOf` nedeniyle `NullPointerException` atıyor — kararlaştırıldığı
  gibi mevcut davranış olarak sabitlendi.
- **Test sayısı:** 18 (good: 6, bad: 12)

### OtpService

- **Sorumluluk:** Tek kullanımlık login kodunu üretir, hash'leyerek saklar ve tek seferlik
  olarak tüketir.
- **Test edilen davranışlar:** Yeni kod üretmeden önce açık kodların iptali (`InOrder`),
  `expiresAt = now + ttl` (varsayılan ve özel TTL, `Clock.fixed`), düz metnin saklanmaması,
  doğru kodun `used = true` yapması, yanlış kod, aday olmaması, legacy düz metin eşleşmesi,
  ne hash ne legacy değeri olan aday, birden çok adaydan yalnızca eşleşenin işaretlenmesi,
  sorguya geçirilen zamanın enjekte edilen saatten gelmesi.
- **Bilinçli test edilmeyenler:** `TokenGenerator`'ın rastgeleliği (`TokenGeneratorTests`
  kapsıyor) ve Argon2'nin kendisi. **TTL sınırındaki gerçek filtreleme repository
  sorgusunun işi** (`…AndExpiresAtAfter…`), bu yüzden burada yalnızca yazılan `expiresAt` ve
  sorguya verilen an doğrulanıyor.
- **Kullanılan mock'lar:** `OneTimePasswordRepository` — veritabanına gitmemek ve aday
  listesini kurgulamak için. `HashGenerator` statik olduğu için mock'lanamıyor; Argon2
  (m=32768, t=3) pahalı olduğundan gerçek hash yalnızca sınıf başına bir kez hesaplanıyor,
  diğer `consume` testleri legacy düz metin dalını kullanıyor.
- **Kalan risk:** Süresi dolmuş ve kullanılmış kodların gerçekten elenmesi integration
  katmanına ait; unit seviyede bunlar "boş aday listesi" olarak temsil ediliyor. Pessimistic
  lock davranışı da test edilmiyor.
- **Test sayısı:** 13 (good: 9, bad: 4)

### RateLimitService

- **Sorumluluk:** Operasyon ve HMAC'lenmiş özne başına sabit pencereli kova tutarak kod
  isteme ve login denemelerini sınırlar.
- **Test edilen davranışlar:**
  - Özne hash'i: kararlılık, e-posta/IP ad alanı ayrımı, 64 karakter hex, `null` IP'nin
    `"unknown"` olması, boş anahtarda `IllegalStateException`
  - `validateConfiguration`: 31 / 32 / `null` anahtar
  - `consume`: kova yokken oluşturma, sınır altı artırma, **kovanın tam dolduğu an** (hâlâ
    başarılı), **dolduktan sonraki istek** (`RateLimitException`, kayıt yok), süresi geçmiş
    pencerede sıfırlanma, penceresi tam şimdi biten kova, iki çakışmadan sonra başarı, üç
    çakışmada yeniden fırlatma, reddin yeniden denenmemesi, farklı öznelerin ayrı kovaları
  - `ensureAllowed`: kova yok / sınır altı / sınırda / süresi geçmiş, hiç yazmaması,
    `Retry-After` değerinin en az 1 saniye olması
  - `reset`: yalnızca o kovanın silinmesi
- **Bilinçli test edilmeyenler:** Gerçek `REQUIRES_NEW` transaction semantiği ve unique
  constraint yarışı — mock'lanmış bir yönetici propagation'ı gerçekten uygulamaz. `AuthService`
  içindeki limit değerleri de burada okunmuyor.
- **Kullanılan mock'lar:** `AuthRateLimitBucketRepository` (veritabanı yok) ve
  `PlatformTransactionManager`. Servis `TransactionTemplate`'i kendisi kurduğu için yönetici
  mock'lanıyor; gerçek template callback'i böylece gerçekten çalıştırıyor.
- **Kalan risk:** Eşzamanlı iki isteğin aynı kovayı doğru saydığı yalnızca integration
  katmanında gösterilebilir; buradaki üç denemelik yeniden deneme döngüsü mock ile
  simüle ediliyor.
- **Test sayısı:** 26 (good: 18, bad: 8)

### AuditRevertService

- **Sorumluluk:** Bir audit girdisinin geri alınabilir olup olmadığına karar verir ve tek bir
  alan düzenlemesini tersine çevirir.
- **Test edilen davranışlar:**
  - `describe`: boş sayfa, temiz alan diff'i, geri alınamayan aksiyon, handler'sız hedef tipi,
    yaşam döngüsü anahtarı (`exists`), `before`/`after` olmayan değişiklik, boş `changes`,
    **hedef id'si olmayan refusal girdisi** (eski 500 regresyonu), zaten geri alınmış girdi
    (+ geri alan girdinin id'si), pencere dışı, **tam cutoff üzerinde** (hâlâ geri alınabilir),
    cutoff'un bir nanosaniye ötesi, kaybolmuş hedef, değişmiş değer, handler'ın bilmediği alan
  - Toplu çalışma: aynı tipteki iki girdi için `currentValues` **tek çağrı**; aday içermeyen
    sayfada hiç sorgu yok; karışık sayfada her girdiye bir karar
  - `revert`: `before` değerlerinin uygulanması, `AuditRevertContext`'in handler çalışırken
    dolu ve sonrasında boş olması, handler patlasa bile temizlenmesi, 404, ve beş refusal'ın
    her biri için 409 + mesaj + `reason.name()` kodu
  - Handler kablolaması: aynı hedef tipini iddia eden iki handler'da `IllegalStateException`,
    doğru handler'a yönlendirme, hiç handler olmaması
- **Bilinçli test edilmeyenler:** Handler implementasyonlarının kendisi (`UserRevertHandler`
  vb.) ve tersine çevirmenin veritabanına yansıması — ayrı sınıflar, integration konusu.
  `@Transactional` semantiği burada yok.
- **Kullanılan mock'lar:** `AuditLogRepository` (veritabanı yok, `findReversalsOf` satırlarını
  kurgulamak için) ve `AuditRevertHandler` — gerçek bir `List` içinde mock handler'lar, çünkü
  servis haritayı `Collectors.toMap` ile kendisi kuruyor.
- **Kalan risk:** Pencere `Duration.toString()` ile mesaja giriyor, yani `P7D` kullanıcıya
  `PT168H` olarak görünüyor. Test bunu sabitliyor ama bu bir ürün kararı; panelde okunabilir
  bir metin isteniyorsa mesaj değişmeli.
- **Test sayısı:** 30 (good: 8, bad: 22)

### LoginLocationService

- **Sorumluluk:** Bir IP adresi için yaklaşık konumu çözer ve login bildirim e-postasına
  gömülecek harita HTML'ini üretir.
- **Test edilen davranışlar:**
  - Çözülen yol: tam yanıt, yalnızca şehir, boş bölge (çift virgül yok), X-Forwarded-For
    listesinde **yalnızca ilk adresin** sorgulanması (yakalanan `UriBuilder` fonksiyonu gerçek
    bir factory ile çözülerek doğrulanıyor)
  - Ağa hiç çıkılmayan yollar: null/boş adres, boş token
  - **Başarısızlığın her biri ayrı ayrı:** 401, 403, 429, 5xx, timeout
    (`SocketTimeoutException`), DNS hatası (`UnknownHostException`), deserialize edilemeyen
    gövde, `null` gövde, bogon adres (tüm alanlar null), çözülemeyen `loc`
  - Her birinde dönen değerin **tam olarak** `LoginLocation("Unknown", null, null)` olduğu ve
    log'a WARN düştüğü; boş token yolunda ise istek sırasında **hiç log olmadığı**
  - `warnIfTokenMissing()`: token boş ya da yalnızca boşluk iken açılışta `IPINFO_TOKEN` adını
    içeren bir WARN, token varken hiç log
  - `createStaticMap`: geçerli koordinat + anahtar (`lonlat` sırası ters), boş Geoapify
    anahtarı, geçersiz koordinat formatları (parametreli), koordinat ve URL yokken boş çıktı,
    HTML kaçışı
- **Bilinçli test edilmeyenler:** Gerçek IPinfo/Geoapify çağrıları. Üretilen HTML'in tam
  metni — kırılgan olurdu; bunun yerine ayırt edici parçalar doğrulanıyor. **Sağlayıcı yedek
  zinciri test edilmedi çünkü yok:** Geoapify yalnızca statik görsel üretiyor, tek yedek
  `catch (Exception) → "Unknown"`.
- **Kullanılan mock'lar:** `RestClient` ve fluent zincirinin üç seviyesi
  (`RequestHeadersUriSpec`, `RequestHeadersSpec`, `ResponseSpec`) — gerçek HTTP yapmamak için.
  Bunu mümkün kılmak adına `RestClient` artık constructor'dan enjekte ediliyor
  (`RestClientConfig`); davranış değişmedi. Ayrıca Logback `ListAppender`, çünkü sessiz
  başarısızlık ile loglanan başarısızlık arasındaki fark bu batch'in ana bulgusu.
- **Kalan risk:**
  - **`IPINFO_TOKEN` uyarısı yalnızca açılışta düşüyor.** Token sonradan iptal edilirse tek
    iz 401/403 WARN'ları olur; istek başına uyarı bilinçli olarak eklenmedi (her login için
    log gürültüsü).
  - **Geniş `catch (Exception)`** 401/403/429/timeout'u çağıran açısından ayırt edilemez
    kılıyor; ayrım yalnızca logda. Önerilen (uygulanmadı): catch'in daraltılması.
  - Koordinat regex'i virgül etrafındaki boşluğu reddediyor (`"49.0, 8.4"` geçersiz). Bugün
    IPinfo boşluksuz döndüğü için sorun değil, ama sağlayıcı formatı değişirse sessizce
    haritayı düşürür.
- **Test sayısı:** 39 (good: 10, bad: 29)
