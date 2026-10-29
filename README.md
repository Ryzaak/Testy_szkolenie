# 🎯 Testy szkoleniowe

Strona do nauki przed testami ze szkolenia w Policji. Pytania są jednokrotnego wyboru (A–D), a pod każdą odpowiedzią jest wyjaśnienie.

### 👉 [ryzaak.github.io/Testy_szkolenie](https://ryzaak.github.io/Testy_szkolenie/)

Nie trzeba niczego instalować ani zakładać konta – link działa na telefonie i komputerze.

---

## Jak to działa

| | |
|---|---|
| 🗂️ **Zakładki** | Każdy przedmiot ma swoją zakładkę (np. **JM04 JS01**), z osobnym postępem i czasem. |
| 🎲 **Losowanie** | Pytania i kolejność odpowiedzi są losowane, więc nie da się zapamiętać literki. |
| ✅ **Dobra odpowiedź** | Pytanie trafia do puli opanowanych. |
| ❌ **Zła odpowiedź** | Wyświetla się wyjaśnienie, a pytanie wróci losowo jeszcze 2 razy. |
| ⏱️ **Liczniki** | Czas rozwiązywania, a w kółku przy pytaniu – ile razy już się pojawiło. |
| 🎯 **Tematy** | W „Zakres tematów” wybierasz, z których działów chcesz pytania. |
| 🔄 **Reset** | „Zresetuj test” zeruje postęp i czas w bieżącej zakładce. |

Postęp zapisuje się w Twojej przeglądarce, więc każdy uczy się osobno. Po wyczyszczeniu danych przeglądarki postęp znika.

**Skróty klawiszowe:** `1`–`4` lub `A`–`D` wybierają odpowiedź, `Enter` przechodzi do następnego pytania.

## Dostępne zakładki

| Kod | Przedmiot | Pytań |
|---|---|---|
| **JM04 JS01** | Strzelanie broń krótka (bezpieczeństwo, broń i amunicja, P99, Beretta APX, REX Zero 1, Glock, teoria strzału, podstawy celnego strzelania, zacięcia) | 120 |
| **JM03 JS01** | Systemy informacyjne Policji (podstawy prawne, ochrona danych, systemy policyjne i pozapolicyjne, SIS) | 87 |
| **JM01 JS03** | Prawo karne szczegółowe (wybrane przestępstwa i wykroczenia) | 69 |
| **JM01 JS04** | Ustawy szczególne (broń, narkomania, tytoń, dowody, prawo autorskie, dostęp warunkowy, alkohol, imprezy masowe, zwierzęta) | 124 |

## Skąd są pytania

- Pytania oznaczone **„z testu”** pochodzą z prawdziwych testów i quizów.
- Pozostałe są ułożone na podstawie prezentacji z zajęć.
- Odpowiedzi sprawdzono w prezentacjach, przepisach (m.in. Zarządzenie nr 2 KGP z 15.01.2024 w sprawie wyszkolenia strzeleckiego) i materiałach szkół Policji.
- Jeśli odpowiedzi nie dało się w pełni potwierdzić, wyjaśnienie zaczyna się od **„UWAGA – niepewne”**. Przy takich pytaniach warto dopytać prowadzącego.

---

<details>
<summary>🛠️ Dla autora – budowa strony i dodawanie pytań</summary>

### Pliki

```
index.html            szkielet strony i style (z polityką CSP)
app.js                logika testu (jedyny skrypt – CSP blokuje skrypty z innych źródeł i inline)
dane/zakladki.json    lista zakładek
dane/<KOD>.json       pytania jednej zakładki
app.py, uruchom.bat   podgląd lokalny → http://localhost:8770
```

### Wpis w `dane/zakladki.json`

```json
{"id": "JS01", "kod": "JM04 JS01", "nazwa": "Strzelanie broń krótka", "plik": "JS01.json"}
```

`id` służy do zapisu postępu w przeglądarce – po publikacji go nie zmieniamy. Na stronie wyświetla się `kod – nazwa`.

### Pytanie w `dane/<KOD>.json`

```json
{
  "id": "10 znaków md5 z treści pytania",
  "temat": "Glock",
  "pytanie": "Ile bezpieczników posiada Glock?",
  "poprawna": "3",
  "bledne": ["1", "2", "4"],
  "wyjasnienie": "Zewnętrzny bezpiecznik spustowy, przednia i tylna blokada iglicy.",
  "zrodlo": "test"
}
```

`bledne` ma zawsze dokładnie 3 elementy. `zrodlo` to `"test"` albo `"prezentacje"`.

### Nowa zakładka

1. Dodaj zweryfikowane pytania jako `dane/<KOD>.json`.
2. Dopisz zakładkę do `dane/zakladki.json`.
3. Zrób commit i push – GitHub Pages odświeży stronę w 1–2 minuty.

</details>
