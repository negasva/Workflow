# Graph Report - Workflow  (2026-05-18)

## Corpus Check
- 14 files · ~5,802 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 42 nodes · 39 edges · 9 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `81aae632`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]

## God Nodes (most connected - your core abstractions)
1. `Setup paso a paso` - 6 edges
2. `TattoFlow` - 5 edges
3. `Uso` - 4 edges
4. `4. Configurar variables de entorno locales` - 3 edges
5. `Deploy en Vercel` - 3 edges
6. `5. Instalar dependencias y correr localmente` - 2 edges
7. `Opción A — desde la CLI de Vercel` - 2 edges
8. `Stack` - 1 edges
9. `1. Crear proyecto en Supabase` - 1 edges
10. `2. Ejecutar el schema SQL` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (9 total, 0 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (9): 1. Crear proyecto en Supabase, 2. Ejecutar el schema SQL, 3. Obtener credenciales de Supabase, 4. Configurar variables de entorno locales, 5. Instalar dependencias y correr localmente, code:bash (cp .env.local.example .env.local), code:env (NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co), code:bash (npm install) (+1 more)

### Community 3 - "Community 3"
Cohesion: 0.29
Nodes (6): Modo Editor (✏️), Modo Venta (💬), Stack, TattoFlow, Tipos de nodo, Uso

### Community 4 - "Community 4"
Cohesion: 0.5
Nodes (4): code:bash (npm i -g vercel), Deploy en Vercel, Opción A — desde la CLI de Vercel, Opción B — desde vercel.com

## Knowledge Gaps
- **12 isolated node(s):** `Stack`, `1. Crear proyecto en Supabase`, `2. Ejecutar el schema SQL`, `3. Obtener credenciales de Supabase`, `code:bash (cp .env.local.example .env.local)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TattoFlow` connect `Community 3` to `Community 1`, `Community 4`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `Setup paso a paso` connect `Community 1` to `Community 3`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **What connects `Stack`, `1. Crear proyecto en Supabase`, `2. Ejecutar el schema SQL` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._