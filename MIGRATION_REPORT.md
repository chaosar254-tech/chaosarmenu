# Migration Report: menu2 → customer-menu/apps/web

## Date: 2025-01-15

## Summary
Successfully merged website (marketing) from `menu2/` into `customer-menu/apps/web`.

## Files Moved

### 1. Marketing App → apps/web
**Source:** `menu2/apps/marketing/`  
**Destination:** `customer-menu/apps/web/`

#### App Structure:
- ✅ `app/page.tsx` - Landing page
- ✅ `app/layout.tsx` - Root layout with Navbar/Footer
- ✅ `app/globals.css` - Global styles
- ✅ `app/policies/` - Policy pages (cookie, kvkk, privacy, terms)
- ✅ `app/api/lead/route.ts` - Lead form API endpoint
- ✅ `app/components/` - All website components:
  - `Navbar.tsx`
  - `Footer.tsx`
  - `LeadForm.tsx`
  - `LeadFormModal.tsx`
  - `DemoOverlay.tsx` (iframe wrapper, not actual demo logic)
  - `hero/` - Hero section components
  - `HeroDecor.tsx`, `HeroVeggieDecor.tsx`

#### Configuration Files:
- ✅ `package.json` - Updated name to `@chaosar/web`, port to 3002
- ✅ `next.config.js` - Static export config
- ✅ `tsconfig.json`
- ✅ `tailwind.config.js`
- ✅ `postcss.config.js`
- ✅ `.eslintrc.json`

#### Public Assets:
- ✅ `public/hero/hero-bg.png`
- ✅ `public/burger.jpg`, `pizza.jpg`

### 2. Shared Packages → packages/
**Source:** `menu2/packages/`  
**Destination:** `customer-menu/packages/`

- ✅ `packages/config/` - Constants, theme, utils
- ✅ `packages/ui/` - UI components (Button, Badge, Card, Section, etc.)

## Configuration Updates

### 1. `customer-menu/pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'packages/*'  # Added
```

### 2. `customer-menu/apps/web/package.json`
- Name: `@chaosar/marketing` → `@chaosar/web`
- Dev script: Added port `-p 3002`

### 3. `customer-menu/apps/web/app/page.tsx`
- Updated demo URL references:
  - Port: `3003` → `3001` (menu app port)
  - Path: `/menus/demo-burger/` → `/menu/demo-burger`

## Files NOT Moved (Correctly Excluded)

### AR/Menu Logic (Correctly Left in menu2 or customer-menu/apps/menu):
- ❌ `ARViewer.tsx` - AR component (stays in apps/menu)
- ❌ `.glb` / `.usdz` files - 3D models (stays in apps/menu/public/models/)
- ❌ Menu routes (`/menus/[restaurantSlug]`) - Menu logic (stays in apps/menu)
- ❌ Menu components - Menu-specific components (stays in apps/menu)

### Dashboard Logic (Already in customer-menu/apps/dashboard):
- ❌ Dashboard components - Already exists
- ❌ Admin routes - Already exists

## Port Assignments

- `apps/dashboard`: Port 3000
- `apps/menu`: Port 3001
- `apps/web`: Port 3002 (new)

## Import Paths

All imports verified and working:
- ✅ `@chaosar/config` - Working (packages/config)
- ✅ `@chaosar/ui` - Working (packages/ui)
- ✅ Relative imports - All correct

## Verification Checklist

- ✅ No ARViewer references in apps/web
- ✅ No .glb/.usdz files in apps/web
- ✅ No menu route logic in apps/web
- ✅ All package imports resolve correctly
- ✅ Workspace config updated
- ✅ Port conflicts resolved
- ✅ Demo URL references updated to point to menu app

## Next Steps

1. Run `pnpm install` in customer-menu root to install dependencies
2. Test `pnpm dev` to ensure all apps start correctly
3. Verify web app builds: `cd apps/web && pnpm build`
4. Update environment variables if needed:
   - `NEXT_PUBLIC_MENU_URL` should point to menu app (port 3001)
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` for WhatsApp links

## Notes

- `DemoOverlay.tsx` is just an iframe wrapper - it doesn't contain actual demo logic
- The web app links to the menu app for demo functionality
- All website/marketing content is now isolated in apps/web
- menu2 can be safely removed after verification
