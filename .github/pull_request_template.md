## Descripción

<!-- Describe los cambios que introduce este PR. Incluye el "por qué" y el "qué". -->

---

## Tipo de cambio

<!-- Marca con una `x` las que correspondan -->

- [ ] 🐛 Bug fix (cambio que corrige un problema)
- [ ] ✨ Nueva funcionalidad (cambio que agrega funcionalidad)
- [ ] 💥 Breaking change (fix o feature que cambia comportamiento existente)
- [ ] 📝 Documentación (actualización de docs, README, comentarios)
- [ ] ♻️ Refactor / Limpieza (sin cambio de comportamiento)
- [ ] ⚡ Performance (mejora de rendimiento)
- [ ] 🧪 Tests (agregar o corregir tests)
- [ ] 🔧 Config / CI / Build (cambios en tooling, pipelines, deps)

---

## Checklist

<!-- Verifica antes de pedir review -->

- [ ] El código compila (`pnpm build`)
- [ ] Lint pasa (`pnpm lint`)
- [ ] Tests pasan (`pnpm vitest run`)
- [ ] He agregado/actualizado tests para los cambios
- [ ] He actualizado documentación si corresponde (README, SPECS, comentarios)
- [ ] Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] No hay `console.log` ni código de debug
- [ ] El PR es pequeño y enfocado (< 400 líneas si es posible)

---

## Testing

<!-- ¿Cómo se probó? Incluye pasos manuales si aplica -->

| Escenario | Probado | Notas |
|-----------|---------|-------|
| Build de producción | ☐ | `pnpm build` |
| Lint | ☐ | `pnpm lint` |
| Tests unitarios | ☐ | `pnpm vitest run` |
| Dev server local | ☐ | `pnpm dev` |
| Escáner por imagen (`/`) | ☐ | |
| Generar QR (`/generar`) | ☐ | |
| Escáner cámara (`/escanear-camara`) | ☐ | Requiere HTTPS/localhost |

---

## Capturas de pantalla / Video

<!-- Si hay cambios visuales, adjunta capturas o un video corto -->

---

## Breaking changes

<!-- Si hay breaking changes, descríbelos y la estrategia de migración -->

---

## Issues relacionados

<!-- Link a issues relacionados: `Fixes #123`, `Closes #456`, `Relates to #789` -->

---

## Notas adicionales

<!-- Cualquier contexto extra, decisiones de diseño, trade-offs, etc. -->