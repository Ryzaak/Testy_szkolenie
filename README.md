# Testy – nauka

Strona z testami jednokrotnego wyboru (ABCD) z wyjaśnieniami. Każdy przedmiot to osobna zakładka (np. JS01).

- Po błędnej odpowiedzi pytanie wraca losowo jeszcze 2 razy.
- Postęp, czas i liczba wystąpień pytań zapisują się w przeglądarce osoby, która się uczy.

## Struktura

- `index.html` – cała strona (działa bez serwera, np. na GitHub Pages).
- `dane/zakladki.json` – lista zakładek: `{"id": "JS01", "nazwa": "...", "plik": "JS01.json"}`.
- `dane/<ID>.json` – pytania zakładki. Każde pytanie ma pola:
  `id` (10 znaków md5 z treści pytania), `temat`, `pytanie`, `poprawna`,
  `bledne` (dokładnie 3), `wyjasnienie`, `zrodlo` (`"test"` albo `"prezentacje"`).
  Wyjaśnienie zaczyna się od „UWAGA – niepewne”, gdy odpowiedzi nie dało się potwierdzić w źródłach.

## Nowa zakładka

1. Dodać plik `dane/<ID>.json` z pytaniami (po weryfikacji odpowiedzi).
2. Dopisać wpis do `dane/zakladki.json`.
3. Commit i push – GitHub Pages sam odświeży stronę.

## Podgląd lokalny

`python app.py` (albo `uruchom.bat`) → http://localhost:8770
