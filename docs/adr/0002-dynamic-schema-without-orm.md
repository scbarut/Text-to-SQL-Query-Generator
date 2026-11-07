# Dinamik Schema — ORM Modelleri Olmadan

Sistem herhangi bir SQLite veritabanı dosyasını dinamik olarak destekleyecek. ORM modelleri (`SQLAlchemy declarative models`) kullanmıyoruz çünkü dinamik schema discovery ile çelişir: her tablo için önceden Python sınıfı yazmak, "herhangi bir DB'yi bağla" amacını bozar. Bunun yerine `sqlite_master`'dan DDL olarak schema çekiliyor, LLM'e system prompt'ta veriliyor ve sorgular `text()` ile read-only bağlantıda çalıştırılıyor. Yazma işlemi olmadığı için (sadece SELECT + WITH) ORM'nin sağladığı tip güvenliği ve migration avantajları geçersiz.

## Consequences

- Tablo yapısı değiştiğinde Python kodu değişmez — sadece `/refresh-schema` çağrısı yeterli.
- Compile-time tip güvenliği yok; hatalı sütun isimleri runtime'da yakalanır (DB hata mesajı ile).
- Yeni bir SQLite dosyası bağlamak için sadece `DATABASE_URL` env değişkeni değiştirilir, kod değişikliği gerekmez.

