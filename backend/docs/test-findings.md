# Test bulguları

Unit test batch'lerinin ortaya çıkardığı kusurlar, tek yerde. [test-plan.md](test-plan.md)
neyin nasıl test edildiğini anlatır; bu belge yalnızca **testlerin bulduğu şeyleri** ve her
birinin ne durumda olduğunu tutar.

Her bulgu, onu sabitleyen testin adıyla birlikte veriliyor: bir bulgu ancak bir testte
yaşıyorsa gerçekten kayıtlıdır.

## Özet

| # | Bulgu | Etki | Durum |
|---|---|---|---|
| [BUG-3](#bug-3--profesör-ataması-sırası-geri-almayı-sessizce-reddediyor) | Profesör ataması sırası geri almayı reddediyor | Yüksek — kullanıcıya kararsız görünüyor | Açık, karakterize edildi |
| [F-1](#f-1--oy-verme-audit-yazmıyor) | Oy verme audit yazmıyor | Yüksek — moderasyon kör noktası | Açık, karakterize edildi |
| [F-2](#f-2--votetype-doğrulanmıyor) | `voteType` doğrulanmıyor, `null` 409'a dönüşüyor | Orta — yanlış HTTP kodu | Açık, karakterize edildi |
| [F-3](#f-3--oy-geri-çekilemiyor) | Oy geri çekilemiyor (toggle-off yok) | Orta — ürün boşluğu | Açık, karakterize edildi |
| [F-4](#f-4--voteanswer-rotasında-eğik-çizgi-eksik) | `/vote/answer` rotasında eğik çizgi eksik | Orta — rota yanlış | Açık, kayda geçti |
| [F-5](#f-5--başarısızlıklar-http-200-ile-dönüyor) | Başarısızlıklar HTTP 200 ile dönüyor | Orta — sessiz hata | Açık, sözleşme sabitlendi |
| [F-6](#f-6--studentservicein-ikinci-moderasyon-yolu) | `StudentService`'in ikinci, zayıf moderasyon yolu | Yüksek — koruma atlanabilirdi | **Çözüldü** (silindi) |
| [F-7](#f-7--normalizeip-tek-virgülde-çöküyordu) | `normalizeIp` tek virgülde çöküyordu | Orta — login e-postasında hata | **Çözüldü** (`8fc2901`) |
| [F-8](#f-8--ipinfo_token-boşken-sessiz-başarısızlık) | `IPINFO_TOKEN` boşken sessiz başarısızlık | Orta — teşhis edilemiyordu | **Kısmen çözüldü** |
| [F-9](#f-9--readonly-transaction-içinde-yazma) | `readOnly` transaction içinde alan yazma | Düşük — integration sorusu | Açık, kayda geçti |
| [F-10](#f-10--istemciye-giden-yazım-hataları) | İstemciye giden yazım hataları | Düşük — kozmetik, ama sözleşme | Açık, sabitlendi |
| [F-11](#f-11--uyarı-geri-almada-kontroluygulama-yarışı) | Uyarı geri almada kontrol/uygulama yarışı | Düşük — nadir | Açık, kayda geçti |
| [F-12](#f-12--boş-hedef-listesinde-gereksiz-yönetici-sorgusu) | Boş hedef listesinde gereksiz yönetici sorgusu | Çok düşük | Açık, karakterize edildi |
| [F-13](#f-13--token-iptali-tek-bir-koşula-bağlı) | Token iptali tek bir koşula bağlı | Bilgi — koruma mevcut | Test altına alındı |
| [P-1](#p-1--kapsam-baseline-sayısı-yanlıştı) | Kapsam baseline sayısı yanlıştı | Süreç | **Çözüldü** (yeniden ölçüldü) |
| [P-2](#p-2--integration-testleri-unit-hedeflerini-gizliyor) | Integration testleri unit hedeflerini gizliyor | Süreç | **Çözüldü** (yöntem değişti) |
| [P-3](#p-3--lombok-jacocoda-filtrelenmiyor) | Lombok JaCoCo'da filtrelenmiyor | Süreç | Açık, bilinçli |

BUG-1 ve BUG-2 (cursor ve yaklaşık konum hata raporları) [test-plan.md](test-plan.md#bulgular)
içinde; ikisi de backend'de yeniden üretilemedi ve orada yerinde duruyor.

---

## Kod kusurları

### BUG-3 — Profesör ataması sırası geri almayı sessizce reddediyor

**Nerede.** `CatalogueRevertHandler.LectureHandler.currentValues` (okuma tarafı) ve
`ModerationCatalogService.updateLecture` (yazma tarafı).

**Ne oluyor.** `Lecture.professors` bir `Set<Professor>` — sıra tanımlamayan bir tip — ama
handler onu **sıralı** bir `List`'e çeviriyor. `RevertValues.sameValue` iki koleksiyonu
`asStrings(left).equals(asStrings(right))` üzerinden, yani pozisyon pozisyon karşılaştırıyor.
Sonuç: profesör ataması hiç değişmemiş bir ders, yalnızca kümenin iterasyon sırası audit
JSON'una yazılan sırayla uyuşmadığı için `VALUE_CHANGED` alıp **meşru bir geri almayı
reddediyor**.

Yazma tarafında aynı duyarlılık ters yönde çalışıyor: `updateLecture` `before`'u `Set`'ten,
`after`'ı `professorRepository.findAllById(...)` sırasından üretip `!before.equals(after)`
ile karşılaştırıyor — yani değişmemiş bir atama **sahte** bir `professors` değişikliği ve
sahte bir audit olayı yazabiliyor.

**Neden ciddi.** `Professor` ne `equals` ne `hashCode` override ediyor, yani kimlik hash'i
kullanılıyor ve `HashSet` bucket dağılımı nesne adreslerine bağlı. Sıra **her çalıştırmada**
değişebiliyor. Kusur bu yüzden üretimde kararsız görünüyor: aynı düzenleme bir seferde geri
alınabilir, diğerinde alınamaz. Yeniden üretilemeyen bir hata raporunun en olası nedeni bu.

**Testler.**
```
CatalogueRevertHandlerTests
  lectureHandler_currentValues_professorAssignment_carriesTheOrderOfAnUnorderedSet
  lectureHandler_professorAssignmentInAnotherOrder_comparesAsChangedByRevertValues
```
Test gerçek `HashSet` sırasına **bel bağlamıyor**: öyle bir test kararsız olur ve kararsızlık
kusura değil teste yazılırdı. Kusur iki deterministik olguya ayrıldı — `LinkedHashSet`
fixture'ı ile handler'ın bildirilen tipin tanımlamadığı bir sıra ürettiği, ve `sameValue`'nun
aynı iki elemanı ters sırada farklı saydığı (küme olarak eşitken).

**Durum.** Açık. Düzeltme (küme alanları için sırasız karşılaştırma) `RevertValues`'ın
sözleşmesini değiştiriyor ve bir ürün kararı. Yazma tarafının deterministik testi —
stub'lanmış `findAllById` sırasıyla — `ModerationCatalogService` batch'ine bırakıldı.

---

### F-1 — Oy verme audit yazmıyor

**Nerede.** `SocialService.voteComment`, `SocialService.voteAnswer`.

**Ne oluyor.** Aynı sınıftaki `submitComment`, `submitAnswer` ve `submit*Report` metotlarının
hepsi `auditWriter.writeStudentAction(...)` çağırıyor. İki oy metodu çağırmıyor. Yani
**oy manipülasyonu moderasyon izinde hiç görünmüyor** — bir hesabın yüzlerce oyu
değiştirmesinin audit tarafında hiçbir izi yok.

**Test.** `SocialServiceVoteTests` — `AuditWriter` bu testte bilinçli olarak mock değil
`null` geçiliyor; iki metot ona dokunmadığı için testler geçiyor, ve dokunmaya başlarsa
anında NPE veriyor. `AuditWriter`'ın o listede olması bulgunun kendisi.

**Durum.** Açık.

---

### F-2 — `voteType` doğrulanmıyor

**Nerede.** `SocialService.voteComment`, `SocialService.voteAnswer`.

**Ne oluyor.** `null` bir oy tipi hiç kontrol edilmeden `setVote(null)`'a kadar gidiyor ve
`save`'e veriliyor. Metot `success = true` dönüyor. Tek durduran, `comment_votes.vote`
üzerindeki `nullable = false` kolonu — o da **flush anında**, bu metodun açtığı bir
transaction'ın dışında (iki metot da `@Transactional` değil).

**Sonuç.** `DataIntegrityViolationException` → `GlobalExceptionHandler:69` → **HTTP 409
"State conflict"**. İstemci bozuk bir istek için 400 beklerken 409 alıyor, ve mesaj
hangi alanın sorunlu olduğunu söylemiyor.

**Testler.**
```
SocialServiceVoteTests
  voteComment_nullVoteType_isSavedAsANullVoteRatherThanRejected
  voteAnswer_nullVoteType_isSavedAsANullVoteRatherThanRejected
```

**Durum.** Açık. Düzeltmesi küçük: request record'una `@NotNull` ya da metotta erken bir
`ApiException(BAD_REQUEST)`.

---

### F-3 — Oy geri çekilemiyor

**Nerede.** `SocialService.voteComment`, `SocialService.voteAnswer`, `VoteType`.

**Ne oluyor.** Aynı yönde ikinci oy, oyu kaldırmak yerine aynı değeri yeniden yazıyor.
`VoteType`'ın yalnızca `UP` ve `DOWN` değerleri var; kaldırmak için üçüncü bir değer
(`NONE`) ya da bir silme yolu yok. **Bir kullanıcı verdiği oyu geri çekemiyor.**

**Test.** `SocialServiceVoteTests.voteComment_repeatedIdenticalVote_isRewrittenRatherThanToggledOff`

**Durum.** Açık — ürün kararı, kusur değil de olabilir; ama bilinçli olduğu kodda hiçbir
yerde yazılı değil, o yüzden kayda geçti.

---

### F-4 — `/vote/answer` rotasında eğik çizgi eksik

**Nerede.** `SocialController:95`.

**Ne oluyor.**
```java
@PostMapping("/comments/vote/answer{answer_id}")   // eğik çizgi yok
```
Sınıf `@RequestMapping("/social")` taşıdığı için gerçek rota
`/social/comments/vote/answer<id>` oluyor — örneğin
`/social/comments/vote/answer7c9e6679-7425-40de-944b-e07fc1f90ae7`.
Yorum tarafındaki kardeş endpoint (`:71`) doğru yazılmış:
`/comments/vote/comment/{comment_id}`.

**Neden testler yakalamadı.** Bu bir controller kusuru; unit katmanı servisi test ediyor,
rota bağlamayı değil. Hiçbir test oy endpoint'ine HTTP isteği atmıyor — bulgu, oy yolunu
okurken çıktı.

**Durum.** Açık, düzeltilmedi. Düzeltmek **kırıcı bir değişiklik**: istemci bugünkü
(bozuk) rotayı kullanıyorsa yeni rota ile birlikte eskisinin de bir süre servis edilmesi
gerekebilir. API/rol batch'inde karara bağlanmalı.

---

### F-5 — Başarısızlıklar HTTP 200 ile dönüyor

**Nerede.** `StudentService`, `AccountService`, `SocialService` — üçü de hiçbir exception
atmıyor.

**Ne oluyor.** Her başarısızlık `BasicResponse(mesaj, success = false)` olarak dönüyor ve
HTTP 200 ile servis ediliyor. Bulunamayan bir öğrenci, bulunamayan bir yorum, silinemeyen
bir hesap — hepsi "başarılı" bir cevap. Yalnızca HTTP durumuna ya da atılan hataya bakan
bir çağıran bozuk bir aramayı başarılı sanıyor.

Karşılaştırma: `ModerationCatalogService` aynı durumlarda `ApiException` atıyor ve
`GlobalExceptionHandler` bunları 400/404'e çeviriyor. Yani kod tabanında **iki farklı hata
sözleşmesi** yan yana duruyor.

**Testler.** Bu yüzden negatif yol testleri `assertThatThrownBy` değil `response.success()`
ve `response.message()` üzerinden yazıldı — sözleşme buysa test onu sabitlemek zorunda:
```
StudentServiceTests
  getUserInformation_unknownStudent_returnsTheAuthenticationFailureShape
  getUserRatings_unknownStudent_returnsTheAuthenticationFailureWithAnEmptyList
  deleteAccount_nullStudent_returnsTheAuthenticationFailure
  deleteAccount_emailNotInTheTable_returnsTheNotFoundFailureWithoutWriting
SocialServiceVoteTests
  voteComment_unknownComment_returnsAFailureWithoutTouchingTheVoteTable
  voteAnswer_unknownAnswer_returnsAFailureWithoutTouchingTheVoteTable
```

**Durum.** Açık — bir tasarım kararı, ve değiştirmek istemci tarafını etkiler. Testler
mevcut davranışı sabitledi, yani sözleşme değişirse testler de değişmeli (ve bu iyi:
değişiklik sessiz olamaz).

Yan not: `getUserInformation` bulunamayan öğrenci için `"Error, cannot authenticate user"`
diyor, oysa olan tek şey id ile eşleşen satır olmaması. Kimlik doğrulama zaten security
zincirinde yapılmış durumda. Mesaj yanıltıcı ve istemciye gidiyor.

---

### F-6 — `StudentService`'in ikinci moderasyon yolu

**Nerede.** `StudentService` — `deleteUser`, `blockStudent`, `unblockStudent`,
`findByKitEmail`, `addStudent`, `getAllUsers`, `getUser`.

**Ne oluyordu.** Yedi metodun `src/` içinde hiçbir çağıranı yoktu. Kodun kendisi de
soruyordu: `//TODO: Why arent they in use?`.

Tehlike, ölü kod olmalarından çok **ne yapmadıklarındaydı**. Canlı yönetici akışı
`ModerationUserService` (`blockStudent:591`, `unblockStudent:617`) ve o ayrıca:

- `protectAdministrator(...)` — bir yöneticinin engellenmesini durduruyor
- idempotency kısa devresi
- `blockedAt` / `blockedReason` bilgisi
- `revokeTokens(target)` — engellenen hesabın oturumlarını kapatıyor
- `auditWriter.write(... USER_BLOCKED ...)`

`StudentService`'in kopyaları bunların **hiçbirini** yapmıyordu; yalnızca `setStatus` +
`save`. Yani bu metotlardan biri bir gün bir controller'a bağlanırsa: token iptali yok,
audit kaydı yok, yönetici koruması yok — ve hiçbir test bunu fark etmezdi.

**Neden test değil silme.** Test yazmak, kimsenin dayanmadığı ve moderasyonun sessizce
zayıf ikinci bir yolunu, kod tek yola indirilmeye çalışılırken çivilemek olurdu.

**Durum.** **Çözüldü.** Yedi metot silindi; `RatingService`'teki kullanılmayan
`import com.pse.user.service.StudentService;` de kaldırıldı. `StudentService`'in
`src/main`'deki tek tüketicisi artık `AccountService` ve tam üç metot kullanıyor.

---

### F-7 — `normalizeIp` tek virgülde çöküyordu

**Nerede.** `LoginLocationService.normalizeIp`.

**Ne oluyordu.** `","` (yalnızca virgülden oluşan bir `X-Forwarded-For`) metodu
`ArrayIndexOutOfBoundsException` ile düşürüyordu: Java'nın `split(",")`'i sondaki boş
parçaları attığı için dizi boş kalıyor ve `[0]` patlıyordu. `normalizeIp`, geniş `try`
bloğundan **önce** çalıştığı için bu, `catch (Exception)`'ın yakalamadığı tek girdiydi —
exception `getLoginLocation`'dan dışarı çıkıp `AFTER_COMMIT` dinleyicisindeki login
e-postasında yakalanmamış hata olarak yüzeye vuruyordu. Login'in kendisi başarılı olmaya
devam ediyordu.

**Düzeltme.** `rawIp.split(",", -1)` — negatif limit boş parçaları koruduğu için sonuç
`[""]` oluyor ve mevcut boşluk kontrolüne düşüyor.

**Test.** `LoginLocationServiceTests.getLoginLocation_addressOfOnlyCommas_returnsUnknownWithoutCallingIpInfo`

**Durum.** **Çözüldü** — commit `8fc2901`.

---

### F-8 — `IPINFO_TOKEN` boşken sessiz başarısızlık

**Nerede.** `LoginLocationService.getLoginLocation`.

**Ne oluyor.** `ipinfo.token=${IPINFO_TOKEN:}` boşa düşerse `getLoginLocation`,
`ipInfoToken.isBlank()` üzerinden hiç HTTP çağrısı yapmadan `"Unknown"` dönüyor. Yaklaşık
konumun "artık çalışmamasının" en olası üretim nedeni bu, ve istek başına **hiçbir iz
bırakmıyordu**.

**Düzeltme.** `warnIfTokenMissing()` (`@PostConstruct`) artık açılışta bir kez WARN
düşüyor. Yutulan exception'lar da stack trace ile loglanıyor, yani 401/403/429 ve timeout
artık loglardan ayırt edilebiliyor.

**Durum.** **Kısmen çözüldü.** Uyarı yalnızca açılışta düşüyor: token sonradan iptal
edilirse tek iz 401/403 WARN'ları olur. İstek başına uyarı bilinçli olarak eklenmedi (her
login için log gürültüsü). Ayrıca geniş `catch (Exception)` hâlâ 401/403/429/timeout'u
çağıran açısından ayırt edilemez kılıyor — ayrım yalnızca logda.

---

### F-9 — `readOnly` transaction içinde yazma

**Nerede.** `StudentService.getUserInformation`.

**Ne oluyor.** Metot `@Transactional(readOnly = true)` ama içinde
`student.setCredibilityScore(credibilityScore)` çağırıyor — yani okuma amaçlı bir
transaction içinde yönetilen bir entity'yi değiştiriyor. Skor hesaplanmış bir değer;
kalıcılaşması istenmiyor gibi görünüyor ama dirty-checking'in gerçek bir persistence
context'te ne yapacağı kodda belli değil.

**Neden unit testle karara bağlanamaz.** Mock'lanmış bir repository'de dirty-checking diye
bir şey yok; davranış Hibernate'in ve `readOnly` bayrağının işi.

**Durum.** Açık, integration katmanına havale edildi.

---

### F-10 — İstemciye giden yazım hataları

**Nerede.** `StudentService.deleteAccount`.

```
"Error, couldnt authenticate user"      // couldn't
"Error, couldnt find student"           // couldn't
"Deleted Account succesfully: ..."      // successfully
```

Bu dizgiler `BasicResponse.message` içinde istemciye gidiyor, yani kullanıcı arayüzünde
görünebiliyorlar.

**Durum.** Açık. Testler dizgileri **olduğu gibi** sabitledi
(`StudentServiceTests.deleteAccount_*`), çünkü mesaj bir sözleşme. Düzeltilirse testler de
güncellenmeli — bu bilinçli: kullanıcının gördüğü metin sessizce değişemesin.

---

### F-11 — Uyarı geri almada kontrol/uygulama yarışı

**Nerede.** `WarningRevertHandler.applyInverse`.

**Ne oluyor.** Revertibility kontrolü (`currentValues`) ile revert'in kendisi
(`applyInverse`) arasında hiçbir şey kilit tutmuyor. Kontrol satırı görüp "geri alınabilir"
diyebilir, revert anında satır gitmiş olabilir. Handler doğru davranıyor — patlamak yerine
`ApiException(NOT_FOUND, "Warning not found")` ile reddediyor — ama kullanıcı geri
alınabilir **görünen** bir girdide hata alıyor.

Bu, `applyInverse` içinde kendi sorgusunu yapan tek handler olduğu için tek bu handler'da
görülüyor.

**Test.** `WarningRevertHandlerTests.applyInverse_warningWithdrawnSinceTheEntry_throwsNotFound`

**Durum.** Açık — davranış makul, yalnızca kullanıcı deneyimi tuhaf. Panelin bu 409/404'ü
"girdi artık geri alınamaz" olarak sunması yeterli olabilir.

---

### F-12 — Boş hedef listesinde gereksiz yönetici sorgusu

**Nerede.** `UserRevertHandler.currentValues`.

**Ne oluyor.** `adminRepository.findAllAdminStudentIds()` döngüden **önce** çağrılıyor, yani
hedef listesi boş olsa bile bir sorgu atılıyor. Bugün zararsız: revertibility geçişi bu
metodu yalnızca boş olmayan bir id kümesiyle çağırıyor.

**Test.** `UserRevertHandlerTests.currentValues_noTargets_stillQueriesTheAdminIdList` —
karakterizasyon, ki bunu değiştiren bir düzenleme bilinçli olsun.

**Durum.** Açık, bilinçli olarak düzeltilmedi.

---

### F-13 — Token iptali tek bir koşula bağlı

**Nerede.** `AccountService.deleteAccount`.

**Ne.** Bu bir kusur **değil** — mevcut bir koruma. Ama kaybedilmesi pahalı olduğu için
kayda geçti.

```java
if (response.success()) {
    authService.invalidateAllAuthTokensForEmail(student.getKitEmail());
}
```

Bu koşul olmadan hesap `DELETED` olurken ona verilmiş her token süresi dolana kadar
geçerli kalır — ve `app.auth.app-session-ttl` varsayılanı **`P365D`**, yani bir öğrenci
token'ı bir yıl yaşıyor. Koşulun diğer yönü de önemli: **başarısız** bir silmede token'lar
iptal edilmemeli, yoksa hâlâ meşru bir oturum kapatılır.

**Testler.**
```
AccountServiceTests
  deleteAccount_successfulDeletion_revokesEveryIssuedToken
  deleteAccount_failedDeletion_leavesTheTokensAlone
```
İkinci test bu batch'in en değerli tek testi: koruma bir gün kaldırılırsa kırmızıya düşer.

**Durum.** Test altına alındı.

---

## Süreç bulguları

### P-1 — Kapsam baseline sayısı yanlıştı

Batch 2'ye girilen sayı %85.7 LINE (2916/3403) idi. Gerçek ölçüm — silmeden sonra —
**%87.76** (2932/3341). %90 hedefi için gereken açık 147 satır değil **75 satırdı**;
yani planlanan işin yaklaşık yarısı yetiyordu.

**Ders.** Batch aritmetiği ölçülmüş bir sayıyla başlamalı, devralınan bir sayıyla değil.
Ölçüm artık batch'in ilk adımı.

### P-2 — Integration testleri unit hedeflerini gizliyor

"Unit testi yok" ile "satırları kapsanmıyor" aynı şey değil. Suite'te on adet
`@SpringBootTest` sınıfı var — `DemoApplicationTests` `@Disabled`, `PostgreSqlMigrationSmokeTests`
yalnızca CI'da koşuyor, kalan **sekizi** her yerel çalıştırmada tüm context'i ayağa
kaldırıyor — ve kapsamları bundle'ın içinde. En keskin örnek:

`UserRevertHandler`'ın hem `currentValues`'ı hem `applyInverse`'ü
`AdminApiIntegrationTests.aFieldEditIsRevertibleAndTheReversalIsItsOwnAuditEvent` (`:2509`)
tarafından uçtan uca sürülüyordu. Kaynak satır sayısından beklenen kazanç ~29 satırdı;
gerçek açık **2 satırdı** (`UserStatus.DELETED` `continue`'su ve `UserRole.ADMIN` ternary
kolu).

Aynı şekilde `StudentService.getUserRatings` mutlu yolu ve `getAverageRating` toplaması
`LazyLoadingRegressionTests` tarafından kapsanıyordu.

**Ders.** Hedefler `jacoco.csv`'deki `LINE_MISSED`'dan seçilmeli:
```
awk -F, 'NR>1 && $8>0 {printf "%4d %s.%s\n", $8, $2, $3}' \
  target/site/jacoco/jacoco.csv | sort -rn | head -25
```
Bu, `UserRevertHandler`'ı listenin dibine, `CatalogueRevertHandler`'ı tepesine taşıyor —
tersi bir sezgiyle çalışılıyordu.

Notlanmaya değer: 2 satırlık kazanca rağmen `UserRevertHandlerTests` yazıldı, çünkü o iki
satır `DELETED` ve `ADMIN` dallarıydı — yani değeri kapsam değil, dalların **niçin** öyle
olduğunun yazılı hâle gelmesiydi.

### P-3 — Lombok JaCoCo'da filtrelenmiyor

Repo'da `lombok.config` yok ve `lombok.addLombokGeneratedAnnotation` varsayılanı `false`.
Yani her entity'nin üretilmiş getter/setter'ları bundle'da sayılan satırlar — paydanın
3341 olmasının büyük nedeni.

**Bilinçli olarak değiştirilmedi.** Filtrelemek bir kısayol gibi görünüyor ama accessor'lar
serileştirme yoluyla yoğun biçimde kapsandığı için *kapsanan* satırları kapsanmayanlardan
daha çok siler ve oranı **düşürebilir** — üstelik sayının ne ölçtüğünü sessizce değiştirir.
Aynı gerekçeyle `<excludes>` listesi de genişletilmedi (`**/model/**` ya da `**/dto/**`
eklemek tek test yazmadan birkaç puan kazandırırdı). Bunlar ratchet'i geçmek değil,
yeniden tanımlamak olurdu.

---

## Bilinçli test edilmeyen erişilemez durumlar

Kod okurken kusur gibi görünen, ama kalıcı bir satırdan erişilemediği için test yazılmayan
noktalar. Test yazmak kurgu üzerine assert etmek olurdu; buraya yazılmaları kararın bilinçli
olduğunu gösteriyor.

| Nokta | Neden erişilemez |
|---|---|
| `WarningRevertHandler` — `warning.getStudent()` NPE'si | `Warning.student` `@ManyToOne(optional = false)`; null öğrencili satır var olamaz |
| `CatalogueRevertHandler` — `getSemesterSeason().name()` null-guard'sız | kolon `nullable = false` |
| `CatalogueRevertHandler` — `getLectureType().name()` null-guard'sız | kolon `nullable = false`, ayrıca Java tarafında `LECTURE_ONLY` varsayılanı var |
| `AccountService` — `student == null` NPE'si | principal security zincirinden geliyor, null olamaz |
| Statik-only sınıfların private constructor'ları | JaCoCo 0.8.0'dan beri filtreliyor; reflection testi yazmak sahte kapsam olurdu |
