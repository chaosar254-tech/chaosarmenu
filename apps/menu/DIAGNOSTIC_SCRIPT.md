# Diagnostic Script for Social FAB Fixed Positioning

## Problem
If the top-right icon (Social FAB) moves while scrolling, use this diagnostic script to identify the root cause.

## Diagnostic Console Script

Open DevTools Console and run:

```javascript
const el = document.querySelector('[data-testid="social-fab"]');
if (!el) {
  console.error('Social FAB not found! Check data-testid="social-fab"');
} else {
  console.log('Found Social FAB:', el);
  console.log('Computed position:', getComputedStyle(el).position);
  console.log('Parent element:', el.parentElement);
  console.log('Is in document.body?', el.parentElement === document.body);
  
  // Check for scroll parents
  let p = el;
  let foundScrollParent = false;
  let foundTransformParent = false;
  
  while (p && p !== document.body) {
    const s = getComputedStyle(p);
    
    // Check for overflow scroll
    if (/(auto|scroll)/.test(s.overflowY) || /(auto|scroll)/.test(s.overflow)) {
      console.warn('❌ SCROLL PARENT FOUND:', p, {
        overflow: s.overflow,
        overflowY: s.overflowY,
        tagName: p.tagName,
        className: p.className,
      });
      foundScrollParent = true;
    }
    
    // Check for transform/filter/perspective
    if (s.transform !== 'none' || s.filter !== 'none' || s.perspective !== 'none' || s.willChange.includes('transform')) {
      console.warn('❌ TRANSFORM/FILTER PARENT FOUND:', p, {
        transform: s.transform,
        filter: s.filter,
        perspective: s.perspective,
        willChange: s.willChange,
        tagName: p.tagName,
        className: p.className,
      });
      foundTransformParent = true;
    }
    
    p = p.parentElement;
  }
  
  if (!foundScrollParent && !foundTransformParent && el.parentElement === document.body) {
    console.log('✅ GOOD: No scroll/transform parents found. Element is directly in document.body');
    console.log('✅ Position should be fixed relative to viewport');
  } else {
    console.error('❌ BAD: Element has problematic parent or is not in document.body');
  }
  
  // Verify computed styles
  const computed = getComputedStyle(el);
  console.log('Computed styles:', {
    position: computed.position,
    top: computed.top,
    right: computed.right,
    zIndex: computed.zIndex,
    width: computed.width,
    height: computed.height,
    borderRadius: computed.borderRadius,
  });
  
  if (computed.position !== 'fixed') {
    console.error('❌ Position is NOT fixed! Should be "fixed" but got:', computed.position);
  } else {
    console.log('✅ Position is correctly set to "fixed"');
  }
}
```

## Expected Results

### ✅ Correct (Portal Implementation)
- `Is in document.body?` → `true`
- `Found scroll/transform parents` → `false` (no warnings)
- `Computed position` → `"fixed"`
- Element should NOT move when scrolling

### ❌ Incorrect (Before Portal Fix)
- `Is in document.body?` → `false`
- Found scroll parent with `overflow: auto` or `overflow: scroll`
- OR found transform parent with `transform: ...` or `filter: ...`
- Element moves when scrolling

## Manual Test

1. Open the customer menu page
2. Scroll the page up and down
3. Observe the Social FAB button (top-right icon)
4. **Expected**: Button stays in the same screen position (doesn't move)
5. **Bug**: Button moves down/up with scroll content

## Fix Verification

After implementing the Portal fix:
- Button is rendered via `createPortal(button, document.body)`
- Button has `data-testid="social-fab"`
- Button CSS has `position: fixed` (not in className, in inline style)
- No scroll or transform parents should be found by diagnostic script

