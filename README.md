# Genealoginator

> Każdą osobę w rodzinie można nazwać na skróty - albo najdłuższą, najbardziej zawiłą drogą przez
> drzewo genealogiczne. *Siostra* to przecież także „córka męża siostry mojego wujka”.

Genealoginator pokazuje bogactwo polskich nazw pokrewieństwa. Wybierasz dwie osoby na drzewie
rodzinnym, a aplikacja przechodzi przez kolejne pokrewieństwa i składa z nich polską nazwę - od
jednego słowa po długi, zawiły łańcuch.

## Po co to

Polszczyzna ma na pokrewieństwa znacznie więcej słów, niż używamy na co dzień. Zamiast jednego
„wujka” miała osobne nazwy dla brata ojca i brata matki, osobne dla rodziny męża i rodziny żony -
i większość z nich cicho wyszła z użycia. Genealoginator wyciąga je z powrotem na wierzch:

- **stryj** - brat ojca (a **wuj** to brat matki; dziś obu mówimy „wujek”)
- **stryjenka** / **wujenka** - żona stryja / żona wuja
- **pociot** - mąż ciotki
- **dziewierz** - brat męża, **zełwa** - siostra męża, **jątrew** - żona brata męża
- **szurzy** - brat żony, **świeść** - siostra żony, **paszenog** - mąż siostry żony
- **świekier** / **świekra** - ojciec i matka męża
- **swak** - mąż siostry, **snecha** - synowa, **nieć** - siostrzeniec

Dawne słowa są w wyniku oznaczone gwiazdką (✦). Klikając je, przełączysz je na dzisiejszy
odpowiednik (`szurzy` ↔ `szwagier`) - i z powrotem.

## Jak się tym bawić

1. **Kliknij dwie osoby** na drzewie: pierwsza to punkt odniesienia („Od”), druga - osoba, którą
   opisujemy („Do”). Przyciskiem 🔄 zamienisz je miejscami.
2. **Ustaw suwak „poziomu zawiłości”** - od `Zwięzłego` (jedno słowo: `siostra`), przez `Dosłowny`
   (`córka moich rodziców`), aż po `Karkołomny`, który błądzi po całym drzewie, żeby dojść do celu
   jak najdłuższą drogą.
3. **🔀 Inna trasa** - do tego samego celu prowadzi zwykle wiele dróg. Ten przycisk pokazuje kolejną.
4. **✎ Nadaj imiona** - kafelki opisane są rolami (`babcia`, `teściowa`), ale możesz wpisać na nich
   własne imiona.
5. Osobę można **wyłączyć** z drzewa - trasa ominie ją i będzie musiała nadłożyć drogi.

Najechanie na kafelek pokazuje wyjaśnienie nazwy (`pociot` → mąż ciotki) i to, po której stronie
rodziny stoi dana osoba.

## Uruchomienie lokalne

```bash
docker run --rm -u $(id -u):$(id -g) -e HOME=/app -v "$PWD":/app -w /app node:22-alpine \
  sh -c "npm install"

docker run --rm -it -u $(id -u):$(id -g) -e HOME=/app -v "$PWD":/app -w /app -p 5173:5173 \
  node:22-alpine sh -c "npm run dev -- --host"
```

Aplikacja czeka na http://localhost:5173.
