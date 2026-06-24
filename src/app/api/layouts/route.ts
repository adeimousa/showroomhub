import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAnyAdmin } from '@/lib/session'

export async function GET() {
  const { fail } = await requireAnyAdmin()
  if (fail) return fail

  const layouts = await db.layout.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })
  return NextResponse.json({ layouts })
}

export async function POST(req: NextRequest) {
  const { fail } = await requireAnyAdmin()
  if (fail) return fail

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const required = ['name', 'category', 'headerStyle', 'heroStyle', 'productGrid', 'footerStyle', 'primaryColor', 'accentColor', 'bgColor', 'textColor', 'fontHeading', 'fontBody']
  for (const f of required) {
    if (body[f] == null) return NextResponse.json({ error: `Missing field: ${f}` }, { status: 400 })
  }

  try {
    const layout = await db.layout.create({
      data: {
        name: body.name,
        category: body.category,
        description: body.description || '',
        premium: !!body.premium,
        headerStyle: body.headerStyle,
        heroStyle: body.heroStyle,
        productGrid: body.productGrid,
        footerStyle: body.footerStyle,
        primaryColor: body.primaryColor,
        accentColor: body.accentColor,
        bgColor: body.bgColor,
        textColor: body.textColor,
        fontHeading: body.fontHeading,
        fontBody: body.fontBody,
        borderRadius: Number(body.borderRadius ?? 8),
        animation: body.animation || 'fade',
        cardStyle: body.cardStyle || 'shadow',
        spacing: body.spacing || 'normal',
        imageStyle: body.imageStyle || 'rounded',
        buttonStyle: body.buttonStyle || 'solid',
        navPosition: body.navPosition || 'top',
      },
    })
    return NextResponse.json({ layout }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create layout' }, { status: 500 })
  }
}
