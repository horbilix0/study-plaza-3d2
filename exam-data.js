export const year = '2026–2027';
export const updated = '2026-09-10';
export const announcement = 'https://odsgm.meb.gov.tr/www/1donem-konu-soru-dagilim-tablolari-2026-2027/icerik/1724';
export const faq = 'https://odsgm.meb.gov.tr/www/sss.php';
const cdn = 'https://cdn.eba.gov.tr/yardimcikaynaklar/2026/09/KSDT/';
export const subjects = [
  ["matematik","Matematik","∑","matematik2.xlsx","mat"],
  ["edebiyat","Türk Dili ve Edebiyatı","Aa","edebiyat2.xlsx","tde"],
  ["fizik","Fizik","↗","fizik2.xlsx","fiz"],
  ["kimya","Kimya","⚗","kimya4.xlsx","kim"],
  ["biyoloji","Biyoloji","✿","biyoloji3_4.xlsx","biyo"],
  ["tarih","Tarih","◷","tarih3.xlsx","tar"],
  ["cografya","Coğrafya","◎","cografya4.xlsx","cog"],
  ["ingilizce","İngilizce","EN","ingilizce_lise2.xlsx","ing"],
  ["din","Din Kültürü ve Ahlak Bilgisi","◇","dkab_lise2.xlsx","dkab"],
].map(([id,name,icon,workbook,pdf]) => ({
  id,name,icon,grade:9, workbook:cdn+workbook, source:'https://rize.meb.gov.tr/ksdt/ortaogretim/'+pdf+'9.pdf',
}));

// Numeric facts from the 9th grade tables. Blank cells are zero. The Rize PDF
// is cross-checked against the corresponding workbook transcription to retain
// column alignment. Conflicting or missing columns are withheld from the app.
const matrices = {
  edebiyat: [{
    totals: [5,6,7],
    rows: [
      ["TDE2.2", [4,5,6]],
      ["TDE4.3", [1,1,1]],
    ],
  }, {
    totals: [6,6,7,7],
    rows: [
      ["TDE2.2", [2,1,2,1]],
      ["TDE4.3", [1,1,1,1]],
      ["TDE2.2b", [3,4,4,5]],
    ],
  }],
  matematik: [{
    totals: [8,6,9,7],
    rows: [
      ["9.1.1", [3,2,2,3]],
      ["9.1.2", [2,1,2,1]],
      ["9.1.3", [1,1,1,1]],
      ["9.1.4", [2,1,2,2]],
      ["9.2.1", [0,1,2,0]],
    ],
  }],
  din: [{
    totals: [6,7,6,6,7],
    rows: [
      ["DKAB.9.1.1", [1,2,1,2,2]],
      ["DKAB.9.1.2", [1,1,2,2,2]],
      ["DKAB.9.1.3", [2,2,2,2,2]],
      ["DKAB.9.1.4", [1,1,1,0,1]],
      ["DKAB.9.2.1", [1,1,0,0,0]],
    ],
  }, {
    totals: [6,8,8,9,6,7],
    rows: [
      ["DKAB.9.1.2", [0,0,0,0,1,1]],
      ["DKAB.9.1.3", [1,1,1,0,0,0]],
      ["DKAB.9.1.4", [0,0,1,1,0,0]],
      ["DKAB.9.2.1", [1,1,1,2,1,2]],
      ["DKAB.9.2.2", [1,2,2,2,2,2]],
      ["DKAB.9.2.3", [1,2,2,2,2,2]],
      ["DKAB.9.2.4", [1,1,1,1,0,0]],
      ["DKAB.9.3.1", [1,1,0,1,0,0]],
    ],
  }],
  ingilizce: [{
    totals: [6,7,6,7,7],
    rows: [
      ["ENG.8.1.R3", [1,0,1,1,1]],
      ["ENG.8.2.V1", [1,0,1,0,1]],
      ["ENG.8.3.G1", [1,0,0,1,0]],
      ["ENG.8.4.R3", [1,1,1,0,1]],
      ["ENG.8.6.V1", [0,1,0,1,1]],
      ["ENG.8.8.R3", [0,1,0,1,1]],
      ["ENG.9.1.R2", [1,0,0,0,1]],
      ["ENG.9.1.R3", [0,0,1,0,0]],
      ["ENG.9.1.V1", [0,1,0,1,0]],
      ["ENG.9.1.G1", [0,2,1,1,0]],
      ["ENG.9.1.W3", [1,0,1,0,0]],
      ["ENG.9.1.W4", [0,1,0,1,1]],
    ],
  }, {
    totals: [8,6,8,7,6],
    rows: [
      ["ENG.8.1.R3", [1,0,0,0,0]],
      ["ENG.8.3.G1", [0,0,1,0,0]],
      ["ENG.8.4.R3", [0,0,0,0,1]],
      ["ENG.8.6.V1", [0,0,0,1,0]],
      ["ENG.8.8.R3", [0,1,0,0,0]],
      ["ENG.9.1.R2", [1,0,0,1,0]],
      ["ENG.9.1.R3", [0,0,1,0,0]],
      ["ENG.9.1.V1", [0,1,0,0,1]],
      ["ENG.9.2.R2", [0,1,1,0,0]],
      ["ENG.9.2.R3", [0,0,0,1,1]],
      ["ENG.9.2.V1", [1,1,1,0,0]],
      ["ENG.9.2.G1", [1,0,1,1,0]],
      ["ENG.9.2.W3", [1,0,0,0,0]],
      ["ENG.9.2.W4", [0,1,0,1,0]],
      ["ENG.9.3.R2", [0,0,1,0,0]],
      ["ENG.9.3.R3", [1,0,0,0,0]],
      ["ENG.9.3.V1", [1,0,1,1,1]],
      ["ENG.9.3.G1", [0,1,0,1,1]],
      ["ENG.9.3.W3", [1,0,0,0,1]],
      ["ENG.9.3.W4", [0,0,1,0,0]],
    ],
  }],
  fizik: [{
    totals: [7,7,6,6,5],
    rows: [
      ["FİZ.9.1.1", [1,1,0,1,0]],
      ["FİZ.9.1.2", [1,2,2,2,1]],
      ["FİZ.9.1.3", [1,0,1,1,1]],
      ["FİZ.9.1.4", [1,1,1,1,0]],
      ["FİZ.9.2.1", [1,1,1,1,1]],
      ["FİZ.9.2.2", [1,1,1,0,1]],
      ["FİZ.9.2.3", [1,1,0,0,1]],
    ],
  }, {
    totals: [6,7,7,7,8],
    rows: [
      ["FİZ.9.1.2", [1,0,1,0,0]],
      ["FİZ.9.1.4", [0,1,0,0,1]],
      ["FİZ.9.2.1", [0,0,1,1,1]],
      ["FİZ.9.2.2", [0,0,1,1,0]],
      ["FİZ.9.2.3", [1,1,1,1,1]],
      ["FİZ.9.2.4", [1,1,1,1,1]],
      ["FİZ.9.2.5", [1,1,1,1,1]],
      ["FİZ.9.2.6", [1,2,1,2,2]],
      ["FİZ.9.2.7", [1,1,0,0,1]],
    ],
  }],
  kimya: [{
    totals: [6,6,6,5,7],
    rows: [
      ["KİM.9.1.1", [0,1,1,1,1]],
      ["KİM.9.1.2", [1,0,1,1,1]],
      ["KİM.9.1.3", [2,2,2,2,2]],
      ["KİM.9.1.4", [2,2,2,1,2]],
      ["KİM.9.1.5", [1,1,0,0,1]],
    ],
  }, {
    totals: [7,6,6,7,7,8,8,9,9],
    rows: [
      ["KİM.9.1.3", [1,0,0,0,0,0,0,0,0]],
      ["KİM.9.1.4", [0,1,0,1,0,0,0,0,1]],
      ["KİM.9.1.5", [1,0,0,1,0,1,1,1,0]],
      ["KİM.9.1.6", [1,1,1,1,1,1,1,1,1]],
      ["KİM.9.1.7", [1,1,1,1,1,1,1,1,1]],
      ["KİM.9.1.8", [2,2,2,1,2,2,1,2,2]],
      ["KİM.9.2.1", [1,1,1,1,1,1,1,1,1]],
      ["KİM.9.2.2", [0,0,1,1,1,1,2,2,2]],
      ["KİM.9.2.3", [0,0,0,0,1,1,1,1,1]],
    ],
  }],
  biyoloji: [{
    totals: [5,6,5,6],
    rows: [
      ["BİY.9.1.1", [2,1,1,3]],
      ["BİY.9.1.2", [3,3,2,3]],
      ["BİY.9.1.4", [0,2,2,0]],
    ],
  }, {
    totals: [6,7,7,7],
    rows: [
      ["BİY.9.1.1", [1,0,1,1]],
      ["BİY.9.1.2", [1,2,1,1]],
      ["BİY.9.1.4", [1,3,2,3]],
      ["BİY.9.1.5", [3,2,3,2]],
    ],
  }],
  cografya: [{
    totals: [7,7,8,6,8,6],
    rows: [
      ["COĞ.9.1.1", [1,2,2,1,2,1]],
      ["COĞ.9.1.2", [1,1,1,1,1,1]],
      ["COĞ.9.1.3", [1,1,1,1,1,1]],
      ["COĞ.9.2.1", [1,2,2,1,1,2]],
      ["COĞ.9.2.2", [1,1,1,1,1,1]],
      ["COĞ.9.2.3", [1,0,1,1,1,0]],
      ["COĞ.9.3.1", [1,0,0,0,1,0]],
    ],
  }, {
    totals: [5,7,6,7,7,6,5],
    rows: [
      ["COĞ.9.2.2", [0,0,1,0,0,1,1]],
      ["COĞ.9.2.3", [0,1,1,1,0,1,1]],
      ["COĞ.9.3.1", [1,1,1,1,1,1,1]],
      ["COĞ.9.3.2", [2,2,1,2,2,2,2]],
      ["COĞ.9.3.3", [1,2,1,2,2,1,0]],
      ["COĞ.9.3.4", [1,1,1,1,2,0,0]],
    ],
  }],
  tarih: [{
    totals: [7,6,7,7,6,6],
    rows: [
      ["TAR.9.1.1", [3,2,2,2,1,3]],
      ["TAR.9.1.2", [2,2,2,3,2,3]],
      ["TAR.9.1.3", [2,2,3,2,3,0]],
    ],
  }, {
    totals: [7,6,6,6,6,6],
    rows: [
      ["TAR.9.1.1", [1,0,0,1,0,0]],
      ["TAR.9.1.2", [0,1,0,1,1,0]],
      ["TAR.9.1.3", [0,1,1,0,1,2]],
      ["TAR.9.1.4", [2,0,1,1,1,2]],
      ["TAR.9.2.1", [2,2,2,1,1,2]],
      ["TAR.9.2.2", [2,2,2,2,2,0]],
    ],
  }],
};

export const scopeKey = ({grade,subject,term,written}) => [grade,subject,term,written].join('/');
export const grades = [...new Set(subjects.map(s=>s.grade))];
const withheld = { 'biyoloji/1':[4], 'biyoloji/2':[4], 'cografya/2':[7], 'kimya/2':[1,2,3,4,5,6,7,8,9] };
export function getScope({grade,subject,term,written}) {
  const info = subjects.find(s=>s.id===subject&&s.grade===Number(grade));
  const matrix = Number(term)===1 && info ? matrices[subject]?.[Number(written)-1] : null;
  const unverified = matrix ? withheld[subject+'/'+written] || [] : [];
  const scenarios = (matrix?.totals||[]).flatMap((total,index)=>unverified.includes(index+1)?[]:[{
    id:index+1,total,source:info.source,updated,
    rows:matrix.rows.filter(([,counts])=>counts[index]>0).map(([code,counts])=>({code,count:counts[index]})),
  }]);
  const reason = Number(term)!==1 ? 'Bu dönem için güncel MEB tablosu doğrulanamadı.'
    : subject==='matematik'&&Number(written)===2 ? 'Bu yazılı ülke geneli ortak sınav olarak duyurulmuş. Dağılım sınav kılavuzuyla yayımlanacak.'
    : subject==='kimya'&&Number(written)===2 ? 'Bakanlık Excel dosyası açılmadı ve erişilebilen tablolarda bir kazanımın soru dağılımı farklı. Bu yazılı doğrulanamadı.'
    : unverified.length ? 'Sonradan duyurulan senaryoların dağılımı doğrudan doğrulanamadı.' : '';
  return {info,scenarios,unverified,reason};
}
