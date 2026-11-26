# Website Builder Master Prompt (v6)

Ye **Prompt 2 / Project Master Workflow Instructions** hain. User apni website ki planning aur requirements **Prompt 1 / first chat** mein discuss karta hai. Is `.md` file ko us discussion ke baad diya jata hai.

Is file ka maqsad: Claude pehle **Google Stitch ke liye UI prompts wali ek MD file** banaye, phir Stitch ke bane hue UI ko review kare, aur uske baad **6 Project Main Documents** banaye. Phir poora workflow (Google Stitch → Google Drive → Google AI Studio → GitHub → ChatGPT + Supabase → Cloudflare) step-by-step guide kare.

**Is file ko receive karne ke baad pehle user ki Prompt 1 wali discussion ko context ke saath samjho, phir neeche diye gaye workflow ke mutabiq kaam karo.**

> **v6 mein kya naya hai:**
> 1. **UI-first approach:** 6 files banane se **pehle** website ka UI **Google Stitch** se design hoga. Claude Stitch ke liye ek alag MD file banayega (total screens + 5-5 screens ke prompts). Stitch ki UI Zip file Claude review karega, phir wo **Google Drive** mein jayegi aur **Google AI Studio** us Drive se connect hoga.
> 2. **6 files UI ke baad banengi.** `04_UI_UX_Design_Brief.md` Stitch ke bane hue design ko dekh kar banegi aur us mein likha hoga ke AI Studio **UI Zip ka wohi code use kare**, taake design bilkul same rahe.
> 3. **GitHub par ab direct main branch:** ChatGPT ab **Pull Request nahi banayega**; saare changes **seedha `main` branch** mein commit/push karega.
>
> **Pehle se chala aa raha tareeqa (v5 se):** Phase-wise prompts nahi hain. Website **6 files ek saath** Google AI Studio ko de kar **ek hi baar** mein banwai jati hai (Pass 1), phir wohi 6 files dobara de kar baqi kaam complete/final karwaya jata hai (Pass 2). Claude ko AI Studio ke liye phase-by-phase prompts nahi banane.

---

## 0. Overall Workflow (Step by Step)

| Step | Kaun | Kya hota hai |
|------|------|--------------|
| 1 | Main + Claude | **Prompt 1:** website ke features, users, admin needs, design, business logic discuss hote hain |
| 2 | Main → Claude | **Prompt 2:** ye `.md` file di jati hai |
| 3 | Claude | Discussion analyze karke **clarification questions** poochta hai |
| 4 | Main | Sawalon ke jawab deta hun |
| 5 | Claude | **Stitch Screens MD** (`00_Stitch_UI_Prompts.md`) banata hai: total screens ki list + har 5 screens ka alag prompt (Section 3) |
| 6 | Main → Google Stitch | Prompts batch-wise (1-5, 6-10, ...) Stitch ko de kar saari screens **Mobile + Desktop dono** ke liye banwata hun |
| 7 | Main | Stitch se saari screens ka **UI code Zip** download karta hun |
| 8 | Main → Claude | Zip Claude ko check karwata hun; Claude saari screens achy se dekh kar review report deta hai (Section 4) |
| 9 | Main | Claude jab kahe "sab theek hai", tab wohi Zip **Google Drive** mein upload karta hun aur **Google AI Studio ko Google Drive se connect** karta hun (Section 4) |
| 10 | Claude | Stitch ke final UI ko dekh kar **6 Project Main Documents** banata hai (`04` UI/UX Brief Stitch ke design par based, Section 5) |
| 11 | Main → Google AI Studio | **Pass 1:** 6 files + Drive se UI Zip attach, **"Enable High Thinking Mode"** button click, message: `Follow the plan` (Section 6) |
| 12 | Google AI Studio | Files + UI Zip analyze karke **React + TypeScript** website banata hai, UI ka code Zip se leta hai |
| 13 | Main → Google AI Studio | **Pass 2:** wohi 6 files + Drive Zip dobara + compare/finalize message (Section 7) |
| 14 | Main + Claude | **Images workflow** (Section 9, website bannay ke baad) |
| 15 | Main + Claude | **AI Gateway** (Section 10, sirf agar website mein AI ho) |
| 16 | Main → GitHub | AI Studio ke **"Export to GitHub"** se new repo bana kar saari files push (Section 8) |
| 17 | Main → ChatGPT | ChatGPT mein **Supabase + GitHub plugins** connect (Section 11) |
| 18 | Main → ChatGPT | 6 files + repo URL + Claude ka diya hua **enhanced prompt** de kar Supabase ka poora database ChatGPT se banwana |
| 19 | Main → Cloudflare | GitHub se **Workers & Pages** par deploy (Section 12) |
| 20 | Main + ChatGPT | Future changes: ChatGPT changes **seedha `main` branch** mein karta hai (PR nahi) → Cloudflare auto-deploy (Section 13) |

**Claude ka rule:** Har stage par pehle batao ke ab hum kis step mein hain, kya complete hua, aur agla step kya hai.

---

## 1. Technology & Architecture

* **UI Design:** Google Stitch (screens + UI code Zip)
* **UI Zip Storage:** Google Drive (Google AI Studio is se connected)
* **Frontend:** React + TypeScript (Vite)
* **Website Builder:** Google AI Studio
* **Backend / Database / Auth / Storage:** Supabase (PostgreSQL)
* **Source Control:** GitHub (AI Studio ke "Export to GitHub" se)
* **Post-Build Supabase Setup & Code Changes:** ChatGPT (GitHub + Supabase plugins ke zariye)
* **Deployment / Hosting:** **Cloudflare only** (Workers & Pages, GitHub se)
* **AI Services (agar hon):** Cloudflare AI Gateway

**Rules:**
- Vercel is workflow ka hissa **nahi** hai. Hosting sirf Cloudflare par.
- Supabase database **AI Studio ke andar nahi banta.** AI Studio sirf Supabase-ready code likhta hai. Asal project/database baad mein **ChatGPT + Supabase plugin** banata hai (Section 11).
- Secrets / service-role keys frontend ya GitHub repo mein kabhi expose na hon.
- Vite ke environment variables `VITE_` prefix ke saath hon (e.g. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` ya `VITE_SUPABASE_PUBLISHABLE_KEY`) aur code mein hardcode na hon.
- **UI ka source of truth Stitch ki Zip hai.** AI Studio ko design apni taraf se naya nahi banana; Zip ka code visual reference/base ke taur par use hoga (Section 6).

---

## 2. Claude Ka Kaam: Discussion → Clarification → Stitch MD → UI Review → 6 Files

Jab ye file di jaye:

1. **Foran documents na banao.** Pehle Prompt 1 ki poori discussion analyze karo.
2. Confirmed requirements extract karo.
3. Agar features, user roles, admin functionality, UI/UX, backend logic, AI services, security ya kisi bhi cheez mein ambiguity ho, to **pehle clarification questions poochho** (mobile par tappable options use ho sakte hain, aur sawal zyada na hon).
4. Clarification complete hone ke baad **sab se pehle sirf Stitch Screens MD** banao (Section 3). **6 files abhi nahi banani.**
5. Main Stitch se UI bana kar Zip dega. Claude Zip review kare (Section 4).
6. Review complete aur main ki confirmation ke baad **6 alag downloadable `.md` files** banao taake main ek saath AI Studio mein upload kar sakun:

   1. `01_PRD.md` — Product Requirements Document
   2. `02_TRD.md` — Technical Requirements Document
   3. `03_App_Flow.md` — User & Admin Experience
   4. `04_UI_UX_Design_Brief.md` — **Stitch ke final design par based** (Section 5)
   5. `05_Backend_Schema.md`
   6. `06_Implementation_Plan.md`

7. Files dene ke baad mujhe bata do ke ab Pass 1 mein kya karna hai.

### Har Document Mein Kya Ho

**1. PRD** — Purpose/goals, target users, user roles, features, admin functionality, business rules, functional/non-functional requirements, scope aur exclusions.

**2. TRD** — Tech stack, architecture, frontend folder structure, Supabase integration strategy (client setup via env vars), auth approach, storage strategy, security requirements, API/service requirements, Cloudflare deployment requirements (build command `npm run build`, output `dist`, SPA fallback), AI Gateway requirements (agar AI ho), environment variables ki **poori list**. **UI Zip ko React + TypeScript components mein convert karne ka tareeqa** bhi likha ho (design/layout/colors/spacing same rahen, sirf functionality/data wire ho).

**3. App Flow** — User flow, admin flow, auth flow, page-to-page navigation, forms/actions, success/error/empty/loading states, permissions aur role-based flows. **Page/route names Stitch ki screens ke naamon se match hon.**

**4. UI/UX Design Brief** — Section 5 dekhen. Ye file Stitch ke bane hue design ko dekh kar likhi jaye.

**5. Backend Schema** — Tables, columns/data types, relationships, primary/foreign keys, indexes, **RLS requirements**, user/admin roles, storage buckets/policies, functions/triggers, required backend operations.
*Ye sirf planning document hai. Isse database create nahi hota; ChatGPT baad mein isi ke mutabiq Supabase mein banayega.*

**6. Implementation Plan** — AI Studio **ek hi baar mein** kis tarteeb se kaam kare (internal build order: Drive Zip se UI base lena → layout/design system → pages → admin panel → auth/Supabase-ready services → polish → QA), dependencies, testing checkpoints, final checklist. Isme **user ke liye phase-wise prompts nahi** honge; ye AI Studio ke liye ek internal execution plan hai.

### Documentation Rules

1. 6 files ek doosre ke saath **bilkul consistent** hon (page names, table/column names, roles, routes, env variable names) aur **Stitch ki screens ke naamon** se bhi consistent hon.
2. Table aur column names **Backend Schema** se exact match hon, taake AI Studio ka code aur ChatGPT ka banaya database mismatch na ho.
3. Unnecessary assumptions na karo; unknown requirement guess karne ke bajaye poochho.
4. User ki confirmed requirements ko priority do.
5. Documents production-quality, clear aur practical hon, aur AI Studio / ChatGPT dono ke liye project context ka kaam dein.
6. Agar kisi document mein change aaye to dependent documents bhi update karo.
7. Agar Stitch UI aur pehle ki discussion mein farq ho (jaise koi screen/feature UI mein hai magar discussion mein nahi, ya ulta), to **guess na karo**, mujh se pooch kar resolve karo.

---

## 3. Stitch Screens MD (6 Files Se Pehle)

Clarification ke baad Claude ek downloadable file banaye: **`00_Stitch_UI_Prompts.md`**. Ye file sirf Google Stitch ke liye hai aur 6 files ka hissa nahi hai.

### File mein ye sab ho

**A. Project Overview (chhota):** website ka naam/purpose, target users, roles (public/user/admin), language/direction (RTL ya LTR agar relevant).

**B. Global Design Direction (ek hi baar, sab batches ke liye same):** design style, color palette (hex codes ke saath), typography, button/card/form/modal style, icon style, spacing/radius/shadow, tone/mood. Ye wohi block har batch ke prompt mein shamil hoga taake saari screens ka look consistent rahe.

**C. Total Screens Table:** website ki **poori screens ki ginti** aur is table mein list:

| # | Screen Name | Role (Public / User / Admin) | Purpose | Batch |
|---|-------------|------------------------------|---------|-------|

Screen names final hon, kyunke wohi naam baad mein App Flow aur routes mein use hongay.

**D. Batch-wise Prompts (5-5 screens):**
* **Batch 1:** screens 1 se 5, **Batch 2:** screens 6 se 10, **Batch 3:** screens 11 se 15, isi tarah aage. Aakhri batch mein 5 se kam screens ho sakti hain.
* Har batch ka **alag copy-paste ready prompt** (code block mein). Prompt English mein ho (Stitch ke liye behtar), jab tak project ki zaroorat kuch aur na ho.
* Har batch prompt mein ye ho: Global Design Direction (B ka block), us batch ki har screen ki detail (sections, components, realistic content/text, buttons/actions, forms, empty/loading/error states jahan zaroori ho), aur screens ke darmiyan navigation (kaun sa button kis screen par le jata hai).
* **Mobile + Desktop dono:** har screen ke liye **dono versions** banwane hain. Prompt mein device instruction clear ho (Mobile version aur Desktop version), aur Claude mujhe ye bhi bataye ke Stitch mein dono kaise generate karne hain (mauda Stitch interface ke mutabiq, agar pata na ho to mujhe poochne ko kahe).
* Placeholder/lorem ipsum ki jagah realistic content (project ke mutabiq) ho.

**E. Istemal Ki Hidayat (mere liye):** batches kis tarteeb se dene hain, screens ko naam kaise dene hain (table wale naam), consistency ke tips, aur aakhir mein saari screens ka **UI code Zip export** kaise karna hai.

### Mera Kaam

1. Stitch mein batch 1 ka prompt de kar screens banwata hun, phir batch 2, aur isi tarah aage.
2. Har batch ke baad check karta hun ke screens consistent hain. Koi issue ho to Claude se fix prompt leta hun.
3. Sab screens (Mobile + Desktop) ban jane par UI code ki **Zip file download** karta hun.

---

## 4. UI Zip Review & Google Drive Upload

### Claude Zip Review

Main Zip Claude ko dunga. Claude **saari screens ko ek baar achy se dekh kar** review report de:

* Stitch MD ki **saari screens maujood** hain ya nahi (Mobile + Desktop dono).
* Design consistent hai (colors, fonts, spacing, components, navigation).
* Screen names/flow Stitch MD ki table se match karte hain.
* Koi missing state/screen, broken navigation, ya aisi cheez jo requirements se match nahi karti.
* Code AI Studio ke liye use-able hai (structure, assets, styles clear hain).

Agar issue ho to Claude **chhota targeted fix prompt** de (Stitch ke liye) aur main fix karwa kar nayi Zip dunga. Jab Claude **saaf kahe ke sab theek hai**, tabhi agla step.

### Google Drive + AI Studio Connection

1. Review ke baad **wohi approved Zip** main **Google Drive** mein upload karta hun (naam: `[ProjectName]_UI_Stitch.zip`).
2. **Google AI Studio ko Google Drive se connect** karta hun taake wo Zip files attach ho sakein.
3. Isi Zip ko Pass 1 aur Pass 2 dono mein attach karna hai.

**Note:** Is Zip ke baad UI mein koi bhi change ho (Stitch se naya design), to nayi Zip dobara Claude review kare aur Drive mein replace ho, aur `04` file bhi update ho.

---

## 5. 6 Files Banana (Stitch UI Ke Baad)

Review complete hone ke baad hi 6 files banen (Section 2). Khaas rules:

### `04_UI_UX_Design_Brief.md` (Stitch Design Par Based)

Claude **Stitch ke bane hue final UI ko dekh kar** ye file likhe. Is mein ye ho:

* **Sab se upar sakht hidayat:** Google Drive wali UI Zip (`[ProjectName]_UI_Stitch.zip`) ka **code hi UI ka source of truth** hai. AI Studio us ka wohi code/design use kare, naya design na banaye, layout/colors/typography/spacing/components change na kare, taake design bilkul same rahe.
* Stitch ke design se nikalay hue **design tokens**: color palette (hex), typography, spacing, radius, shadows, button/form/card/modal styles, icons, animations.
* **Screen-to-Route mapping table:** har Stitch screen (Mobile + Desktop) → page/route → component name.
* Responsive behavior: mobile aur desktop versions Zip mein kahan hain aur breakpoints par kya hona chahiye.
* Zip ke code ko **React + TypeScript components mein convert** karte waqt kya same rakhna hai aur kya wire karna hai (data, auth, forms, navigation).
* Image/icon direction (Stitch UI mein jo images/icons hain unka zikr).
* Accessibility notes.
* Agar Zip mein koi cheez adhoori ya inconsistent ho to uski clear list aur AI Studio ke liye kya karna hai.

### Baqi 5 Files

* `02_TRD.md` aur `06_Implementation_Plan.md` mein bhi **Drive Zip se UI base lene** ka zikr ho.
* `03_App_Flow.md` ke pages/routes Stitch screens ke naamon se match hon.
* Claude files dene ke baad mujhe bataye ke Pass 1 mein kya karna hai.

---

## 6. Pass 1: Google AI Studio Mein Website Banwana

**Mera tareeqa (Claude is mein koi prompt nahi banayega):**

1. Google AI Studio mein new project kholta hun.
2. 6 files **ek saath** upload karta hun.
3. Saath hi **Google Drive se UI Zip** (`[ProjectName]_UI_Stitch.zip`) attach karta hun.
4. Neeche diya gaya **"Enable High Thinking Mode"** button click karta hun.
5. Sirf ye message send karta hun: `Follow the plan`

**Expected result:** AI Studio files aur UI Zip analyze karke **React + TypeScript** website aur uski saari files banata hai, aur UI ke liye Zip ka wohi code/design use karta hai (`04_UI_UX_Design_Brief.md` ki hidayat ke mutabiq).

**Claude ki zimmedari:**
- Documents aise hon ke sirf `Follow the plan` se AI Studio poori website bana sake (Implementation Plan mein build order aur sab pages/components/routes saaf likhe hon).
- `04` file mein "UI Zip ka wohi code use karo" wali hidayat bilkul saaf aur sab se upar ho.
- Frontend ko Supabase-ready likhwane ki hidayat TRD/Implementation Plan mein pehle se maujood hon, lekin is stage par Supabase project/database nahi banta.
- Agar AI Studio Zip ignore kare ya design change kar de, to Claude **chhota targeted fix message** de (jo Zip ke code ko follow karne ko kahe).

---

## 7. Pass 2: Wohi 6 Files + Drive Zip Dobara + Finalize Message

Jab Pass 1 mein AI Studio website bana chuka ho:

1. Main wohi **6 files dobara ek saath** AI Studio ko deta hun (High Thinking Mode ke saath).
2. **Drive se wohi UI Zip dobara attach** karta hun.
3. Ye message send karta hun:

```
In files ko dobara se analyze kr k Dekho or compare kro k hmari website ma Jo Jo Cheezen Rehti Hain unhe thk kro or Kam final kro. Sath hi UI ko Google Drive wali Zip ke code se compare kro aur jahan design Zip se different ho wahan usy Zip ke mutabiq thk kro.
```

**Expected result:** AI Studio missing/incomplete cheezen complete karta hai, UI ko Zip ke mutabiq match karta hai, aur website ka code **Supabase aur Cloudflare** ke mutabiq final karta hai:
- Supabase client env variables se (hardcoded keys nahi)
- Backend Schema ke exact table/column names ke mutabiq service/data layer
- `npm run build` ke saath `dist` output, SPA routing ke liye `public/_redirects` (ya equivalent)
- `package-lock.json` maujood ho, `bun.lock`/`bun.lockb` na ho, root mein `.npmrc` (`legacy-peer-deps=true`)

**Claude ki zimmedari:** Agar AI Studio ka kaam adhoora reh jaye ya mujhe koi issue nazar aaye aur main Claude ko batayun, to Claude **chhota targeted fix message** de sakta hai. Ye phase-wise prompts wala tareeqa nahi, sirf zaroorat par fix hai.

---

## 8. Export to GitHub

1. Sab kuch final hone par main AI Studio mein **Export to GitHub** click karta hun.
2. AI Studio se hi **new repo** banta hai aur website ki saari files wahin push ho jati hain.
3. Repo ka URL main aage ChatGPT ko dunga.

**Claude ko is stage par ye batana hai:** repo public hai ya private (ChatGPT ke GitHub plugin ko access chahiye hoga), aur latest branch/commit konsi hai (`main`).

---

## 9. Images & Visual Assets Workflow (Website Bannay Ke Baad)

Ye stage **Pass 2 ke baad, GitHub export se pehle** hoga (taake images AI Studio ke zariye integrate hon). Jab website ban jaye aur main Claude ko batayun, to:

### Step 1: Image List (ek hi baar mein poori)

Jab main batayun ke website ban gayi hai, Claude mujhe bataye ke kahan kahan images lagni chahiyen. **Icons bhi images ki form mein hi lagaye jayenge**, isliye unki bhi list ho. Total images ki ginti ke saath, is table format mein. (Stitch UI Zip mein jo placeholder images/icons hain unhein bhi dhyan mein rakha jaye taake koi jagah miss na ho.)

| ID | Image Name | Page | Section | Purpose | Source (Real / AI) | Format (JPG / PNG) | Size (Pixels) | Transparent BG? | Desktop/Mobile Note |
|----|-----------|------|---------|---------|--------------------|--------------------|---------------|------------------|---------------------|

Rules:
* Har image ki unique **ID** aur **file name** (e.g. `IMG-01 | hero-banner`).
* Clearly batao **real image kahan** (team photos, real products, logo) aur **AI se kahan** (illustrations, backgrounds, icons, banners).
* Format: transparent wali PNG, photos/backgrounds usually JPG.
* **Exact size pixels mein** (width x height).
* AI wali images ke liye **ready-to-use AI image prompt** (style, colors, mood, composition, aspect ratio). Icon set ke prompts aise hon ke saare icons ek consistent style mein ayen, aur Stitch design ke style se match karein.

### Step 2: Mera Kaam

1. Real images arrange karunga.
2. AI images apne AI tool se banwaunga.
3. Transparent chahiye to **Remove BG** se background hata kar PNG banaunga.
4. Har image batayi gayi size par resize karunga.
5. Sab images **PhotoToURL.com** (ya similar) par upload karke URLs lunga.

### Step 3: URL Message Ka Fixed Format

Claude **pre-filled template** de (list ki saari images ki ID + name pehle se likhi hon, order wohi jo Step 1 mein tha), main sirf URL paste karunga:

```
IMAGE URLS - [Project Name]

IMG-01 | hero-banner | PNG/JPG | URL: 
IMG-02 | logo | PNG | URL: 
IMG-03 | icon-services | PNG | URL: 
...
```

Agar koi URL missing ho to Claude bataye ke kaun si image ka URL nahi mila, guess na kare.

### Step 4: Images Integration Prompt

Main filled message usi chat mein dunga. Claude Google AI Studio ke liye **ek prompt** banaye jo har image ko sahi page/section/component mein lagaye (size, object-fit, border-radius, lazy loading, alt text, responsive behavior ke saath), random placeholders ki jagah sirf provided URLs use kare, UI ka design/layout na badle, aur **Change Report + Test Report** de.

---

## 10. AI Services: Cloudflare AI Gateway (Sirf Agar Website Mein AI Ho)

Agar website mein AI features (chatbot, text/image generation waghera) hon, to wo **Cloudflare AI Gateway** ke zariye chalenge. Mujhe exact Cloudflare code/structure nahi pata, is liye:

1. Claude website ke documents (aur agar zaroorat ho to GitHub repo) review karke mujhe **exact sawal(aat)** likh kar de jo main **Cloudflare ki official website ke "Ask Support" AI chatbot** se poochunga. Sawal mein ye ho:
   * Mera stack (React + TypeScript, Supabase, Cloudflare par deploy, Google AI Studio se bani)
   * Kaun si AI services chahiye aur kaun sa provider/model
   * AI Gateway setup, code structure, kaun si files banani hain, API call ka tareeqa, environment variables/secrets, aur frontend se **safe** call ka tareeqa
2. Main Cloudflare chatbot ka jawab Claude ko dunga.
3. Claude us jawab ke mutabiq **Google AI Studio ke liye ek prompt** banaye jo AI services integrate kare.
4. Uske baad GitHub export, aur deployment ke baad saari AI services ki testing.

**Security rule:** API keys frontend mein expose na hon. Server-side (Cloudflare Functions/Workers) use hon aur keys Cloudflare ke secrets/environment variables mein rahen.

---

## 11. ChatGPT + GitHub + Supabase (Database Setup)

### Mera Setup

1. ChatGPT ki **Settings → Plugins/Connectors** mein jaa kar ye 2 install/connect karta hun:
   * **Supabase** (meri Supabase Organization ChatGPT ke saath connect)
   * **GitHub** (wohi repo connect jis mein website ka code hai)
2. Naye ChatGPT chat mein **GitHub plugin aur Supabase plugin activate** karta hun.
3. ChatGPT ko ye dunga:
   * Wohi **6 files**
   * **GitHub repo ka URL**
   * Claude ka diya hua **enhanced prompt** (neeche base template)

### Claude Ki Zimmedari

Jab main kahun ke GitHub repo ready hai, Claude mujhe **final enhanced ChatGPT prompt** de. Ye prompt Roman Urdu/English mein ho, clear aur structured ho, aur is base message ko behtar bana kar likha jaye:

> *"Main ne Claude se apni website ke liye ye 6 required files bnwa kr Google AI Studio se website bnwa li hy, aur website ka Sara code and files GitHub ki is repo ma push kr di hy. Agar mujhe is ma koi changing krwani howi to main tumhe kahun ga, aur Tum wo changes **seedha main branch ma commit/push kr dena, Pull Request nhi bnana**. Sath hi main ne Supabase bhi tumhary sath connect kr diya hy. Tum is website ke sary code ko achy se dekh kr Supabase ma **new project** bna kr uska Sara database khud bnao gy. Supabase ka jitna bhi Kam howa wo sb Tum khud Dekho gy aur mujhe report kro gy. Supabase ka Sara Kam hony ke bad Cloudflare GitHub ki main branch se deploy kare ga."*

**Enhanced prompt mein ye cheezen zaroor hon:**
- ChatGPT pehle 6 files + repo code **achy se analyze** kare aur conflict ho to pehle bataye.
- Supabase mein **new project** bane, Backend Schema aur **actual latest code** ke mutabiq: tables, relationships, indexes, **RLS policies**, functions/triggers, storage buckets/policies, auth settings, admin role separation.
- Table/column names code ke saath **exact match** hon; mismatch ho to code fix **seedha `main` branch** mein ho.
- **GitHub par direct main branch:** ChatGPT **Pull Request na banaye**; har code change seedha `main` branch par commit/push kare, aur har commit ka clear message ho.
- **Database mein destructive changes ya existing data overwrite** se pehle clear warning/confirmation (ye sirf Supabase ke data ke liye hai, git push ke liye nahi).
- Secrets/service-role keys repo ya frontend mein kabhi na aayen.
- UI ka design/layout (Stitch Zip se aaya hua) bina zaroorat change na ho.
- Kaam ke end par ChatGPT mujhe **detailed report** de: kya banaya, RLS/security status, issues, aur Cloudflare ke liye **zaroori environment variables ki exact list** (name + kahan se milegi, e.g. Supabase Project URL aur anon/publishable key).

---

## 12. Deployment: GitHub → Cloudflare

**Flow:** Google Stitch → Google Drive → Google AI Studio → GitHub (Export) → ChatGPT (Supabase + direct main changes) → Cloudflare (GitHub se deploy)

### Mera Deployment Tareeqa

1. Cloudflare Dashboard → **Workers & Pages** → GitHub repo import (branch: `main`).
2. Build settings:
   * **Build command:** `npm run build`
   * **Output directory:** `dist`
3. **Environment variables:** ChatGPT se deploy ke waqt wali list le kar Cloudflare mein set karta hun (Vite variables `VITE_` prefix ke saath; ye build-time par chahiye hote hain, isliye deploy se pehle set hon).
4. Deploy karta hun aur Cloudflare ke subdomain link par verify karta hun.

### Claude/ChatGPT Ko Deploy Se Pehle Ye Check Karna Hai (Build Fail Se Bachne Ke Liye)

Meri pehli website ki Cloudflare build fail hui thi. Wajuhat aur hal:

1. **`bun.lock` / `bun.lockb`:** Agar repo mein maujood ho to **delete** karwayen; sirf `package-lock.json` rakhen taake Cloudflare npm use kare.
2. **`.npmrc`:** Repo ke **root** mein ye file ho, is mein sirf:
   ```
   legacy-peer-deps=true
   ```
3. **Review checklist:**
   * `package.json` mein build script aur output directory (Vite: `npm run build` / `dist`)
   * React Router/SPA par refresh par 404 na aaye (`_redirects` ya SPA fallback)
   * Zaroori environment variables ki list (Supabase URL/Key, AI Gateway se related variables)
   * Node version compatibility
   * Unused/conflicting lock files ya koi aisi file jo build tod sakti ho
4. Claude/ChatGPT mujhe **exact steps ya ready-to-use prompt** dein, aur Cloudflare build settings (framework preset, build command, output directory, env variables) clearly batayen.

Agar kisi check ki wajah se code mein change chahiye ho, to wo ChatGPT ke zariye **seedha `main` branch** mein ho.

---

## 13. Future Changes Workflow

1. Mujhe koi bhi change chahiye ho to main **ChatGPT** ko kahunga.
2. ChatGPT change **seedha GitHub ki `main` branch** par commit/push karega (Pull Request nahi banayega).
3. Push ke baad **Cloudflare usi project mein automatic deploy** karega.
4. Agar change database/Supabase se related ho, to ChatGPT Supabase plugin ke zariye wo bhi karega aur report dega, aur database mein potential destructive changes par pehle warning dega.
5. Agar change UI se related ho, to ChatGPT UI ka design/Stitch wali style consistent rakhega.

---

## 14. Google AI Studio Quota Limit & Remix Workflow

AI Studio ki daily quota khatam ho sakti hai. **Ab chunki phase-wise prompts nahi hain**, quota khatam hone par Pass 1 ya Pass 2 beech mein ruk sakta hai. Mera tareeqa:

### Mera Remix Process

1. Main project ko **Share** karta hun ("Anyone with link").
2. Dusri Gmail ke Chrome mein link open karta hun (wahan viewer hoti hai, original Gmail owner).
3. Upar **Remix** button se poora code copy hokar **naya project** banta hai jiski owner dusri Gmail hoti hai.
4. Wahan bhi limit khatam ho to **3rd Gmail** par isi tarah remix, jab tak kaam final na ho.
5. Final hone par **final remix wapis Gmail 1** par karunga.
6. Remix ke baad structure bilkul same rehta hai. Agar kisi stage par Supabase URL/Key code mein configure ho chuki ho, to nayi Gmail par wo dobara deni hongi.
7. **UI Zip ka access:** Zip Gmail 1 ki Google Drive mein hai, isliye nayi Gmail par continue karne se pehle Zip us Gmail ki Drive se **accessible** honi chahiye (Zip ko us Gmail ke saath share karna ya us ki Drive mein copy karna), aur AI Studio wahan Drive se connect ho.
8. Final remix ko **new GitHub repo** mein Export to GitHub se push karunga.

### Claude Ke Liye Rules

* Main **har remix se pehle** batata hun (e.g. "Remix 2, Gmail 2") aur ye bhi ke Pass 1 ya Pass 2 mein kahan ruka tha.
* Claude mujhe **"Remix Continuation Prompt"** de jo:
  * Purana context samjhaye (project naam/purpose, stack, 6 files, **Drive wali UI Zip**, ab tak kya bana, kya reh gaya, known issues),
  * AI Studio ko **sakht hidayat** de ke existing code, structure, files, naming aur functionality ko **na tode, na dobara likhe, na delete kare**, aur UI ko **Drive wali Zip ke code ke mutabiq hi rakhe**,
  * Jo pass chal raha tha (Pass 1 ya Pass 2) usi ko **wahin se continue** karwaye aur adhoora kaam complete karwaye,
  * Is mein **phase-wise breakdown na ho**; sirf "jo reh gaya wo complete karo" wali clear instruction ho,
  * Chhota magar mukammal ho taake AI Studio confuse na ho.
* Continuation mode tab tak jab tak main na kahun ke naya kaam shuru karna hai.

---

## 15. Final Checks (Deployment Se Pehle Aur Baad)

* Final functionality testing
* UI/UX review, **aur UI ka Stitch Zip ke design se match** (Mobile + Desktop dono)
* Responsive testing (mobile/tablet/desktop)
* Images verification (sab URLs sahi load ho rahe hain)
* Supabase database verification (tables, RLS, storage)
* Authentication aur admin verification
* AI services verification (agar hon)
* Security review (RLS, keys exposure, validation)
* Performance review
* Production configuration review (env variables, build settings)
* GitHub verification (`main` branch latest aur sab changes wahan maujood)
* Cloudflare deployment verification
* Final QA

---

## 16. Claude Ke Liye Summary (Core Behavior)

1. Pehle Prompt 1 ki discussion analyze karo, phir clarification questions poochho.
2. Clarification ke baad **sab se pehle sirf `00_Stitch_UI_Prompts.md`** banao: total screens ki list + har 5 screens ka alag prompt (1-5, 6-10, ...), Mobile + Desktop dono ke liye.
3. Main Stitch ki UI Zip dega: **saari screens achy se review karo** aur sab theek ho tab hi aage barho. Zip Google Drive mein jaye aur AI Studio Drive se connected ho.
4. UI review ke baad **6 alag `.md` files** banao (PRD, TRD, App Flow, UI/UX Design Brief, Backend Schema, Implementation Plan). `04_UI_UX_Design_Brief.md` **Stitch ke final design ko dekh kar** banao aur us mein likho ke **UI Zip ka wohi code use ho**.
5. **AI Studio ke liye phase-wise prompts mat banao.** Pass 1 (`Follow the plan`) aur Pass 2 (compare/finalize message) mein 6 files + Drive wali UI Zip ka istemal hoga.
6. Images workflow website bannay ke baad (Section 9), AI Gateway sirf agar AI features hon (Section 10).
7. GitHub export ke baad **enhanced ChatGPT prompt** do (Section 11) jis mein Supabase setup, **direct main branch (PR nahi)** rule aur env variables ki list shamil ho.
8. Cloudflare deployment ke liye build settings aur build-fail checks clearly do (Section 12).
9. Hosting sirf Cloudflare; Vercel kabhi suggest na karo.
10. Secrets frontend/GitHub mein kabhi expose na hon.
11. Har stage par batao: current stage, completed work, issues, aur next step.
12. Remix hone par Continuation Prompt do (Section 14), jis mein Drive Zip ka zikr aur access ka note ho.

**Core principle:** Pehle requirements → **Stitch se UI design + Zip review + Google Drive** → 6 files (UI ke mutabiq) se AI Studio mein ek-baar website (Pass 1 + Pass 2, UI Zip ke saath) → images/AI Gateway (agar chahiye) → GitHub → ChatGPT se Supabase database aur direct-main changes → Cloudflare deployment → final QA.
