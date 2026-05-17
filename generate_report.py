from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.platypus.flowables import Flowable
from reportlab.lib.colors import HexColor

# ── Colours ──────────────────────────────────────────────
NAVY   = HexColor('#1a2e4a')
NAVY2  = HexColor('#243a5e')
GOLD   = HexColor('#c9973a')
GOLD2  = HexColor('#e8b84b')
GREEN  = HexColor('#16a34a')
ORANGE = HexColor('#d97706')
RED    = HexColor('#dc2626')
BLUE   = HexColor('#2563eb')
LIGHT  = HexColor('#f5f7fa')
MUTED  = HexColor('#64748b')
WHITE  = colors.white
TEXT   = HexColor('#1e293b')

W, H = A4

# ── Styles ────────────────────────────────────────────────
def ps(name, **kw):
    defaults = dict(fontName='Helvetica', fontSize=10, leading=14, textColor=TEXT)
    defaults.update(kw)
    return ParagraphStyle(name, **defaults)

def make_styles():
    s = {}
    s['body']        = ps('body',        spaceAfter=6)
    s['bold']        = ps('bold',        fontName='Helvetica-Bold')
    s['muted']       = ps('muted',       textColor=MUTED, fontSize=9, leading=12)
    s['center']      = ps('center',      alignment=TA_CENTER)
    s['justify']     = ps('justify',     alignment=TA_JUSTIFY, leading=16)
    s['h1']          = ps('h1',          fontName='Helvetica-Bold', fontSize=26,
                           textColor=WHITE, alignment=TA_CENTER, leading=32)
    s['h2']          = ps('h2',          fontName='Helvetica-Bold', fontSize=14,
                           textColor=NAVY, spaceAfter=4)
    s['h3']          = ps('h3',          fontName='Helvetica-Bold', fontSize=11,
                           textColor=NAVY, spaceAfter=3)
    s['cover_sub']   = ps('cover_sub',   fontSize=13, textColor=HexColor('#b0bec5'),
                           alignment=TA_CENTER, leading=18)
    s['cover_label'] = ps('cover_label', fontName='Helvetica-Bold', fontSize=8,
                           textColor=GOLD2, spaceAfter=2, leading=10)
    s['cover_val']   = ps('cover_val',   fontSize=11, textColor=WHITE, leading=14)
    s['bullet']      = ps('bullet',      leftIndent=14, spaceAfter=3)
    s['small']       = ps('small',       fontSize=9, leading=12)
    s['th']          = ps('th',          fontName='Helvetica-Bold', fontSize=9,
                           textColor=WHITE, alignment=TA_CENTER)
    s['td']          = ps('td',          fontSize=9, leading=12)
    s['td_c']        = ps('td_c',        fontSize=9, leading=12, alignment=TA_CENTER)
    s['gold_label']  = ps('gold_label',  fontName='Helvetica-Bold', fontSize=8,
                           textColor=GOLD2, spaceAfter=4)
    return s

S = make_styles()

# ── Custom Flowables ──────────────────────────────────────
class ColorRect(Flowable):
    def __init__(self, w, h, fill, radius=4):
        self.w, self.h, self.fill, self.radius = w, h, fill, radius
    def wrap(self, *a): return self.w, self.h
    def draw(self):
        self.canv.setFillColor(self.fill)
        self.canv.roundRect(0, 0, self.w, self.h, self.radius, fill=1, stroke=0)

class StatusBadge(Flowable):
    COLORS = {
        'done': (HexColor('#dcfce7'), GREEN),
        'prog': (HexColor('#fef3c7'), ORANGE),
        'todo': (HexColor('#fee2e2'), RED),
        'next': (HexColor('#dbeafe'), BLUE),
    }
    def __init__(self, kind, label):
        bg, fg = self.COLORS[kind]
        self.bg, self.fg, self.label = bg, fg, label
    def wrap(self, *a):
        return 72, 14
    def draw(self):
        c = self.canv
        c.setFillColor(self.bg)
        c.roundRect(0, 0, 72, 14, 6, fill=1, stroke=0)
        c.setFillColor(self.fg)
        c.setFont('Helvetica-Bold', 7)
        c.drawCentredString(36, 3.5, self.label)

def section_heading(num, title):
    data = [[
        Paragraph(str(num), ParagraphStyle('sn', fontName='Helvetica-Bold',
                  fontSize=10, textColor=GOLD2, alignment=TA_CENTER)),
        Paragraph(title, S['h2'])
    ]]
    t = Table(data, colWidths=[1*cm, 14*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0),(0,0), NAVY),
        ('VALIGN',     (0,0),(-1,-1), 'MIDDLE'),
        ('LEFTPADDING',(0,0),(0,0), 6),
        ('RIGHTPADDING',(0,0),(0,0), 6),
        ('TOPPADDING', (0,0),(-1,-1), 5),
        ('BOTTOMPADDING',(0,0),(-1,-1), 5),
        ('ROUNDEDCORNERS', [4]),
    ]))
    return [t, Spacer(1, 10)]

def hr():
    return HRFlowable(width='100%', thickness=1, color=HexColor('#dde3ec'), spaceAfter=10, spaceBefore=4)

def callout(text):
    data = [[Paragraph(text, S['body'])]]
    t = Table(data, colWidths=[15*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0),(-1,-1), HexColor('#eff6ff')),
        ('LEFTPADDING',(0,0),(-1,-1), 12),
        ('RIGHTPADDING',(0,0),(-1,-1), 12),
        ('TOPPADDING', (0,0),(-1,-1), 10),
        ('BOTTOMPADDING',(0,0),(-1,-1), 10),
        ('LINEAFTER',  (0,0),(0,-1), 4, BLUE),
        ('ROUNDEDCORNERS', [4]),
    ]))
    return [t, Spacer(1, 10)]

def status_row(step, desc, kind, badge_text):
    data = [[
        Paragraph(step, S['td']),
        Paragraph(desc, S['td']),
        StatusBadge(kind, badge_text),
    ]]
    return data

def progress_bar(label, pct, color=NAVY):
    bar_w = 12 * cm
    filled = bar_w * pct / 100
    pct_str = f'{pct}%'
    data = [[
        Paragraph(label, S['small']),
        Paragraph(pct_str, ParagraphStyle('pct', fontName='Helvetica-Bold',
                  fontSize=9, textColor=GREEN if pct==100 else (RED if pct==0 else ORANGE),
                  alignment=TA_CENTER))
    ]]
    header = Table(data, colWidths=[13*cm, 2*cm])
    header.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('TOPPADDING',(0,0),(-1,-1),0),
        ('BOTTOMPADDING',(0,0),(-1,-1),3),
    ]))

    track_data = [['']]
    track = Table(track_data, colWidths=[bar_w], rowHeights=[8])
    track.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1), HexColor('#dde3ec')),
        ('ROUNDEDCORNERS',[4]),
        ('TOPPADDING',(0,0),(-1,-1),0),
        ('BOTTOMPADDING',(0,0),(-1,-1),0),
    ]))

    fill_data = [['']]
    if pct > 0:
        fill = Table(fill_data, colWidths=[filled], rowHeights=[8])
        fill.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,-1), color),
            ('ROUNDEDCORNERS',[4]),
            ('TOPPADDING',(0,0),(-1,-1),0),
            ('BOTTOMPADDING',(0,0),(-1,-1),0),
        ]))

    return [header, track, Spacer(1,8)]

def tl_item(dot_kind, title, desc):
    dot_colors = {'done':GREEN,'prog':ORANGE,'todo':MUTED,'next':BLUE}
    dc = dot_colors[dot_kind]
    items = [
        [Paragraph(f'<b>{title}</b>', S['bold']),
         Paragraph(desc, S['muted'])]
    ]
    t = Table(items, colWidths=[15*cm])
    t.setStyle(TableStyle([
        ('LEFTPADDING',(0,0),(-1,-1), 12),
        ('TOPPADDING',(0,0),(-1,-1), 4),
        ('BOTTOMPADDING',(0,0),(-1,-1), 4),
        ('LINEBEFORE',(0,0),(0,-1), 3, dc),
        ('BACKGROUND',(0,0),(-1,-1), LIGHT),
        ('ROUNDEDCORNERS',[3]),
    ]))
    return [t, Spacer(1,6)]

# ── Cover Page ────────────────────────────────────────────
def build_cover():
    elems = []

    # navy background block
    cover_data = [[
        Paragraph('FINAL YEAR PROJECT — PROGRESS REPORT', S['gold_label']),
        Spacer(1, 12),
        Paragraph('Legal Code<br/><font color="#e8b84b">Assistant</font>', S['h1']),
        Spacer(1, 8),
        Paragraph('AI-Powered Pakistani Legal Research &amp; Advisory System', S['cover_sub']),
        Spacer(1, 24),
        HRFlowable(width='80', thickness=3, color=GOLD, lineCap='round', spaceAfter=24),
    ]]
    meta = Table([
        [
            Table([[
                Paragraph('STUDENT',  S['cover_label']),
                Paragraph('Ali Shair', S['cover_val']),
            ]], colWidths=[6.5*cm], style=[
                ('BACKGROUND',(0,0),(-1,-1), HexColor('#1e3a5e')),
                ('BOX',(0,0),(-1,-1),1,HexColor('#334e75')),
                ('ROUNDEDCORNERS',[5]),
                ('LEFTPADDING',(0,0),(-1,-1),12),
                ('TOPPADDING',(0,0),(-1,-1),8),
                ('BOTTOMPADDING',(0,0),(-1,-1),8),
            ]),
            Table([[
                Paragraph('REPORT DATE',  S['cover_label']),
                Paragraph('May 2026', S['cover_val']),
            ]], colWidths=[6.5*cm], style=[
                ('BACKGROUND',(0,0),(-1,-1), HexColor('#1e3a5e')),
                ('BOX',(0,0),(-1,-1),1,HexColor('#334e75')),
                ('ROUNDEDCORNERS',[5]),
                ('LEFTPADDING',(0,0),(-1,-1),12),
                ('TOPPADDING',(0,0),(-1,-1),8),
                ('BOTTOMPADDING',(0,0),(-1,-1),8),
            ]),
        ],
        [
            Table([[
                Paragraph('OVERALL PROGRESS',  S['cover_label']),
                Paragraph('~35% Complete', S['cover_val']),
            ]], colWidths=[6.5*cm], style=[
                ('BACKGROUND',(0,0),(-1,-1), HexColor('#1e3a5e')),
                ('BOX',(0,0),(-1,-1),1,HexColor('#334e75')),
                ('ROUNDEDCORNERS',[5]),
                ('LEFTPADDING',(0,0),(-1,-1),12),
                ('TOPPADDING',(0,0),(-1,-1),8),
                ('BOTTOMPADDING',(0,0),(-1,-1),8),
            ]),
            Table([[
                Paragraph('CURRENT PHASE',  S['cover_label']),
                Paragraph('Data + Frontend Done', S['cover_val']),
            ]], colWidths=[6.5*cm], style=[
                ('BACKGROUND',(0,0),(-1,-1), HexColor('#1e3a5e')),
                ('BOX',(0,0),(-1,-1),1,HexColor('#334e75')),
                ('ROUNDEDCORNERS',[5]),
                ('LEFTPADDING',(0,0),(-1,-1),12),
                ('TOPPADDING',(0,0),(-1,-1),8),
                ('BOTTOMPADDING',(0,0),(-1,-1),8),
            ]),
        ],
    ], colWidths=[6.8*cm, 6.8*cm], rowHeights=[None, None])
    meta.setStyle(TableStyle([
        ('ALIGN',(0,0),(-1,-1),'CENTER'),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('LEFTPADDING',(0,0),(-1,-1),3),
        ('RIGHTPADDING',(0,0),(-1,-1),3),
        ('TOPPADDING',(0,0),(-1,-1),3),
        ('BOTTOMPADDING',(0,0),(-1,-1),3),
    ]))

    full = Table([[
        Paragraph('FINAL YEAR PROJECT — PROGRESS REPORT', S['gold_label']),
        Spacer(1, 14),
        Paragraph('Legal Code\nAssistant', ParagraphStyle('cv_h1',
            fontName='Helvetica-Bold', fontSize=32, textColor=WHITE,
            alignment=TA_CENTER, leading=38)),
        Spacer(1, 10),
        Paragraph('AI-Powered Pakistani Legal Research & Advisory System', S['cover_sub']),
        Spacer(1, 20),
        HRFlowable(width=60, thickness=3, color=GOLD, lineCap='round',
                   spaceAfter=20, spaceBefore=0),
        meta,
        Spacer(1, 30),
        Paragraph('Confidential — FYP Committee Review', ParagraphStyle(
            'cf', fontName='Helvetica', fontSize=8,
            textColor=HexColor('#546e8a'), alignment=TA_CENTER)),
    ]], colWidths=[15.5*cm])
    full.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1), NAVY),
        ('ALIGN',(0,0),(-1,-1),'CENTER'),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('LEFTPADDING',(0,0),(-1,-1),30),
        ('RIGHTPADDING',(0,0),(-1,-1),30),
        ('TOPPADDING',(0,0),(-1,-1),60),
        ('BOTTOMPADDING',(0,0),(-1,-1),60),
        ('ROUNDEDCORNERS',[8]),
    ]))
    elems += [full, PageBreak()]
    return elems

# ── Page 2: Overview + Progress ───────────────────────────
def build_overview():
    elems = []
    elems += section_heading(1, 'Project Overview')
    elems += callout(
        '<b>Problem:</b> Pakistan\'s 2,000+ legal codes are locked inside dense government PDFs, '
        'inaccessible to ordinary citizens. Legal consultations cost thousands of rupees and are '
        'unavailable in rural areas.'
    )
    elems.append(Paragraph(
        'Legal Code Assistant is an AI-powered SaaS web application that answers legal questions '
        'in plain English, Urdu, and Roman Urdu — for free. It uses Retrieval-Augmented Generation (RAG) '
        'on 2,464 official Pakistani law PDFs to provide instant, cited answers for citizens, '
        'police officers, and lawyers.',
        S['justify']
    ))
    elems.append(Spacer(1, 16))

    elems += section_heading(2, 'Features Being Built')
    features = [
        ('⚖  AI Legal Chatbot',
         'Ask any question about Pakistani law in English/Urdu/Roman Urdu. Cites exact PPC/CrPC sections.'),
        ('📋  FIR Generator',
         'Describe an incident → AI auto-generates a legally correct FIR. References CrPC Section 154.'),
        ('🎙  Voice Assistant',
         'Speak your legal question in any language. Speech-to-text → RAG query → spoken answer.'),
        ('🔮  Case Outcome Predictor',
         'Input case facts → AI predicts bail probability and conviction likelihood.'),
        ('📄  Document Analyzer',
         'Upload FIR or contract → AI highlights key clauses, risks, and applicable laws.'),
        ('🎯  Self-Assessment Tool',
         'Instantly check penalty and bail status for any offense under Pakistani law.'),
    ]
    feat_data = [[
        Paragraph(f'<b>{t}</b><br/><font color="#64748b" size="8">{d}</font>', S['body'])
        for t, d in features[i:i+2]
    ] for i in range(0, len(features), 2)]
    ft = Table(feat_data, colWidths=[7.5*cm, 7.5*cm])
    ft.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1), LIGHT),
        ('BOX',(0,0),(0,-1),1,HexColor('#dde3ec')),
        ('BOX',(1,0),(1,-1),1,HexColor('#dde3ec')),
        ('INNERGRID',(0,0),(-1,-1),0.5,HexColor('#dde3ec')),
        ('TOPPADDING',(0,0),(-1,-1),8),
        ('BOTTOMPADDING',(0,0),(-1,-1),8),
        ('LEFTPADDING',(0,0),(-1,-1),10),
        ('RIGHTPADDING',(0,0),(-1,-1),10),
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('ROUNDEDCORNERS',[4]),
    ]))
    elems += [ft, Spacer(1, 20)]

    elems += section_heading(3, 'Progress Summary')
    bars = [
        ('Step 1 — Project Setup & Monorepo',       100),
        ('Step 3 — Data Collection (2,464 PDFs)',    100),
        ('Step 8 — Frontend UI (All Pages)',         100),
        ('Step 2 — Account Creation',                 30),
        ('Steps 4–5 — PDF Extraction & Embeddings',   0),
        ('Steps 6–10 — RAG API & Backend',             0),
        ('Steps 11–18 — Advanced Features',            0),
        ('Steps 20–30 — Testing, Deploy, FYP Docs',    0),
    ]
    for label, pct in bars:
        color = GREEN if pct==100 else (ORANGE if pct>0 else MUTED)
        pct_style = ParagraphStyle('ps', fontName='Helvetica-Bold', fontSize=9,
                                   textColor=color, alignment=TA_CENTER)
        track_w = 12.5*cm
        fill_w  = track_w * pct / 100

        row = [[
            Paragraph(label, S['small']),
            Paragraph(f'{pct}%', pct_style),
        ]]
        header = Table(row, colWidths=[13.5*cm, 1.5*cm])
        header.setStyle(TableStyle([
            ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
            ('TOPPADDING',(0,0),(-1,-1),0),
            ('BOTTOMPADDING',(0,0),(-1,-1),2),
            ('LEFTPADDING',(0,0),(-1,-1),0),
            ('RIGHTPADDING',(0,0),(-1,-1),0),
        ]))
        elems.append(header)

        track = Table([['']], colWidths=[track_w], rowHeights=[7])
        track.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,-1), HexColor('#dde3ec')),
            ('TOPPADDING',(0,0),(-1,-1),0),
            ('BOTTOMPADDING',(0,0),(-1,-1),0),
            ('LEFTPADDING',(0,0),(-1,-1),0),
        ]))
        elems.append(track)

        if fill_w > 0:
            fill_color = GREEN if pct==100 else ORANGE
            fill = Table([['']], colWidths=[fill_w], rowHeights=[7])
            fill.setStyle(TableStyle([
                ('BACKGROUND',(0,0),(-1,-1), fill_color),
                ('TOPPADDING',(0,0),(-1,-1),0),
                ('BOTTOMPADDING',(0,0),(-1,-1),0),
                ('LEFTPADDING',(0,0),(-1,-1),0),
            ]))
            # overlap trick: place on same row position — use negative spacer
            elems.append(Spacer(1, -7))
            elems.append(fill)

        elems.append(Spacer(1, 8))

    elems.append(PageBreak())
    return elems

# ── Page 3: Completed Work ────────────────────────────────
def build_completed():
    elems = []
    elems += section_heading(4, 'Completed Work')

    # Step 1
    s1 = [
        ['Step 1', 'Project Setup & Monorepo Structure',
         Paragraph('<b>✓ DONE</b>', ParagraphStyle('dg', fontName='Helvetica-Bold',
                   fontSize=8, textColor=GREEN, alignment=TA_CENTER))]
    ]
    s1_details = [
        'Next.js 16 + React 19 + TypeScript initialized',
        'Tailwind CSS v4 + Shadcn/UI (base-nova) configured',
        'Monorepo: frontend/, ai-ml-module/, legal-data/, backend-core/',
        'npm packages: Zustand, TanStack Query, Framer Motion, Lucide React',
        'Git repository with proper .gitignore',
    ]

    # Step 3
    s3_details = [
        'Custom Selenium scraper: ai-ml-module/scripts/download_pakistan_code_pdfs.py',
        'Source: pakistancode.gov.pk — official Estacode (all 17 categories)',
        '2,464 PDF files — Pakistani laws from 1840 to 2021',
        'Stored in legal-data/raw-pdfs/',
    ]

    # Step 8
    s8_details = [
        'Custom Navy + Gold design system, Playfair Display + Inter fonts',
        'Landing page: hero, voice search bar, role cards, features section, CTA',
        'Auth pages: Login (split-panel) + Signup',
        'Pricing page: Free / Pro (Rs.999/mo) / Enterprise tiers',
        'Chat system: sidebar layout, /chat role selector, /chat/[chatId] dynamic route',
        'Assessment tool: penalty + bail checker (6 offense categories)',
        'Settings: dark mode, language selector (English / Urdu / Roman Urdu)',
        'Profile: user info, plan status, Pro upgrade, sign out',
        'State: Zustand chatStore.ts — chat history + auth state',
        'Voice input: Web Speech API hook — real-time speech-to-text',
        'Build: TypeScript passing, 0 errors, 11 routes generating (8 static + 1 dynamic)',
    ]

    def completed_card(step_num, step_title, details):
        bullet_text = ''.join([f'• {d}<br/>' for d in details])
        data = [[
            Paragraph(f'<b>Step {step_num}</b>', ParagraphStyle('st', fontName='Helvetica-Bold',
                      fontSize=10, textColor=NAVY)),
            Paragraph(step_title, S['bold']),
            Paragraph('✓  DONE', ParagraphStyle('dk', fontName='Helvetica-Bold',
                      fontSize=8, textColor=GREEN, alignment=TA_CENTER)),
        ],[
            '',
            Paragraph(bullet_text, ParagraphStyle('blt', fontName='Helvetica',
                      fontSize=9, textColor=MUTED, leading=13)),
            '',
        ]]
        t = Table(data, colWidths=[1.5*cm, 11*cm, 2.5*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,-1), WHITE),
            ('BOX',(0,0),(-1,-1),1, HexColor('#dde3ec')),
            ('LINEBEFORE',(0,0),(0,-1),4, GREEN),
            ('SPAN',(0,1),(0,1)),
            ('SPAN',(2,1),(2,1)),
            ('VALIGN',(0,0),(-1,-1),'TOP'),
            ('TOPPADDING',(0,0),(-1,-1),8),
            ('BOTTOMPADDING',(0,0),(-1,-1),8),
            ('LEFTPADDING',(0,0),(-1,-1),10),
            ('RIGHTPADDING',(0,0),(-1,-1),10),
            ('ROUNDEDCORNERS',[4]),
        ]))
        return [t, Spacer(1, 10)]

    elems += completed_card(1, 'Project Setup & Monorepo Structure', s1_details)
    elems += completed_card(3, 'Data Collection — 2,464 Pakistani Law PDFs', s3_details)

    # PDF Category table inside Step 3
    cat_data = [
        [Paragraph('Category', S['th']), Paragraph('Count', S['th']),
         Paragraph('Category', S['th']), Paragraph('Count', S['th'])],
        ['Criminal Laws','449','Police Laws','212'],
        ['Civil Laws','401','Companies Laws','187'],
        ['Family Laws','300','Land/Property Laws','118'],
        ['Labour Laws','227','Islamic/Religious Laws','108'],
        ['Service Laws','219','Banking/Financial Laws','74'],
        [Paragraph('<b>Total</b>', S['td']),'','',Paragraph('<b>2,464</b>', S['td'])],
    ]
    cat_t = Table(cat_data, colWidths=[5*cm, 2.5*cm, 5*cm, 2.5*cm])
    cat_t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0), NAVY),
        ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT]),
        ('INNERGRID',(0,0),(-1,-1),0.5, HexColor('#dde3ec')),
        ('BOX',(0,0),(-1,-1),1, HexColor('#dde3ec')),
        ('FONTNAME',(0,1),(-1,-1),'Helvetica'),
        ('FONTSIZE',(0,1),(-1,-1),9),
        ('LEFTPADDING',(0,0),(-1,-1),8),
        ('TOPPADDING',(0,0),(-1,-1),5),
        ('BOTTOMPADDING',(0,0),(-1,-1),5),
        ('ALIGN',(1,0),(1,-1),'CENTER'),
        ('ALIGN',(3,0),(3,-1),'CENTER'),
    ]))
    elems += [cat_t, Spacer(1, 14)]
    elems += completed_card(8, 'Frontend UI — Full Next.js App Router Migration', s8_details)

    # Step 2 in progress
    ip_data = [[
        Paragraph('<b>Step 2</b>', ParagraphStyle('st', fontName='Helvetica-Bold',
                  fontSize=10, textColor=NAVY)),
        Paragraph('Account Creation (Groq, Supabase, Qdrant, Vercel)', S['bold']),
        Paragraph('⏳  IN PROGRESS', ParagraphStyle('dk', fontName='Helvetica-Bold',
                  fontSize=8, textColor=ORANGE, alignment=TA_CENTER)),
    ],[
        '',
        Paragraph('All service accounts being set up. All have free tiers — zero cost for FYP scope.',
                  ParagraphStyle('blt', fontName='Helvetica', fontSize=9, textColor=MUTED)),
        '',
    ]]
    ip_t = Table(ip_data, colWidths=[1.5*cm, 11*cm, 2.5*cm])
    ip_t.setStyle(TableStyle([
        ('BOX',(0,0),(-1,-1),1, HexColor('#dde3ec')),
        ('LINEBEFORE',(0,0),(0,-1),4, ORANGE),
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,-1),8),
        ('BOTTOMPADDING',(0,0),(-1,-1),8),
        ('LEFTPADDING',(0,0),(-1,-1),10),
        ('RIGHTPADDING',(0,0),(-1,-1),10),
        ('ROUNDEDCORNERS',[4]),
    ]))
    elems += [ip_t, PageBreak()]
    return elems

# ── Page 4: Remaining Work ────────────────────────────────
def build_remaining():
    elems = []
    elems += section_heading(5, 'Remaining Work & Roadmap')

    items = [
        ('next', 'Step 4 — PDF Text Extraction  [NEXT]',
         'Use pdfplumber (Python, free) to extract text from all 2,464 PDFs. '
         'Parse into structured JSON with section numbers, titles, and content. '
         'Expected: 50,000–200,000 law sections. Output to legal-data/extracted/.'),
        ('todo', 'Step 5 — Vector Embeddings + Qdrant Upload',
         'Convert each section into 384-dim vectors using paraphrase-multilingual-MiniLM-L12-v2 '
         '(supports Urdu + English, runs on CPU, completely free). Upload to Qdrant cloud free tier.'),
        ('todo', 'Step 6 — Semantic Search Function',
         'Next.js API route: user query → embed → Qdrant nearest-neighbour search → '
         'return top-K matching law sections with metadata (category, year, section number).'),
        ('todo', 'Step 7 — RAG Chat API (Groq Llama 3.1-70B)',
         'Core AI endpoint: retrieved sections + user question → Groq API → answer with citations. '
         'Connect to existing chat UI (replacing current mock responses).'),
        ('todo', 'Step 9 — Authentication (Supabase Auth)',
         'Real login/signup via Supabase Auth. Session management, protected routes, user profiles in PostgreSQL.'),
        ('todo', 'Step 10 — Usage Limits & Tracking',
         'Free: 10 queries/day. Pro: unlimited. Track in Supabase, enforce in Next.js middleware.'),
        ('todo', 'Step 11 — FIR Generator',
         'Multi-step form → Groq generates properly formatted FIR → PDF export. References CrPC Section 154.'),
        ('todo', 'Step 12 — Voice Assistant (Full Integration)',
         'Voice input already built on frontend. Connect to RAG backend. Add TTS output for AI responses.'),
        ('todo', 'Steps 13–14 — Case Predictor & Document Analyzer',
         'Case predictor: facts → probability analysis. Document analyzer: upload FIR/contract → AI extracts risks.'),
        ('todo', 'Steps 15–16 — Payment System (JazzCash)',
         'JazzCash Business API for Rs. 999/month Pro subscriptions. Webhook handling for subscription status.'),
        ('todo', 'Steps 17–18 — User Dashboard & Query History',
         'Dashboard: usage stats, saved queries, subscription. Full query history with search and export.'),
        ('todo', 'Steps 20–24 — Performance, Testing & Bug Fixes',
         'Optimization, comprehensive error handling, SEO meta tags, PWA support, end-to-end testing.'),
        ('todo', 'Step 25 — Production Deployment',
         'Frontend → Vercel. Database → Supabase Cloud. Configure custom domain, SSL, environment variables.'),
        ('todo', 'Steps 26–27 — Launch & User Feedback',
         'Beta launch, target 100+ users. Iterate. Revenue target: Rs. 99,900/month from 100 Pro users.'),
        ('todo', 'Steps 28–30 — FYP Documentation & Submission',
         'Full FYP report, system documentation, demo preparation, final submission and demo day.'),
    ]

    dot_colors = {'done':GREEN, 'prog':ORANGE, 'todo':MUTED, 'next':BLUE}
    for kind, title, desc in items:
        dc = dot_colors[kind]
        t = Table([[
            Paragraph(f'<b>{title}</b><br/><font color="#64748b" size="8">{desc}</font>', S['body'])
        ]], colWidths=[15*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,-1), LIGHT if kind!='next' else HexColor('#eff6ff')),
            ('LINEBEFORE',(0,0),(0,-1), 3, dc),
            ('LEFTPADDING',(0,0),(-1,-1),10),
            ('RIGHTPADDING',(0,0),(-1,-1),10),
            ('TOPPADDING',(0,0),(-1,-1),7),
            ('BOTTOMPADDING',(0,0),(-1,-1),7),
            ('ROUNDEDCORNERS',[3]),
        ]))
        elems += [t, Spacer(1, 6)]

    elems.append(PageBreak())
    return elems

# ── Page 5: Tech Stack + Architecture ────────────────────
def build_tech():
    elems = []
    elems += section_heading(6, 'Technology Stack')
    elems += callout(
        '<b>Zero-Cost Architecture:</b> Every tool has a free tier sufficient for FYP scope. '
        'No credit card required to build and launch the entire system.'
    )

    th_style = ParagraphStyle('th2', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)
    td_style = ParagraphStyle('td2', fontName='Helvetica', fontSize=9, leading=13, textColor=TEXT)
    free_style = ParagraphStyle('free', fontName='Helvetica-Bold', fontSize=8, textColor=GREEN)

    tech_data = [
        [Paragraph('Layer', th_style), Paragraph('Technology', th_style),
         Paragraph('Purpose', th_style), Paragraph('Cost', th_style)],
        ['Frontend', 'Next.js 16 + React 19 + TypeScript', 'Web app, SSR/SSG, API Routes',
         Paragraph('Free', free_style)],
        ['', 'Tailwind CSS v4 + Shadcn/UI', 'Styling, reusable components',
         Paragraph('Free', free_style)],
        ['', 'Zustand + TanStack Query', 'State management, data fetching',
         Paragraph('Free', free_style)],
        ['AI / LLM', 'Groq — Llama 3.1-70B', 'Answer generation with legal citations',
         Paragraph('Free tier', free_style)],
        ['Embeddings', 'multilingual-MiniLM-L12-v2', 'Text → 384-dim vectors (Urdu+English)',
         Paragraph('Free (local)', free_style)],
        ['Vector DB', 'Qdrant Cloud', 'Semantic search over 50K-200K sections',
         Paragraph('Free 1GB', free_style)],
        ['Database', 'Supabase (PostgreSQL)', 'Users, auth, subscriptions, history',
         Paragraph('Free tier', free_style)],
        ['Python', 'pdfplumber + sentence-transformers', 'PDF extraction → embeddings pipeline',
         Paragraph('Free', free_style)],
        ['Payments', 'JazzCash Business API', 'Rs.999/month Pro subscriptions', '% per txn'],
        ['Deploy', 'Vercel', 'Frontend hosting, serverless functions',
         Paragraph('Free tier', free_style)],
        ['Data', 'pakistancode.gov.pk (Estacode)', '2,464 official PDFs (1840–2021)',
         Paragraph('Public', free_style)],
    ]

    for row in tech_data[1:]:
        for i, cell in enumerate(row):
            if isinstance(cell, str):
                row[i] = Paragraph(cell, td_style)

    t = Table(tech_data, colWidths=[2.5*cm, 5*cm, 5.5*cm, 2*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0), NAVY),
        ('ROWBACKGROUNDS',(0,1),(-1,-1), [WHITE, LIGHT]),
        ('INNERGRID',(0,0),(-1,-1),0.5, HexColor('#dde3ec')),
        ('BOX',(0,0),(-1,-1),1, HexColor('#dde3ec')),
        ('TOPPADDING',(0,0),(-1,-1),6),
        ('BOTTOMPADDING',(0,0),(-1,-1),6),
        ('LEFTPADDING',(0,0),(-1,-1),8),
        ('VALIGN',(0,0),(-1,-1),'TOP'),
    ]))
    elems += [t, Spacer(1, 20)]

    elems += section_heading(7, 'RAG Architecture')

    arch_items = [
        ('📄 2,464 PDFs', 'legal-data/raw-pdfs/\nofficially scraped'),
        ('🔍 pdfplumber', 'Extract text\nParse sections'),
        ('🧮 Sentence-BERT', 'multilingual\n384-dim vectors'),
        ('🗄 Qdrant', 'Vector database\nSemantic index'),
    ]
    arch2 = [
        ('👤 User Query', 'Text / Voice\nAny language'),
        ('🔎 Qdrant Search', 'Top-K similar\nlaw sections'),
        ('🤖 Groq LLM', 'Llama 3.1-70B\nGenerate answer'),
        ('💬 Response', 'Answer + section\ncitations'),
    ]

    def arch_row(items, label):
        cells = []
        for icon_title, sub in items:
            cells.append(Table([[
                Paragraph(icon_title, ParagraphStyle('an', fontName='Helvetica-Bold',
                          fontSize=9, textColor=NAVY, alignment=TA_CENTER)),
                Paragraph(sub, ParagraphStyle('as', fontName='Helvetica', fontSize=8,
                          textColor=MUTED, alignment=TA_CENTER, leading=11)),
            ]], colWidths=[3.3*cm], style=[
                ('BACKGROUND',(0,0),(-1,-1), LIGHT),
                ('BOX',(0,0),(-1,-1),1,HexColor('#dde3ec')),
                ('TOPPADDING',(0,0),(-1,-1),8),
                ('BOTTOMPADDING',(0,0),(-1,-1),8),
                ('ALIGN',(0,0),(-1,-1),'CENTER'),
                ('ROUNDEDCORNERS',[5]),
            ]))
        row = []
        for i, c in enumerate(cells):
            row.append(c)
            if i < len(cells)-1:
                row.append(Paragraph('→', ParagraphStyle('arr', fontName='Helvetica-Bold',
                           fontSize=14, textColor=GOLD, alignment=TA_CENTER)))
        widths = []
        for i in range(len(row)):
            widths.append(0.6*cm if i % 2 == 1 else 3.3*cm)
        t = Table([row], colWidths=widths)
        t.setStyle(TableStyle([
            ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
            ('ALIGN',(0,0),(-1,-1),'CENTER'),
            ('TOPPADDING',(0,0),(-1,-1),0),
            ('BOTTOMPADDING',(0,0),(-1,-1),0),
            ('LEFTPADDING',(0,0),(-1,-1),0),
            ('RIGHTPADDING',(0,0),(-1,-1),0),
        ]))
        wrapper = Table([[
            Paragraph(label, ParagraphStyle('al', fontName='Helvetica-Bold', fontSize=8,
                      textColor=MUTED, letterSpacing=0.5)),
            t,
        ]], colWidths=[15*cm])
        wrapper.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,-1), HexColor('#f8fafc')),
            ('BOX',(0,0),(-1,-1),1,HexColor('#dde3ec')),
            ('LEFTPADDING',(0,0),(-1,-1),12),
            ('RIGHTPADDING',(0,0),(-1,-1),12),
            ('TOPPADDING',(0,0),(-1,-1),10),
            ('BOTTOMPADDING',(0,0),(-1,-1),10),
            ('ROUNDEDCORNERS',[6]),
        ]))
        return [wrapper, Spacer(1,8)]

    elems += arch_row(arch_items, 'DATA PIPELINE (one-time batch process)')
    elems += arch_row(arch2,      'QUERY PIPELINE (real-time per request)')

    # Why RAG box
    why = Table([[
        Paragraph('<b>Why RAG — Not Fine-Tuning?</b>', ParagraphStyle(
            'wt', fontName='Helvetica-Bold', fontSize=10, textColor=GOLD2, spaceAfter=6)),
        Paragraph(
            'Fine-tuning a large language model requires expensive GPU time (thousands of USD) '
            'and months of work. RAG achieves the same result at zero cost — the model stays unchanged; '
            'we retrieve the relevant law text at query time and pass it as context. '
            'This is exactly how enterprise AI products like ChatGPT with plugins operate.',
            ParagraphStyle('wb', fontName='Helvetica', fontSize=9, textColor=HexColor('#b0c4de'), leading=14)),
    ]], colWidths=[15*cm])
    why.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1), NAVY),
        ('LEFTPADDING',(0,0),(-1,-1),16),
        ('RIGHTPADDING',(0,0),(-1,-1),16),
        ('TOPPADDING',(0,0),(-1,-1),14),
        ('BOTTOMPADDING',(0,0),(-1,-1),14),
        ('ROUNDEDCORNERS',[8]),
    ]))
    elems += [Spacer(1,10), why]
    return elems

# ── Build Document ────────────────────────────────────────
def build():
    out = 'FYP_Progress_Report.pdf'
    doc = SimpleDocTemplate(
        out, pagesize=A4,
        leftMargin=2.2*cm, rightMargin=2.2*cm,
        topMargin=1.8*cm, bottomMargin=2*cm,
        title='FYP Progress Report — Legal Code Assistant',
        author='Ali Shair',
    )
    story = []
    story += build_cover()
    story += build_overview()
    story += build_completed()
    story += build_remaining()
    story += build_tech()
    doc.build(story)
    print(f'PDF created: {out}')

if __name__ == '__main__':
    build()
