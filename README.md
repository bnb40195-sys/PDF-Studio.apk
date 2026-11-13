# DocuScan & PDF Studio 📱📄

تطبيق **DocuScan & PDF Studio** للأندرويد والويب — ماسح ضوئي شامل واستوديو متكامل لإدارة ملفات الـ PDF وتوليد رموز الـ QR والباركود، مصمم للعمل **100% محلياً بدون إنترنت** (مع دعم ميزات الصياغة الذكية عند الاتصال).

---

## ✨ المميزات الرئيسية

- **📷 الماسح الضوئي الشامل**:
  - التقاط مباشر بالكاميرا مع قص تلقائي وتعديل الزوايا والتدوير.
  - فلاتر تنقية احترافية (Magic Color، B&W عالي التباين، وضوح طبي، فواتير حرارية، مخطط هندسي).
  - مسح وفحص البطاقات، الفواتير المحاسبية، الروشتات الطبية، والمعادلات الرياضية.
- **🔲 استوديو رموز QR والباركود**:
  - قراءة وفك تشفير رموز QR والباركود فوراً بدون إنترنت.
  - إنشاء وتوليد رموز QR (أساسي، شبكات Wi-Fi، جهات اتصال، روابط، مواقع جغرافية، شبكات تواصل) والباركود التجاري (`EAN-13`, `EAN-8`, `CODE128`, `UPC` وغيرها).
- **📑 استوديو ومحرر PDF الشامل**:
  - **عارض ومحرر PDF**: فتح وتصفح ملفات PDF، التكبير والتصغير، إضافة العلامات المائية، وتصدير النسخ المعدلة.
  - **تحويل الصور إلى PDF**: ترتيب وتدوير الصور وتصديرها كملف PDF متكامل بالهوامش والمقاسات المطلوبة.
  - **تصميم وتوليد PDF**: إنشاء الفواتير الضريبية، التقارير، الشهادات، والخطابات الرسمية مع التوقيع الإلكتروني والختم.
  - **صياغة بالذكاء الاصطناعي**: توليد ملفات PDF من الوصف النصي أو من صورة ممسوحة.
- **📁 اختيار مسارات الملفات من الهاتف**:
  - استعراض وتحديد مسارات ملفات PDF وصور QR من ذاكرة الهاتف الخارجية وسجل المسارات السريع.

---

## 📂 هيكل المشروع

```text
├── .github/
│   └── workflows/
│       └── build-apk.yml          # سير العمل التلقائي لبناء APK ونشره على GitHub Releases
├── android/                       # مشروع Capacitor Android الأصلي (Gradle + Kotlin/Java)
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/AndroidManifest.xml
│   ├── gradle/
│   │   ├── libs.versions.toml     # فهرس إصدارات المكتبات والإضافات (Version Catalog)
│   │   └── wrapper/
│   ├── build.gradle
│   ├── settings.gradle
│   └── variables.gradle
├── gradle/
│   └── libs.versions.toml         # نسخة فهرس الإصدارات الموحد على مستوى الجذر
├── src/                           # الكود المصدري لواجهة التطبيق (React + TypeScript + Tailwind CSS)
├── capacitor.config.json          # إعدادات Capacitor للتطبيق (com.docuscan.pdfstudio)
└── package.json                   # الاعتماديات وأوامر البناء والتشغيل
```

---

## 🤖 بناء ونشر ملف APK للتصحيح (Debug APK) تلقائياً

تم تجهيز المستودع بملف سير العمل `.github/workflows/build-apk.yml` لبناء ملف `DocuScan-PDFStudio-debug.apk` تلقائياً ونشره للتحميل المباشر عبر **GitHub Releases**:

### 1. النشر التلقائي عبر GitHub
عند رفع التغييرات (`git push`) إلى فرع `main` أو `master` أو إنشاء وسم إصدار (`v*`):
1. يقوم GitHub Actions تلقائياً بتثبيت **JDK 21** و **Android SDK** و **Node.js 20**.
2. يبني تطبيق الويب عبر `npm run build` ويزامن ملفات الأندرويد عبر `npx cap sync android`.
3. ينفذ `./gradlew assembleDebug` لإنتاج حزمة التصحيح `.apk`.
4. يرفع الملفين `DocuScan-PDFStudio-debug.apk` و `app-debug.apk` إلى:
   - تبويب **Releases** في GitHub للتحميل المباشر على هاتفك الأندرويد.
   - تبويب **Actions → Artifacts** للتحميل خلال 90 يوماً.

### 2. التشغيل اليدوي من GitHub
من تبويب **Actions** ← اختر **Build Android Debug APK & GitHub Release** ← اضغط **Run workflow** ← ثم حمّل ملف الـ APK مباشرة من **Releases**.

---

## 💻 أوامر التشغيل والبناء محلياً

### تشغيل بيئة التطوير (Web + Server)
```bash
npm install
npm run dev
```

### بناء واجهة الويب ومزامنة الأندرويد
```bash
npm run build
npx cap sync android
```

### بناء ملف Debug APK محلياً (يتطلب JDK 21 و Android SDK)
```bash
npm run build:android
```
وسيتم حفظ ملف الـ APK الناتج في:
`android/app/build/outputs/apk/debug/app-debug.apk`
