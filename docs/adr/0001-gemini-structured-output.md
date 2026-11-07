# Gemini 2.5 Flash Lite Structured Output — HuggingFace CodeAgent yerine

Mevcut HuggingFace `smolagents` + `CodeAgent` altyapısı her istekte agent'ı yeniden oluşturarak 10–30 sn latency yaratıyor, yapılandırılabilir değil ve pahalı. Google `google-genai` SDK ile Gemini 2.5 Flash Lite'a geçiyoruz. Function calling yerine **structured output** kullanıyoruz: model `{ "sql": "...", "explanation": "..." }` formatında JSON döndürür. Tek amaçlı bir pipeline (text → SQL) için function calling gereksiz karmaşıklık ekler; structured output daha deterministic, parse etmesi kolay ve hata oranı düşük.

## Considered Options

- **HuggingFace smolagents (mevcut)**: Her istekte `CodeAgent` yeniden oluşturuluyor, yavaş, pahalı, konfigüre edilemiyor. `DuckDuckGoSearchTool` gibi gereksiz bağımlılıklar taşıyor.
- **Gemini + Function Calling**: Esnek ama tek tool (SQL üretimi) için overengineering. Birden fazla tool orkestrasyon senaryosu olmadığından ek karmaşıklık değer katmıyor.
- **Gemini + Structured Output (seçilen)**: Basit, hızlı, deterministic. Model client bir kez initialize edilir, her istekte sadece API çağrısı yapılır. JSON schema ile response formatı garanti altında.

