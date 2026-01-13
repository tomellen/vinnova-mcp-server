# Vinnova MCP Server

En MCP-server (Model Context Protocol) för åtkomst till Vinnovas öppna projektdata. Fungerar med både Claude Desktop och ChatGPT.

## Funktioner

Servern tillhandahåller följande verktyg:

### 1. search_vinnova_projects
Sök efter Vinnova-finansierade projekt med valfria filter:
- Organisation (delmatchning)
- Nyckelord (i titel, sammanfattning eller utlysningsnamn)
- Datumintervall (från/till) - **VIKTIGT**: Använd specifika datum för att minska API-belastning
- Kommun (delmatchning, t.ex. "Malmö", "Lund")
- Län (delmatchning, t.ex. "Skåne", "Stockholm")
- Finansieringsbelopp (min/max)
- Begränsning av antal resultat

**Prestandatips**: För årsspecifika frågor (t.ex. "projekt från 2023"), ange både startDate och endDate för att bara hämta relevant data från API:et.

### 2. get_vinnova_project
Hämta detaljerad information om ett specifikt projekt via dess projekt-ID.

### 3. get_organization_projects
Hämta alla projekt för en specifik organisation med totalsummor.

### 4. get_vinnova_statistics
Få aggregerad statistik om Vinnova-finansiering:
- Totalt antal projekt och finansiering
- Genomsnittlig finansiering
- Topp 10 organisationer
- Projektfördelning per år

## Installation

```bash
npm install
npm run build
```

## Konfiguration för Claude Desktop

Lägg till följande i din Claude Desktop konfigurationsfil:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "vinnova": {
      "command": "node",
      "args": ["/Users/tommyboije/Desktop/VinnovaMCP/build/index.js"]
    }
  }
}
```

Starta om Claude Desktop efter att ha sparat konfigurationen.

## Konfiguration för ChatGPT (via MCP Inspector)

1. Installera MCP Inspector:
```bash
npm install -g @modelcontextprotocol/inspector
```

2. Starta servern med Inspector:
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

## API-källa

Data hämtas från Vinnovas öppna API:
- Bas-URL: https://data.vinnova.se/api/projekt/
- Startdatum för data: 2001-01-01

## Cachning

Servern cachar API-anrop i 1 timme för att minska belastningen på Vinnovas API och förbättra prestanda.

## Datastruktur

Projektdata innehåller följande fält:
- `projektID`: Unikt projekt-ID
- `projektTitel`: Projektets titel
- `projektStart`: Startdatum
- `projektSlut`: Slutdatum
- `utlysningNamn`: Namn på utlysningen
- `organisationNamn`: Mottagande organisations namn
- `organisationOrganisationsNummer`: Organisationsnummer
- `organisationKommun`: Kommun
- `organisationLan`: Län
- `beviljandeAr`: År för beviljandet
- `beviljatBidrag`: Beviljade bidrag i SEK
- `projektStatus`: Projektets status
- `sammanfattning`: Projektsammanfattning
- `koordinator`: Om organisationen är koordinator

## Licens

MIT
