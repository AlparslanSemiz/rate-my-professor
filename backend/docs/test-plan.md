# Test planı

Katmanlar: **unit → API/rol → integration → E2E**. Bu belge şu an unit katmanının 1. ve 2.
batch'ini kapsıyor; her batch kendi bölümünü ekler.

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

## Batch 2

Hedef: `com.pse.audit.revert` handler'larının tamamı, hesap yaşam döngüsü ve oy verme.

| Sınıf | LINE | BRANCH | Test |
|---|---|---|---|
| `CatalogueRevertHandler.LectureHandler` | 100.0% | 100% | 9 |
| `CatalogueRevertHandler.ProfessorHandler` | 100.0% | 100% | 6 |
| `ReportStatusRevertHandler.CommentReportHandler` | 100.0% | 100% | 6 |
| `ReportStatusRevertHandler.AnswerReportHandler` | 100.0% | 100% | 4 |
| `WarningRevertHandler` | 100.0% | 100% | 6 |
| `UserRevertHandler` | 100.0% | 100% | 9 |
| `SocialService` (yalnızca oy metotları) | 91.8%* | 67%* | 9 |
| `StudentService` | 100.0% | 94% | 12 |
| `AccountService` | 100.0% | 100% | 6 |

\* Sınıfın tamamının sayısı. Batch'in hedeflediği `voteComment` / `voteAnswer` **tam**
kapsandı (0 açık satır); kalan 16 satır `submit*` ve rapor metotlarına ait ve sonraki bir
batch'e bırakıldı.

**Toplam 67 test (good 34 / bad 33).** Tüm suite: 439 test, 0 hata (2 atlanan: `@Disabled`
`DemoApplicationTests` ve yalnızca CI'da koşan `PostgreSqlMigrationSmokeTests`).
Sayılar parametreli testlerin açılmış hâlidir.

Bu batch ile `com.pse.audit.revert` paketinin **dokuz handler bean'inin tamamı** ve
`AuditRevertService` + `RevertValues` %100 LINE'a ulaştı; pakette açık satır kalmadı.

### Bundle ve eşik

Ölçülen bundle: **%91.41 LINE** (3054/3341), **%75.51 BRANCH** (845/1119).
Batch öncesi ölçüm %87.76 LINE / %72.83 BRANCH idi.

`jacoco:check` iki limite çekildi: LINE `0.85` → **`0.90`**, ve yeni bir **BRANCH `0.73`**
tabanı. İkisi de ölçülenin yaklaşık bir buçuk puan altında — kural ölçülene pay bırakmak,
kaba bir hedefe sabitlemek değil. Gerekçe: `check` `test` değil `verify` fazına bağlı, yani
payı olmayan bir eşik CI'da, başkasının MR'ında, testlerle ilgisiz bir değişiklikte
patlar — pom'daki yorumun tam da önlemek için seçildiğini söylediği başarısızlık biçimi.
BRANCH bir taban, hedef değil: yalnız-LINE kapısı, çok dallı bir metodun tek mutlu-yol
testiyle gelmesine ve branch kapsamının sessizce düşmesine izin veriyordu.

Eşiğin gerçekten kapı olduğu doğrulandı: LINE geçici olarak `0.95`'e çekildiğinde
`./mvnw verify` "lines covered ratio is 0.91, but expected minimum is 0.95" ile kırmızıya
düştü, `0.90` ile yeşil.

**Bilinçli olarak yapılmayanlar** — üçü de sayıyı test yazmadan zıplatan, yani ratchet'i
geçmek yerine yeniden tanımlayan kısayollar:

- `<excludes>` listesi genişletilmedi. `**/model/**` ya da `**/dto/**` eklemek tek test
  yazmadan birkaç puan kazandırırdı.
- `lombok.config` eklenip Lombok filtrelenmedi. Repo'da `lombok.config` yok ve
  `addLombokGeneratedAnnotation` default `false`, yani üretilen tüm getter/setter'lar
  bundle'da sayılıyor. Accessor'lar serileştirme ile yoğun kapsandığı için filtrelemek
  *kapsanan*ı kapsanmayandan daha çok silip oranı düşürebilirdi — üstelik sayının ne
  ölçtüğünü sessizce değiştirirdi.
- Statik-only sınıfların private constructor'ları için reflection testi yazılmadı; JaCoCo
  0.8.0'dan beri bunları zaten filtreliyor.

`ModerationCatalogService.updateLecture` / `updateProfessor` (31 açık satır, 57/106 branch)
bu batch'in koşullu 4. grubuydu: bundle %91'i geçtiği için gerekmedi. Geriye kalan en
dal-yoğun test edilmemiş metot olduğu için sonraki batch'in ilk adayı.

### Üç farklı kapsam sayısı

Karıştırmamak için: üç sayı üç ayrı şeyi ölçüyor, tutarsızlık değil.

- **pom `jacoco:check` (LINE 0.90 / BRANCH 0.73)** — bundle regresyon kapısı. Bir daha
  düşmemesi gereken taban.
- **Bu belgedeki %90 hedefi** — batch'lerin nişan aldığı seviye.
- **`scripts/CheckChangedCoverage.java --threshold 30`** — yalnızca *değişen* kodun
  kapsamına bakan MR kapısı. Bundle ile ilgisi yok.

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

### BUG-3 — Profesör ataması sırası geri almayı sessizce reddediyor

`Lecture.professors` bir `Set<Professor>` — sıra tanımlamayan bir tip — ama
`CatalogueRevertHandler.LectureHandler.currentValues` onu **sıralı** bir `List`'e çeviriyor
ve `RevertValues.sameValue` iki koleksiyonu `asStrings(left).equals(asStrings(right))`
üzerinden, yani pozisyon pozisyon karşılaştırıyor. Sonuç: profesör ataması hiç değişmemiş
bir ders, yalnızca kümenin iterasyon sırası audit JSON'una yazılan sırayla uyuşmadığı için
`VALUE_CHANGED` alıp meşru bir geri almayı reddedebilir.

Aynı sıra duyarlılığı yazma tarafında da var: `ModerationCatalogService.updateLecture`
`before`'u `Set`'ten, `after`'ı `professorRepository.findAllById(...)` sırasından üretip
`!before.equals(after)` ile karşılaştırıyor — yani değişmemiş bir atama sahte bir
`professors` değişikliği ve sahte bir audit olayı yazabiliyor.

**Neden gerçek `HashSet` sırasıyla test edilmedi.** `Professor` ne `equals` ne `hashCode`
override ediyor, yani kimlik hash'i kullanılıyor ve bucket dağılımı nesne adreslerine
bağlı: sıra **her çalıştırmada** değişebiliyor. UUID seçerek sırayı zorlamak işe yaramaz,
çünkü UUID'ler hiç `hashCode`'a girmiyor. Böyle bir test kararsız olur ve kararsızlık
kusura değil teste yazılırdı. Bunun yerine kusur iki deterministik olguya ayrıldı:
`LinkedHashSet` fixture'ı ile handler'ın **bildirilen tipin tanımlamadığı bir sıra
ürettiği**, ve `sameValue`'nun aynı iki elemanı ters sırada **farklı** saydığı ayrı ayrı
sabitlendi.

Düzeltilmedi — küme alanları için sırasız karşılaştırma bir ürün kararı ve `RevertValues`'ın
sözleşmesini değiştiriyor. Yazma tarafının deterministik testi (stub'lanmış `findAllById`
sırası ile) `ModerationCatalogService` batch'ine bırakıldı.

### Oy verme yolundaki dört boşluk

`SocialService.voteComment` / `voteAnswer` karakterizasyon testlerinde sabitlenen, bilinçli
olmadığı belli olan dört davranış:

1. **Audit yazılmıyor.** Aynı sınıftaki `submitComment` / `submitAnswer` / `submit*Report`
   metotlarının hepsi `auditWriter.writeStudentAction(...)` çağırıyor; iki oy metodu
   çağırmıyor. Yani moderasyon izinde oy manipülasyonu görünmüyor.
2. **`voteType` doğrulanmıyor.** `null` bir oy tipi `setVote(null)`'a kadar gidiyor ve
   `save`'e veriliyor; tek durduran `nullable = false` kolonu, o da flush'ta — bu metodun
   açtığı bir transaction'ın dışında, yani çağıranın müdahale edebileceği yerde değil.
   Metot bu arada `success = true` dönüyor.
3. **Hiçbiri `@Transactional` değil.** Sınıftaki diğer yazma metotları öyle.
4. **Toggle-off yolu yok.** Aynı yönde ikinci oy, oyu kaldırmak yerine yeniden yazıyor ve
   `VoteType`'ın (`UP`, `DOWN`) kaldırmak için üçüncü bir değeri yok. Oy geri çekmek
   bugün mümkün değil.

### `SocialController` rota hatası — `/vote/answer` eğik çizgisi eksik

`SocialController:96` mapping'i `"/social/comments/vote/answer{answer_id}"`. Path
değişkeninden önce eğik çizgi yok, yani gerçek rota `/social/comments/vote/answer<id>`.
Yorum tarafındaki kardeş endpoint (`:73`) doğru yazılmış (`.../vote/comment/{comment_id}`).
Controller seviyesi bir kusur, unit katmanının dışında; bu batch'te düzeltilmedi, kayda
geçti.

### Silinen ölü kod — `StudentService`'in ikinci moderasyon yolu

`StudentService`'te çağıranı olmayan yedi metot silindi: `deleteUser`, `blockStudent`,
`unblockStudent`, `findByKitEmail`, `addStudent`, `getAllUsers`, `getUser`. Kodun kendisi
zaten soruyordu: `//TODO: Why arent they in use?`.

Test yazmak yerine silmenin nedeni, salt kapsam aritmetiği değil. Canlı yönetici akışı
`ModerationUserService` (`blockStudent` :591, `unblockStudent` :617) ve o ayrıca
`protectAdministrator`, idempotency kısa devresi, `blockedAt`/`blockedReason` bilgisi,
`revokeTokens(target)` ve `auditWriter.write(... USER_BLOCKED ...)` yapıyor.
`StudentService`'in kopyaları bunların **hiçbirini** yapmıyordu — yalnızca `setStatus` +
`save`. Yani token iptali yok, audit kaydı yok, yönetici koruması yok. Bunlara test yazmak,
kimsenin dayanmadığı ve moderasyonun sessizce zayıf ikinci bir yolunu, kod tek yola
indirilmeye çalışılırken çivilemek olurdu.

Ayrıca `RatingService`'teki kullanılmayan `import com.pse.user.service.StudentService;`
kaldırıldı. `StudentService`'in `src/main`'deki tek tüketicisi artık `AccountService` ve tam
üç metot kullanıyor.

Silme paydayı düşürdüğü için ölçüm batch'in *başında*, silmeden **sonra** alındı; belgedeki
3341 sayısı bu yüzden Batch 1'in 3403'ünden küçük.

### Yanlış pakette duran test dosyası

`StudentServiceTests` `com.pse` kökünde duruyordu, oysa sınıf `com.pse.user.service`
içinde. `com/pse/user/service/`'e taşındı ve ev stiline çevrildi: `@InjectMocks` yerine
manuel constructor factory, JUnit `assertEquals` yerine AssertJ. `1cd449b`
(ProfessorServiceTests) ile aynı hamle. Mevcut iki credibility testi korundu, yalnızca
`metot_senaryo_beklenti` adlandırmasına geçirildi.

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
testlerin bilinçli olarak Docker gerektirmediğini söylüyor (H2, Flyway'in H2
migration'ları, `ddl-auto=validate`, `test` profili). H2, PostgreSQL modunda `timestamptz` hassasiyetini aynı şekilde modellemiyor,
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

### CatalogueRevertHandler.LectureHandler / .ProfessorHandler

- **Sorumluluk:** Ders ve profesör alan düzenlemelerini, karşılıklı atamaları dâhil, geri
  alır. `com.pse.audit.revert`'te *koleksiyon* alanı bildiren tek handler çifti.
- **Test edilen davranışlar:**
  - `LectureHandler.currentValues`: yedi alanın tamamı (`professors` UUID string listesi
    olarak), profesörsüz derste **boş liste** (eksik anahtar değil), silinmiş dersin
    haritada bulunmaması, boş hedef listesi
  - **BUG-3, iki deterministik yarım:** `LinkedHashSet` fixture'ı ile handler'ın
    bildirilen `Set` tipinin tanımlamadığı bir sıra ürettiği; ve `RevertValues.sameValue`'nun
    aynı iki elemanı ters sırada farklı saydığı (küme olarak eşitken)
  - `LectureHandler.applyInverse`: yedi alanın çözülmesi — özellikle kayıttaki
    `"professors"` anahtarının request'teki `professorIds` alanına eşlenmesi — ve tek
    alanlı `before` yarısında diğerlerinin `null` kalması
  - `ProfessorHandler`: dört alan + `lectures` listesi, silinmiş profesör, boş hedef
    listesi, tam ve kısmi `applyInverse`, ve `updateLecture` değil **`updateProfessor`**'a
    gitmesi
- **Bilinçli test edilmeyenler:** `ModerationCatalogService`'in kendisi (ayrı sınıf, sonraki
  batch). `lecture.getSemesterSeason().name()` ve `getLectureType().name()` null-guard'sız
  ama iki kolon da `nullable = false`, yani kalıcı bir satırdan erişilemez durum — test
  kurgu üzerine assert ederdi. Gerçek `HashSet` iterasyon sırası (BUG-3'te gerekçesi).
- **Kullanılan mock'lar:** `LectureRepository`, `ProfessorRepository` (veritabanına
  gitmemek ve "satır yok" hâlini kurgulamak için) ve `ModerationCatalogService` --
  `applyInverse` alanları kendisi yazmıyor, panelin çağırdığı metodu çağırıyor, o yüzden
  doğrulanacak şey delegasyonun kendisi.
- **Kalan risk:** BUG-3 açık. Gerçek dünyadaki sıra `Professor`'ün `hashCode`'u olmadığı
  için çalıştırma başına değişiyor, yani kusur üretimde **kararsız** görünür: aynı
  düzenleme bir seferde geri alınabilir, diğerinde `VALUE_CHANGED` verir. Bu, bir hata
  raporunun yeniden üretilememesinin en olası nedeni.
- **Test sayısı:** 15 (good: 7, bad: 8) — LectureHandler 9, ProfessorHandler 6

### ReportStatusRevertHandler.CommentReportHandler / .AnswerReportHandler

- **Sorumluluk:** Bir raporun durum değişikliğini geri alır. Önemi: `ACTION_TAKEN` raporun
  konusu olan içeriği gizliyor, yani yanlışlıkla verilen bir durum bir gönderiyi
  uygulamadan çıkarıyor.
- **Test edilen davranışlar:** İki handler için de tek `status` alanının adıyla eşlenmesi,
  silinmiş raporun haritada bulunmaması, boş hedef listesi, `updateReportStatus`'a geçen
  enum, ve `status` içermeyen `before` yarısında `null` geçilmesi. Her iki `applyInverse`
  testinde **diğer** servise hiç dokunulmadığı da doğrulanıyor.
- **Bilinçli test edilmeyenler:** Durum değişikliğinin içeriği gerçekten gizlemesi/geri
  getirmesi — `ModerationCommentService` / `ModerationAnswerReportService` işi, integration
  konusu.
- **Kullanılan mock'lar:** `CommentReportRepository`, `AnswerReportRepository`,
  `ModerationCommentService`, `ModerationAnswerReportService`. Dördü birlikte, çünkü bu
  kadar az mantık taşıyan bir handler çiftinde yakalanmaya değer hata kopyala-yapıştır
  hatası: yanlış repository ya da yanlış servise bağlanmış bir handler yanlış raporu geri
  alır — ya da hiçbir şeyi.
- **Kalan risk:** Yok denecek kadar az; iki handler toplam 30 satır ve ikisi de %100.
- **Test sayısı:** 10 (good: 6, bad: 4) — CommentReportHandler 6, AnswerReportHandler 4

### WarningRevertHandler

- **Sorumluluk:** Bir uyarı metnindeki düzeltmeyi geri alır. `applyInverse` içinde kendi
  sorgusunu yapan **tek** handler: uyarı, verildiği öğrencinin alt kaynağı olarak
  adreslendiği için sahibi önce çözülmek zorunda — ve bu yüzden reddedebilen tek handler.
- **Test edilen davranışlar:** Tek `message` alanı, geri çekilmiş uyarının haritada
  bulunmaması, boş hedef listesi, `updateWarning(principal, studentId, warningId, request)`
  argüman sırasının uyarı satırından kurulması (audit girdisinden değil — sahip kayıtlı
  alanlardan biri değil), ve kayıp uyarıda `ApiException` + `NOT_FOUND` +
  `"Warning not found"` ile reddetmesi.
- **Bilinçli test edilmeyenler:** `warning.getStudent()` NPE'si. `Warning.student`
  `@ManyToOne(optional = false)`, yani null öğrencili bir satır var olamaz; test erişilemez
  bir duruma assert ederdi.
- **Kullanılan mock'lar:** `WarningRepository` (hem `findAllById` hem `findById` için,
  ikinci si yalnızca bu handler'da var) ve `ModerationUserService`.
- **Kalan risk:** Revertibility kontrolü ile revert'in kendisi arasında hiçbir şey kilit
  tutmuyor, yani `NOT_FOUND` yolu gerçek bir yarış: kontrol satırı görüp "geri alınabilir"
  der, revert anında satır gitmiş olabilir. Handler doğru davranıyor (patlamak yerine
  reddediyor) ama kullanıcı geri alınabilir görünen bir girdide hata alıyor.
- **Test sayısı:** 6 (good: 3, bad: 3)

### UserRevertHandler

- **Sorumluluk:** Öğrenci hesabı alan düzenlemelerini geri alır. En geniş handler: altı alan,
  ve bildirdiği değer kümesini **iki tablodan** kuran tek handler — öğrenci satırı artı
  yönetici id listesi, çünkü rol öğrencide bir kolon değil.
- **Test edilen davranışlar:**
  - Altı alanın tamamı; yönetici id kümesindeki öğrencide `role = ADMIN`, olmayanda
    `STUDENT` (ternary'nin iki kolu ayrı ayrı)
  - `biography == null → ""`: yük taşıyan normalizasyon, çünkü audit girdisi de `""`
    kaydediyor — `null` bildirmek dokunulmamış bir biyografiyi değişmiş gibi gösterip
    geri almayı reddederdi
  - `UserStatus.DELETED` satırının **atlanması**: anonimleşmiş hesabın kayıtlı kullanıcı
    adı ve adresi zaten gitmiş, o yüzden bayat değil **kayıp** hedef olarak okunmalı;
    bildirmek anonim değerleri gerçekmiş gibi geri yazan bir revert önerirdi
  - Hayatta kalmayan id'nin haritada bulunmaması
  - Karakterizasyon: yönetici id listesinin döngüden önce çekilmesi, yani **boş id
    listesinde bile** sorgulanması
  - `applyInverse`: altı alan tam, ve tek alanlı `before` yarısında diğerlerinin `null`
    kalması
- **Bilinçli test edilmeyenler:** `ModerationUserService.updateStudent`'ın kendisi — rol
  düşürme koruması ve doğrulama oraya ait. Handler bilinçli olarak o yolu çağırıyor ki
  revert aynı korumaları miras alsın.
- **Kullanılan mock'lar:** `StudentRepository`, `AdminRepository` (rol yalnızca buradan
  türetilebiliyor) ve `ModerationUserService`.
- **Kalan risk:** Bu handler'ın `currentValues` ve `applyInverse`'ü zaten
  `AdminApiIntegrationTests.aFieldEditIsRevertibleAndTheReversalIsItsOwnAuditEvent`
  tarafından uçtan uca sürülüyordu; unit testlerin gerçek katkısı yalnızca `DELETED` ve
  `ADMIN` dallarıydı (batch öncesi 2 açık satır). Yani buradaki değer kapsam değil,
  dalların **niçin** öyle olduğunun yazılı hâle gelmesi.
- **Test sayısı:** 9 (good: 4, bad: 5)

### SocialService (voteComment / voteAnswer)

- **Sorumluluk:** Bir yoruma ya da cevaba oy verir; aynı öğrencinin ikinci oyunda mevcut
  satırı güncellemesi gerekiyor, çünkü tabloda `(student, comment)` üzerinde unique
  constraint var.
- **Test edilen davranışlar:** Bulunamayan hedefte oy tablosuna hiç dokunulmaması; ilk oyda
  satırın `student` + `comment`/`answer` + `vote` ile kurulması; ikinci oyda **aynı
  örneğin** mutasyona uğrayıp kaydedilmesi (`isSameAs`, ikinci satır eklenmemesi); cevap
  yolunun yorum oy tablosuna dokunmaması. Ve karakterizasyon olarak **dört boşluk**:
  toggle-off olmaması, `null` `voteType`'ın `success = true` ile kaydedilmesi (iki metot
  için ayrı ayrı).
- **Bilinçli test edilmeyenler:** `submitComment` / `submitAnswer` / rapor metotları ve
  bildirim yolu — sınıfın kalan 16 açık satırı, sonraki batch. Unique constraint'in
  gerçekten ikinci satırı engellemesi integration konusu; burada yalnızca kodun
  `save`'e *ne verdiği* doğrulanıyor.
- **Kullanılan mock'lar:** Yalnızca iki metodun dokunduğu dört repository
  (`CommentRepository`, `AnswerRepository`, `CommentVoteRepository`,
  `AnswerVoteRepository`). Constructor'ın kalan beş bağımlılığı (`LectureService`,
  iki rapor repository'si, `NotificationRepository`, `AuditWriter`) mock değil **`null`**
  geçiliyor: mock koymak, ileride bir düzenlemenin bu işbirlikçileri sessizce kullanmaya
  başlamasına izin verirdi; `null` bunu metodun kendi testinde anında NPE'ye çeviriyor.
  `AuditWriter`'ın o listede olması zaten bulgunun kendisi.
- **Kalan risk:** Dört boşluğun hiçbiri düzeltilmedi — hepsi ürün kararı. En ciddisi
  audit'in olmaması: oy manipülasyonu moderasyon izinde hiç görünmüyor. `null` `voteType`
  ise `DataIntegrityViolationException` → 409 "State conflict" olarak yüzeye vuruyor, yani
  istemci 400 beklerken 409 alıyor.
- **Test sayısı:** 9 (good: 4, bad: 5)

### StudentService

- **Sorumluluk:** Profil bilgisini bir entity grafiğinden derler ve hesabı soft-delete eder.
- **Test edilen davranışlar:**
  - `getUserInformation`: credibility skorunun up eksi down olması, sıfıra denk gelen hâl,
    ortalama puan + rating/yorum sayıları, rating yokken sıfır ortalama (sıfıra bölme
    değil), ve bulunamayan öğrencide dönen tam başarısızlık şekli
  - Skorun, içeriği yazan öğrenciye gelen **bütün** oyları, kimin verdiğine bakmadan
    sayması (sabitlendi ki ileride "kendi oyunu sayma" değişikliği bilinçli olsun)
  - `getUserRatings`: her rating'in `LectureResponse` + ortalama skora eşlenmesi, mesaja
    gömülen sayı (`"Success, found 2 ratings."`), boş listede yine `success = true`, ve
    bulunamayan öğrencide `null` değil **boş liste** dönmesi
  - `deleteAccount`: `null` principal; e-postası tabloda olmayan principal (hiçbir şey
    yazılmıyor); başarılı yolda `UserStatus.DELETED` yazılıp `save` edilmesi ve mesajın
    e-postayı içermesi
- **Bilinçli test edilmeyenler:** `softDeleteByKitEmail` ve `getAverageRating` için
  doğrudan test yok — ikisinin de her dalı `deleteAccount` / `getUserInformation`
  üzerinden geçiliyor, ayrı test yazmak aynı satırları ikinci kez saymak olurdu.
  `ProfilePictureGenerator`, `LectureService.createLectureResponse` ve
  `RatingService.calculateAverageScore` **statik**, mock'lanmıyorlar; `mockStatic` yeni bir
  bağımlılık (mockito-inline) ve ev stilinden sapma olurdu, gerek de yok — sade fixture'lar
  üçünü de sürüyor.
- **Kullanılan mock'lar:** Yalnızca `StudentRepository`; sınıfın tek bağımlılığı.
- **Kalan risk:**
  - **Hiçbir yol exception atmıyor.** Her başarısızlık `success = false` taşıyan bir
    response ve HTTP 200. Yani yalnızca atılan hataya bakan bir çağıran, bozuk bir
    aramayı başarılı sanıyor. Testler bu sözleşmeyi sabitliyor, ama sözleşmenin kendisi
    tartışmalı.
  - `getUserInformation`, `readOnly = true` bir transaction içinde
    `student.setCredibilityScore(...)` yapıyor. Unit seviyede zararsız; gerçek bir
    persistence context'te dirty-checking'in ne yaptığı integration sorusu.
  - Mesaj dizgilerindeki yazım hataları (`couldnt`, `succesfully`) istemciye gidiyordu;
    `deleteAccount`'un üçü `edaf2bc` ile düzeltildi ve testler birlikte güncellendi.
    `src/main`'de beş örnek daha duruyor (F-10).
- **Test sayısı:** 12 (good: 6, bad: 6)

### AccountService

- **Sorumluluk:** `StudentService` üzerine ince bir cephe, kendine ait tek mantığı var:
  hesap silinince ona verilmiş token'ları iptal etmek.
- **Test edilen davranışlar:** İki okuma yolunun `student.getId()` ile değiştirmeden
  delege etmesi; `deleteAccount`'ta **başarılı** silmede
  `invalidateAllAuthTokensForEmail`'in çağrılması ve **başarısız** silmede
  çağrılmaması; `requestLogout`'un dönen oturum sayısını mesaja gömmesi (üç oturum ve
  sıfır oturum).
- **Bilinçli test edilmeyenler:** `AuthService.invalidateAllAuthTokensForEmail`'in
  gerçekten token'ları revoke etmesi — `AuthService`'in işi. Silinen bir hesabın
  token'ıyla artık istek yapılamadığı integration konusu (`TokenAuthenticationService`
  `DELETED`'ı reddediyor).
- **Kullanılan mock'lar:** `AuthService` ve `StudentService`. `StudentService` mock'lanıyor
  çünkü sınav edilen şey silmenin kendisi değil, silmenin **sonucuna göre** token iptalinin
  yapılıp yapılmaması.
- **Kalan risk:** `success` koşulu olmadan hesap `DELETED` olurken her token süresi
  dolana kadar geçerli kalıyordu ve bir öğrenci token'ı bir yıl yaşıyor — bu yüzden
  başarısız-silme dalı bu batch'in en değerli tek testi. Sınıf `student == null` gelirse
  `getId()`/`getKitEmail()` üzerinde NPE atar; principal'ı security zinciri sağladığı için
  test edilmedi.
- **Test sayısı:** 6 (good: 4, bad: 2)
