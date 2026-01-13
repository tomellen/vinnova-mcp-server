# Vinnova MCP Server

En MCP-server (Model Context Protocol) för åtkomst till Vinnovas öppna projektdata. Fungerar med både Claude Desktop och ChatGPT.

## Funktioner

Servern tillhandahåller följande verktyg:

### 1. search_vinnova_projects

Sök efter Vinnova-finansierade projekt med valfria filter:

* Organisation (delmatchning)
* Nyckelord (i titel, sammanfattning eller utlysningsnamn)
* Datumintervall (från/till) - **VIKTIGT**: Använd specifika datum för att minska API-belastning
* Kommun (delmatchning, t.ex. "Malmö", "Lund")
* Län (delmatchning, t.ex. "Skåne", "Stockholm")
* Finansieringsbelopp (min/max)
* Begränsning av antal resultat

**Prestandatips**: För årsspecifika frågor (t.ex. "projekt från 2023"), ange både startDate och endDate för att bara hämta relevant data från API:et.

### 2. get_vinnova_project

Hämta detaljerad information om ett specifikt projekt via dess projekt-ID.

### 3. get_organization_projects

Hämta alla projekt för en specifik organisation med totalsummor.

### 4. get_vinnova_statistics

Få aggregerad statistik om Vinnova-finansiering:

* Totalt antal projekt och finansiering
* Genomsnittlig finansiering
* Topp 10 organisationer
* Projektfördelning per år

## Installation

### Förutsättningar

Innan du börjar måste du ha följande installerat:

* **Node.js** (version 16 eller senare) - [Ladda ner från nodejs.org](https://nodejs.org/)
* **Git** - [Ladda ner från git-scm.com](https://git-scm.com/)

Du kan verifiera att de är installerade genom att köra:
```bash
node --version
npm --version
git --version
```

### Steg 1: Klona repositoryt

Välj en plats på din dator där du vill spara projektet (t.ex. `~/projects` eller `~/Desktop`), öppna Terminal/Kommandotolken och kör:

```bash
git clone https://github.com/tomellen/vinnova-mcp-server
cd vinnova-mcp-server
```

### Steg 2: Installera och bygg

```bash
npm install
npm run build
```

Efter detta kommer en `build`-mapp att skapas med den kompilerade servern.

### Steg 3: Testa servern (valfritt men rekommenderat)

För att verifiera att allt fungerar kan du testa servern innan du lägger till den i Claude Desktop:

```bash
node build/index.js
```

Du bör se output som indikerar att servern är igång. Tryck `Ctrl+C` för att stoppa den.

## Konfiguration för Claude Desktop

### macOS

1. Öppna `~/Library/Application Support/Claude/claude_desktop_config.json` i en textredigerare
2. Lägg till följande (byt ut `/path/to/vinnova-mcp-server` mot den faktiska sökvägen där du klonarde repositoryt):

```json
{
  "mcpServers": {
    "vinnova": {
      "command": "node",
      "args": ["/path/to/vinnova-mcp-server/build/index.js"]
    }
  }
}
```

**Exempel**: Om du klonaide i din hemkatalog skulle det vara:
```json
{
  "mcpServers": {
    "vinnova": {
      "command": "node",
      "args": ["/Users/dittnamn/vinnova-mcp-server/build/index.js"]
    }
  }
}
```

3. Spara filen och starta om Claude Desktop helt (stäng och öppna igen)

### Windows

1. Öppna `%APPDATA%\Claude\claude_desktop_config.json` i en textredigerare (använd Notepad eller en annan textredigerare)
2. Lägg till följande (byt ut `C:\path\to\vinnova-mcp-server` mot din faktiska sökväg):

```json
{
  "mcpServers": {
    "vinnova": {
      "command": "node",
      "args": ["C:\\path\\to\\vinnova-mcp-server\\build\\index.js"]
    }
  }
}
```

**Exempel**: Om du klonaide i `C:\Users\DittNamn\Documents` skulle det vara:
```json
{
  "mcpServers": {
    "vinnova": {
      "command": "node",
      "args": ["C:\\Users\\DittNamn\\Documents\\vinnova-mcp-server\\build\\index.js"]
    }
  }
}
```

3. Spara filen och starta om Claude Desktop helt (stäng och öppna igen)

### Linux

1. Öppna `~/.config/Claude/claude_desktop_config.json` i en textredigerare
2. Lägg till samma JSON som macOS-exemplet ovan, men använd din Linux-sökväg:

```json
{
  "mcpServers": {
    "vinnova": {
      "command": "node",
      "args": ["/home/dittnamn/vinnova-mcp-server/build/index.js"]
    }
  }
}
```

3. Spara filen och starta om Claude Desktop helt

### Verifiera att det fungerar

Efter att Claude Desktop startar om bör du se ett Vinnova-icon i Claude-chats. Om du inte ser det, se **Felsökning** nedan.

## Konfiguration för ChatGPT (via MCP Inspector)

1. Installera MCP Inspector:

```bash
npm install -g @modelcontextprotocol/inspector
```

2. I `vinnova-mcp-server`-mappen kör du:

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

3. Öppna webbläsaren på den URL som visas (vanligtvis http://localhost:5173)
4. Använd Inspector för att testa servern och integrera med ChatGPT

## Användningsexempel

### Exempel 1: Sök projekt om AI

```
Sök efter Vinnova-projekt som handlar om artificiell intelligens
```

### Exempel 2: Hitta en organisations projekt

```
Vilka projekt har Chalmers fått finansiering för från Vinnova?
```

### Exempel 3: Regional sökning (optimerad)

```
Vilka Vinnova-projekt fick skånska kommuner 2023?
```

Detta kommer nu automatiskt begränsa API-anropet till 2023 och filtrera på Skåne.

### Exempel 4: Kommun-specifik sökning

```
Visa projekt i Malmö kommun från 2022-2024
```

### Exempel 5: Statistik

```
Visa statistik över Vinnova-finansiering från 2020
```

### Exempel 6: Sök efter finansiering

```
Hitta projekt med finansiering över 10 miljoner kronor
```

### Exempel 7: Hämta detaljer om ett projekt

Efter att ha sökt och hittat ett projekt-ID kan du få detaljerad information:

```
Hämta detaljer om projekt med ID: ABC123
```

(Projekt-ID får du från sökresultaten i tidigare exempel)

## API-källa

Data hämtas från Vinnovas öppna API:

* Bas-URL: https://data.vinnova.se/api/projekt/
* Startdatum för data: 2001-01-01

## Cachning

Servern cachar API-anrop i 1 timme för att minska belastningen på Vinnovas API och förbättra prestanda.

## Datastruktur

Projektdata innehåller följande fält:

* `projektID`: Unikt projekt-ID
* `projektTitel`: Projektets titel
* `projektStart`: Startdatum
* `projektSlut`: Slutdatum
* `utlysningNamn`: Namn på utlysningen
* `organisationNamn`: Mottagande organisations namn
* `organisationOrganisationsNummer`: Organisationsnummer
* `organisationKommun`: Kommun
* `organisationLan`: Län
* `beviljandeAr`: År för beviljandet
* `beviljatBidrag`: Beviljade bidrag i SEK
* `projektStatus`: Projektets status
* `sammanfattning`: Projektsammanfattning
* `koordinator`: Om organisationen är koordinator

## Felsökning

### Vinnova-ikonen visas inte i Claude Desktop

**Problem**: Efter att ha lagt till MCP-servern och startat om Claude Desktop ser du inte Vinnova-verktyget.

**Lösningar**:

1. **Verifiera sökvägen**: Öppna `claude_desktop_config.json` igen och kontrollera att sökvägen är helt korrekt och att filen `build/index.js` finns på den platsen.

2. **Verifiera byggning**: Gå tillbaka till `vinnova-mcp-server`-mappen och kör:
   ```bash
   npm run build
   ```
   Se till att det inte finns några felmeddelanden.

3. **Kontrollera Node.js**: Verifiera att `node build/index.js` fungerar korrekt i terminalen (utan fel).

4. **Visa dolda filer**: På macOS och Linux kan du behöva visa dolda filer för att hitta `.config`-mappen:
   - macOS: Tryck `Cmd+Shift+.` i Finder
   - Linux: Använd `ls -la` i terminalen

5. **Starta om fullständigt**: Stäng Claude Desktop helt (inte bara minimeringen) och starta den igen.

### Fel vid körning

**Problem**: `command not found: node` eller liknande fel

**Lösning**: Node.js är inte installerat eller är inte i din PATH. Installera Node.js från https://nodejs.org/

**Problem**: `ENOENT: no such file or directory`

**Lösning**: Sökvägen i `claude_desktop_config.json` är felaktig. Verifiera den igen.

### Claude kan inte hitta verktyget

**Problem**: MCP-servern startar men Claude hittar inte Vinnova-verktyget i sökresultat.

**Lösning**: 
- Starta om Claude Desktop igen
- Testa att skriva "Vinnova" i en chat för att se om auto-complete visar verktyget

### Andra problem

Om du stöter på andra problem:

1. Kontrollera att du är online och kan nå https://data.vinnova.se/api/projekt/
2. Kolla Vinnovas API-status
3. Öppna ett issue på GitHub: https://github.com/tomellen/vinnova-mcp-server/issues

## Licens

MIT
