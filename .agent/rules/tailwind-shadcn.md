---
trigger: always_on
---

## Стилизация
- Используйте Tailwind CSS v4 + shadcn/ui/Radix UI для всех компонентов.
- Mobile-first: классы вроде "block md:flex", sm:prefix для breakpoints.
- Цвета/темы: следуйте design tokens из /tokens.css или Tailwind config (primary-blue-500, dark:).
- Классы: утилиты только, без inline styles. Группируйте: layout, spacing, typography, colors.
- Анимации: framer-motion или Tailwind transitions (hover:, focus:).
- Доступность: focus-visible, contrast WCAG AA, screen-reader only.
- CSS Modules fallback: если нет Tailwind, используйте styles.module.css с :local.
- Оптимизация: @apply в редких случаях; purge unused classes в tailwind.config.js.[web:20][web:26][web:27]

Пример Button:
<div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
  <span className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90">Button</span>
</div>

Для CSS Modules:
import styles from './Button.module.css';
<div className={styles.button}>Button</div>
