import moment from 'moment-timezone'
import os from 'os'

const NEW_DAYS = 30 //  auto-hides itself after this many days
const STATUS_CACHE_MS = 5 * 60 * 1000 // 5 min cache for status checks

// Bold Unicode converter — works natively in WhatsApp, no image/library needed
function toBoldUnicode(str) {
 if (!str  typeof str !== 'string') return str  ''
 const bold = {
  a:'𝐚',b:'𝐛',c:'𝐜',d:'𝐝',e:'𝐞',f:'𝐟',g:'𝐠',h:'𝐡',i:'𝐢',j:'𝐣',
  k:'𝐤',l:'𝐥',m:'𝐦',n:'𝐧',o:'𝐨',p:'𝐩',q:'𝐪',r:'𝐫',s:'𝐬',t:'𝐭',
  u:'𝐮',v:'𝐯',w:'𝐰',x:'𝐱',y:'𝐲',z:'𝐳',
  A:'𝐀',B:'𝐁',C:'𝐂',D:'𝐃',E:'𝐄',F:'𝐅',G:'𝐆',H:'𝐇',I:'𝐈',J:'𝐉',
  K:'𝐊',L:'𝐋',M:'𝐌',N:'𝐍',O:'𝐎',P:'𝐏',Q:'𝐐',R:'𝐑',S:'𝐒',T:'𝐓',
  U:'𝐔',V:'𝐕',W:'𝐖',X:'𝐗',Y:'𝐘',Z:'𝐙',
  0:'𝟎',1:'𝟏',2:'𝟐',3:'𝟑',4:'𝟒',5:'𝟓',6:'𝟔',7:'𝟕',8:'𝟖',9:'𝟗',
 }
 return str.split('').map(c => bold[c] || c).join('')
}

// color dot per category — quick visual scanning
const categoryColors = {
 main: '', ai: '', downloader: '', uploader: '',
 editor: '', sticker: '', tools: '', infobot: '',
 group: '', owner: '',
}

// ---------------- i18n ----------------
const translations = {
 en: {
  prefix: 'Prefix', uptime: 'Uptime', ram: 'RAM', status: 'Status',
  commands: 'Commands', plugins: 'Plugins', users: 'Users', views: 'Menu Views',
  tapMenu: '✦ Tap  Menu List below to switch category',
  notFound: 'Category not found, showing full menu.', empty: '(empty)',
  whatsNew: "What's New", newDesc: 'Commands added in the last', days: 'days',
  noNew: '(no new commands right now)',
  tips: [
   ' Tip: type .menu <category> to jump straight to a section.',
   ' Tip:  next to a command means it was added recently.',
   ' Tip:  marks the most used commands right now.',
   ' Tip:  means the command has a usage limit.',
   ' Tip:  means the command is premium-only.',
   ' Tip: type .menu new to see everything added recently.',
   ' Tip: type .lang ar|fr|en to change the menu language.',
  ],
 },
 ar: {
  prefix: 'البادئة', uptime: 'مدة التشغيل', ram: 'الذاكرة', status: 'الحالة',
  commands: 'الأوامر', plugins: 'الإضافات', users: 'المستخدمون', views: 'مشاهدات المنيو',
  tapMenu: '✦ اضغط  قائمة الأوامر بالأسفل للتنقل بين الأقسام',
  notFound: 'القسم غير موجود، سيتم عرض القائمة الكاملة.', empty: '(فارغ)',
  whatsNew: 'الجديد', newDesc: 'أوامر تمت إضافتها في آخر', days: 'يوم',
  noNew: '(لا يوجد أوامر جديدة حاليا)',
  tips: [
   ' نصيحة: اكتب .menu <القسم> للوصول مباشرة لقسم معين.',
   ' نصيحة:  جانب الأمر تعني أنه أضيف مؤخرا.',
   ' نصيحة:  تعني أن هذا الأمر من الأكثر استعمالا.',
   ' نصيحة:  تعني أن الأمر له حد استعمال محدود.',
   ' نصيحة:  تعني أن الأمر خاص بالمستخدمين المميزين.',
   ' نصيحة: اكتب .menu new لرؤية كل الأوامر المضافة مؤخرا.',
   ' نصيحة: اكتب .lang ar|fr|en لتغيير لغة القائمة.',
  ],
 },
 fr: {
  prefix: 'Préfixe', uptime: 'Uptime', ram: 'RAM', status: 'Statut',
  commands: 'Commandes', plugins: 'Plugins', users: 'Utilisateurs', views: 'Vues du menu',
  tapMenu: '✦ Appuyez sur  Menu List ci-dessous pour changer de catégorie',
  notFound: 'Catégorie introuvable, menu complet affiché.', empty: '(vide)',
  whatsNew: 'Nouveautés', newDesc: 'Commandes ajoutées ces derniers', days: 'jours',
  noNew: '(aucune nouvelle commande pour le moment)',
  tips: [
   ' Astuce : tapez .menu <catégorie> pour accéder directement à une section.',
   ' Astuce :  signifie que la commande a été ajoutée récemment.',
   ' Astuce :  marque les commandes les plus utilisées.',
   " Astuce :  signifie que la commande a une limite d'utilisation.",
   ' Astuce :  signifie que la commande est réservée aux membres premium.',
   ' Astuce : tapez .menu new pour voir tout ce qui a été ajouté récemment.',
   ' Astuce : tapez .lang ar|fr|en pour changer la langue du menu.',
  ],
 },
}

function t(lang, key) {
 const dict = translations[lang] || translations.en
 return dict[key] !== undefined ? dict[key] : translations.en[key]
}

const handler = async (m, { conn, usedPrefix: _p, command, isOwner, args }) => {
