'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ChevronRight, ChevronLeft, Copy, Printer,
  Download, CheckCircle, FileCheck, RefreshCw, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from 'sonner';

// ── Constants ─────────────────────────────────────────────────────────────────
const DISTRICTS = [
  'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Peshawar',
  'Quetta', 'Faisalabad', 'Multan', 'Hyderabad', 'Sialkot',
  'Gujranwala', 'Bahawalpur', 'Sargodha', 'Abbottabad',
];

const DESIGNATIONS = ['SI', 'ASI', 'HC', 'Constable', 'DSP', 'Inspector'];

const EXAMPLES = [
  { label: 'Mobile Snatching', text: 'Last night at 10 PM, my mobile phone was snatched at Gulshan Market. The phone was an iPhone 13 Pro worth Rs. 150,000. Two suspects aged 25-30, wearing black shirts, arrived on a motorcycle. They pointed a pistol at me, snatched the phone, and fled.' },
  { label: 'House Robbery', text: 'At 2 AM, three unknown persons forcibly broke into my house by breaking the front door. They took jewelry, cash, and valuables totaling Rs. 500,000. They also pushed my wife, causing her injuries. All three fled after committing the crime.' },
  { label: 'Fraud / Cheating', text: 'Muhammad Imran received Rs. 200,000 from me as a business investment and promised to return it within 3 months. Six months have passed and he has neither returned the money nor answered calls.' },
];

const LOADING_STEPS = ['واقعہ کا تجزیہ...', 'دفعات کی شناخت...', 'FIR تیار کی جا رہی ہے...'];

const INIT_DETAILS = {
  name: '', fatherName: '', address: '', cnic: '', phone: '',
  district: 'Lahore', station: '', occurrence: '',
  place: '', distanceDirection: '', beatNo: '', property: '',
};

const INIT_OFFICER = {
  officerName: '',
  designation: 'SI',
  beltNo: '',
  officerPhone: '',
  reportRefNo: '',
  departureDateTime: '',
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface FIRData {
  firNo: number; year: string; tag: string; serialNo: string;
  reportDate: string; reportTime: string;
  name: string; fatherName: string; address: string; cnic: string; phone: string;
  station: string; district: string; occurrence: string;
  place: string; distanceDirection: string; beatNo: string; property: string;
  officerName: string; designation: string; beltNo: string;
  officerPhone: string; reportRefNo: string; departureDateTime: string;
  sections: string[]; statement: string;
  cognizable: boolean; bailable: boolean; punishment: string;
}

// ── QR Code Placeholder (SVG-based, no external lib) ─────────────────────────
function QRCode({ data, size = 64 }: { data: string; size?: number }) {
  const N = 21;
  const cs = size / N;
  // Deterministic seed from data string
  let seed = data.split('').reduce((a, c) => Math.imul(a, 31) + c.charCodeAt(0) | 0, 7);
  const rng = () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };

  const grid = Array.from({ length: N }, (_, r) =>
    Array.from({ length: N }, (_, c): boolean => {
      // Top-left finder (7×7)
      if (r < 7 && c < 7) {
        if (r === 0 || r === 6 || c === 0 || c === 6) return true;
        return r >= 2 && r <= 4 && c >= 2 && c <= 4;
      }
      // Top-right finder
      if (r < 7 && c >= N - 7) {
        const cc = c - (N - 7);
        if (r === 0 || r === 6 || cc === 0 || cc === 6) return true;
        return r >= 2 && r <= 4 && cc >= 2 && cc <= 4;
      }
      // Bottom-left finder
      if (r >= N - 7 && c < 7) {
        const rr = r - (N - 7);
        if (rr === 0 || rr === 6 || c === 0 || c === 6) return true;
        return rr >= 2 && rr <= 4 && c >= 2 && c <= 4;
      }
      // Separators
      if ((r === 7 && c <= 7) || (c === 7 && r <= 7)) return false;
      if ((r === 7 && c >= N - 8) || (c === N - 8 && r <= 7)) return false;
      if ((r >= N - 8 && c === 7) || (r === N - 8 && c <= 7)) return false;
      // Timing patterns
      if (r === 6) return c % 2 === 0;
      if (c === 6) return r % 2 === 0;
      // Data modules — pseudo-random from seed
      return rng() > 0.45;
    })
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="white" />
      {grid.flatMap((row, r) =>
        row.map((black, c) =>
          black ? <rect key={`${r}-${c}`} x={c * cs} y={r * cs} width={cs + 0.3} height={cs + 0.3} fill="black" /> : null
        )
      )}
    </svg>
  );
}

// ── Official FIR Document Layout ──────────────────────────────────────────────
function FIRDocument({ d }: { d: FIRData }) {
  const nm = '__________';
  // Change 6: border-collapse:collapse, 1px solid #333 everywhere
  const bdr = '1px solid #333';
  const td: React.CSSProperties = {
    borderTop: bdr, borderRight: bdr, borderBottom: bdr, borderLeft: bdr,
    padding: '3px 6px',
    fontSize: '11px',
    verticalAlign: 'top',
    lineHeight: '1.65',
  };
  const b: React.CSSProperties = { fontWeight: 'bold' };
  const center: React.CSSProperties = { textAlign: 'center' };
  const num: React.CSSProperties = {
    borderTop: bdr, borderRight: bdr, borderBottom: bdr, borderLeft: bdr,
    width: '20px', textAlign: 'center',
    fontWeight: 'bold', fontSize: '12px',
    verticalAlign: 'middle', padding: '2px 3px',
  };

  return (
    <div
      id="fir-print-area"
      dir="rtl"
      style={{
        fontFamily: "'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Urdu Typesetting',serif",
        direction: 'rtl',
        color: '#000',
        backgroundColor: '#fff',
        padding: '8px 10px',
      }}
    >
      {/* Change 6: border-collapse:collapse; outer border 2px */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '2px solid #333', borderRight: '2px solid #333', borderBottom: '2px solid #333', borderLeft: '2px solid #333', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '72px' }} />
          <col />
          <col style={{ width: '108px' }} />
        </colgroup>
        <tbody>

          {/* ── ROW 1: Header — Auth QR (right) | Title (center) | Serial + Citizen QR (left) ── */}
          {/* Change 1 + Change 2: serial number top-left, title centered with HR below subtitle */}
          <tr>
            {/* Change 1: Authentication QR – visual right in RTL */}
            <td style={{ ...td, ...center, verticalAlign: 'middle', padding: '5px', borderLeft: '1px solid #333' }}>
              <div style={{ fontSize: '7.5px', marginBottom: '2px', fontFamily: 'Arial, sans-serif' }}>Authentication</div>
              <QRCode data={`${d.firNo}/${d.year}-${d.station}`} size={56} />
              <div style={{ fontSize: '6.5px', marginTop: '2px', fontFamily: 'Arial, sans-serif' }}>Scan کریں</div>
            </td>

            {/* Change 2: Title centered with HR below subtitle */}
            <td style={{ ...td, ...center, padding: '5px 8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px' }}>پولیس فارم نمبر 24-5(1)</div>
              <div style={{ fontSize: '10px', marginTop: '2px', lineHeight: '1.5' }}>
                ابتدائی اطلاعی رپورٹ بنسبت جرم قابل دستندازی پولیس رپورٹ شدہ زیر دفعہ 154 مجموعہ ضابطہ فوجداری
              </div>
              {/* Change 2: thin HR below subtitle */}
              <hr style={{ margin: '4px 0 0 0', borderColor: '#ccc', borderWidth: '1px 0 0 0' }} />
            </td>

            {/* Change 1: Serial number (NC-format) top-left + Citizen Feedback QR – visual left in RTL */}
            <td style={{ ...td, ...center, verticalAlign: 'middle', padding: '5px', borderRight: '1px solid #333' }}>
              {/* Change 1: reference number in NC-DD/MM/YYYY-XXXX format, structured */}
              <div style={{ fontSize: '7.5px', textAlign: 'right', direction: 'rtl', marginBottom: '2px', fontFamily: 'Arial, sans-serif', fontWeight: 'bold', lineHeight: '1.6' }}>
                سیریل نمبر:<br />
                <span style={{ fontSize: '7px', fontWeight: 'normal' }}>{d.serialNo}</span>
              </div>
              <QRCode data={d.serialNo} size={56} />
              <div style={{ fontSize: '6.5px', marginTop: '2px', fontFamily: 'Arial, sans-serif', textAlign: 'left', direction: 'ltr' }}>Citizen Feedback</div>
            </td>
          </tr>

          {/* ── ROW 2: FIR No | Thana + District | E-Tag in NC-format ── */}
          {/* Change 1: e-tag shown as reference number in top-left style */}
          <tr>
            <td style={{ ...td }}><span style={b}>نمبر:</span> {d.firNo}/{d.year}</td>
            <td style={{ ...td }}><span style={b}>تھانہ:</span> {d.station || nm}&nbsp;&nbsp;<span style={b}>ضلع:</span> {d.district || nm}</td>
            <td style={{ ...td, fontSize: '10px', direction: 'ltr', textAlign: 'left' }}>
              {/* Change 1: reference number style with DD-MM-YYYY format dates */}
              <span style={{ fontWeight: 'bold', direction: 'rtl' }}>ای ٹیگ نمبر:</span><br />
              <span>{d.tag}</span>
            </td>
          </tr>

          {/* ── FIELD 1: Report time + Occurrence (right, colSpan=2) | Departure + RefNo (left) ── */}
          <tr>
            <td colSpan={2} style={{ ...td }}>
              <div><span style={b}>۱۔ تاریخ و وقت رپورٹ:</span> {d.reportDate} بوقت: {d.reportTime}</div>
              {d.occurrence && (
                <div style={{ marginTop: '1px', fontSize: '10.5px' }}>
                  <span style={b}>تاریخ و وقت وقوعہ:</span> {d.occurrence}
                </div>
              )}
            </td>
            <td style={{ ...td }}>
              <div style={{ fontSize: '10px' }}>
                <span style={b}>روانگی از تھانہ تاریخ بوقت:</span><br />
                {d.departureDateTime || nm}
              </div>
              {d.reportRefNo && (
                <div style={{ marginTop: '1px', fontSize: '10px' }}>
                  <span style={b}>بحوالہ رپورٹ نمبر:</span> {d.reportRefNo}
                </div>
              )}
            </td>
          </tr>

          {/* ── FIELD 2: Complainant ── */}
          {/* Change 3: proper table row with visible borders, narrow num cell */}
          <tr>
            <td style={{ ...num }}>۲</td>
            <td colSpan={2} style={{ ...td }}>
              <div>
                <span style={b}>نام و سکونت اطلاع دہندہ مستغیث:</span>{' '}
                {d.name || nm} ولد {d.fatherName || nm}، {d.address || nm}
              </div>
              <div style={{ marginTop: '2px' }}>
                <span style={b}>شناختی کارڈ نمبر:</span> {d.cnic || nm}&nbsp;&nbsp;
                <span style={b}>فون نمبر:</span> {d.phone || nm}
              </div>
              <div style={{ marginTop: '2px' }}>
                <span style={b}>مرتب مرسلہ:</span> {d.officerName || nm} {d.designation} تھانہ {d.station || nm} {d.district || ''}
              </div>
            </td>
          </tr>

          {/* ── FIELD 3: Offense + Property ── */}
          <tr>
            <td style={{ ...num }}>۳</td>
            <td colSpan={2} style={{ ...td }}>
              <div style={b}>مختصر کیفیت جرم (معہ دفعہ) و مال جو چرا/کھو گیا ہے:</div>
              <div style={{ marginTop: '2px' }}>
                <span style={{ ...b, textDecoration: 'underline' }}>جرم:</span>{' '}
                {d.sections.length ? d.sections.join('، ') : nm}
              </div>
              <div style={{ marginTop: '2px' }}>
                <span style={b}>مال:</span> {d.property || nm}
              </div>
            </td>
          </tr>

          {/* ── FIELD 4: Place of occurrence ── */}
          <tr>
            <td style={{ ...num }}>۴</td>
            <td colSpan={2} style={{ ...td }}>
              <div>
                <span style={b}>جائے وقوعہ و فاصلہ قبلہ سے اور</span>{' '}
                {d.place || nm}{d.distanceDirection ? `، ${d.distanceDirection}` : ''}
              </div>
              <div style={{ marginTop: '2px' }}>
                <span style={b}>بیٹ نمبر:</span> {d.beatNo || nm}
              </div>
            </td>
          </tr>

          {/* ── FIELD 5: Delay reason ── */}
          <tr>
            <td style={{ ...num }}>۵</td>
            <td colSpan={2} style={{ ...td }}>
              <div style={{ fontSize: '10px', color: '#222' }}>کاروائی ماقبل تفتیش اگر اطلاع درج کرنے میں کچھ توقف ہوا ہو تو اسکی وجہ بیان کی جاوے / اوراق متعلقہ تفتیش:</div>
              <div style={{ marginTop: '1px' }}>حسب آمد تحریری درخواست مقدمہ درج رجسٹر کی جائے گی۔</div>
            </td>
          </tr>

          {/* ── Signature Row ── */}
          <tr>
            <td colSpan={3} style={{ ...td, borderTop: '1.5px solid #333', padding: '3px 5px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '1px 5px' }}><span style={b}>دستخط:</span> {d.officerName || nm}</td>
                    <td style={{ padding: '1px 5px', borderRight: '1px solid #aaa', borderLeft: '1px solid #aaa' }}><span style={b}>بیلٹ نمبر:</span> {d.beltNo || nm}</td>
                    <td style={{ padding: '1px 5px' }}><span style={b}>عہدہ:</span> {d.designation}</td>
                    <td style={{ padding: '1px 5px', borderRight: '1px solid #aaa' }}><span style={b}>ٹیلیفون نمبر:</span> {d.officerPhone || nm}</td>
                    <td style={{ padding: '1px 5px', direction: 'ltr', textAlign: 'left' }}><span style={b}>تاریخ:</span> {d.reportDate}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Change 4: P.S.M.S as bold heading, no heavy gray background */}
          <tr>
            <td colSpan={3} style={{
              ...td,
              ...center,
              borderTop: '1.5px solid #333',
              fontWeight: 'bold',
              fontSize: '11.5px',
              padding: '4px 6px',
              backgroundColor: '#f7f7f7',
              letterSpacing: '1px',
            }}>
              P.S.M.S
              <span style={{ fontWeight: 'normal', fontSize: '10px', marginRight: '10px' }}>
                &nbsp;(ابتدائی اطلاع / بیان مستغیث نیچے درج کریں)
              </span>
            </td>
          </tr>

          {/* ── FIR Statement ── Change 4: line-height 1.7 */}
          <tr>
            <td colSpan={3} style={{
              ...td,
              fontSize: '12px',
              lineHeight: '2.1',
              minHeight: '160px',
              whiteSpace: 'pre-wrap',
              padding: '8px 12px',
            }}>
              {d.statement || nm}
            </td>
          </tr>

          {/* ── Footer / Dispatch + Officer Signature ── */}
          {/* Change 5: thin HR + date left + page number right */}
          <tr>
            <td colSpan={3} style={{ ...td, borderTop: '1.5px solid #333', borderBottom: 'none', fontSize: '10.5px', padding: '4px 6px' }}>
              <div>
                مورخہ {d.reportDate} کو تھانہ {d.station || nm} ضلع {d.district || nm} {d.designation} {d.officerName || nm} نے آمد تحریری درخواست مقدمہ درج رجسٹر کیا۔
                FIR نقل معہ تحریری درخواست مقدمہ درج رجسٹر بجناب SHO صاحب تھانہ {d.station || nm} کو ارسال کی جاتی ہے۔
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '5px' }}>
                <span style={{ direction: 'rtl', fontSize: '10.5px' }}>
                  <span style={b}>{d.designation} {d.officerName || nm}</span>
                  <br />{d.reportDate}
                </span>
                <span style={{ fontSize: '9px', color: '#555', fontFamily: 'Arial, sans-serif', direction: 'ltr' }}>
                  نوٹ: یہ FIR صرف بطورِ حوالہ تیار کی گئی ہے۔ تمام دفعات کسی مستند وکیل سے تصدیق کر لیں۔
                </span>
              </div>
              {/* Change 5: footer HR + date left + page 1/1 right */}
              <hr style={{ margin: '6px 0 3px 0', borderColor: '#ccc', borderWidth: '1px 0 0 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', fontFamily: 'Arial, sans-serif', direction: 'ltr' }}>
                <span>{d.reportDate}</span>
                <span>1/1</span>
              </div>
            </td>
          </tr>

        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FIRGeneratorPage() {
  const [step, setStep] = useState(1);
  const [incident, setIncident] = useState('');
  const [details, setDetails] = useState(INIT_DETAILS);
  const [officer, setOfficer] = useState(INIT_OFFICER);
  const [firData, setFirData] = useState<FIRData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const canNext1 = incident.trim().length > 0;
  const canGenerate =
    details.name && details.fatherName && details.address &&
    details.district && details.station &&
    officer.officerName && officer.beltNo;

  const getFIRText = () => {
    if (!firData) return '';
    const nm = '____';
    return [
      'پولیس فارم نمبر 24-5(1)',
      'ابتدائی اطلاعی رپورٹ بنسبت جرم قابل دستندازی پولیس رپورٹ شدہ زیر دفعہ 154 مجموعہ ضابطہ فوجداری',
      '',
      `نمبر: ${firData.firNo}/${firData.year}   تھانہ: ${firData.station||nm}   ضلع: ${firData.district||nm}   ای ٹیگ: ${firData.tag}`,
      `تاریخ و وقت وقوعہ: ${firData.occurrence||nm}`,
      '',
      `1۔ تاریخ و وقت رپورٹ: ${firData.reportDate} ${firData.reportTime}   بحوالہ رپٹ نمبر: ${firData.reportRefNo||nm}`,
      `   روانگی از تھانہ: ${firData.departureDateTime||nm}`,
      '',
      `2۔ نام مستغیث: ${firData.name||nm} ولد ${firData.fatherName||nm}، پتہ: ${firData.address||nm}، فون: ${firData.phone||nm}`,
      `   شناختی کارڈ: ${firData.cnic||nm}`,
      `   مرتب مرسلہ: ${firData.officerName||nm} ${firData.designation} تھانہ ${firData.station||nm}`,
      '',
      `3۔ دفعات: ${firData.sections.join('، ')||nm}`,
      `   مال: ${firData.property||nm}`,
      '',
      `4۔ جائے وقوعہ: ${firData.place||nm}، ${firData.distanceDirection||nm}، بیٹ نمبر: ${firData.beatNo||nm}`,
      '',
      '5۔ حسب آمد تحریری درخواست مقدمہ درج رجسٹر کیا گیا۔',
      '',
      `دستخط: ${firData.officerName||nm}   بیلٹ: ${firData.beltNo||nm}   عہدہ: ${firData.designation}   ٹیلی: ${firData.officerPhone||nm}`,
      '',
      '─'.repeat(60),
      firData.statement,
      '─'.repeat(60),
      '',
      `دستخط مستغیث: ${'_'.repeat(20)}   تاریخ: ${firData.reportDate}`,
    ].join('\n');
  };

  const handleGenerate = async () => {
    setLoading(true);
    setLoadingIdx(0);
    const lower = incident.toLowerCase();
    const type = lower.includes('snatch') || lower.includes('mobile') ? 'Mobile Snatching'
      : lower.includes('robbery') || lower.includes('ghar') ? 'House Robbery'
      : lower.includes('fraud') || lower.includes('invest') ? 'Fraud / Cheating'
      : lower.includes('murder') || lower.includes('qatl') ? 'Murder'
      : 'General Offense';

    try {
      setLoadingIdx(0); await new Promise(r => setTimeout(r, 800));
      setLoadingIdx(1);
      const res = await fetch('/api/generate-fir', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident, type,
          details: {
            name: details.name, fatherName: details.fatherName,
            address: details.address, station: details.station,
            district: details.district, occurrence: details.occurrence,
            place: details.place, property: details.property,
          },
        }),
      });
      setLoadingIdx(2); await new Promise(r => setTimeout(r, 600));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'API error');
      }
      if (!data.statement?.trim() && !Array.isArray(data.sections)) {
        throw new Error('Incomplete FIR response from server');
      }

      const now = new Date();
      const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const reportDate = fmt(now);
      const reportTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
      const firNo = Math.floor(Math.random() * 9000) + 100;
      const year = String(now.getFullYear()).slice(-2);
      const ini = (details.station || 'FIR').split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 3) || 'FIR';
      const dateTag = reportDate.replace(/\//g, '/');
      const tag = `${ini}-${dateTag}-${Math.floor(Math.random() * 9000) + 1000}`;
      const serialNo = `LHR-${ini}-${Math.floor(Math.random() * 900000) + 100000}`;

      setFirData({
        firNo, year, tag, serialNo, reportDate, reportTime,
        name: details.name, fatherName: details.fatherName,
        address: details.address, cnic: details.cnic, phone: details.phone,
        station: details.station, district: details.district,
        occurrence: details.occurrence, place: details.place,
        distanceDirection: details.distanceDirection, beatNo: details.beatNo,
        property: details.property,
        officerName: officer.officerName,
        designation: officer.designation,
        beltNo: officer.beltNo,
        officerPhone: officer.officerPhone,
        reportRefNo: officer.reportRefNo,
        departureDateTime: officer.departureDateTime,
        sections: Array.isArray(data.sections) ? data.sections : [],
        statement: data.statement || incident,
        cognizable: data.cognizable ?? true,
        bailable: data.bailable ?? false,
        punishment: data.punishment ?? '',
      });
      setStep(3);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'FIR بنانے میں مسئلہ آیا۔ دوبارہ کوشش کریں۔';
      toast.error(message);
    } finally { setLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getFIRText());
    setCopied(true); toast.success('FIR copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([getFIRText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `FIR_${(details.name||'complainant').replace(/\s+/g,'_')}.txt`;
    a.click(); URL.revokeObjectURL(url); toast.success('FIR downloaded!');
  };

  const handleReset = () => { setStep(1); setIncident(''); setDetails(INIT_DETAILS); setOfficer(INIT_OFFICER); setFirData(null); };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <header className="h-12 flex items-center border-b border-border px-4 shrink-0 print:hidden">
        <SidebarTrigger className="mr-2" />
        <FileText className="w-4 h-4 text-accent mr-2" />
        <span className="text-sm font-semibold">FIR Generator</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 print:max-w-full print:p-0">

          {/* Step progress */}
          <div className="flex items-center gap-2 mb-2 print:hidden">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${step >= s ? 'gradient-gold text-[hsl(220,60%,12%)]' : 'bg-muted text-muted-foreground'}`}>
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`h-0.5 flex-1 rounded transition-all duration-500 ${step > s ? 'bg-accent' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mb-8 font-sans px-1 print:hidden">
            <span>Incident</span><span>Details + Officer</span><span>FIR Document</span>
          </div>

          <AnimatePresence mode="wait">

            {/* ══ STEP 1: Incident ══ */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                <h1 className="text-2xl font-bold mb-1">Describe the Incident</h1>
                <p className="text-muted-foreground text-sm mb-5 font-sans">Describe what happened — include time, place, and persons involved</p>
                <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 font-sans">Quick examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLES.map((ex) => (
                      <button key={ex.label} onClick={() => setIncident(ex.text)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-accent/40 text-accent hover:bg-accent/10 transition-colors font-sans">
                        {ex.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={incident} onChange={(e) => setIncident(e.target.value)}
                  placeholder="Describe the incident in detail..."
                  className="w-full h-48 p-4 rounded-xl border border-border bg-card text-foreground text-sm font-sans resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
                <div className="text-xs text-right mt-1 font-sans text-muted-foreground">{incident.length} characters</div>
                <Button className="w-full mt-5 gradient-gold text-[hsl(220,60%,12%)] font-semibold rounded-xl h-11" disabled={!canNext1} onClick={() => setStep(2)}>
                  Next — Enter Details <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {/* ══ STEP 2: Complainant + Officer Details ══ */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>

                {/* ─ SECTION A: Complainant ─ */}
                <h1 className="text-2xl font-bold mb-1">Complainant Details</h1>
                <p className="text-muted-foreground text-sm mb-5 font-sans">شاکی / مستغیث کی تفصیلات</p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                  <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">Full Name (نام) *</label>
                      <Input value={details.name} onChange={(e) => setDetails({...details, name: e.target.value})} placeholder="Muhammad Ali" className="rounded-xl font-sans h-10" />
                  </div>
                  <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">Father&apos;s Name (ولد) *</label>
                      <Input value={details.fatherName} onChange={(e) => setDetails({...details, fatherName: e.target.value})} placeholder="Muhammad Ibrahim" className="rounded-xl font-sans h-10" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">Full Address (پتہ) *</label>
                    <Input value={details.address} onChange={(e) => setDetails({...details, address: e.target.value})} placeholder="House 12, Street 4, Gulberg III, Lahore" className="rounded-xl font-sans h-10" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">CNIC (شناختی کارڈ)</label>
                      <Input value={details.cnic} onChange={(e) => setDetails({...details, cnic: e.target.value})} placeholder="35202-1234567-1" className="rounded-xl font-sans h-10" maxLength={15} />
                  </div>
                  <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">Phone (فون نمبر)</label>
                      <Input value={details.phone} onChange={(e) => setDetails({...details, phone: e.target.value})} placeholder="0325-1234567" className="rounded-xl font-sans h-10" maxLength={15} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">District (ضلع) *</label>
                      <select value={details.district} onChange={(e) => setDetails({...details, district: e.target.value})}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent/50">
                        {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">Police Station (تھانہ) *</label>
                      <Input value={details.station} onChange={(e) => setDetails({...details, station: e.target.value})} placeholder="Nishtar Colony" className="rounded-xl font-sans h-10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">تاریخ و وقت وقوعہ</label>
                      <Input value={details.occurrence} onChange={(e) => setDetails({...details, occurrence: e.target.value})} placeholder="17-05-2026 07:00 PM" className="rounded-xl font-sans h-10" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">جائے وقوعہ — Place</label>
                      <Input value={details.place} onChange={(e) => setDetails({...details, place: e.target.value})} placeholder="Gulshan Market, Lahore" className="rounded-xl font-sans h-10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">فاصلہ و سمت از تھانہ</label>
                      <Input value={details.distanceDirection} onChange={(e) => setDetails({...details, distanceDirection: e.target.value})} placeholder="قریب 3 کلومیٹر جانب شمال" className="rounded-xl font-sans h-10" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">بیٹ نمبر — Beat No.</label>
                      <Input value={details.beatNo} onChange={(e) => setDetails({...details, beatNo: e.target.value})} placeholder="10" className="rounded-xl font-sans h-10" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">مال جو چرا/کھو گیا — Stolen Property</label>
                    <Input value={details.property} onChange={(e) => setDetails({...details, property: e.target.value})} placeholder="موبائل: Tecno Spark C10، قیمت 20000؛ نقدی 230000" className="rounded-xl font-sans h-10" />
                  </div>
                </div>

                {/* ─ SECTION B: Police Officer Details ─ */}
                <div className="mt-7 pt-5 border-t-2 border-accent/30">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-accent" />
                    <h2 className="font-bold text-base">Police Officer Details</h2>
                    <span className="text-xs text-muted-foreground font-sans">(درج کنندہ افسر)</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-sans mb-4">
                    Fields marked * required — appear in FIR header and signature
                  </p>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">Officer Name (نام) *</label>
                        <Input value={officer.officerName} onChange={(e) => setOfficer({...officer, officerName: e.target.value})} placeholder="Muhammad Siddiq" className="rounded-xl font-sans h-10" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">Designation (عہدہ) *</label>
                        <select value={officer.designation} onChange={(e) => setOfficer({...officer, designation: e.target.value})}
                          className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent/50">
                          {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">Belt Number (بیلٹ نمبر) *</label>
                        <Input value={officer.beltNo} onChange={(e) => setOfficer({...officer, beltNo: e.target.value})} placeholder="1940L" className="rounded-xl font-sans h-10" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">Officer Phone (ٹیلیفون)</label>
                        <Input value={officer.officerPhone} onChange={(e) => setOfficer({...officer, officerPhone: e.target.value})} placeholder="03074186393" className="rounded-xl font-sans h-10" maxLength={13} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">بحوالہ رپورٹ نمبر</label>
                        <Input value={officer.reportRefNo} onChange={(e) => setOfficer({...officer, reportRefNo: e.target.value})} placeholder="(15)" className="rounded-xl font-sans h-10" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">روانگی از تھانہ تاریخ بوقت</label>
                        <Input value={officer.departureDateTime} onChange={(e) => setOfficer({...officer, departureDateTime: e.target.value})} placeholder="21-05-2026 08:00 AM" className="rounded-xl font-sans h-10" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setStep(1)}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button className="flex-1 gradient-gold text-[hsl(220,60%,12%)] font-semibold rounded-xl h-11"
                    disabled={!canGenerate || loading} onClick={handleGenerate}>
                    {loading
                      ? <span className="font-sans text-sm animate-pulse">{LOADING_STEPS[loadingIdx]}</span>
                      : <><FileCheck className="w-4 h-4 mr-2" />Generate FIR</>}
                  </Button>
                </div>

                {loading && (
                  <div className="mt-4">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div className="h-full gradient-gold rounded-full"
                        initial={{ width: '5%' }}
                        animate={{ width: `${((loadingIdx+1)/LOADING_STEPS.length)*95}%` }}
                        transition={{ duration: 0.9, ease: 'easeInOut' }}
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-2 font-sans">Step {loadingIdx+1} of {LOADING_STEPS.length}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ══ STEP 3: FIR Document ══ */}
            {step === 3 && firData && (
              <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

                <div className="flex items-start justify-between mb-4 print:hidden">
                  <div>
                    <h1 className="text-2xl font-bold">FIR Generated ✓</h1>
                    <p className="text-muted-foreground text-sm font-sans">Review below — click Print for official paper copy</p>
                  </div>
                </div>

                {/* Detected sections */}
                {firData.sections.length > 0 && (
                  <Card className="p-4 mb-4 border-accent/30 bg-accent/5 print:hidden">
                    <p className="text-xs font-semibold text-accent mb-2 font-sans uppercase tracking-wide">دفعات — AI Detected Sections</p>
                    <div className="flex flex-wrap gap-2 mb-2" dir="rtl">
                      {firData.sections.map((s) => (
                        <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-accent/15 text-foreground border border-accent/25">{s}</span>
                      ))}
                    </div>
                    <div className="flex gap-4 text-xs font-sans">
                      <span className={firData.cognizable ? 'text-red-500' : 'text-green-600'}>
                        {firData.cognizable ? '🔴 Cognizable' : '🟢 Non-cognizable'}
                      </span>
                      <span className={firData.bailable ? 'text-green-600' : 'text-red-500'}>
                        {firData.bailable ? '🟢 Bailable' : '🔴 Non-bailable'}
                      </span>
                      {firData.punishment && <span className="text-muted-foreground">⚖️ {firData.punishment}</span>}
                  </div>
                </Card>
                )}

                {/* FIR Document — always white/black like real paper */}
                <div className="rounded-xl border-2 border-border overflow-hidden mb-4 bg-white shadow-md">
                  <FIRDocument d={firData} />
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-3 gap-2 mb-3 print:hidden">
                  <Button variant="outline" className="rounded-xl h-10 text-xs font-sans" onClick={handleCopy}>
                    {copied ? <><CheckCircle className="w-3.5 h-3.5 mr-1 text-green-500" />Copied!</> : <><Copy className="w-3.5 h-3.5 mr-1" />Copy</>}
                  </Button>
                  <Button variant="outline" className="rounded-xl h-10 text-xs font-sans" onClick={() => window.print()}>
                    <Printer className="w-3.5 h-3.5 mr-1" /> Print (A4)
                  </Button>
                  <Button variant="outline" className="rounded-xl h-10 text-xs font-sans" onClick={handleDownload}>
                    <Download className="w-3.5 h-3.5 mr-1" /> Download
                  </Button>
                </div>

                <Button variant="ghost" className="w-full rounded-xl text-sm font-sans text-muted-foreground hover:text-foreground print:hidden" onClick={handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Generate New FIR
                </Button>

                <Card className="p-3 mt-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 print:hidden">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-sans">
                    ⚠️ This FIR is for reference only. Verify all legal sections with a qualified attorney before presenting at a police station.
                  </p>
                </Card>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
