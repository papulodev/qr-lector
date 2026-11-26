# Guía de Contribución

¡Gracias por querer contribuir a **qr-lector**! 🎉

Este documento cubre cómo reportar issues, proponer cambios, y el flujo de trabajo para PRs.

---

## 🚀 Inicio rápido

```bash
# Clonar y entrar
git clone https://github.com/papulodev/qr-lector.git
cd qr-lector

# Instalar dependencias (requiere pnpm)
pnpm install

# Desarrollo
pnpm dev        # Servidor local con HMR

# Verificaciones antes de commit
pnpm lint       # ESLint
pnpm vitest run # Tests unitarios
pnpm build      # Build de producción
```

---

## 📋 Reportar Issues

### Antes de crear un issue

1. **Busca issues existentes** (abiertos y cerrados)
2. **Prueba en `main`** para confirmar que no esté ya arreglado
3. **Usa la plantilla correcta**:
   - 🐛 **Bug report** - Comportamiento incorrecto, crashes, errores
   - ✨ **Feature request** - Nueva funcionalidad o mejora

### Qué incluir en un bug report

- Pasos mínimos para reproducir
- Comportamiento esperado vs actual
- Entorno (OS, navegador, versiones)
- Capturas/logs si aplica

---

## 🔀 Pull Requests

### Flujo de trabajo

1. **Fork** el repo y crea tu branch desde `main`
   ```bash
   git checkout -b feat/mi-nueva-funcionalidad
   # o
   git checkout -b fix/arreglo-bug-xyz
   ```

2. **Haz commits atómicos** siguiendo [Conventional Commits](https://www.conventionalcommits.org/)
   ```
   feat: agregar generador de QR para WiFi
   fix: corregir parsing de vCard con campos vacíos
   docs: actualizar README con nuevas rutas
   ```

3. **Ejecuta verificaciones** localmente:
   ```bash
   pnpm lint && pnpm vitest run && pnpm build
   ```

4. **Push y abre PR** usando la plantilla

### Checklist de PR

- [ ] Código compila (`pnpm build`)
- [ ] Lint pasa (`pnpm lint`)
- [ ] Tests pasan (`pnpm vitest run`)
- [ ] Tests nuevos/actualizados para cambios
- [ ] Docs actualizadas si corresponde
- [ ] Commits siguen Conventional Commits
- [ ] Sin `console.log` ni debug code
- [ ] PR enfocado (< 400 líneas ideal)

### Etiquetas requeridas

Todo PR debe tener **al menos una** etiqueta de tipo:
- `bug` - Corrección de error
- `enhancement` - Nueva funcionalidad
- `documentation` - Solo docs
- `refactor` - Refactor sin cambio de comportamiento
- `performance` - Mejora de rendimiento
- `test` - Solo tests
- `chore` - Mantenimiento (deps, config, etc.)
- `config` - Cambios en CI/build/tooling

---

## 🏷️ Labels

| Categoría | Labels |
|-----------|--------|
| **Tipo** | `bug`, `enhancement`, `documentation`, `refactor`, `performance`, `test`, `chore`, `config` |
| **Estado** | `needs-triage`, `ready-for-review`, `blocked`, `wip` |
| **Prioridad** | `priority:high`, `priority:medium`, `priority:low` |
| **Área** | `ui`, `camera`, `generator`, `parser`, `history`, `routing`, `deps`, `ci` |
| **Meta** | `good first issue`, `help wanted`, `breaking-change` |

---

## 🧪 Tests

- **Unitarios**: `src/utils/**/*.test.ts` (parseQR, urlSafety, history, qrPayloads, qrExport)
- **Ejecutar**: `pnpm vitest run`
- **Watch mode**: `pnpm vitest`
- **Cobertura**: `pnpm vitest --coverage`

Agrega tests para:
- Nueva lógica de parsing
- Casos edge en utils
- Nuevas funcionalidades de generator

---

## 📦 Estructura del proyecto

```
src/
├── components/     # Componentes reutilizables (DropZone, CameraScanner, etc.)
├── pages/          # Páginas de routing (ScanPage, GeneratePage, CameraPage)
├── hooks/          # Custom hooks (useCameraScanner)
├── utils/          # Lógica pura (parseQR, history, urlSafety, qrPayloads, qrExport)
├── types/          # TypeScript types
├── App.tsx         # Router principal
└── main.tsx        # Entry point
```

---

## 🎯 Convenciones de código

- **TypeScript estricto**: sin `any` innecesarios
- **CSS**: Custom properties (`var(--token)`), sin valores hardcoded
- **Componentes**: Functional + hooks, `forwardRef` cuando necesario
- **Accesibilidad**: `aria-*`, roles, focus visible, contraste
- **Tests**: Cobertura en utils críticos, naming `describe`/`it` en español

---

## 🔄 CI/CD

El pipeline en `.github/workflows/ci.yml` corre en cada PR/push a `main`:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm vitest run`
4. `pnpm build`

Debe pasar todo para mergear.

---

## 📝 Licencia

Al contribuir, aceptas que tu código se licencie bajo la misma licencia del proyecto (MIT).

---

## 🤝 Código de Conducta

Sé respetuoso, inclusivo y constructivo. Consulta [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) si existe.

---

¿Dudas? Abre un issue o pregunta en [Discussions](https://github.com/papulodev/qr-lector/discussions).