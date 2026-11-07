# Text-to-SQL Query Generator

Doğal dil sorularını SQL sorgularına dönüştüren, güvenli ve analiz yetenekli bir araç.

## Language

**Query (Sorgu)**:
Kullanıcının doğal dilde sorduğu soru. Sistem bunu SQL'e çevirir.
_Avoid_: Prompt, request, input

**Generated SQL (Üretilen SQL)**:
LLM'in bir Query'den ürettiği SQL SELECT (veya WITH...SELECT) ifadesi.
_Avoid_: Output, result query, response

**Schema Discovery (Şema Keşfi)**:
Bağlı veritabanındaki tüm tablo, sütun ve ilişkilerin `sqlite_master`'dan otomatik algılanması. Uygulama başlatıldığında veya `/refresh-schema` çağrıldığında çalışır.
_Avoid_: Schema introspection, metadata scan

**Analysis (Analiz)**:
Sorgu sonuçları için uygun grafik türünü ve konfigürasyonunu önerme süreci — heuristik kurallarla veya LLM ile.
_Avoid_: Visualization (o, render edilmiş çıktıdır — süreç değil)

**Insight**:
Bir grafikle birlikte döndürülen, temel bulguyu özetleyen doğal dil cümlesi.
_Avoid_: Summary, description, comment

**Security Layer (Güvenlik Katmanı)**:
Kullanıcı girdisine (sanitization), LLM çıktısına (SQL doğrulama) ve istek hızına (throttling) uygulanan çok katmanlı doğrulama hattı.
_Avoid_: Firewall, filter, guard

