// Substituto de `server-only` nos testes.
//
// O pacote real lança ao ser importado fora de um Server Component, e é por
// isso que ele serve de proteção no código de produção. No Vitest não há essa
// distinção, então módulos legítimos de servidor — sanitizar.ts, noticias.ts —
// não conseguiriam nem ser importados pelo teste.
export {}
