/**
 * Layout Preview & Comparison Script
 *
 * Generates a visual comparison of all 30 furniture store layouts
 * Shows the unique characteristics of each layout
 *
 * Usage:
 *   npx tsx scripts/preview-layouts.ts
 */
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const db = new PrismaClient()

const STYLE_LABELS = {
  // Header styles
  'minimal-bar': 'Minimal Top Bar',
  'centered-logo': 'Centered Logo',
  'split-nav': 'Split Navigation',
  'sticky-glass': 'Sticky Glass Effect',

  // Hero styles
  'split-image': 'Split Image Layout',
  'full-bleed': 'Full Bleed Hero',
  'carousel': 'Image Carousel',
  'grid-cells': 'Grid Cells',
  'video-bg': 'Video Background',

  // Product grid
  '3-col-cards': '3 Column Cards',
  '4-col-tight': '4 Column Tight',
  'masonry': 'Masonry Grid',
  'list-rows': 'List Rows',
  'slider': 'Horizontal Slider',
  'bento': 'Bento Grid',

  // Footer
  'footer-minimal': 'Minimal Footer',
  'footer-mega': 'Mega Footer',
  'footer-center': 'Centered Footer',
  'footer-split': 'Split Footer',

  // Card styles
  'flat': 'Flat Cards',
  'shadow': 'Shadow Cards',
  'border': 'Border Cards',
  'outlined': 'Outlined Cards',
  'glass': 'Glass Morphism',

  // Spacing
  'compact': 'Compact Spacing',
  'normal': 'Normal Spacing',
  'spacious': 'Spacious Layout',
  'minimal': 'Minimal Spacing',

  // Image styles
  'square': 'Square Images',
  'rounded': 'Rounded Images',
  'circle': 'Circular Images',
  'sharp': 'Sharp Edges',

  // Button styles
  'solid': 'Solid Buttons',
  'outline': 'Outline Buttons',
  'ghost': 'Ghost Buttons',
  'pill': 'Pill Buttons',

  // Nav position
  'top': 'Top Navigation',
  'side': 'Side Navigation',
  'sticky': 'Sticky Navigation',

  // Animation
  'fade': 'Fade Animation',
  'slide': 'Slide Animation',
  'zoom': 'Zoom Animation',
  'none': 'No Animation',
}

async function main() {
  console.log('📊 Layout Preview & Comparison\n')

  const layouts = await db.layout.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  console.log(`Found ${layouts.length} layouts across 5 categories\n`)

  // Group by category
  const categories = ['MODERN', 'LUXURY', 'MINIMAL', 'CREATIVE', 'CLASSIC']

  // Console output
  for (const category of categories) {
    const categoryLayouts = layouts.filter(l => l.category === category)
    console.log(`\n${'='.repeat(80)}`)
    console.log(`${category} (${categoryLayouts.length} layouts)`)
    console.log('='.repeat(80))

    for (const layout of categoryLayouts) {
      console.log(`\n📐 ${layout.name}${layout.premium ? ' ⭐️ PREMIUM' : ''}`)
      console.log(`   ${layout.description}`)
      console.log('')
      console.log(`   STRUCTURE:`)
      console.log(`   • Header:   ${STYLE_LABELS[layout.headerStyle] || layout.headerStyle}`)
      console.log(`   • Hero:     ${STYLE_LABELS[layout.heroStyle] || layout.heroStyle}`)
      console.log(`   • Products: ${STYLE_LABELS[layout.productGrid] || layout.productGrid}`)
      console.log(`   • Footer:   ${STYLE_LABELS[layout.footerStyle] || layout.footerStyle}`)
      console.log('')
      console.log(`   COLORS:`)
      console.log(`   • Primary:  ${layout.primaryColor}`)
      console.log(`   • Accent:   ${layout.accentColor}`)
      console.log(`   • BG:       ${layout.bgColor}`)
      console.log(`   • Text:     ${layout.textColor}`)
      console.log('')
      console.log(`   TYPOGRAPHY:`)
      console.log(`   • Heading:  ${layout.fontHeading}`)
      console.log(`   • Body:     ${layout.fontBody}`)
      console.log('')
      console.log(`   VISUAL DETAILS:`)
      console.log(`   • Cards:      ${STYLE_LABELS[layout.cardStyle] || layout.cardStyle}`)
      console.log(`   • Spacing:    ${STYLE_LABELS[layout.spacing] || layout.spacing}`)
      console.log(`   • Images:     ${STYLE_LABELS[layout.imageStyle] || layout.imageStyle}`)
      console.log(`   • Buttons:    ${STYLE_LABELS[layout.buttonStyle] || layout.buttonStyle}`)
      console.log(`   • Navigation: ${STYLE_LABELS[layout.navPosition] || layout.navPosition}`)
      console.log(`   • Radius:     ${layout.borderRadius}px`)
      console.log(`   • Animation:  ${STYLE_LABELS[layout.animation] || layout.animation}`)
    }
  }

  // Generate HTML comparison
  console.log('\n\n📄 Generating HTML comparison file...')
  generateHTMLComparison(layouts, categories)
  console.log('✅ HTML file created: scripts/layout-preview.html')
  console.log('\n   Open this file in your browser to see a visual comparison of all layouts.')
}

function generateHTMLComparison(layouts: any[], categories: string[]) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FurnitureHub - Layout Comparison</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 2rem;
      line-height: 1.6;
    }
    .header {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .subtitle { color: #666; font-size: 1.1rem; }
    .category-section {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .category-title {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 3px solid #0f766e;
    }
    .layouts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .layout-card {
      border: 2px solid #e5e5e5;
      border-radius: 8px;
      padding: 1.5rem;
      background: #fafafa;
      transition: all 0.2s;
    }
    .layout-card:hover {
      border-color: #0f766e;
      box-shadow: 0 4px 12px rgba(15, 118, 110, 0.15);
    }
    .layout-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
    }
    .layout-name {
      font-size: 1.1rem;
      font-weight: bold;
      color: #111;
    }
    .premium-badge {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: white;
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: bold;
    }
    .layout-desc {
      color: #555;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e5e5e5;
    }
    .color-palette {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .color-swatch {
      height: 40px;
      border-radius: 6px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: relative;
    }
    .color-swatch:hover::after {
      content: attr(data-label);
      position: absolute;
      bottom: -24px;
      left: 50%;
      transform: translateX(-50%);
      background: #111;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      white-space: nowrap;
      z-index: 10;
    }
    .style-details {
      display: grid;
      gap: 0.5rem;
    }
    .style-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      padding: 0.25rem 0;
    }
    .style-label {
      color: #666;
      font-weight: 500;
    }
    .style-value {
      color: #111;
      font-weight: 600;
      text-align: right;
    }
    .fonts {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e5e5e5;
    }
    .font-preview {
      margin: 0.5rem 0;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #0f766e;
    }
    .stat-label {
      color: #666;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏠 FurnitureHub Layout Comparison</h1>
    <p class="subtitle">30 unique furniture store layouts across 5 categories</p>
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="stat-value">${layouts.length}</div>
      <div class="stat-label">Total Layouts</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${layouts.filter(l => l.premium).length}</div>
      <div class="stat-label">Premium Layouts</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">5</div>
      <div class="stat-label">Categories</div>
    </div>
  </div>

  ${categories.map(category => {
    const categoryLayouts = layouts.filter(l => l.category === category)
    return `
      <div class="category-section">
        <h2 class="category-title">${category} (${categoryLayouts.length})</h2>
        <div class="layouts-grid">
          ${categoryLayouts.map(layout => `
            <div class="layout-card">
              <div class="layout-header">
                <div class="layout-name">${layout.name}</div>
                ${layout.premium ? '<div class="premium-badge">PREMIUM</div>' : ''}
              </div>
              <div class="layout-desc">${layout.description}</div>

              <div class="color-palette">
                <div class="color-swatch" style="background-color: ${layout.primaryColor}" data-label="Primary"></div>
                <div class="color-swatch" style="background-color: ${layout.accentColor}" data-label="Accent"></div>
                <div class="color-swatch" style="background-color: ${layout.bgColor}" data-label="BG"></div>
                <div class="color-swatch" style="background-color: ${layout.textColor}" data-label="Text"></div>
              </div>

              <div class="style-details">
                <div class="style-row">
                  <span class="style-label">Header:</span>
                  <span class="style-value">${STYLE_LABELS[layout.headerStyle] || layout.headerStyle}</span>
                </div>
                <div class="style-row">
                  <span class="style-label">Hero:</span>
                  <span class="style-value">${STYLE_LABELS[layout.heroStyle] || layout.heroStyle}</span>
                </div>
                <div class="style-row">
                  <span class="style-label">Products:</span>
                  <span class="style-value">${STYLE_LABELS[layout.productGrid] || layout.productGrid}</span>
                </div>
                <div class="style-row">
                  <span class="style-label">Footer:</span>
                  <span class="style-value">${STYLE_LABELS[layout.footerStyle] || layout.footerStyle}</span>
                </div>
                <div class="style-row">
                  <span class="style-label">Cards:</span>
                  <span class="style-value">${STYLE_LABELS[layout.cardStyle] || layout.cardStyle}</span>
                </div>
                <div class="style-row">
                  <span class="style-label">Spacing:</span>
                  <span class="style-value">${STYLE_LABELS[layout.spacing] || layout.spacing}</span>
                </div>
                <div class="style-row">
                  <span class="style-label">Images:</span>
                  <span class="style-value">${STYLE_LABELS[layout.imageStyle] || layout.imageStyle}</span>
                </div>
                <div class="style-row">
                  <span class="style-label">Buttons:</span>
                  <span class="style-value">${STYLE_LABELS[layout.buttonStyle] || layout.buttonStyle}</span>
                </div>
                <div class="style-row">
                  <span class="style-label">Navigation:</span>
                  <span class="style-value">${STYLE_LABELS[layout.navPosition] || layout.navPosition}</span>
                </div>
                <div class="style-row">
                  <span class="style-label">Border Radius:</span>
                  <span class="style-value">${layout.borderRadius}px</span>
                </div>
                <div class="style-row">
                  <span class="style-label">Animation:</span>
                  <span class="style-value">${STYLE_LABELS[layout.animation] || layout.animation}</span>
                </div>
              </div>

              <div class="fonts">
                <div class="font-preview" style="font-family: '${layout.fontHeading}', serif; font-weight: bold; font-size: 1.1rem;">
                  ${layout.fontHeading}
                </div>
                <div class="font-preview" style="font-family: '${layout.fontBody}', sans-serif; font-size: 0.9rem; color: #666;">
                  ${layout.fontBody}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }).join('')}
</body>
</html>
  `

  const outputPath = path.join(__dirname, 'layout-preview.html')
  fs.writeFileSync(outputPath, html.trim())
}

main()
  .catch((e) => {
    console.error('❌ Preview generation failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
