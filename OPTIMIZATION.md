# Prestandaoptimering för Vinnova MCP Server

## Problem som åtgärdats

### Ursprungligt problem
När användare frågade om projekt från ett specifikt år (t.ex. 2023) laddade servern **all data från 2001** och filtrerade sedan i minnet. Detta orsakade:
- Överbelastning av Vinnovas API
- Långsamma svarstider
- Hög minnesanvändning
- Potentiellt hundratusentals onödiga poster

### Lösning implementerad

#### 1. Smart datumhantering
**Tidigare (vinnova-client.ts:39)**:
```typescript
const startDate = params.startDate || '2001-01-01'; // Alltid från 2001!
```

**Nu**:
```typescript
let startDate = params.startDate || '2001-01-01';

// Om slutdatum anges men inte startdatum, använd rimligt intervall
if (params.endDate && !params.startDate) {
  const endYear = parseInt(params.endDate.substring(0, 4));
  const startYear = Math.max(2001, endYear - 5);
  startDate = `${startYear}-01-01`;
}
```

**Resultat**: Frågor om 2023 hämtar nu bara från 2018-2023 istället för 2001-2023, vilket minskar datamängden med upp till 80%.

#### 2. Kommun- och länsfiltrering
Lagt till stöd för geografisk filtrering:
```typescript
if (params.kommun) {
  filtered = filtered.filter(p =>
    p.organisationKommun?.toLowerCase().includes(kommunLower)
  );
}

if (params.lan) {
  filtered = filtered.filter(p =>
    p.organisationLan?.toLowerCase().includes(lanLower)
  );
}
```

#### 3. Förbättrad MCP tool beskrivning
Lagt till tydlig instruktion i tool description:
```
IMPORTANT: For year-specific searches (e.g., "projects from 2023"),
you MUST set both startDate and endDate to limit the data fetch
(e.g., startDate: "2023-01-01", endDate: "2023-12-31")
```

Detta hjälper AI-modellen att automatiskt använda rätt parametrar.

## Prestandaförbättringar

### Före optimering
- **Fråga**: "Vilka Vinnova-projekt fick skånska kommuner 2023?"
- **API-anrop**: `https://data.vinnova.se/api/projekt/2001-01-01`
- **Data laddad**: ~23 års data (~200,000+ projekt)
- **Filtrering**: I minnet efter nedladdning
- **Risk**: API timeout/överbelastning

### Efter optimering
- **Fråga**: "Vilka Vinnova-projekt fick skånska kommuner 2023?"
- **API-anrop**: `https://data.vinnova.se/api/projekt/2018-01-01` (eller `2023-01-01` om AI sätter båda datum)
- **Data laddad**: Max 5 års data (~40,000-50,000 projekt)
- **Filtrering**: Både datum (från API) och geografi (i minnet)
- **Resultat**: 80% mindre data, snabbare svar, mindre API-belastning

## Cachningsstrategi

Servern använder en 1-timmars cache per startdatum:
```typescript
private cache: Map<string, { data: VinnovaProject[]; timestamp: number }>;
const CACHE_TTL = 3600000; // 1 timme
```

**Fördelar**:
- Upprepade frågor inom samma tidsperiod använder cachad data
- Inga onödiga API-anrop
- Snabbare svar för efterföljande frågor

## Bästa praxis för användare

### Rekommenderade frågor (optimerade)
✅ "Visa projekt från 2023 i Skåne"
✅ "Vilka projekt fick Malmö kommun 2022-2024?"
✅ "AI-projekt i Stockholm från 2020"

### Undvik (ej optimerade)
❌ "Visa alla projekt någonsin" (laddar allt från 2001)
❌ "Sök projekt om AI" (utan tidsavgränsning)

### Tips
- Specificera alltid år eller tidsperiod när möjligt
- Använd län/kommun-filter för regionala frågor
- Begränsa resultat med `limit` för stora sökningar

## Framtida förbättringar

Potentiella optimeringar att överväga:
1. **Persistent cache** (fil-baserad) mellan sessioner
2. **Inkrementell uppdatering** - bara hämta nya projekt
3. **Indexering** för snabbare textfiltrering
4. **Streaming** för stora resultat
5. **Parallel filtrering** för mycket stora dataset
