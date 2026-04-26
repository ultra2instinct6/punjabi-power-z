/* ============================================================
   Punjabi Power Z — Warrior from Peshtigo
   Single-file game logic. No backend. localStorage save.
   ============================================================ */

(() => {
  "use strict";

  // ---------- Content ---------------------------------------------------------
  /** @type {{id:string, type:'vocab'|'phrase'|'grammar', punjabi:string, english:string, definition?:string, related?:string, example?:string}[]} */
  const DECK = [
    // Vocab
    { id: "v1",  type: "vocab", punjabi: "paani",  english: "water",
      definition: "A clear liquid you drink.",
      related: "peena (to drink), naddi (river)",
      example: "Mainu paani chahida hai. — I need water." },
    { id: "v2",  type: "vocab", punjabi: "roti",   english: "bread / flatbread",
      definition: "A round Indian flatbread eaten with meals.",
      related: "atta (flour), tava (griddle)",
      example: "Roti garam hai. — The bread is hot." },
    { id: "v3",  type: "vocab", punjabi: "ghar",   english: "house",
      definition: "A place where a family lives.",
      related: "kamra (room), darvaza (door)",
      example: "Mera ghar vadda hai. — My house is big." },
    { id: "v4",  type: "vocab", punjabi: "maa",    english: "mother",
      definition: "A female parent.",
      related: "biji, mummy",
      example: "Meri maa changi hai. — My mother is good." },
    { id: "v5",  type: "vocab", punjabi: "pyo",    english: "father",
      definition: "A male parent.",
      related: "papa, daddy",
      example: "Mera pyo kamm karda hai. — My father works." },
    { id: "v6",  type: "vocab", punjabi: "bazaar", english: "market",
      definition: "A place where things are bought and sold.",
      related: "dukaan (shop), paisa (money)",
      example: "Asin bazaar jaande haan. — We go to the market." },
    { id: "v7",  type: "vocab", punjabi: "gaddi",  english: "car",
      definition: "A vehicle with four wheels.",
      related: "saikal (cycle), bus",
      example: "Gaddi tez hai. — The car is fast." },
    { id: "v8",  type: "vocab", punjabi: "jaldi",  english: "quickly / hurry",
      definition: "Doing something in a fast way.",
      related: "tez (fast), chhetee",
      example: "Jaldi karo! — Hurry up!" },
    { id: "v9",  type: "vocab", punjabi: "ruk",    english: "stop",
      definition: "To stop moving or to pause.",
      related: "khalo (stand), band (closed)",
      example: "Ruk jao! — Stop!" },
    { id: "v10", type: "vocab", punjabi: "sun",    english: "listen",
      definition: "To pay attention with your ears.",
      related: "bol (speak), gaana (song)",
      example: "Mainu sun! — Listen to me!" },
    { id: "v11", type: "vocab", punjabi: "kitaab", english: "book",
      definition: "Pages bound together that you can read.",
      related: "padhna (to read), school",
      example: "Eh kitaab changi hai. — This book is good." },
    { id: "v12", type: "vocab", punjabi: "dost",   english: "friend",
      definition: "A person you like and trust.",
      related: "yaar, saathi",
      example: "Tu mera dost hai. — You are my friend." },
    { id: "v13", type: "vocab", punjabi: "skool", english: "school",
      definition: "A place where children learn.",
      related: "ustaad (teacher), kitaab (book)",
      example: "Main school jaanda haan. — I go to school." },
    { id: "v14", type: "vocab", punjabi: "chah",   english: "tea",
      definition: "A hot drink made from leaves.",
      related: "doodh (milk), cheeni (sugar)",
      example: "Chah pee lo. — Drink the tea." },
    { id: "v15", type: "vocab", punjabi: "doodh",  english: "milk",
      definition: "A white drink that comes from a cow.",
      related: "chah (tea), dahi (yogurt)",
      example: "Doodh thanda hai. — The milk is cold." },
    { id: "v16", type: "vocab", punjabi: "rang",   english: "color",
      definition: "What we see — like red, blue, green.",
      related: "neela (blue), peela (yellow)",
      example: "Mera rang neela hai. — My color is blue." },
    { id: "v17", type: "vocab", punjabi: "din",    english: "day",
      definition: "The time when the sun is up.",
      related: "raat (night), suraj (sun)",
      example: "Aaj changa din hai. — Today is a good day." },
    { id: "v18", type: "vocab", punjabi: "raat",   english: "night",
      definition: "The time when it is dark.",
      related: "din (day), chand (moon)",
      example: "Raat thandee hai. — The night is cool." },
    { id: "v19", type: "vocab", punjabi: "khaana", english: "food / to eat",
      definition: "Food, or the action of eating.",
      related: "roti, chaaval (rice)",
      example: "Khaana taiyar hai. — Food is ready." },
    { id: "v20", type: "vocab", punjabi: "naam",   english: "name",
      definition: "What someone or something is called.",
      related: "main (I), tu (you)",
      example: "Mera naam Ravi hai. — My name is Ravi." },

    // Phrases
    { id: "p1", type: "phrase", punjabi: "Tusi kive ho?",
      english: "How are you?",
      definition: "Polite greeting to ask how someone is doing.",
      example: "Tusi kive ho? Main theek haan. — How are you? I'm good." },
    { id: "p2", type: "phrase", punjabi: "Main theek haan",
      english: "I am good.",
      definition: "Standard reply to 'Tusi kive ho?' (how are you).",
      example: "Main theek haan, shukriya. — I'm good, thanks." },
    { id: "p3", type: "phrase", punjabi: "Tuhada naam ki hai?",
      english: "What is your name?",
      definition: "Polite way to ask someone's name.",
      example: "A: Tuhada naam ki hai? B: Mera naam Ravi hai. — A: What's your name? B: My name is Ravi." },
    { id: "p4", type: "phrase", punjabi: "Mera naam ___ hai",
      english: "My name is ___.",
      definition: "Reply with your name in place of the blank.",
      example: "Mera naam Simran hai. — My name is Simran." },
    { id: "p5", type: "phrase", punjabi: "Main Punjabi sikh reha haan",
      english: "I am learning Punjabi.",
      definition: "Used to tell people you're studying the language. Female speaker: 'sikh rahi haan'.",
      example: "Main Punjabi sikh reha haan. — I'm learning Punjabi." },
    { id: "p6", type: "phrase", punjabi: "Sat sri akaal",
      english: "Hello (a respectful greeting).",
      definition: "Universal Sikh greeting (lit. 'eternal truth is the immortal Lord'). Used any time of day, hello or goodbye.",
      example: "Sat sri akaal ji, kive ho? — Hello, how are you?" },
    { id: "p7", type: "phrase", punjabi: "Shukriya",
      english: "Thank you.",
      definition: "Common way to thank someone. Alternative: 'mehrbaani'.",
      example: "Shukriya ji, tuhada bahut shukriya. — Thank you, thank you very much." },

    // Grammar / definitions
    { id: "g1", type: "grammar", punjabi: "naaon",
      english: "noun",
      definition: "A person, place, thing, or idea.",
      example: "ghar (house) is a naaon." },
    { id: "g2", type: "grammar", punjabi: "kirya",
      english: "verb",
      definition: "An action word.",
      example: "khaana (to eat) is a kirya." },
    { id: "g3", type: "grammar", punjabi: "visheshan",
      english: "adjective",
      definition: "A describing word.",
      example: "vadda (big) is a visheshan." },
    { id: "g4", type: "grammar", punjabi: "kirya visheshan",
      english: "adverb",
      definition: "Describes an action.",
      example: "jaldi (quickly) is a kirya visheshan." },

    // ===== Numbers (1–10, then tens) =====
    { id: "n1",  type: "vocab", punjabi: "ikk",     english: "one",
      definition: "The number 1.",
      related: "pehla (first), ikko (just one)",
      example: "Ikk roti dio. — Give one roti." },
    { id: "n2",  type: "vocab", punjabi: "do",      english: "two",
      definition: "The number 2.",
      related: "doja (second), dono (both)",
      example: "Do dost aaye. — Two friends came." },
    { id: "n3",  type: "vocab", punjabi: "tinn",    english: "three",
      definition: "The number 3.",
      related: "teeja (third)",
      example: "Tinn kitaaban. — Three books." },
    { id: "n4",  type: "vocab", punjabi: "char",    english: "four",
      definition: "The number 4.",
      related: "chautha (fourth)",
      example: "Char paye. — Four legs." },
    { id: "n5",  type: "vocab", punjabi: "panj",    english: "five",
      definition: "The number 5. (Punjab = 'land of five rivers'.)",
      related: "panjvaan (fifth), Panjab",
      example: "Panj minit. — Five minutes." },
    { id: "n6",  type: "vocab", punjabi: "che",     english: "six",
      definition: "The number 6.",
      related: "chheva (sixth)",
      example: "Che vaje. — Six o'clock." },
    { id: "n7",  type: "vocab", punjabi: "satt",    english: "seven",
      definition: "The number 7.",
      related: "sattvaan (seventh)",
      example: "Satt din. — Seven days." },
    { id: "n8",  type: "vocab", punjabi: "atth",    english: "eight",
      definition: "The number 8.",
      related: "atthvaan (eighth)",
      example: "Atth saal da. — Eight years old." },
    { id: "n9",  type: "vocab", punjabi: "nau",     english: "nine",
      definition: "The number 9.",
      related: "nauvaan (ninth)",
      example: "Nau vaje suttey. — Slept at nine." },
    { id: "n10", type: "vocab", punjabi: "das",     english: "ten",
      definition: "The number 10.",
      related: "dasvaan (tenth)",
      example: "Das rupaye. — Ten rupees." },
    { id: "n20", type: "vocab", punjabi: "vee",     english: "twenty",
      definition: "The number 20.",
      related: "ikkee (21), bee (22)",
      example: "Vee saal da. — Twenty years old." },
    { id: "n100", type: "vocab", punjabi: "sau",    english: "hundred",
      definition: "The number 100.",
      related: "hazaar (thousand), lakh (100,000)",
      example: "Sau rupaye. — One hundred rupees." },
    { id: "n1000", type: "vocab", punjabi: "hazaar", english: "thousand",
      definition: "The number 1,000.",
      related: "sau (100), lakh (100,000)",
      example: "Ikk hazaar. — One thousand." },

    // ===== Family =====
    { id: "f1", type: "vocab", punjabi: "bhra",  english: "brother",
      definition: "A male sibling.",
      related: "bhain (sister), vadda bhra (older brother)",
      example: "Mera bhra dukaan vich kamm karda hai. — My brother works in the shop." },
    { id: "f2", type: "vocab", punjabi: "bhain", english: "sister",
      definition: "A female sibling.",
      related: "bhra (brother), choti bhain (younger sister)",
      example: "Meri bhain padhai kar rahi hai. — My sister is studying." },
    { id: "f3", type: "vocab", punjabi: "dada",  english: "paternal grandfather",
      definition: "Your father's father.",
      related: "dadi (paternal grandmother), nana (maternal grandfather)",
      example: "Mera dada ji buzurg han. — My grandfather is elderly." },
    { id: "f4", type: "vocab", punjabi: "dadi",  english: "paternal grandmother",
      definition: "Your father's mother.",
      related: "dada (paternal grandfather)",
      example: "Dadi ji kahaani sunaande han. — Grandmother tells stories." },
    { id: "f5", type: "vocab", punjabi: "nana",  english: "maternal grandfather",
      definition: "Your mother's father.",
      related: "nani (maternal grandmother), dada",
      example: "Nana ji pind rehnde han. — Grandfather lives in the village." },
    { id: "f6", type: "vocab", punjabi: "nani",  english: "maternal grandmother",
      definition: "Your mother's mother.",
      related: "nana (maternal grandfather)",
      example: "Nani ji vadiya khaana banaande han. — Grandmother makes great food." },
    { id: "f7", type: "vocab", punjabi: "chacha", english: "paternal uncle (younger)",
      definition: "Your father's younger brother. (Older brother = taaya.)",
      related: "chachi, taaya, mama",
      example: "Chacha ji ne gaddi laitee. — Uncle bought a car." },
    { id: "f8", type: "vocab", punjabi: "mama",  english: "maternal uncle",
      definition: "Your mother's brother.",
      related: "mami, chacha",
      example: "Mama ji aaye han. — Maternal uncle has come." },
    { id: "f9", type: "vocab", punjabi: "puttar", english: "son",
      definition: "A male child. Often used affectionately for any young person.",
      related: "dheeyaan/dhee (daughter), beta",
      example: "Puttar, idhar aa. — Son, come here." },
    { id: "f10", type: "vocab", punjabi: "dhee", english: "daughter",
      definition: "A female child.",
      related: "puttar (son), beti",
      example: "Meri dhee doctor hai. — My daughter is a doctor." },
    { id: "f11", type: "vocab", punjabi: "parivaar", english: "family",
      definition: "All the people in your household / relatives.",
      related: "ghar (home), rishtedaar (relatives)",
      example: "Saada parivaar vadda hai. — Our family is big." },

    // ===== Body parts =====
    { id: "b1", type: "vocab", punjabi: "sir",   english: "head",
      definition: "The top of the body where the brain is.",
      related: "vaal (hair), mooh (face/mouth)",
      example: "Mera sir dukhda hai. — My head hurts." },
    { id: "b2", type: "vocab", punjabi: "akh",   english: "eye",
      definition: "The body part used to see.",
      related: "akhaan (eyes, plural), dekhna (to see)",
      example: "Tuhadi akhaan sohniyaan han. — Your eyes are beautiful." },
    { id: "b3", type: "vocab", punjabi: "kann",  english: "ear",
      definition: "The body part used to hear.",
      related: "sunna (to listen)",
      example: "Kann khol ke sun. — Listen with your ears open." },
    { id: "b4", type: "vocab", punjabi: "nakk",  english: "nose",
      definition: "The body part used to smell and breathe.",
      related: "saans (breath)",
      example: "Mera nakk vagda hai. — My nose is running." },
    { id: "b5", type: "vocab", punjabi: "mooh",  english: "mouth / face",
      definition: "The opening used to speak and eat; also means 'face'.",
      related: "bolna (to speak), dand (teeth)",
      example: "Mooh dho lo. — Wash your face." },
    { id: "b6", type: "vocab", punjabi: "hath",  english: "hand",
      definition: "The body part at the end of your arm.",
      related: "ungal (finger), bahn (arm)",
      example: "Hath dho. — Wash your hands." },
    { id: "b7", type: "vocab", punjabi: "pair",  english: "foot / leg",
      definition: "The body part used for walking.",
      related: "tur (walk), dauran (run)",
      example: "Mera pair dukhda hai. — My foot hurts." },
    { id: "b8", type: "vocab", punjabi: "pet",   english: "stomach / belly",
      definition: "Where food goes when you eat.",
      related: "bhukh (hunger), khaana (food)",
      example: "Mera pet bhar gaya. — My stomach is full." },
    { id: "b9", type: "vocab", punjabi: "dil",   english: "heart",
      definition: "The organ that pumps blood; also 'feelings/desire'.",
      related: "pyar (love), jaan (life)",
      example: "Mera dil kehnda hai. — My heart says (i.e. I feel like)." },
    { id: "b10", type: "vocab", punjabi: "vaal", english: "hair",
      definition: "What grows on the top of your head.",
      related: "sir (head)",
      example: "Tuhade vaal lambay han. — Your hair is long." },

    // ===== Colors =====
    { id: "c1", type: "vocab", punjabi: "laal",   english: "red",
      definition: "The color of blood and roses.",
      related: "rang (color)",
      example: "Laal gulaab. — A red rose." },
    { id: "c2", type: "vocab", punjabi: "neela",  english: "blue",
      definition: "The color of the sky and ocean.",
      related: "aasman (sky)",
      example: "Neela aasman. — A blue sky." },
    { id: "c3", type: "vocab", punjabi: "peela",  english: "yellow",
      definition: "The color of the sun and lemons.",
      related: "suraj (sun)",
      example: "Peela rang. — Yellow color." },
    { id: "c4", type: "vocab", punjabi: "hara",   english: "green",
      definition: "The color of grass and leaves.",
      related: "patta (leaf)",
      example: "Hare khet. — Green fields." },
    { id: "c5", type: "vocab", punjabi: "kaala",  english: "black",
      definition: "The darkest color.",
      related: "raat (night)",
      example: "Kaale vaal. — Black hair." },
    { id: "c6", type: "vocab", punjabi: "chitta", english: "white",
      definition: "The color of milk and snow.",
      related: "doodh (milk), barf (snow)",
      example: "Chitta kapra. — White cloth." },
    { id: "c7", type: "vocab", punjabi: "bhura",  english: "brown",
      definition: "The color of wood and chocolate.",
      related: "lakkad (wood)",
      example: "Bhura ghoda. — A brown horse." },
    { id: "c8", type: "vocab", punjabi: "gulabi", english: "pink",
      definition: "The color of rose flowers; from 'gulaab' (rose).",
      related: "gulaab (rose)",
      example: "Gulabi rang. — Pink color." },

    // ===== Days of the week =====
    { id: "d1", type: "vocab", punjabi: "somvar",    english: "Monday",
      definition: "The first weekday.",
      related: "din (day), hafta (week)",
      example: "Somvar nu school jaana. — Go to school on Monday." },
    { id: "d2", type: "vocab", punjabi: "mangalvar", english: "Tuesday",
      definition: "The second weekday.",
      example: "Mangalvar nu chutti. — Holiday on Tuesday." },
    { id: "d3", type: "vocab", punjabi: "budhvar",   english: "Wednesday",
      definition: "The middle weekday.",
      example: "Budhvar aaya. — Wednesday came." },
    { id: "d4", type: "vocab", punjabi: "veervar",   english: "Thursday",
      definition: "The fourth weekday. (Also 'jumeraat'.)",
      related: "jumeraat",
      example: "Veervar nu mela hai. — There's a fair on Thursday." },
    { id: "d5", type: "vocab", punjabi: "shukarvar", english: "Friday",
      definition: "The fifth weekday.",
      example: "Shukarvar nu jaldi aana. — Come early Friday." },
    { id: "d6", type: "vocab", punjabi: "shanivar",  english: "Saturday",
      definition: "The sixth weekday.",
      example: "Shanivar nu chutti hundi hai. — Saturday is a holiday." },
    { id: "d7", type: "vocab", punjabi: "aitvar",    english: "Sunday",
      definition: "The seventh day; weekend rest day.",
      example: "Aitvar nu aaram. — Rest on Sunday." },

    // ===== Time =====
    { id: "t1", type: "vocab", punjabi: "ajj",     english: "today",
      definition: "This day, right now.",
      related: "kal, parson",
      example: "Ajj garmi hai. — Today is hot." },
    { id: "t2", type: "vocab", punjabi: "kal",     english: "yesterday / tomorrow",
      definition: "Means BOTH yesterday and tomorrow — context (verb tense) tells you which.",
      related: "ajj (today), parson",
      example: "Kal milange. — We'll meet tomorrow.  /  Kal mile si. — We met yesterday." },
    { id: "t3", type: "vocab", punjabi: "savere",  english: "morning",
      definition: "Early in the day.",
      related: "sham (evening), dupahir (noon)",
      example: "Savere jaldi uthna. — Wake up early in the morning." },
    { id: "t4", type: "vocab", punjabi: "sham",    english: "evening",
      definition: "Late afternoon / before night.",
      related: "savere, raat",
      example: "Sham nu chai pee laange. — We'll drink tea in the evening." },
    { id: "t5", type: "vocab", punjabi: "dupahir", english: "noon / afternoon",
      definition: "The middle of the day.",
      related: "savere, sham",
      example: "Dupahir da khaana. — Lunch (noon meal)." },
    { id: "t6", type: "vocab", punjabi: "hun",     english: "now",
      definition: "At this moment.",
      related: "ajj, jaldi",
      example: "Hun chalo. — Let's go now." },
    { id: "t7", type: "vocab", punjabi: "saal",    english: "year",
      definition: "12 months.",
      related: "mahina (month), hafta (week)",
      example: "Aglay saal. — Next year." },
    { id: "t8", type: "vocab", punjabi: "mahina",  english: "month",
      definition: "About 30 days.",
      related: "saal, hafta",
      example: "Eh mahina chhota hai. — This month is short." },
    { id: "t9", type: "vocab", punjabi: "hafta",   english: "week",
      definition: "Seven days.",
      related: "din (day)",
      example: "Aglay hafte milange. — We'll meet next week." },

    // ===== Food =====
    { id: "fd1", type: "vocab", punjabi: "chaaval", english: "rice",
      definition: "Cooked grains, a staple food.",
      related: "daal, sabzi",
      example: "Chaaval te daal. — Rice and lentils." },
    { id: "fd2", type: "vocab", punjabi: "daal",    english: "lentils / lentil curry",
      definition: "Cooked lentils, a very common Punjabi dish.",
      related: "chaaval, sabzi",
      example: "Daal banai hai. — I made daal." },
    { id: "fd3", type: "vocab", punjabi: "sabzi",   english: "vegetable / vegetable dish",
      definition: "Cooked vegetables.",
      related: "aaloo (potato), gobhi (cauliflower)",
      example: "Aaj ki sabzi banai? — What vegetable did you cook today?" },
    { id: "fd4", type: "vocab", punjabi: "aaloo",   english: "potato",
      definition: "A starchy root vegetable.",
      related: "sabzi, paronthe",
      example: "Aaloo paronthe pasand han. — I like potato parathas." },
    { id: "fd5", type: "vocab", punjabi: "phal",    english: "fruit",
      definition: "Sweet edible plant produce.",
      related: "anb (mango), seb (apple)",
      example: "Phal khao, sehat changi rehndi hai. — Eat fruit, it's healthy." },
    { id: "fd6", type: "vocab", punjabi: "anb",     english: "mango",
      definition: "A sweet tropical fruit; the king of fruits.",
      related: "phal",
      example: "Anb mitthe han. — Mangoes are sweet." },
    { id: "fd7", type: "vocab", punjabi: "lassi",   english: "lassi (yogurt drink)",
      definition: "A traditional Punjabi yogurt drink, sweet or salty.",
      related: "dahi (yogurt), doodh (milk)",
      example: "Mitthi lassi. — Sweet lassi." },
    { id: "fd8", type: "vocab", punjabi: "namak",   english: "salt",
      definition: "A white seasoning.",
      related: "mirch (chili), cheeni (sugar)",
      example: "Namak ghatt hai. — There's not enough salt." },
    { id: "fd9", type: "vocab", punjabi: "mirch",   english: "chili / pepper",
      definition: "A spicy ingredient.",
      related: "namak, masala",
      example: "Mirch tikhi hai. — The chili is hot/spicy." },
    { id: "fd10", type: "vocab", punjabi: "anda",   english: "egg",
      definition: "Comes from a hen; a food.",
      related: "murga (rooster)",
      example: "Anda khaada. — I ate an egg." },
    { id: "fd11", type: "vocab", punjabi: "paronthe", english: "paratha (stuffed flatbread)",
      definition: "A pan-fried flatbread, often stuffed with potato, paneer, or radish.",
      related: "roti, makhan",
      example: "Aaloo paronthe naal makhan. — Potato parathas with butter." },

    // ===== Animals =====
    { id: "a1", type: "vocab", punjabi: "kutta",  english: "dog",
      definition: "A common pet animal.",
      related: "billi (cat)",
      example: "Kutta bhonkda hai. — The dog is barking." },
    { id: "a2", type: "vocab", punjabi: "billi",  english: "cat",
      definition: "A small furry pet.",
      related: "kutta",
      example: "Billi doodh peendi hai. — The cat drinks milk." },
    { id: "a3", type: "vocab", punjabi: "gaan",   english: "cow",
      definition: "A farm animal that gives milk; sacred in Hindu tradition.",
      related: "doodh (milk)",
      example: "Gaan khet vich hai. — The cow is in the field." },
    { id: "a4", type: "vocab", punjabi: "ghoda",  english: "horse",
      definition: "A large animal used for riding.",
      related: "gaddi",
      example: "Ghoda tez daudda hai. — The horse runs fast." },
    { id: "a5", type: "vocab", punjabi: "pakhi",  english: "bird",
      definition: "An animal with wings and feathers.",
      related: "udna (to fly)",
      example: "Pakhi gaaonde han. — Birds sing." },
    { id: "a6", type: "vocab", punjabi: "sher",   english: "lion / tiger",
      definition: "A large wild cat. In Punjabi 'sher' often covers both; 'baagh' is more specifically tiger. The Sikh surname 'Singh' literally means 'lion'.",
      related: "baagh, jangli",
      example: "Oh sher varga bahaadar hai. — He is brave like a lion." },

    // ===== Places =====
    { id: "pl1", type: "vocab", punjabi: "pind",      english: "village",
      definition: "A small rural settlement; deep in Punjabi culture.",
      related: "shehar (city), khet (field)",
      example: "Mera pind Punjab vich hai. — My village is in Punjab." },
    { id: "pl2", type: "vocab", punjabi: "shehar",    english: "city",
      definition: "A large town.",
      related: "pind",
      example: "Vadda shehar. — A big city." },
    { id: "pl3", type: "vocab", punjabi: "khet",      english: "field / farm",
      definition: "Land where crops grow.",
      related: "pind, kisaan (farmer)",
      example: "Khet vich kanak. — Wheat in the field." },
    { id: "pl4", type: "vocab", punjabi: "naddi",     english: "river",
      definition: "A flowing body of water. Punjab = land of FIVE rivers.",
      related: "paani, samandar (sea)",
      example: "Naddi vagdi hai. — The river flows." },
    { id: "pl5", type: "vocab", punjabi: "gurudwara", english: "Gurdwara (Sikh temple)",
      definition: "A Sikh place of worship; literally 'door of the Guru'.",
      related: "mandir, masjid",
      example: "Asin gurudwara jaande haan. — We go to the Gurdwara." },
    { id: "pl6", type: "vocab", punjabi: "dukaan",    english: "shop / store",
      definition: "A place to buy things.",
      related: "bazaar, paisa",
      example: "Dukaan band hai. — The shop is closed." },

    // ===== Common adjectives =====
    { id: "ad1", type: "vocab", punjabi: "vadda",   english: "big / elder",
      definition: "Large in size, or older in age.",
      related: "chhota (small)",
      example: "Vadda bhra. — Elder brother." },
    { id: "ad2", type: "vocab", punjabi: "chhota",  english: "small / younger",
      definition: "Small, or younger.",
      related: "vadda",
      example: "Chhoti bhain. — Younger sister." },
    { id: "ad3", type: "vocab", punjabi: "changa",  english: "good",
      definition: "Of good quality; fine; okay.",
      related: "maada (bad), vadiya (excellent)",
      example: "Sab changa hai. — Everything is fine." },
    { id: "ad4", type: "vocab", punjabi: "maada",   english: "bad",
      definition: "Of poor quality; not good.",
      related: "changa",
      example: "Maada kamm. — Bad work." },
    { id: "ad5", type: "vocab", punjabi: "sohna",   english: "beautiful / handsome",
      definition: "Pretty, attractive. (Famous Punjabi song: 'Sohna lagda'.)",
      related: "sundar",
      example: "Sohna munda. — A handsome boy." },
    { id: "ad6", type: "vocab", punjabi: "garam",   english: "hot (temperature)",
      definition: "High in temperature.",
      related: "thanda (cold), tikhi (spicy hot)",
      example: "Chah garam hai. — The tea is hot." },
    { id: "ad7", type: "vocab", punjabi: "thanda",  english: "cold",
      definition: "Low in temperature.",
      related: "garam",
      example: "Paani thanda hai. — The water is cold." },
    { id: "ad8", type: "vocab", punjabi: "navan",   english: "new",
      definition: "Recently made or obtained.",
      related: "purana (old)",
      example: "Navan kapra. — New cloth." },
    { id: "ad9", type: "vocab", punjabi: "purana",  english: "old (thing)",
      definition: "Used for objects that are not new. (For old PEOPLE use 'buzurg' = elderly.)",
      related: "navan, buzurg",
      example: "Purana ghar. — The old house." },
    { id: "ad10", type: "vocab", punjabi: "sokha",  english: "easy",
      definition: "Not difficult.",
      related: "aukha (difficult)",
      example: "Eh sokha hai. — This is easy." },
    { id: "ad11", type: "vocab", punjabi: "aukha",  english: "difficult / hard",
      definition: "Hard to do.",
      related: "sokha",
      example: "Punjabi aukhi nahin. — Punjabi is not difficult." },

    // ===== Common verbs (infinitive ends in -na/-ona) =====
    { id: "vb1", type: "vocab", punjabi: "jaana",   english: "to go",
      definition: "Move from one place to another.",
      related: "aana (to come)",
      example: "Main school jaanda haan. — I go to school." },
    { id: "vb2", type: "vocab", punjabi: "aana",    english: "to come",
      definition: "Move toward a place.",
      related: "jaana",
      example: "Idhar aa. — Come here." },
    { id: "vb3", type: "vocab", punjabi: "karna",   english: "to do / to make",
      definition: "The most common 'helper' verb in Punjabi.",
      related: "kamm karna (to work), gall karna (to talk)",
      example: "Ki karna hai? — What to do?" },
    { id: "vb4", type: "vocab", punjabi: "bolna",   english: "to speak",
      definition: "To say words out loud.",
      related: "sunna (to listen), gall (talk)",
      example: "Punjabi bolo. — Speak Punjabi." },
    { id: "vb5", type: "vocab", punjabi: "padhna",  english: "to read / to study",
      definition: "Look at words; or study at school.",
      related: "likhna (to write), kitaab",
      example: "Main Punjabi padh reha haan. — I am studying Punjabi." },
    { id: "vb6", type: "vocab", punjabi: "likhna",  english: "to write",
      definition: "Make letters or words on paper.",
      related: "padhna",
      example: "Naam likho. — Write your name." },
    { id: "vb7", type: "vocab", punjabi: "dekhna",  english: "to see / to watch",
      definition: "Use your eyes.",
      related: "akh, samajhna",
      example: "Eh dekho! — Look at this!" },
    { id: "vb8", type: "vocab", punjabi: "samajhna", english: "to understand",
      definition: "To grasp the meaning of something.",
      related: "seekhna (to learn)",
      example: "Mainu samajh aa gayi. — I understood." },
    { id: "vb9", type: "vocab", punjabi: "seekhna", english: "to learn",
      definition: "To gain knowledge or skill.",
      related: "padhna, samajhna",
      example: "Main Punjabi seekh reha haan. — I am learning Punjabi." },
    { id: "vb10", type: "vocab", punjabi: "sona",   english: "to sleep",
      definition: "Rest with eyes closed.",
      related: "uthna (to wake/get up)",
      example: "Raat nu sona. — Sleep at night." },
    { id: "vb11", type: "vocab", punjabi: "khareedna", english: "to buy",
      definition: "To purchase something.",
      related: "vechna (to sell), paisa",
      example: "Main roti khareed laitee. — I bought roti." },
    { id: "vb12", type: "vocab", punjabi: "denna",  english: "to give",
      definition: "Hand something to someone.",
      related: "lain (to take)",
      example: "Mainu paani de. — Give me water." },
    { id: "vb13", type: "vocab", punjabi: "lain",   english: "to take",
      definition: "Receive or pick up something.",
      related: "denna",
      example: "Eh lai lo. — Take this." },

    // ===== Pronouns =====
    { id: "pc1", type: "vocab", punjabi: "main",   english: "I",
      definition: "First person singular pronoun. Pair with 'haan' (am).",
      related: "asi (we), mera (my)",
      example: "Main thakk gaya haan. — I am tired." },
    { id: "pc2", type: "vocab", punjabi: "tu",     english: "you (informal singular)",
      definition: "Use ONLY with close friends, kids, or younger family. Otherwise use 'tusi'.",
      related: "tusi (formal/plural), tera (your)",
      example: "Tu kithe hai? — Where are you? (informal)" },
    { id: "pc3", type: "vocab", punjabi: "tusi",   english: "you (formal / plural)",
      definition: "Polite singular OR plural 'you'. Always safe to use with adults/strangers.",
      related: "tu, tuhada (your formal)",
      example: "Tusi kive ho? — How are you? (polite)" },
    { id: "pc4", type: "vocab", punjabi: "asi",    english: "we",
      definition: "First person plural.",
      related: "main, saada (our)",
      example: "Asi dost haan. — We are friends." },
    { id: "pc5", type: "vocab", punjabi: "oh",     english: "he / she / it / that / they",
      definition: "Punjabi has no he/she gender split — 'oh' covers all third person.",
      related: "eh (this), uda (his/her)",
      example: "Oh aaya. — He came.  /  Oh aayi. — She came. (Verb agrees with gender.)" },
    { id: "pc6", type: "vocab", punjabi: "eh",     english: "this",
      definition: "Demonstrative for something near.",
      related: "oh (that)",
      example: "Eh ki hai? — What is this?" },

    // ===== Question words =====
    { id: "q1", type: "vocab", punjabi: "ki",     english: "what",
      definition: "Used to ask about a thing.",
      related: "kithe, kado, kyon",
      example: "Eh ki hai? — What is this?" },
    { id: "q2", type: "vocab", punjabi: "kithe",  english: "where",
      definition: "Used to ask about a place.",
      related: "ki, kithon",
      example: "Tu kithe jaa reha hai? — Where are you going?" },
    { id: "q3", type: "vocab", punjabi: "kado",   english: "when",
      definition: "Used to ask about time.",
      example: "Tusi kado aaoge? — When will you come?" },
    { id: "q4", type: "vocab", punjabi: "kyon",   english: "why",
      definition: "Used to ask about a reason.",
      example: "Tu kyon ro reha hai? — Why are you crying?" },
    { id: "q5", type: "vocab", punjabi: "kive",   english: "how",
      definition: "Used to ask about manner or condition.",
      example: "Tusi kive ho? — How are you?" },
    { id: "q6", type: "vocab", punjabi: "kaun",   english: "who",
      definition: "Used to ask about a person.",
      example: "Eh kaun hai? — Who is this?" },
    { id: "q7", type: "vocab", punjabi: "kinna",  english: "how much / how many",
      definition: "Used for quantity. Changes form: kinna (m), kinni (f), kinne (pl).",
      example: "Kinne paise? — How much money?" },

    // ===== More phrases (greetings, courtesy, daily) =====
    { id: "p8",  type: "phrase", punjabi: "Sat sri akaal ji",
      english: "Hello (very respectful).",
      definition: "The 'ji' at the end adds respect. Used by Sikhs as both greeting and goodbye.",
      example: "Reply: 'Sat sri akaal ji' back." },
    { id: "p9",  type: "phrase", punjabi: "Phir milange",
      english: "See you again / goodbye.",
      definition: "Literally 'we will meet again'. Casual goodbye.",
      example: "Acha, phir milange! — Okay, see you later!" },
    { id: "p10", type: "phrase", punjabi: "Rab rakha",
      english: "Goodbye (lit. 'God protect you').",
      definition: "A warm farewell, very common in Punjabi.",
      example: "Chal, rab rakha. — Alright, take care." },
    { id: "p11", type: "phrase", punjabi: "Maaf karna",
      english: "Sorry / excuse me.",
      definition: "Used to apologize OR to get someone's attention politely.",
      example: "Maaf karna, mainu samajh nahin aayi. — Sorry, I didn't understand." },
    { id: "p12", type: "phrase", punjabi: "Koi gall nahin",
      english: "No problem / it's okay.",
      definition: "Literally 'no matter / no issue'. Reply to an apology or thanks.",
      example: "A: Maaf karna. B: Koi gall nahin." },
    { id: "p13", type: "phrase", punjabi: "Mehrbaani",
      english: "Thank you / please (kindness).",
      definition: "More heartfelt alternative to 'shukriya'. Literally 'kindness'.",
      example: "Bahut mehrbaani. — Many thanks." },
    { id: "p14", type: "phrase", punjabi: "Ji haan",
      english: "Yes (polite).",
      definition: "'Ji' adds respect. Just 'haan' alone is more casual.",
      example: "Ji haan, main aavaanga. — Yes, I will come." },
    { id: "p15", type: "phrase", punjabi: "Ji nahin",
      english: "No (polite).",
      definition: "Polite negative.",
      example: "Ji nahin, mainu pata nahin. — No, I don't know." },
    { id: "p16", type: "phrase", punjabi: "Tuhanu milke khushi hoyi",
      english: "Nice to meet you.",
      definition: "Literally 'meeting you brought happiness'.",
      example: "Used after first introductions." },
    { id: "p17", type: "phrase", punjabi: "Tusi kithon ho?",
      english: "Where are you from?",
      definition: "Polite question asking where someone is from. 'kithon' = from where.",
      example: "Reply: 'Main Amreeka ton haan.' — I'm from America." },
    { id: "p18", type: "phrase", punjabi: "Main Amreeka ton haan",
      english: "I am from America.",
      definition: "'ton' = 'from'. Replace 'Amreeka' with your country.",
      example: "Main Canada ton haan. — I'm from Canada." },
    { id: "p19", type: "phrase", punjabi: "Mainu samajh nahin aayi",
      english: "I didn't understand.",
      definition: "Literally 'understanding did not come to me'. Note the dative 'mainu' (to me).",
      example: "Use this to ask someone to explain again." },
    { id: "p20", type: "phrase", punjabi: "Haule bolo",
      english: "Please speak slowly.",
      definition: "'haule' = slowly/softly. Useful for learners!",
      example: "Maaf karna, haule bolo. — Sorry, please speak slowly." },
    { id: "p21", type: "phrase", punjabi: "Phir kaho",
      english: "Say it again.",
      definition: "Polite request to repeat what was just said. 'phir' = again, 'kaho' = say.",
      example: "Mainu samajh nahin aayi, phir kaho. — I didn't understand, say again." },
    { id: "p22", type: "phrase", punjabi: "Mainu bhukh laggi hai",
      english: "I am hungry.",
      definition: "Literally 'hunger has struck me'. Note the dative construction.",
      related: "Mainu pyaas laggi hai (I'm thirsty)",
      example: "Mainu bhukh laggi hai, kuch khaana hai. — I'm hungry, I want to eat." },
    { id: "p23", type: "phrase", punjabi: "Mainu pyaas laggi hai",
      english: "I am thirsty.",
      definition: "Literally 'thirst has struck me'.",
      example: "Mainu pyaas laggi hai, paani dio. — I'm thirsty, give water." },
    { id: "p24", type: "phrase", punjabi: "Mainu pasand hai",
      english: "I like it.",
      definition: "Literally 'it is liked to me'.",
      example: "Mainu Punjabi gaane pasand han. — I like Punjabi songs." },
    { id: "p25", type: "phrase", punjabi: "Mainu pata nahin",
      english: "I don't know.",
      definition: "'pata' = knowledge/awareness. Very common phrase.",
      example: "Mainu pata nahin oh kithe hai. — I don't know where he/she is." },
    { id: "p26", type: "phrase", punjabi: "Kinne paise?",
      english: "How much money? / How much does it cost?",
      definition: "Use at shops and markets.",
      example: "Eh kinne paise da hai? — How much is this?" },
    { id: "p27", type: "phrase", punjabi: "Bahut mehnga hai",
      english: "It's too expensive.",
      definition: "For bargaining at the bazaar.",
      related: "sasta (cheap)",
      example: "Bahut mehnga hai, ghatt karo. — Too expensive, reduce the price." },
    { id: "p28", type: "phrase", punjabi: "Chalo!",
      english: "Let's go! / Come on!",
      definition: "An all-purpose energizer — 'let's go', 'okay then', 'fine'.",
      example: "Chalo, ghar chaliye. — Come on, let's go home." },
    { id: "p29", type: "phrase", punjabi: "Acha",
      english: "Okay / I see / really?",
      definition: "Multipurpose: agreement, mild surprise, transition.",
      example: "Acha, theek hai. — Okay, fine." },
    { id: "p30", type: "phrase", punjabi: "Khush raho",
      english: "Stay happy / be blessed.",
      definition: "A warm wish, often said when parting or after thanks.",
      example: "Shukriya. Khush raho. — Thank you. Be happy." },

    // ===== Grammar essentials =====
    { id: "g5", type: "grammar", punjabi: "haan / hai / ho",
      english: "to be (am / is / are)",
      definition: "The Punjabi copula. main HAAN (I am), tu HAI / tusi HO (you are), oh HAI (he/she is), asi HAAN (we are), oh HAN (they are). Past forms: si, san.",
      example: "Main thakk gaya haan. — I am tired." },
    { id: "g6", type: "grammar", punjabi: "ling",
      english: "gender",
      definition: "Every Punjabi noun is masculine or feminine. Adjectives and verbs CHANGE form to agree. Common pattern: -a (m) → -i (f). Example: vadda munda (big boy), vaddi kuri (big girl).",
      example: "Mera ghar (my house, m) vs Meri kitaab (my book, f)." },
    { id: "g7", type: "grammar", punjabi: "tu te tusi",
      english: "informal vs formal 'you'",
      definition: "TU = informal (close friends, children, family younger than you). TUSI = polite singular OR plural. When unsure, ALWAYS use 'tusi'. Verb endings change: tu hai vs tusi ho.",
      example: "Tu kithe hai? (informal) vs Tusi kithe ho? (polite)" },
    { id: "g8", type: "grammar", punjabi: "nahin",
      english: "not (negation)",
      definition: "Place 'nahin' before the verb to make a sentence negative. 'Na' is also used in commands.",
      example: "Main jaanda haan → Main NAHIN jaanda. — I go → I don't go." },
    { id: "g9", type: "grammar", punjabi: "nu",
      english: "to / for (postposition)",
      definition: "Punjabi uses POSTpositions (after the noun) instead of prepositions. 'Nu' marks the indirect object or 'to'.",
      example: "Mainu (= main + nu) paani de. — Give water TO me." },
    { id: "g10", type: "grammar", punjabi: "ton",
      english: "from (postposition)",
      definition: "'Ton' comes AFTER the noun to mean 'from'.",
      example: "Main Amreeka TON haan. — I am FROM America." },
    { id: "g11", type: "grammar", punjabi: "vich",
      english: "in / inside (postposition)",
      definition: "'Vich' = in. Comes after the noun.",
      example: "Ghar VICH. — Inside the house." },
    { id: "g12", type: "grammar", punjabi: "te",
      english: "on / at (postposition)",
      definition: "'Te' = on/at. Also means 'and' in some contexts.",
      example: "Mez TE kitaab hai. — The book is ON the table." },
    { id: "g13", type: "grammar", punjabi: "naal",
      english: "with (postposition)",
      definition: "'Naal' = with / along with.",
      example: "Mere NAAL chal. — Come WITH me." },
    { id: "g14", type: "grammar", punjabi: "da / di / de",
      english: "of / 's (possessive)",
      definition: "Possessive postposition. Form changes to match the GENDER and NUMBER of the thing possessed: DA (m sg), DI (f sg/pl), DE (m pl).",
      example: "Ravi DA ghar (Ravi's house, m). Ravi DI kitaab (Ravi's book, f)." },
    { id: "g15", type: "grammar", punjabi: "mera / meri / mere",
      english: "my (possessive)",
      definition: "Like da/di/de but for 'my'. Agrees with the noun owned, not the speaker. Same pattern: tera (your), saada (our), tuhada (your formal), uda (his/her).",
      example: "Mera bhra (my brother). Meri bhain (my sister). Mere dost (my friends)." },
    { id: "g16", type: "grammar", punjabi: "ne",
      english: "ergative marker (past transitive)",
      definition: "In PAST tense with TRANSITIVE verbs, the doer takes 'ne'. The verb then agrees with the OBJECT, not the doer. A unique Punjabi/Hindi feature.",
      example: "Ravi NE roti khaadi. — Ravi ate roti. (verb 'khaadi' is feminine to match 'roti')." },
    { id: "g17", type: "grammar", punjabi: "vacchan",
      english: "number (singular / plural)",
      definition: "Plurals often add -an or change ending. Masc -a → -e (munda → munde). Fem often adds -an (kuri → kurian).",
      example: "ikk munda (one boy) → do munde (two boys)." },
    { id: "g18", type: "grammar", punjabi: "kal-aaj-kal",
      english: "tense from context",
      definition: "'Kal' means BOTH yesterday and tomorrow. The VERB tense tells you which: 'kal aaya si' (came yesterday) vs 'kal aavega' (will come tomorrow).",
      example: "Kal milange (we'll meet tomorrow) vs Kal mile si (we met yesterday)." },
    { id: "g19", type: "grammar", punjabi: "Gurmukhi",
      english: "Punjabi script",
      definition: "Punjabi is written in GURMUKHI in India ('from the mouth of the Guru', developed for Sikh scripture) and SHAHMUKHI (Perso-Arabic) in Pakistan. This app uses romanization for beginners.",
      example: "ਪਾਣੀ = paani (water) in Gurmukhi." },
    { id: "g20", type: "grammar", punjabi: "sur",
      english: "tone",
      definition: "Punjabi is one of the few Indo-European TONAL languages. Three tones: high, low, level. Tone can change meaning: kòṛa (whip) vs kora (blank/empty) vs ghora (horse). The app's romanization ignores tone for simplicity.",
      example: "Listen carefully — tones distinguish many words!" },

    // ===== Kindness & respect: the 'ji' culture =====
    { id: "k1", type: "phrase", punjabi: "ji",
      english: "respectful suffix (sir/ma'am).",
      definition: "The single most important kindness word in Punjabi. Add 'ji' after a name, pronoun, or yes/no to show respect. Works for any age, gender, or status. When in doubt — add 'ji'.",
      related: "tusi, sahib",
      example: "Haan ji (yes sir/ma'am). Papa ji. Ravi ji. Tusi ji." },
    { id: "k2", type: "phrase", punjabi: "Ji aaya nu",
      english: "Welcome (warmest welcome).",
      definition: "Literally 'welcome to your coming'. The classic Punjabi welcome at the door — said with both hands open or pressed together.",
      example: "Ji aaya nu, andar aao. — Welcome, please come inside." },
    { id: "k3", type: "phrase", punjabi: "Tashreef rakho",
      english: "Please have a seat.",
      definition: "Very polite, slightly formal. Literally 'place your honor'. Use with elders or guests.",
      related: "baith jao (sit down, casual)",
      example: "Tashreef rakho ji, chai aaundi hai. — Please sit, tea is coming." },
    { id: "k4", type: "phrase", punjabi: "Baith jao ji",
      english: "Please sit (warm).",
      definition: "Friendlier 'please sit'. Adding 'ji' makes any command into a polite request.",
      example: "Aao, baith jao ji. — Come, please sit." },
    { id: "k5", type: "phrase", punjabi: "Pani peeo ji",
      english: "Please drink some water.",
      definition: "Offering water to a guest is sacred Punjabi hospitality. Always offer; always accept.",
      example: "Pehlan paani peeo ji, phir gall karange. — First drink water, then we'll talk." },
    { id: "k6", type: "phrase", punjabi: "Chah pee ke jaana",
      english: "Have tea before you go.",
      definition: "A near-mandatory hospitality offer. Refusing tea twice is normal; the host insists three times.",
      example: "Chah pee ke jaana ji, jaldi ki hai? — Have tea before you go, what's the rush?" },
    { id: "k7", type: "phrase", punjabi: "Kirpa karke",
      english: "Please (formal 'kindly').",
      definition: "Literally 'doing kindness'. The most formal 'please'. Use when making a real request.",
      related: "mehrbaani karke",
      example: "Kirpa karke darvaza band karo. — Please close the door." },
    { id: "k8", type: "phrase", punjabi: "Mehrbaani karke",
      english: "Please (kindly).",
      definition: "Warmer, slightly less formal than 'kirpa karke'. Both are great everyday 'please'.",
      example: "Mehrbaani karke mainu sunno. — Please listen to me." },
    { id: "k9", type: "phrase", punjabi: "Bahut shukriya ji",
      english: "Thank you very much (respectfully).",
      definition: "Stronger than just 'shukriya'. Adding 'bahut' (very) and 'ji' makes it heartfelt.",
      example: "Tuhadi madad layi bahut shukriya ji. — Thank you very much for your help." },
    { id: "k10", type: "phrase", punjabi: "Dhanvaad",
      english: "Thank you (Sikh/formal).",
      definition: "More common in religious / formal contexts; from Sanskrit. 'Shukriya' is everyday; 'dhanvaad' is heartfelt or written.",
      example: "Sat sri akaal, dhanvaad ji. — Hello, thank you." },
    { id: "k11", type: "phrase", punjabi: "Mainu maaf karo",
      english: "Please forgive me.",
      definition: "Stronger than 'maaf karna'. Use when you've actually done wrong, not just to say 'excuse me'.",
      example: "Mainu maaf karo, mere kolon galti ho gayi. — Please forgive me, I made a mistake." },
    { id: "k12", type: "phrase", punjabi: "Galti ho gayi",
      english: "I made a mistake.",
      definition: "A humble admission. Literally 'a mistake happened' — softer than 'I was wrong'.",
      example: "Mere kolon galti ho gayi, maaf karna. — A mistake happened from me, sorry." },
    { id: "k13", type: "phrase", punjabi: "Tuhadi mehrbaani",
      english: "Your kindness / much obliged.",
      definition: "A heartfelt thanks acknowledging the OTHER person's goodness. Very Punjabi.",
      example: "Tuhadi mehrbaani, main eh kade nahin bhulanga. — Your kindness — I'll never forget this." },
    { id: "k14", type: "phrase", punjabi: "Rabb tuhada bhala kare",
      english: "May God bless you.",
      definition: "A blessing offered after someone helps you. Common across Sikhs, Muslims, Hindus.",
      related: "Waheguru tuhada bhala kare",
      example: "Rabb tuhada bhala kare, bahut shukriya. — May God bless you, thank you so much." },
    { id: "k15", type: "phrase", punjabi: "Khair",
      english: "Well-being / 'all's well'.",
      definition: "A small word with big warmth. Use in greetings ('sab khair?' = is everything well?) and well-wishes.",
      example: "Sab khair hai? — Is everything well?" },
    { id: "k16", type: "phrase", punjabi: "Sab theek hai",
      english: "Everything is fine.",
      definition: "Standard reassurance / reply.",
      example: "A: Ki haal hai? B: Sab theek hai ji. — How are things? All good." },
    { id: "k17", type: "phrase", punjabi: "Ki haal hai?",
      english: "How are things? / How's it going?",
      definition: "More casual than 'tusi kive ho?'. Used between friends and family.",
      related: "Tusi kive ho? (more polite)",
      example: "Oye, ki haal hai? — Hey, how's it going?" },
    { id: "k18", type: "phrase", punjabi: "Sab vadiya",
      english: "All great / everything's wonderful.",
      definition: "Upbeat reply. 'Vadiya' = excellent. A very Punjabi-flavored response.",
      example: "A: Ki haal? B: Sab vadiya ji! — How are things? All great!" },
    { id: "k19", type: "phrase", punjabi: "Tuhada din vadiya rahe",
      english: "Have a great day.",
      definition: "A kind parting wish.",
      example: "Chalo ji, tuhada din vadiya rahe. — Alright, have a great day." },
    { id: "k20", type: "phrase", punjabi: "Aaram naal",
      english: "Take it easy / no rush.",
      definition: "Literally 'with comfort'. A kind way to tell someone not to stress.",
      example: "Aaram naal karo, koi jaldi nahin. — Take it easy, no rush." },
    { id: "k21", type: "phrase", punjabi: "Fikar na karo",
      english: "Don't worry.",
      definition: "Reassuring kindness. 'Fikar' = worry.",
      example: "Fikar na karo, sab theek ho jaayega. — Don't worry, everything will be okay." },
    { id: "k22", type: "phrase", punjabi: "Madad chahidi hai?",
      english: "Do you need help?",
      definition: "Offering help politely. 'Madad' = help.",
      example: "Ji, madad chahidi hai? — Sir/ma'am, do you need help?" },
    { id: "k23", type: "phrase", punjabi: "Main madad karaan?",
      english: "May I help?",
      definition: "Even more polite — asking permission to help.",
      example: "Main madad karaan ji? — May I help you?" },
    { id: "k24", type: "phrase", punjabi: "Tuhada swagat hai",
      english: "You are welcome (formal).",
      definition: "A formal welcome OR reply to 'thank you'. 'Swagat' = welcome.",
      example: "A: Shukriya. B: Tuhada swagat hai. — Thanks. You're welcome." },
    { id: "k25", type: "phrase", punjabi: "Beshakk",
      english: "Of course / certainly.",
      definition: "A confident, kind 'yes'. 'Beshakk' literally = without doubt.",
      example: "Beshakk ji, main aavaanga. — Of course, I will come." },
    { id: "k26", type: "phrase", punjabi: "Zaroor",
      english: "Definitely / sure.",
      definition: "Warm agreement.",
      example: "Zaroor, kal milange. — Sure, we'll meet tomorrow." },
    { id: "k27", type: "phrase", punjabi: "Khayal rakhna",
      english: "Take care (of yourself).",
      definition: "A loving farewell, especially to family. 'Khayal' = thought/care.",
      example: "Apna khayal rakhna ji. — Take care of yourself." },
    { id: "k28", type: "phrase", punjabi: "Apna dhyan rakho",
      english: "Look after yourself.",
      definition: "Similar to 'khayal rakhna' — slightly more formal.",
      example: "Safar vich apna dhyan rakho. — Take care on the journey." },
    { id: "k29", type: "phrase", punjabi: "Vadhaiyaan!",
      english: "Congratulations!",
      definition: "Used for births, weddings, exams, festivals — any happy occasion.",
      related: "mubarak",
      example: "Vadhaiyaan ji, bahut vadhaiyaan! — Congratulations, many congrats!" },
    { id: "k30", type: "phrase", punjabi: "Mubarak",
      english: "Blessed / congratulations (occasion-specific).",
      definition: "Pair with the event: 'Janamdin mubarak' (happy birthday), 'Eid mubarak', 'Vivaah mubarak' (wedding).",
      example: "Janamdin mubarak ho! — Happy birthday!" },

    // ===== Honorifics & terms of address =====
    { id: "h1", type: "vocab", punjabi: "sahib",
      english: "sir / mister (respectful)",
      definition: "Polite title, often added after a name: 'Singh sahib'. Used by Sikhs/Punjabis universally.",
      related: "ji, sardar",
      example: "Singh sahib, tuhada phone aaya hai. — Mr. Singh, your phone is calling." },
    { id: "h2", type: "vocab", punjabi: "sardar ji",
      english: "respected sir (esp. Sikh men)",
      definition: "Title for a turbaned Sikh man — but also used broadly as a respectful 'sir'. 'Sardarni' = woman.",
      related: "sahib, ji",
      example: "Sardar ji, kithe jaa rahe ho? — Sir, where are you going?" },
    { id: "h3", type: "vocab", punjabi: "veer ji",
      english: "respected brother (also: any older man)",
      definition: "Literally 'brother', but used kindly for any older/peer male — even strangers. Adds warmth instantly.",
      related: "bhra, paaji",
      example: "Veer ji, raasta dasso. — Brother, please tell me the way." },
    { id: "h4", type: "vocab", punjabi: "paaji",
      english: "older brother (very warm)",
      definition: "Northern Punjabi term of endearment, especially in cities. Can address any older male respectfully.",
      related: "veer ji, bhra",
      example: "Paaji, ki haal? — Brother, how's it going?" },
    { id: "h5", type: "vocab", punjabi: "bhain ji",
      english: "respected sister (also: any woman)",
      definition: "Used for any older or peer woman to show respect — like calling a stranger 'sister'.",
      related: "didi, behen",
      example: "Bhain ji, eh kithe milda hai? — Sister, where can I find this?" },
    { id: "h6", type: "vocab", punjabi: "beta",
      english: "child / 'son' (affectionate, gender-neutral)",
      definition: "Used by elders for ANY child or younger person, regardless of gender. Warm and kind.",
      related: "puttar, beti",
      example: "Beta, eh kha lo. — Child, eat this." },
    { id: "h7", type: "vocab", punjabi: "puttar ji",
      english: "dear son / dear child",
      definition: "Tender form of 'puttar'. Used by parents and elders — pure affection.",
      example: "Puttar ji, padhai karo. — Dear child, please study." },
    { id: "h8", type: "vocab", punjabi: "buzurg",
      english: "elder / elderly person",
      definition: "Respectful word for older people. NEVER call an elder 'old' (purana) — use 'buzurg'.",
      related: "vadda, dada/dadi",
      example: "Buzurgaan da satkaar karo. — Respect your elders." },
    { id: "h9", type: "vocab", punjabi: "satkaar",
      english: "respect / honor",
      definition: "A core Punjabi value. Showing satkaar to elders, guests, and teachers is fundamental.",
      related: "izzat, adab",
      example: "Maa-pyo da satkaar karo. — Respect your parents." },
    { id: "h10", type: "vocab", punjabi: "izzat",
      english: "honor / dignity / respect",
      definition: "Closely tied to family honor in Punjabi culture. To 'give izzat' is to treat with full respect.",
      related: "satkaar",
      example: "Tuhadi izzat hai mere dil vich. — You have honor in my heart." },

    // ===== Feelings & inner life =====
    { id: "fe1", type: "vocab", punjabi: "khush",
      english: "happy",
      definition: "Joyful, glad. 'Khushi' = happiness (the noun).",
      related: "udaas (sad), khushi",
      example: "Main bahut khush haan. — I am very happy." },
    { id: "fe2", type: "vocab", punjabi: "udaas",
      english: "sad",
      definition: "Feeling down or melancholy.",
      related: "khush, dukh",
      example: "Tu udaas kyon hai? — Why are you sad?" },
    { id: "fe3", type: "vocab", punjabi: "gussa",
      english: "anger",
      definition: "Anger or irritation. 'Gussa aana' = to get angry (lit. 'anger comes').",
      related: "shaant (calm)",
      example: "Mainu gussa aaya. — I got angry." },
    { id: "fe4", type: "vocab", punjabi: "shaant",
      english: "calm / peaceful",
      definition: "A peaceful state — mind, place, or person. A virtue.",
      related: "aaram, gussa",
      example: "Shaant raho, sab theek hai. — Stay calm, all is well." },
    { id: "fe5", type: "vocab", punjabi: "darr",
      english: "fear",
      definition: "Being scared. 'Darr lagda hai' = to feel afraid.",
      example: "Mainu darr lagda hai. — I feel scared." },
    { id: "fe6", type: "vocab", punjabi: "thakk",
      english: "tired",
      definition: "Exhausted. 'Thakk gaya' (m) / 'thakk gayi' (f) = (I) got tired.",
      related: "aaram (rest)",
      example: "Main thakk gaya haan. — I am tired." },
    { id: "fe7", type: "vocab", punjabi: "pyar",
      english: "love",
      definition: "Deep affection. 'Pyar karna' = to love.",
      related: "muhabbat, ishq",
      example: "Main tenu pyar karda haan. — I love you." },
    { id: "fe8", type: "vocab", punjabi: "yaad",
      english: "memory / missing someone",
      definition: "Remembering, OR missing someone. 'Tuhadi yaad aayi' = I missed you (lit. 'your memory came').",
      example: "Tuhadi bahut yaad aayi. — I missed you a lot." },
    { id: "fe9", type: "vocab", punjabi: "dukh",
      english: "sorrow / pain",
      definition: "Deep sadness or hardship — emotional or physical. The opposite of 'sukh'.",
      related: "sukh, udaas",
      example: "Tuhade dukh vich main shaamil haan. — I share in your sorrow." },
    { id: "fe10", type: "vocab", punjabi: "sukh",
      english: "well-being / comfort / peace",
      definition: "More than 'happy' — a state of ease and blessing. 'Sukh-shanti' = peace and well-being.",
      related: "dukh, shaant",
      example: "Rabb sukh deve. — May God grant peace." },
    { id: "fe11", type: "vocab", punjabi: "umeed",
      english: "hope",
      definition: "Wishing for something good. 'Umeed hai' = I hope.",
      example: "Umeed hai tusi changi sehat vich ho. — I hope you are in good health." },
    { id: "fe12", type: "vocab", punjabi: "sehat",
      english: "health",
      definition: "Physical well-being. Asking about sehat is kind.",
      example: "Tuhadi sehat kive hai? — How is your health?" },

    // ===== Hospitality & sharing (very Punjabi values) =====
    { id: "hp1", type: "phrase", punjabi: "Khaana khaa ke jaana",
      english: "Eat before you leave.",
      definition: "Refusing food at a Punjabi home is hard — the host genuinely wants to feed you. A core hospitality phrase.",
      example: "Bina khaana khaaye nahin jaana. — Don't go without eating." },
    { id: "hp2", type: "phrase", punjabi: "Hor lo ji",
      english: "Have some more (please).",
      definition: "Said while serving more food. Hosts often serve extra without asking — declining politely is an art.",
      example: "Hor roti lo ji, bas ikk hor. — Have one more roti, just one more." },
    { id: "hp3", type: "phrase", punjabi: "Bas ji, bahut ho gaya",
      english: "That's enough, thank you (when offered more food).",
      definition: "The polite 'I'm full'. Pat your stomach gently to seal the deal.",
      example: "Bas ji, pet bhar gaya. — That's enough, my stomach is full." },
    { id: "hp4", type: "phrase", punjabi: "Apna ghar samjho",
      english: "Consider this your own home.",
      definition: "The ultimate Punjabi welcome — said to guests so they feel completely at ease.",
      example: "Aao ji, apna ghar samjho. — Come, treat this as your own home." },
    { id: "hp5", type: "phrase", punjabi: "Mehmaan rabb da roop",
      english: "A guest is the form of God.",
      definition: "A traditional Punjabi/Sikh saying — guests are sacred. Explains why hospitality is so intense.",
      example: "Often quoted to children to teach respect for guests." },
    { id: "hp6", type: "phrase", punjabi: "Langar",
      english: "free community kitchen meal.",
      definition: "The Sikh tradition of free meals served to ALL at the gurdwara — rich, poor, any religion. Started by Guru Nanak. Embodies equality and seva (selfless service).",
      related: "gurudwara, seva",
      example: "Langar chhako ji. — Please partake of langar." },
    { id: "hp7", type: "phrase", punjabi: "Seva",
      english: "selfless service.",
      definition: "Voluntary work done for others without expectation — a central Sikh and Punjabi value. Cleaning, cooking langar, helping strangers.",
      related: "langar, satkaar",
      example: "Seva karna sabh ton vadda dharam hai. — Service is the highest duty." },
    { id: "hp8", type: "phrase", punjabi: "Sangat",
      english: "good company / community.",
      definition: "The community of good people. 'Sangat' shapes you — a core Punjabi belief.",
      example: "Changi sangat vich raho. — Stay in good company." },

    // ===== Daily essentials =====
    { id: "de1", type: "vocab", punjabi: "paisa",
      english: "money",
      definition: "Currency. 'Paise' (plural) is more common.",
      related: "rupaye, dukaan",
      example: "Mere kol paise nahin han. — I don't have money." },
    { id: "de2", type: "vocab", punjabi: "kamm",
      english: "work / job",
      definition: "Both 'work' (the activity) and 'job'. 'Kamm karna' = to work.",
      related: "naukri (job), mehnat (effort)",
      example: "Main kamm te jaa reha haan. — I'm going to work." },
    { id: "de3", type: "vocab", punjabi: "samaan",
      english: "stuff / belongings / goods",
      definition: "All-purpose word for things, luggage, or shop merchandise.",
      example: "Apna samaan le lo. — Take your stuff." },
    { id: "de4", type: "vocab", punjabi: "kapra",
      english: "cloth / clothing",
      definition: "'Kapre' (plural) = clothes.",
      related: "kameez, salwar",
      example: "Navey kapre paao. — Wear new clothes." },
    { id: "de5", type: "vocab", punjabi: "rasta",
      english: "road / way / path",
      definition: "Both literal road and figurative 'way'.",
      related: "saddak (road), jaana",
      example: "Eh rasta sidha hai. — This road is straight." },
    { id: "de6", type: "vocab", punjabi: "samaa",
      english: "time",
      definition: "Time in general. 'Vele' / 'vela' is used for specific times.",
      related: "vele, ghanta",
      example: "Samaa nahin hai. — There's no time." },
    { id: "de7", type: "vocab", punjabi: "vele",
      english: "time / occasion",
      definition: "Used for points in time: 'kis vele' (at what time).",
      related: "samaa",
      example: "Kis vele aaoge? — At what time will you come?" },
    { id: "de8", type: "vocab", punjabi: "phon",
      english: "phone",
      definition: "Borrowed from English. 'Phone karna' = to call. 'Phone chukna' = to pick up.",
      example: "Mainu phone karo. — Call me." },
    { id: "de9", type: "vocab", punjabi: "gall",
      english: "talk / matter / thing (said)",
      definition: "Extremely versatile: a conversation, a topic, or 'a thing' as in 'koi gall nahin' (no matter).",
      related: "bolna, gall karna",
      example: "Eh vakhri gall hai. — That's a different matter." },
    { id: "de10", type: "vocab", punjabi: "saval",
      english: "question",
      definition: "'Saval puchna' = to ask a question.",
      related: "javaab (answer)",
      example: "Mera ikk saval hai. — I have a question." },
    { id: "de11", type: "vocab", punjabi: "javaab",
      english: "answer / reply",
      definition: "'Javaab denna' = to give an answer.",
      related: "saval",
      example: "Mainu javaab dio. — Give me an answer." },
    { id: "de12", type: "vocab", punjabi: "sach",
      english: "truth",
      definition: "A core value — truthfulness is celebrated in Punjabi/Sikh tradition.",
      related: "jhooth (lie)",
      example: "Sach bolo. — Speak the truth." },
    { id: "de13", type: "vocab", punjabi: "jhooth",
      english: "lie / falsehood",
      definition: "The opposite of sach. 'Jhooth bolna' = to lie — strongly disapproved of.",
      related: "sach",
      example: "Jhooth na bolo. — Don't lie." },
    { id: "de14", type: "vocab", punjabi: "mehnat",
      english: "hard work / effort",
      definition: "A celebrated Punjabi value. 'Mehnati' = hardworking person — high praise.",
      related: "kamm",
      example: "Mehnat da phal mitha hunda hai. — The fruit of hard work is sweet." },
    { id: "de15", type: "vocab", punjabi: "himmat",
      english: "courage / spirit",
      definition: "Inner strength. 'Himmat rakh' = keep your courage. Often said to encourage someone.",
      example: "Himmat rakho, sab theek ho jaayega. — Keep courage, all will be well." },

    // ===== More polite phrases (the kind speaker's toolkit) =====
    { id: "p31", type: "phrase", punjabi: "Tuhanu takleef nahin?",
      english: "Is this not a trouble for you?",
      definition: "Asked when accepting help — a sign of consideration. 'Takleef' = inconvenience/trouble.",
      example: "Tuhanu takleef nahin? Main aap hi kar laanga. — Not too much trouble? I can do it myself." },
    { id: "p32", type: "phrase", punjabi: "Koi takleef nahin",
      english: "It's no trouble at all.",
      definition: "Reassuring reply when someone hesitates to ask for help.",
      example: "Maango ji, koi takleef nahin. — Please ask, it's no trouble." },
    { id: "p33", type: "phrase", punjabi: "Tuhada bahut bahut shukriya",
      english: "Many many thanks to you.",
      definition: "Doubling 'bahut' (very) makes thanks even warmer — very Punjabi.",
      example: "Madad layi tuhada bahut bahut shukriya. — Many many thanks for your help." },
    { id: "p34", type: "phrase", punjabi: "Mehrbaani karke ikk minute",
      english: "One minute, please.",
      definition: "Polite way to ask someone to wait briefly.",
      example: "Mehrbaani karke ikk minute, main hun aaya. — One minute please, I'm coming." },
    { id: "p35", type: "phrase", punjabi: "Pehlaan tusi",
      english: "You first.",
      definition: "Polite gesture — letting someone go first through a door, in line, or to speak.",
      example: "Nahin nahin, pehlaan tusi ji. — No no, you first please." },
    { id: "p36", type: "phrase", punjabi: "Jiven tuhadi marzi",
      english: "As you wish.",
      definition: "Respectful deference. 'Marzi' = wish/will.",
      example: "Jiven tuhadi marzi ji. — As you wish." },
    { id: "p37", type: "phrase", punjabi: "Mainu tuhade naal gall karni hai",
      english: "I'd like to talk with you.",
      definition: "Polite way to start an important conversation.",
      example: "Ikk minute, mainu tuhade naal gall karni hai. — One moment, I'd like to talk with you." },
    { id: "p38", type: "phrase", punjabi: "Sun rahe ho?",
      english: "Are you listening?",
      definition: "Gentle check-in during conversation — softer than English 'are you listening?'.",
      example: "Ji, sun rahe ho? — Yes, are you listening?" },
    { id: "p39", type: "phrase", punjabi: "Mainu samajh aa gayi",
      english: "I understood.",
      definition: "Confirms comprehension. Note: 'samajh' is feminine, so verb is 'aa GAYI'.",
      related: "Mainu samajh nahin aayi",
      example: "Acha, mainu samajh aa gayi. — Okay, I understood." },
    { id: "p40", type: "phrase", punjabi: "Ki main puch sakda haan?",
      english: "May I ask?",
      definition: "Polite permission to ask a question. (Female: 'sakdi haan'.)",
      example: "Ki main puch sakda haan tuhada naam? — May I ask your name?" },
    { id: "p41", type: "phrase", punjabi: "Tuhadi gall theek hai",
      english: "You're right / what you say is correct.",
      definition: "Validating someone politely — a kind way to agree.",
      example: "Haan ji, tuhadi gall theek hai. — Yes, what you say is right." },
    { id: "p42", type: "phrase", punjabi: "Mainu lagda hai",
      english: "I think / it seems to me.",
      definition: "Soft way to share an opinion — humbler than 'main sochda haan' (I think).",
      example: "Mainu lagda hai eh theek nahin. — It seems to me this isn't right." },
    { id: "p43", type: "phrase", punjabi: "Bura na manno",
      english: "Please don't take offense / no offense.",
      definition: "Said before disagreeing or giving honest feedback — softens the blow.",
      example: "Bura na manno, par mainu eh theek nahin lagda. — No offense, but this doesn't seem right to me." },
    { id: "p45", type: "phrase", punjabi: "Koi nahin",
      english: "It's nothing / no worries.",
      definition: "Common short reassurance — like English 'no worries'.",
      example: "Koi nahin ji, sab theek hai. — No worries, it's all fine." },
    { id: "p46", type: "phrase", punjabi: "Aaja ji",
      english: "Please come / come on.",
      definition: "Warm invitation. 'Ji' makes the command kind.",
      example: "Aaja ji, baith ja. — Please come, sit down." },
    { id: "p47", type: "phrase", punjabi: "Kuch kha lo",
      english: "Please eat something.",
      definition: "A near-reflexive Punjabi offer — guests must be fed.",
      example: "Kuch kha lo ji, khaali pet nahin jaana. — Eat something, don't go on an empty stomach." },
    { id: "p48", type: "phrase", punjabi: "Rabb mehr kare",
      english: "May God show grace.",
      definition: "A blessing — wishing divine kindness on someone in difficulty.",
      example: "Tuhade kamm vich Rabb mehr kare. — May God grace your work." },
    { id: "p49", type: "phrase", punjabi: "Waheguru",
      english: "'Wonderful Lord' (Sikh name for God).",
      definition: "The Sikh primary name for God. Used in greetings ('Waheguru ji ka khalsa, Waheguru ji ki fateh') and as a heartfelt exclamation.",
      example: "Waheguru! Eh kinna sohna hai! — God! How beautiful this is!" },
    { id: "p50", type: "phrase", punjabi: "Chardi kala",
      english: "rising spirit / unshakable optimism.",
      definition: "The Sikh concept of staying in high spirits no matter what life brings. A core Punjabi mindset.",
      example: "Chardi kala vich raho. — Stay in rising spirits." },

    // ===== Soft commands & requests (kind imperatives) =====
    { id: "sc1", type: "phrase", punjabi: "Dasso ji",
      english: "Please tell me.",
      definition: "From 'dassna' (to tell) + 'ji'. Kind way to ask for information.",
      example: "Dasso ji, ki gall hai? — Please tell me, what's the matter?" },
    { id: "sc2", type: "phrase", punjabi: "Sunno ji",
      english: "Please listen.",
      definition: "Polite 'listen'. Often used to start an important point.",
      example: "Sunno ji, mainu kuch kehna hai. — Please listen, I have something to say." },
    { id: "sc3", type: "phrase", punjabi: "Vekhho ji",
      english: "Please look / please see.",
      definition: "From 'vekhna' (to see). Kindly draw attention.",
      example: "Vekhho ji, eh kinna sohna hai. — Please look, how lovely this is." },
    { id: "sc4", type: "phrase", punjabi: "Karo ji",
      english: "Please do / go ahead.",
      definition: "Encouraging permission — 'go ahead'.",
      example: "Karo ji, koi gall nahin. — Go ahead, no problem." },
    { id: "sc5", type: "phrase", punjabi: "Lao ji",
      english: "Please bring / here you are.",
      definition: "When handing something over OR asking for it, depending on context.",
      example: "Paani lao ji. — Please bring water.  /  Lao ji, eh tuhada hai. — Here you are, this is yours." },
    { id: "sc6", type: "phrase", punjabi: "Andar aao ji",
      english: "Please come inside.",
      definition: "Warm invitation at the door.",
      example: "Bahar kyon khade ho? Andar aao ji. — Why are you standing outside? Please come in." },

    // ===== More grammar essentials for kind speech =====
    { id: "g21", type: "grammar", punjabi: "command levels",
      english: "polite vs casual commands",
      definition: "Punjabi commands have THREE levels: TU form (kar = do, harsh), TUSI form (karo = please do, polite), and infinitive (karna = should do, soft request). Always default to 'karo' with 'ji' added.",
      example: "Aa! (come, harsh) → Aao! (please come) → Aao ji (please come, kindly)." },
    { id: "g22", type: "grammar", punjabi: "ji as a particle",
      english: "the universal respect marker",
      definition: "'Ji' can go after almost anything: pronouns (tusi ji), names (Ravi ji), yes/no (haan ji / nahin ji), titles (papa ji, sardar ji), commands (aao ji). It instantly adds warmth and respect.",
      example: "Anything + ji = kinder version. When in doubt, add ji." },
    { id: "g23", type: "grammar", punjabi: "dative experiencer",
      english: "feelings come TO you",
      definition: "In Punjabi, feelings, hunger, cold, knowledge etc. are NOT things you 'have' — they 'come to you'. Use 'mainu' (to me): mainu bhukh laggi (hunger struck me), mainu pata hai (knowledge is to me = I know), mainu thand lagdi hai (cold strikes me).",
      example: "Mainu khushi hoyi. — I felt happy (lit. happiness happened TO me)." },
    { id: "g24", type: "grammar", punjabi: "verb agrees with subject gender",
      english: "verbs change form by gender",
      definition: "Past and many present forms change for masculine/feminine: gaya (m) vs gayi (f), aaya vs aayi, khaada vs khaadi. So 'I went' = main gaya (male) or main gayi (female).",
      example: "Main school gaya (boy). Main school gayi (girl)." },
    { id: "g25", type: "grammar", punjabi: "plural for respect",
      english: "use plural verbs for elders",
      definition: "When speaking ABOUT elders or respected people, use PLURAL verb forms even if singular: 'Papa ji aaye han' (lit. 'father has come', plural verb) — singular 'aaya' would be disrespectful.",
      example: "Dadi ji keh rahe han (plural, respectful) vs Munda keh reha hai (singular, neutral)." },
    { id: "g26", type: "grammar", punjabi: "sakda/sakdi (can / be able)",
      english: "expressing ability politely",
      definition: "Add 'sakda haan' (m) / 'sakdi haan' (f) after a verb stem to mean 'I can'. Useful for polite offers and requests.",
      example: "Main madad kar sakda haan. — I can help. / Ki main puch sakdi haan? — May I ask?" },
    { id: "g27", type: "grammar", punjabi: "chahida hai",
      english: "should / need",
      definition: "Expresses 'need' or 'should'. With 'mainu': 'mainu paani chahida hai' = I need water. Form changes by gender of the thing wanted: chahida (m), chahidi (f).",
      example: "Mainu madad chahidi hai. — I need help (madad is feminine)." },
    { id: "g28", type: "grammar", punjabi: "particle 'na'",
      english: "softening tag (right? / isn't it?)",
      definition: "Adding 'na' at the end softens statements or invites agreement, like English 'right?' or 'no?'.",
      example: "Tusi aaoge na? — You'll come, right?" },

    // ===== Numbers 11–19 (the tricky teens) =====
    { id: "n11", type: "vocab", punjabi: "gyaarah", english: "eleven",
      definition: "The number 11. Punjabi teens are unique words, not 'ten-one'.",
      related: "das (10), baarah (12)",
      example: "Gyaarah vaje. — Eleven o'clock." },
    { id: "n12", type: "vocab", punjabi: "baarah", english: "twelve",
      definition: "The number 12.",
      related: "gyaarah, terah",
      example: "Baarah mahine. — Twelve months." },
    { id: "n13", type: "vocab", punjabi: "terah", english: "thirteen",
      definition: "The number 13.",
      example: "Terah saal da. — Thirteen years old." },
    { id: "n14", type: "vocab", punjabi: "chaudah", english: "fourteen",
      definition: "The number 14.",
      example: "Chaudah din. — Fourteen days." },
    { id: "n15", type: "vocab", punjabi: "pandrah", english: "fifteen",
      definition: "The number 15.",
      example: "Pandrah minit. — Fifteen minutes." },
    { id: "n16", type: "vocab", punjabi: "solah", english: "sixteen",
      definition: "The number 16.",
      example: "Solah saal. — Sixteen years." },
    { id: "n17", type: "vocab", punjabi: "satarah", english: "seventeen",
      definition: "The number 17.",
      example: "Satarah rupaye. — Seventeen rupees." },
    { id: "n18", type: "vocab", punjabi: "atharah", english: "eighteen",
      definition: "The number 18 — age of adulthood in many places.",
      example: "Atharah saal da. — Eighteen years old." },
    { id: "n19", type: "vocab", punjabi: "unni", english: "nineteen",
      definition: "The number 19.",
      example: "Unni rupaye. — Nineteen rupees." },
    { id: "n30", type: "vocab", punjabi: "tee", english: "thirty",
      definition: "The number 30.",
      example: "Tee din. — Thirty days." },
    { id: "n40", type: "vocab", punjabi: "chaali", english: "forty",
      definition: "The number 40.",
      example: "Chaali saal. — Forty years." },
    { id: "n50", type: "vocab", punjabi: "panjah", english: "fifty",
      definition: "The number 50.",
      example: "Panjah rupaye. — Fifty rupees." },

    // ===== Ordinals (first, second, third...) =====
    { id: "no1", type: "vocab", punjabi: "pehla", english: "first",
      definition: "First (m). Feminine: 'pehli'.",
      related: "doja, teeja",
      example: "Pehla din. — The first day." },
    { id: "no2", type: "vocab", punjabi: "doja", english: "second",
      definition: "Second (m). Feminine: 'doji'.",
      example: "Doja maukha. — The second chance." },
    { id: "no3", type: "vocab", punjabi: "teeja", english: "third",
      definition: "Third (m). Feminine: 'teeji'.",
      example: "Teeja saal. — The third year." },
    { id: "no4", type: "vocab", punjabi: "akhri", english: "last",
      definition: "Final, last in a sequence.",
      related: "pehla",
      example: "Akhri vaari. — The last time." },

    // ===== Weather & nature =====
    { id: "w1", type: "vocab", punjabi: "mausam", english: "weather",
      definition: "The general state of the atmosphere.",
      related: "garmi, sardi, baarish",
      example: "Aaj mausam vadiya hai. — The weather is great today." },
    { id: "w2", type: "vocab", punjabi: "garmi", english: "heat / summer",
      definition: "Hot weather, or the summer season.",
      related: "garam, sardi",
      example: "Garmi bahut hai. — It's very hot." },
    { id: "w3", type: "vocab", punjabi: "sardi", english: "cold / winter",
      definition: "Cold weather, or the winter season; also 'a cold' (illness).",
      related: "thanda, garmi",
      example: "Sardi laggi hai. — I've caught a cold / I feel cold." },
    { id: "w4", type: "vocab", punjabi: "baarish", english: "rain",
      definition: "Water falling from the sky. 'Baarish ho rahi hai' = it's raining.",
      related: "paani, baddal",
      example: "Baarish pai rahi hai. — It is raining." },
    { id: "w5", type: "vocab", punjabi: "baddal", english: "cloud",
      definition: "A puff of water vapor in the sky.",
      related: "aasman, baarish",
      example: "Aasman vich baddal han. — There are clouds in the sky." },
    { id: "w6", type: "vocab", punjabi: "aasman", english: "sky",
      definition: "The space above the earth.",
      related: "baddal, suraj, chand",
      example: "Aasman neela hai. — The sky is blue." },
    { id: "w7", type: "vocab", punjabi: "suraj", english: "sun",
      definition: "The bright star that gives us day.",
      related: "din, chamakda",
      example: "Suraj chamakda hai. — The sun shines." },
    { id: "w8", type: "vocab", punjabi: "chand", english: "moon",
      definition: "The bright disk in the night sky. Also a term of endearment.",
      related: "raat, taare",
      example: "Chand sohna hai. — The moon is beautiful." },
    { id: "w9", type: "vocab", punjabi: "taare", english: "stars",
      definition: "The tiny lights in the night sky. Singular: 'taara'.",
      related: "chand, raat",
      example: "Taare chamakde han. — The stars twinkle." },
    { id: "w10", type: "vocab", punjabi: "hawa", english: "wind / air",
      definition: "Moving air.",
      related: "saans, mausam",
      example: "Hawa changi hai. — The breeze is nice." },
    { id: "w11", type: "vocab", punjabi: "barf", english: "snow / ice",
      definition: "Frozen water — both snow and ice.",
      related: "thanda, sardi",
      example: "Pahaadan te barf hai. — There is snow on the mountains." },
    { id: "w12", type: "vocab", punjabi: "phul", english: "flower",
      definition: "The colorful part of a plant. Plural: 'phul' (same).",
      related: "gulaab, patta",
      example: "Eh phul sohna hai. — This flower is beautiful." },
    { id: "w13", type: "vocab", punjabi: "rukh", english: "tree",
      definition: "A large plant with a trunk.",
      related: "patta, jangle",
      example: "Vadda rukh. — A big tree." },

    // ===== House & rooms =====
    { id: "ho1", type: "vocab", punjabi: "kamra", english: "room",
      definition: "A space inside a house.",
      related: "ghar, darvaza",
      example: "Mera kamra upar hai. — My room is upstairs." },
    { id: "ho2", type: "vocab", punjabi: "rasoi", english: "kitchen",
      definition: "Where food is cooked.",
      related: "khaana, chulha",
      example: "Maa rasoi vich hai. — Mother is in the kitchen." },
    { id: "ho3", type: "vocab", punjabi: "darvaza", english: "door",
      definition: "The opening to enter a room or house.",
      related: "khirki, kunji",
      example: "Darvaza band karo. — Close the door." },
    { id: "ho4", type: "vocab", punjabi: "khirki", english: "window",
      definition: "An opening in a wall, usually with glass.",
      related: "darvaza",
      example: "Khirki khol do. — Open the window." },
    { id: "ho5", type: "vocab", punjabi: "mez", english: "table",
      definition: "Furniture with a flat top and legs.",
      related: "kursi",
      example: "Mez te kitaab hai. — The book is on the table." },
    { id: "ho6", type: "vocab", punjabi: "kursi", english: "chair",
      definition: "Furniture for sitting.",
      related: "mez, baithna",
      example: "Kursi te baith jao. — Please sit on the chair." },
    { id: "ho7", type: "vocab", punjabi: "palang", english: "bed",
      definition: "Furniture for sleeping.",
      related: "sona, kamra",
      example: "Palang te so jao. — Go to sleep on the bed." },
    { id: "ho8", type: "vocab", punjabi: "ghadi", english: "clock / watch",
      definition: "A device that tells time.",
      related: "vele, samaa",
      example: "Ghadi vekho. — Look at the clock." },
    { id: "ho9", type: "vocab", punjabi: "batti", english: "light / lamp",
      definition: "A source of light. 'Batti' also = electricity in everyday speech.",
      related: "andhera, batti band",
      example: "Batti band karo. — Turn off the light." },
    { id: "ho10", type: "vocab", punjabi: "chaabi", english: "key",
      definition: "Used to lock or unlock a door.",
      related: "darvaza, taala",
      example: "Mainu chaabi do. — Give me the key." },

    // ===== Body & health =====
    { id: "b11", type: "vocab", punjabi: "dand", english: "tooth / teeth",
      definition: "What you chew with.",
      related: "mooh, brush",
      example: "Dand saaf karo. — Brush your teeth." },
    { id: "b12", type: "vocab", punjabi: "jeebh", english: "tongue",
      definition: "The muscle in your mouth that helps you taste and speak.",
      related: "mooh, sawaad",
      example: "Jeebh bahar kado. — Stick out your tongue." },
    { id: "b13", type: "vocab", punjabi: "gala", english: "throat",
      definition: "The front of your neck where you swallow and speak.",
      related: "awaaz, khaansi",
      example: "Mera gala kharab hai. — My throat hurts." },
    { id: "b14", type: "vocab", punjabi: "ungal", english: "finger",
      definition: "One of the five digits on your hand.",
      related: "hath, anguthha",
      example: "Ungal te lag gayi. — I hurt my finger." },
    { id: "h11", type: "vocab", punjabi: "dawai", english: "medicine",
      definition: "Something you take to feel better when sick.",
      related: "doctor, sehat",
      example: "Dawai khaa lo. — Take your medicine." },
    { id: "h12", type: "vocab", punjabi: "daktar", english: "doctor",
      definition: "A person who treats illnesses. Borrowed from English.",
      related: "dawai, hospital",
      example: "Doctor kol jaana hai. — We have to go to the doctor." },
    { id: "h13", type: "vocab", punjabi: "bimaar", english: "sick / ill",
      definition: "Not feeling well. 'Bimaari' = the illness itself.",
      related: "dawai, sehat",
      example: "Main bimaar haan. — I am sick." },
    { id: "h14", type: "vocab", punjabi: "dukhna", english: "to hurt / to ache",
      definition: "When part of you hurts. 'Mera sir dukhda hai' = my head hurts.",
      related: "dard, bimaar",
      example: "Mera pet dukhda hai. — My stomach hurts." },
    { id: "h15", type: "vocab", punjabi: "aaram", english: "rest / comfort",
      definition: "Resting; relaxation.",
      related: "sona, thakk",
      example: "Aaram karo. — Take some rest." },

    // ===== School & learning =====
    { id: "s1", type: "vocab", punjabi: "ustaad", english: "teacher",
      definition: "A person who teaches. Also 'master' of a craft.",
      related: "school, vidyaarthi",
      example: "Mere ustaad changey han. — My teachers are good." },
    { id: "s2", type: "vocab", punjabi: "vidyaarthi", english: "student",
      definition: "A person who learns.",
      related: "ustaad, padhna",
      example: "Main vidyaarthi haan. — I am a student." },
    { id: "s3", type: "vocab", punjabi: "sabaq", english: "lesson",
      definition: "A unit of learning.",
      related: "padhna, kitaab",
      example: "Aaj da sabaq sokha hai. — Today's lesson is easy." },
    { id: "s4", type: "vocab", punjabi: "imtihaan", english: "exam / test",
      definition: "A test of knowledge.",
      related: "padhna, mehnat",
      example: "Imtihaan kal hai. — The exam is tomorrow." },
    { id: "s5", type: "vocab", punjabi: "kalam", english: "pen",
      definition: "A writing tool.",
      related: "kaagaz, likhna",
      example: "Mainu kalam do. — Give me a pen." },
    { id: "s6", type: "vocab", punjabi: "kaagaz", english: "paper",
      definition: "What you write on.",
      related: "kalam, kitaab",
      example: "Kaagaz te likho. — Write on the paper." },

    // ===== Travel & directions =====
    { id: "tr1", type: "vocab", punjabi: "safar", english: "journey / travel",
      definition: "Going from one place to another.",
      related: "rasta, jaana",
      example: "Safar changa rahe. — May the journey go well." },
    { id: "tr2", type: "vocab", punjabi: "saddak", english: "road / street",
      definition: "A road for vehicles.",
      related: "rasta, gaddi",
      example: "Eh saddak vaddi hai. — This road is wide." },
    { id: "tr3", type: "vocab", punjabi: "stationer", english: "station",
      definition: "Bus or train station. Borrowed from English.",
      related: "bus, rail",
      example: "Stationer te milange. — We'll meet at the station." },
    { id: "tr4", type: "vocab", punjabi: "sajje", english: "right (direction)",
      definition: "The right side. Used for directions.",
      related: "khabbe, sidha",
      example: "Sajje muddo. — Turn right." },
    { id: "tr5", type: "vocab", punjabi: "khabbe", english: "left (direction)",
      definition: "The left side.",
      related: "sajje, sidha",
      example: "Khabbe muddo. — Turn left." },
    { id: "tr6", type: "vocab", punjabi: "sidha", english: "straight",
      definition: "Going straight ahead; also 'simple/honest'.",
      related: "rasta",
      example: "Sidha jaao. — Go straight." },
    { id: "tr7", type: "vocab", punjabi: "nere", english: "near",
      definition: "Close by.",
      related: "door",
      example: "Bazaar nere hai. — The market is near." },
    { id: "tr8", type: "vocab", punjabi: "door", english: "far",
      definition: "Distant; not close.",
      related: "nere",
      example: "Mera ghar door hai. — My house is far." },
    { id: "tr9", type: "phrase", punjabi: "Rasta dasso ji",
      english: "Please tell me the way.",
      definition: "Polite way to ask for directions.",
      example: "Maaf karna, rasta dasso ji. — Excuse me, please tell the way." },
    { id: "tr10", type: "phrase", punjabi: "Eh kithe hai?",
      english: "Where is this?",
      definition: "Useful for asking about a place.",
      example: "Eh dukaan kithe hai? — Where is this shop?" },

    // ===== Common professions =====
    { id: "pc7", type: "vocab", punjabi: "kisaan", english: "farmer",
      definition: "Someone who farms — central to Punjabi identity.",
      related: "khet, mehnat",
      example: "Mera pyo kisaan hai. — My father is a farmer." },
    { id: "pc8", type: "vocab", punjabi: "dukandaar", english: "shopkeeper",
      definition: "Person who runs a shop.",
      related: "dukaan, paisa",
      example: "Dukandaar bahut changa hai. — The shopkeeper is very nice." },
    { id: "pr9", type: "vocab", punjabi: "draivar", english: "driver",
      definition: "Person who drives a vehicle. Borrowed from English.",
      related: "gaddi, bus",
      example: "Driver sahib, ruk jao. — Driver sir, please stop." },
    { id: "pr10", type: "vocab", punjabi: "engineer", english: "engineer",
      definition: "Person who designs and builds things. Borrowed from English.",
      example: "Mera bhra engineer hai. — My brother is an engineer." },

    // ===== More verbs =====
    { id: "vb14", type: "vocab", punjabi: "khaana (verb)", english: "to eat",
      definition: "Same word as 'food'. 'Khaada' (m) / 'khaadi' (f) = ate.",
      related: "peena, roti",
      example: "Roti khaani hai? — Do you want to eat roti?" },
    { id: "vb15", type: "vocab", punjabi: "peena", english: "to drink",
      definition: "To consume liquid. 'Peeta' (m) / 'peeti' (f) = drank.",
      related: "paani, chah",
      example: "Paani peeo. — Drink water." },
    { id: "vb16", type: "vocab", punjabi: "khelna", english: "to play",
      definition: "To engage in games or sports.",
      related: "khel, dost",
      example: "Asin khel rahe haan. — We are playing." },
    { id: "vb17", type: "vocab", punjabi: "hassna", english: "to laugh",
      definition: "To express joy with sound.",
      related: "khush, khushi",
      example: "Bachche hass rahe han. — The children are laughing." },
    { id: "vb18", type: "vocab", punjabi: "rona", english: "to cry",
      definition: "To weep.",
      related: "udaas, dard",
      example: "Na ro, sab theek hai. — Don't cry, all is well." },
    { id: "vb19", type: "vocab", punjabi: "tur", english: "to walk",
      definition: "Move on foot. 'Turna' = the infinitive.",
      related: "pair, dauran",
      example: "Asin tur ke jaavange. — We will walk." },
    { id: "vb20", type: "vocab", punjabi: "dauran", english: "to run",
      definition: "Move quickly on foot.",
      related: "tur, jaldi",
      example: "Dauran shuru karo. — Start running." },
    { id: "vb21", type: "vocab", punjabi: "baithna", english: "to sit",
      definition: "Take a seat.",
      related: "khalona, kursi",
      example: "Idhar baith jao. — Sit here." },
    { id: "vb22", type: "vocab", punjabi: "khalona", english: "to stand",
      definition: "Be on your feet.",
      related: "baithna, ruk",
      example: "Khalo jao. — Stand up." },
    { id: "vb23", type: "vocab", punjabi: "uthna", english: "to get up / wake up",
      definition: "Rise from sleep or seat.",
      related: "sona, savere",
      example: "Savere jaldi uthna. — Wake up early in the morning." },
    { id: "vb24", type: "vocab", punjabi: "milna", english: "to meet / to find",
      definition: "Encounter someone, or find something.",
      related: "dost, jaldi",
      example: "Kal milange. — We'll meet tomorrow." },
    { id: "vb25", type: "vocab", punjabi: "kholna", english: "to open",
      definition: "Open a door, book, or container.",
      related: "band, darvaza",
      example: "Darvaza kholo. — Open the door." },
    { id: "vb26", type: "vocab", punjabi: "band karna", english: "to close / shut",
      definition: "Shut something. 'Band' = closed.",
      related: "kholna",
      example: "Khirki band karo. — Close the window." },
    { id: "vb27", type: "vocab", punjabi: "puchna", english: "to ask",
      definition: "Pose a question.",
      related: "saval, javaab",
      example: "Mainu puchho. — Ask me." },
    { id: "vb28", type: "vocab", punjabi: "dassna", english: "to tell",
      definition: "Share information; tell someone something.",
      related: "bolna, gall",
      example: "Mainu dasso. — Tell me." },
    { id: "vb29", type: "vocab", punjabi: "sochna", english: "to think",
      definition: "Use your mind.",
      related: "samajhna",
      example: "Sochke dasso. — Think and tell me." },
    { id: "vb30", type: "vocab", punjabi: "yaad karna", english: "to remember / to memorize",
      definition: "Hold something in memory; or actively memorize.",
      related: "yaad, bhulna",
      example: "Eh yaad rakho. — Remember this." },
    { id: "vb31", type: "vocab", punjabi: "bhulna", english: "to forget",
      definition: "Lose from memory.",
      related: "yaad",
      example: "Main bhul gaya. — I forgot." },

    // ===== Opposites (great for vocabulary expansion) =====
    { id: "op1", type: "vocab", punjabi: "lamba", english: "long / tall",
      definition: "Long in length, or tall in height. Feminine: 'lambi'.",
      related: "chhota, ucha",
      example: "Lamba safar. — A long journey." },
    { id: "op2", type: "vocab", punjabi: "ucha", english: "high / tall (loud)",
      definition: "High up, or loud (for sound).",
      related: "neeva, lamba",
      example: "Ucha bolo. — Speak loudly." },
    { id: "op3", type: "vocab", punjabi: "neeva", english: "low / short / soft",
      definition: "Low in height, or quiet (for sound).",
      related: "ucha",
      example: "Haule, neevi awaaz vich. — Slowly, in a soft voice." },
    { id: "op4", type: "vocab", punjabi: "tez", english: "fast / sharp / loud",
      definition: "Fast in speed; sharp in mind; or loud in sound.",
      related: "haule, jaldi",
      example: "Tez gaddi. — A fast car." },
    { id: "op5", type: "vocab", punjabi: "haule", english: "slowly / softly",
      definition: "At a slow or gentle pace.",
      related: "tez, aaram",
      example: "Haule chalo. — Walk slowly." },
    { id: "op6", type: "vocab", punjabi: "khaali", english: "empty",
      definition: "Nothing inside.",
      related: "bhareya",
      example: "Glass khaali hai. — The glass is empty." },
    { id: "op7", type: "vocab", punjabi: "bhareya", english: "full",
      definition: "Filled completely. Feminine: 'bhari'.",
      related: "khaali",
      example: "Pet bhareya hoya hai. — My stomach is full." },
    { id: "op8", type: "vocab", punjabi: "saaf", english: "clean",
      definition: "Free of dirt; also 'clear' as in clear speech.",
      related: "ganda",
      example: "Hath saaf karo. — Clean your hands." },
    { id: "op9", type: "vocab", punjabi: "ganda", english: "dirty",
      definition: "Not clean.",
      related: "saaf",
      example: "Kapre gande han. — The clothes are dirty." },
    { id: "op10", type: "vocab", punjabi: "sasta", english: "cheap (inexpensive)",
      definition: "Low in price.",
      related: "mehnga",
      example: "Eh sasta hai. — This is cheap." },
    { id: "op11", type: "vocab", punjabi: "mehnga", english: "expensive",
      definition: "High in price.",
      related: "sasta",
      example: "Bahut mehnga hai. — It's very expensive." },

    // ===== Sentence-building patterns (mini-grammar in action) =====
    { id: "sb1", type: "phrase", punjabi: "Eh ___ hai",
      english: "This is ___.",
      definition: "Most basic sentence pattern. Fill the blank with any noun. 'Eh kitaab hai' = This is a book.",
      example: "Eh mera dost hai. — This is my friend." },
    { id: "sb2", type: "phrase", punjabi: "Oh ___ hai",
      english: "That is ___ / He is ___ / She is ___.",
      definition: "'Oh' covers he, she, that. Verb 'hai' is singular.",
      example: "Oh mera bhra hai. — He is my brother." },
    { id: "sb3", type: "phrase", punjabi: "Mainu ___ chahida hai",
      english: "I need / want ___.",
      definition: "Replace blank with what you want. Use 'chahidi' if the noun is feminine.",
      example: "Mainu chah chahidi hai. — I want tea (chah is feminine)." },
    { id: "sb4", type: "phrase", punjabi: "Mainu ___ pasand hai",
      english: "I like ___.",
      definition: "Tell people what you like. Use 'han' instead of 'hai' for plural items.",
      example: "Mainu Punjabi gaane pasand han. — I like Punjabi songs." },
    { id: "sb5", type: "phrase", punjabi: "Main ___ jaa reha haan",
      english: "I am going to ___.",
      definition: "Continuous tense. Female speaker says 'jaa rahi haan'.",
      example: "Main school jaa reha haan. — I am going to school." },
    { id: "sb6", type: "phrase", punjabi: "Tuhanu ___ aaunda hai?",
      english: "Do you know how to ___?",
      definition: "For skills. Replace blank with a verb infinitive.",
      example: "Tuhanu Punjabi aaundi hai? — Do you know Punjabi?" },
    { id: "sb7", type: "phrase", punjabi: "Mainu ___ aaunda hai",
      english: "I know how to ___.",
      definition: "Reply pattern. Use 'aaundi' if the skill is feminine (like 'Punjabi').",
      example: "Mainu Punjabi thodi-thodi aaundi hai. — I know a little Punjabi." },
    { id: "sb8", type: "phrase", punjabi: "Ki tusi ___ saktay ho?",
      english: "Can you ___?",
      definition: "Polite request. Replace blank with verb stem. Female version: 'sakdi ho'.",
      example: "Ki tusi haule bol sakday ho? — Can you speak slowly?" },

    // ===== Useful little words (the glue of speech) =====
    { id: "lw2", type: "vocab", punjabi: "par", english: "but",
      definition: "Used to contrast two ideas.",
      related: "lekin",
      example: "Mainu pasand hai par mehnga hai. — I like it but it's expensive." },
    { id: "lw3", type: "vocab", punjabi: "vi", english: "also / too",
      definition: "Adds 'also'. Place AFTER the noun: 'main vi' = me too.",
      example: "Main vi aavaanga. — I will come too." },
    { id: "lw4", type: "vocab", punjabi: "sirf", english: "only",
      definition: "Just / only.",
      related: "bas",
      example: "Sirf ikk minute. — Only one minute." },
    { id: "lw5", type: "vocab", punjabi: "bahut", english: "very / much",
      definition: "Intensifier. 'Bahut changa' = very good.",
      related: "thoda",
      example: "Bahut shukriya. — Many thanks." },
    { id: "lw6", type: "vocab", punjabi: "thoda", english: "a little / a bit",
      definition: "Small amount. Feminine: 'thodi'.",
      related: "bahut",
      example: "Thoda paani. — A little water." },
    { id: "lw7", type: "vocab", punjabi: "sab", english: "all / everyone",
      definition: "Refers to everyone or everything.",
      related: "kuch",
      example: "Sab theek hai. — Everything is fine." },
    { id: "lw8", type: "vocab", punjabi: "kuch", english: "something / some",
      definition: "Indefinite quantity.",
      related: "sab, kujh",
      example: "Kuch khaa lo. — Eat something." },
    { id: "lw9", type: "vocab", punjabi: "phir", english: "then / again",
      definition: "Sequencing word. 'Phir milange' = we'll meet again.",
      example: "Pehlan eh, phir oh. — First this, then that." },
    { id: "lw10", type: "vocab", punjabi: "abhi", english: "right now / just now",
      definition: "Used for immediacy.",
      related: "hun",
      example: "Abhi aaya. — Just arrived." },

    // ===== Beginner conversation starters =====
    { id: "lv1", type: "phrase", punjabi: "Tuhada kamm ki hai?",
      english: "What is your work / job?",
      definition: "Polite way to ask someone's profession.",
      example: "Tuhada kamm ki hai? Main teacher haan. — What's your work? I'm a teacher." },
    { id: "lv2", type: "phrase", punjabi: "Tusi kithe rehnde ho?",
      english: "Where do you live?",
      definition: "Polite question about residence.",
      example: "Main shehar vich rehnda haan. — I live in the city." },
    { id: "lv3", type: "phrase", punjabi: "Tuhadi umar kinni hai?",
      english: "How old are you?",
      definition: "Be careful — only ask kids or close friends. Considered direct for adults.",
      example: "Mainu vee saal de haan. — I am twenty years old." },
    { id: "lv4", type: "phrase", punjabi: "Tuhade kinne bhain-bhra han?",
      english: "How many siblings do you have?",
      definition: "Common Punjabi small-talk question — family is central.",
      example: "Mere do bhra te ikk bhain hai. — I have two brothers and one sister." },
    { id: "lv5", type: "phrase", punjabi: "Tuhanu ki pasand hai?",
      english: "What do you like?",
      definition: "Open-ended friendly question.",
      example: "Mainu kitaaban padhna pasand hai. — I like reading books." },
    { id: "lv6", type: "phrase", punjabi: "Mainu Punjabi sikhna hai",
      english: "I want to learn Punjabi.",
      definition: "Show your intent. Punjabis love when foreigners try to learn the language.",
      example: "Mainu Punjabi sikhna hai, madad karo ji. — I want to learn Punjabi, please help." },
    { id: "lv7", type: "phrase", punjabi: "Mainu thodi-thodi Punjabi aaundi hai",
      english: "I know a little Punjabi.",
      definition: "Humble and honest — earns kindness from native speakers.",
      example: "Maaf karna, mainu thodi-thodi Punjabi aaundi hai. — Sorry, I know just a little Punjabi." },
    { id: "lv8", type: "phrase", punjabi: "Phir kaho ji",
      english: "Please say it again.",
      definition: "Polite request for repetition. Pair with 'haule' (slowly).",
      example: "Maaf karna, phir kaho ji, haule. — Sorry, please say it again, slowly." },
    { id: "lv9", type: "phrase", punjabi: "Eh Punjabi vich ki kehnde han?",
      english: "What do you call this in Punjabi?",
      definition: "Great learner question — point at the object and ask.",
      example: "Eh Punjabi vich ki kehnde han? — What do you call this in Punjabi?" },
    { id: "lv10", type: "phrase", punjabi: "Mainu sikha do",
      english: "Please teach me.",
      definition: "Ask someone to teach you — Punjabis are usually delighted.",
      example: "Mainu eh shabad sikha do. — Teach me this word." },

    // ===== Cultural beginner gems =====
    { id: "cu1", type: "phrase", punjabi: "Bhangra",
      english: "Bhangra (Punjabi folk dance).",
      definition: "Energetic Punjabi folk dance, originally celebrating the harvest. Now world-famous.",
      related: "gidda, dhol",
      example: "Bhangra paao! — Dance bhangra!" },
    { id: "cu2", type: "phrase", punjabi: "Gidda",
      english: "Gidda (women's folk dance).",
      definition: "Lively folk dance traditionally performed by Punjabi women, with rhythmic clapping and 'bolian' (couplets).",
      related: "bhangra",
      example: "Kuriaan gidda paaundiyaan. — The girls dance gidda." },
    { id: "cu3", type: "phrase", punjabi: "Dhol",
      english: "Dhol (drum).",
      definition: "Large two-sided Punjabi drum — the heartbeat of bhangra and weddings.",
      related: "bhangra, gaana",
      example: "Dhol vajda hai! — The dhol is playing!" },
    { id: "cu4", type: "phrase", punjabi: "Vaisakhi",
      english: "Vaisakhi (harvest / Sikh new year festival).",
      definition: "April 13/14 celebration — harvest festival AND the founding of the Khalsa (1699). Major Punjabi/Sikh holiday.",
      related: "khalsa, mela",
      example: "Vaisakhi diyan vadhaiyaan! — Vaisakhi greetings!" },
    { id: "cu5", type: "phrase", punjabi: "Lohri",
      english: "Lohri (winter bonfire festival).",
      definition: "Mid-January Punjabi festival — bonfires, peanuts, gachak, dancing. Marks the end of winter.",
      example: "Lohri mubarak ho! — Happy Lohri!" },
    { id: "cu6", type: "phrase", punjabi: "Khalsa",
      english: "Khalsa (the Sikh community/order).",
      definition: "The community of initiated Sikhs, founded by Guru Gobind Singh in 1699. 'Khalsa' = pure.",
      related: "Sikh, Waheguru",
      example: "Waheguru ji ka Khalsa, Waheguru ji ki Fateh." },
    { id: "cu7", type: "phrase", punjabi: "Punj Pyare",
      english: "The Five Beloved Ones.",
      definition: "The first five Sikhs initiated into the Khalsa by Guru Gobind Singh — symbol of devotion.",
      example: "Punj Pyare di kahaani sun. — Listen to the story of the Five Beloved." },
    { id: "cu8", type: "phrase", punjabi: "Pind di hawa",
      english: "Air of the village (homeland feeling).",
      definition: "A poetic phrase Punjabis use to describe the special feeling of returning to their ancestral village.",
      example: "Pind di hawa naal jind aa jandi hai. — Village air brings the soul back." },

    // ===== Shopping / market dialogue helpers =====
    { id: "sh1", type: "phrase", punjabi: "Eh kinne da hai?",
      english: "How much does this cost?",
      definition: "Standard market question. 'Da' agrees with item gender.",
      related: "Kinne paise?",
      example: "Eh kameez kinni di hai? — How much is this shirt?" },
    { id: "sh2", type: "phrase", punjabi: "Thoda ghatt karo",
      english: "Please reduce the price a bit.",
      definition: "Bargaining is normal in Punjabi bazaars. Always polite — never aggressive.",
      example: "Bhai sahib, thoda ghatt karo ji. — Brother, please reduce a bit." },
    { id: "sh3", type: "phrase", punjabi: "Mainu eh chahida hai",
      english: "I want this one.",
      definition: "Make your selection. Use 'chahidi' if the item is feminine.",
      example: "Mainu eh laal vali chahidi hai. — I want this red one." },
    { id: "sh4", type: "phrase", punjabi: "Bas, hor nahin chahida",
      english: "That's all, nothing more is needed.",
      definition: "Wrap up the purchase politely.",
      example: "Bas ji, hor nahin chahida, shukriya. — That's all, nothing more, thanks." },
    { id: "sh5", type: "phrase", punjabi: "Paisa kithe daiye?",
      english: "Where do I pay?",
      definition: "Useful at a busy shop with multiple counters.",
      example: "Maaf karna, paisa kithe daiye? — Excuse me, where do I pay?" },

    // ===== Common encouragements (build confidence in others) =====
    { id: "en1", type: "phrase", punjabi: "Shabaash!",
      english: "Well done! / Bravo!",
      definition: "The classic Punjabi praise. Say it loud and proud — kids especially love hearing it.",
      example: "Shabaash puttar! — Well done, child!" },
    { id: "en2", type: "phrase", punjabi: "Vadiya kamm!",
      english: "Great work!",
      definition: "Encourage anyone after a job well done.",
      example: "Vadiya kamm kita ji! — Great work done!" },
    { id: "en3", type: "phrase", punjabi: "Lage raho",
      english: "Keep at it / keep going.",
      definition: "Cheer someone on through hard work.",
      example: "Lage raho, manzil door nahin. — Keep going, the goal isn't far." },
    { id: "en4", type: "phrase", punjabi: "Tu kar sakda hai",
      english: "You can do it.",
      definition: "Belief-building phrase. (Female: 'kar sakdi'.)",
      example: "Himmat rakh, tu kar sakda hai. — Have courage, you can do it." },
    { id: "en5", type: "phrase", punjabi: "Koshish karo",
      english: "Please try.",
      definition: "Encourage attempt rather than perfection — very Punjabi mindset.",
      example: "Koshish karo, galti ho jaaye taan koi nahin. — Try; if a mistake happens, no problem." },

    // ===== Pronunciation & learner tips (taught as cards) =====
    { id: "pn1", type: "grammar", punjabi: "aspirated vs plain",
      english: "h-sounds matter (kh, gh, ch, jh, th, dh, ph, bh)",
      definition: "Punjabi distinguishes 'k' vs 'kh', 'p' vs 'ph', etc. The 'h' is a puff of breath. 'Pal' = moment, 'phal' = fruit. Practice by holding a hand near your mouth — the 'h' versions push air.",
      example: "kal (yesterday/tomorrow) vs khal (skin) — listen for the puff!" },
    { id: "pn2", type: "grammar", punjabi: "retroflex sounds",
      english: "the 'curled-tongue' t and d (ṭ, ḍ)",
      definition: "Punjabi has T/D sounds made with the tongue curled BACK against the roof of the mouth — different from English T/D. In romanization sometimes shown as ṭ/ḍ. They sound 'harder' and more crisp.",
      example: "roti has the retroflex T — tongue curled, crisp." },
    { id: "pn3", type: "grammar", punjabi: "nasal vowels",
      english: "vowels with a hum (aan, een, oon)",
      definition: "Punjabi often nasalizes vowels — air flows through the nose. 'Haan' (yes) ends with a nasal hum. In writing it's marked with a tippi/bindi.",
      example: "haan (yes), naheen (no) — feel the hum at the end." },
    { id: "pn4", type: "grammar", punjabi: "tones in Punjabi",
      english: "high, low, level — pitch changes meaning",
      definition: "Unlike Hindi or English, Punjabi is TONAL. The pitch of a word changes its meaning. 'kòṛa' (low tone, whip) vs 'koṛa' (level, blank). For now, just imitate native speakers carefully.",
      example: "Listening practice is the best way to feel tones." },
    { id: "pn5", type: "grammar", punjabi: "emphasis with doubling",
      english: "double a word for emphasis",
      definition: "Repeating a word intensifies it: 'jaldi-jaldi' (very fast), 'thoda-thoda' (just a little), 'changa-changa' (good good = okay okay). Very Punjabi flavor.",
      example: "Haule-haule bolo. — Speak slowly slowly (= very slowly)." },

    // ===== Beginner mini-dialogues (whole exchanges) =====
    { id: "md1", type: "phrase", punjabi: "A: Sat sri akaal ji. B: Sat sri akaal, ki haal hai?",
      english: "A: Hello respected one. B: Hello, how are things?",
      definition: "Standard polite greeting exchange. The full version uses 'ji' both times.",
      example: "Use this opening for any meeting with a Punjabi adult." },
    { id: "md2", type: "phrase", punjabi: "A: Tuhada naam ki hai? B: Mera naam ___ hai. Tuhada?",
      english: "A: What's your name? B: My name is ___. And yours?",
      definition: "Reciprocate the question with 'Tuhada?' — turning the conversation back is polite.",
      example: "Practicing this is the perfect first conversation." },
    { id: "md3", type: "phrase", punjabi: "A: Chah peeoge? B: Bas thodi ji, shukriya.",
      english: "A: Will you have tea? B: Just a little please, thanks.",
      definition: "Tea will always be offered. Accept — at least 'thodi' (a little).",
      example: "Refusing tea outright can hurt feelings; sip slowly." },
    { id: "md4", type: "phrase", punjabi: "A: Eh kinne da hai? B: Sau rupaye. A: Thoda ghatt karo. B: Acha, assi.",
      english: "A: How much? B: One hundred. A: Reduce a bit. B: Okay, eighty.",
      definition: "Friendly bazaar haggle. Always smile, never argue.",
      example: "Final price often lands 15-25% below asking — that's the fun." },
    { id: "md5", type: "phrase", punjabi: "A: Mainu samajh nahin aayi. B: Koi gall nahin, phir kehnda haan haule.",
      english: "A: I didn't understand. B: No problem, I'll say it again slowly.",
      definition: "The kindest exchange a Punjabi learner can have. Both sides showing patience.",
      example: "Most Punjabis love helping learners — never be shy to ask." },

    // ===== Numbers 21–29 + 60/70/80/90 (finishes 1–100) =====
    { id: "n21", type: "vocab", punjabi: "ikkee",   english: "twenty-one",
      definition: "The number 21. Punjabi tens-and-ones are usually a single fused word.",
      related: "vee (20), bee (22)",
      example: "Ikkee saal da. — Twenty-one years old." },
    { id: "n22", type: "vocab", punjabi: "bee",     english: "twenty-two",
      definition: "The number 22.",
      related: "ikkee, teyee",
      example: "Bee tareek. — The 22nd date." },
    { id: "n23", type: "vocab", punjabi: "teyee",   english: "twenty-three",
      definition: "The number 23.",
      example: "Teyee minit. — Twenty-three minutes." },
    { id: "n24", type: "vocab", punjabi: "chaubi",  english: "twenty-four",
      definition: "The number 24.",
      example: "Chaubi ghante. — Twenty-four hours." },
    { id: "n25", type: "vocab", punjabi: "panjee",  english: "twenty-five",
      definition: "The number 25 (a quarter of 100).",
      example: "Panjee rupaye. — Twenty-five rupees." },
    { id: "n26", type: "vocab", punjabi: "chhabi",  english: "twenty-six",
      definition: "The number 26.",
      example: "Chhabi tareek. — The 26th." },
    { id: "n27", type: "vocab", punjabi: "sataai",  english: "twenty-seven",
      definition: "The number 27.",
      example: "Sataai din. — Twenty-seven days." },
    { id: "n28", type: "vocab", punjabi: "athaai",  english: "twenty-eight",
      definition: "The number 28.",
      example: "Athaai vidyaarthi. — Twenty-eight students." },
    { id: "n29", type: "vocab", punjabi: "untee",   english: "twenty-nine",
      definition: "The number 29.",
      example: "Untee saal. — Twenty-nine years." },
    { id: "n60", type: "vocab", punjabi: "satth",   english: "sixty",
      definition: "The number 60.",
      example: "Satth minit ikk ghanta. — Sixty minutes is one hour." },
    { id: "n70", type: "vocab", punjabi: "sattar",  english: "seventy",
      definition: "The number 70.",
      example: "Sattar saal. — Seventy years." },
    { id: "n80", type: "vocab", punjabi: "assi",    english: "eighty",
      definition: "The number 80.",
      example: "Assi rupaye. — Eighty rupees." },
    { id: "n90", type: "vocab", punjabi: "nabbe",   english: "ninety",
      definition: "The number 90.",
      example: "Nabbe percent. — Ninety percent." },

    // ===== Punjabi months (Nanakshahi / desi calendar) =====
    { id: "mo1",  type: "vocab", punjabi: "Chet",    english: "Chet (March–April)",
      definition: "First month of the Punjabi calendar; spring begins.",
      related: "Vaisakh, bahaar",
      example: "Chet vich phul khilde han. — Flowers bloom in Chet." },
    { id: "mo2",  type: "vocab", punjabi: "Vaisakh", english: "Vaisakh (April–May)",
      definition: "Second month; harvest season; Vaisakhi falls in this month.",
      related: "Vaisakhi",
      example: "Vaisakh vich kanak kattenge. — Wheat is harvested in Vaisakh." },
    { id: "mo3",  type: "vocab", punjabi: "Jeth",    english: "Jeth (May–June)",
      definition: "Third month; very hot.",
      example: "Jeth di garmi. — The heat of Jeth." },
    { id: "mo4",  type: "vocab", punjabi: "Harh",    english: "Harh (June–July)",
      definition: "Fourth month; pre-monsoon heat.",
      example: "Harh maheene baarish da intzar. — Waiting for rain in Harh." },
    { id: "mo5",  type: "vocab", punjabi: "Saavan",  english: "Saavan (July–August)",
      definition: "Fifth month; the famous monsoon month celebrated in songs and poetry.",
      related: "barsaat",
      example: "Saavan di baarish. — Saavan rain." },
    { id: "mo6",  type: "vocab", punjabi: "Bhadon",  english: "Bhadon (August–September)",
      definition: "Sixth month; humid late monsoon.",
      example: "Bhadon vich umas hundi hai. — Humidity in Bhadon." },
    { id: "mo7",  type: "vocab", punjabi: "Assu",    english: "Assu (September–October)",
      definition: "Seventh month; weather begins to cool.",
      example: "Assu maheene mausam vadiya. — Weather is great in Assu." },
    { id: "mo8",  type: "vocab", punjabi: "Katak",   english: "Katak (October–November)",
      definition: "Eighth month; Diwali / Bandi Chhor Divas often falls here.",
      related: "Diwali",
      example: "Katak di pooranmashi. — The full moon of Katak." },
    { id: "mo9",  type: "vocab", punjabi: "Maghar",  english: "Maghar (November–December)",
      definition: "Ninth month; cold settles in.",
      example: "Maghar maheene sardi shuru. — Cold begins in Maghar." },
    { id: "mo10", type: "vocab", punjabi: "Poh",     english: "Poh (December–January)",
      definition: "Tenth month; deep winter.",
      example: "Poh di raat lammi te thandi. — Poh nights are long and cold." },
    { id: "mo11", type: "vocab", punjabi: "Magh",    english: "Magh (January–February)",
      definition: "Eleventh month; Lohri ends Poh, Magh begins with Maghi.",
      related: "Lohri, Maghi",
      example: "Magh di sangraand. — The first day of Magh." },
    { id: "mo12", type: "vocab", punjabi: "Phagun",  english: "Phagun (February–March)",
      definition: "Twelfth month; Holi falls here; spring colors return.",
      related: "Holi, bahaar",
      example: "Phagun vich rang udde. — Colors fly in Phagun." },

    // ===== Seasons =====
    { id: "se1", type: "vocab", punjabi: "rut",     english: "season",
      definition: "A season of the year. Punjab traditionally counts six rutaan.",
      related: "mausam",
      example: "Rut badal gayi. — The season has changed." },
    { id: "se2", type: "vocab", punjabi: "bahaar",  english: "spring",
      definition: "Season of flowers and new growth. Beloved in Punjabi poetry.",
      related: "Phagun, Chet, phul",
      example: "Bahaar aa gayi. — Spring has arrived." },
    { id: "se3", type: "vocab", punjabi: "barsaat", english: "monsoon / rainy season",
      definition: "The wet season — Saavan / Bhadon. Major celebration in Punjab.",
      related: "Saavan, baarish",
      example: "Barsaat da mausam vadiya. — The monsoon weather is lovely." },
    { id: "se4", type: "vocab", punjabi: "patjhad", english: "autumn / fall",
      definition: "Season when leaves fall.",
      related: "patta",
      example: "Patjhad vich patte digde han. — Leaves fall in autumn." },

    // ===== Telling time =====
    { id: "tm1", type: "vocab", punjabi: "vaja",    english: "o'clock (singular)",
      definition: "Used with one o'clock: 'Ikk vaja hai' = It's one o'clock.",
      related: "vaje",
      example: "Hun ikk vaja hai. — It's one o'clock now." },
    { id: "tm2", type: "vocab", punjabi: "vaje",    english: "o'clock (plural)",
      definition: "Used with 2 and above: 'Tinn vaje han' = It's three o'clock.",
      related: "vaja",
      example: "Panj vaje han. — It's five o'clock." },
    { id: "tm3", type: "vocab", punjabi: "savaa",   english: "quarter past",
      definition: "Add before the hour: 'Savaa do' = quarter past two (2:15).",
      related: "saadhe, paune",
      example: "Savaa char vaje aana. — Come at quarter past four." },
    { id: "tm4", type: "vocab", punjabi: "saadhe",  english: "half past",
      definition: "Add before the hour: 'Saadhe tinn' = half past three (3:30). Note: 'half past one' is 'derh', 'half past two' is 'dhaayi'.",
      related: "savaa, paune, derh, dhaayi",
      example: "Saadhe satt vaje milange. — We'll meet at 7:30." },
    { id: "tm5", type: "vocab", punjabi: "paune",   english: "quarter to",
      definition: "Add before the hour: 'Paune panj' = quarter to five (4:45).",
      related: "savaa, saadhe",
      example: "Paune nau vaje. — At quarter to nine." },
    { id: "tm6", type: "vocab", punjabi: "derh",    english: "one and a half (1:30)",
      definition: "The special word for 'half past one'. 'Derh vaja hai' = It's 1:30.",
      related: "dhaayi",
      example: "Derh vaje khaana. — Lunch at 1:30." },
    { id: "tm7", type: "vocab", punjabi: "dhaayi",  english: "two and a half (2:30)",
      definition: "The special word for 'half past two'. 'Dhaayi vaje' = at 2:30.",
      related: "derh",
      example: "Dhaayi vaje milange. — We'll meet at 2:30." },
    { id: "tm8", type: "vocab", punjabi: "minit",   english: "minute",
      definition: "Borrowed from English. Same word for minute and small wait.",
      example: "Ikk minit ruko ji. — Please wait one minute." },
    { id: "tm9", type: "vocab", punjabi: "ghanta",  english: "hour",
      definition: "60 minutes. Plural: 'ghante'.",
      example: "Do ghante hor. — Two more hours." },
    { id: "tm10", type: "phrase", punjabi: "Kinne vaje han?",
      english: "What time is it?",
      definition: "The standard way to ask the time.",
      related: "vaje, vaja",
      example: "Maaf karna, kinne vaje han? — Excuse me, what time is it?" },

    // ===== Money & banking =====
    { id: "mn1", type: "vocab", punjabi: "rupaya",  english: "rupee",
      definition: "Indian/Pakistani currency unit. Plural: 'rupaye'.",
      related: "paisa, note",
      example: "Sau rupaye. — One hundred rupees." },
    { id: "mn2", type: "vocab", punjabi: "chillar", english: "loose change / coins",
      definition: "Small coin money. 'Chillar nahin hai' = no change available.",
      related: "rupaya, note",
      example: "Chillar do ji. — Please give change." },
    { id: "mn3", type: "vocab", punjabi: "note",    english: "currency note / bill",
      definition: "Paper money. 'Sau da note' = a hundred-rupee note.",
      related: "rupaya, chillar",
      example: "Pachas da note. — A fifty-rupee note." },
    { id: "mn4", type: "vocab", punjabi: "baink",    english: "bank",
      definition: "A place where money is kept. Borrowed from English.",
      related: "ATM, khaata",
      example: "Bank kithe hai? — Where is the bank?" },
    { id: "mn5", type: "vocab", punjabi: "khaata",  english: "account / ledger",
      definition: "A bank account, or a shop's running tab. 'Khaata kholna' = open an account.",
      related: "bank",
      example: "Mera bank khaata. — My bank account." },
    { id: "mn6", type: "vocab", punjabi: "udhaar",  english: "loan / borrowed",
      definition: "Money or items taken on credit. 'Udhaar denna' = to lend.",
      related: "paisa",
      example: "Udhaar nahin lainda. — I don't take loans." },
    { id: "mn7", type: "vocab", punjabi: "muft",    english: "free (no cost)",
      definition: "Without charge. 'Muft vich' = for free.",
      related: "sasta, paisa",
      example: "Eh muft hai. — This is free." },
    { id: "mn8", type: "vocab", punjabi: "kharcha", english: "expense / spending",
      definition: "Money spent. 'Kharcha karna' = to spend.",
      related: "paisa, kamana",
      example: "Mahine da kharcha. — Monthly expenses." },

    // ===== Clothing =====
    { id: "cl1",  type: "vocab", punjabi: "kapre",     english: "clothes",
      definition: "Plural of 'kapra'. The general word for clothing.",
      related: "kameez, salwar",
      example: "Saaf kapre paao. — Wear clean clothes." },
    { id: "cl2",  type: "vocab", punjabi: "kameez",    english: "shirt / tunic",
      definition: "Long shirt; the top half of a salwar-kameez outfit.",
      related: "salwar, kurta",
      example: "Navi kameez. — A new shirt." },
    { id: "cl3",  type: "vocab", punjabi: "salwar",    english: "loose trousers (Punjabi)",
      definition: "Loose pants, traditionally paired with kameez.",
      related: "kameez",
      example: "Salwar-kameez Punjabi paharaava hai. — Salwar-kameez is Punjabi attire." },
    { id: "cl4",  type: "vocab", punjabi: "kurta",     english: "kurta (loose tunic)",
      definition: "A loose, knee-length tunic worn by men and women.",
      related: "pajama, kameez",
      example: "Chitta kurta paaya. — Wore a white kurta." },
    { id: "cl5",  type: "vocab", punjabi: "pajama",    english: "pajama (loose trousers)",
      definition: "Loose-fit trousers worn with a kurta. (English 'pajamas' came from this word.)",
      related: "kurta",
      example: "Kurta-pajama vadiya lagda. — Kurta-pajama looks great." },
    { id: "cl6",  type: "vocab", punjabi: "dupatta",   english: "long scarf / shawl",
      definition: "A long rectangular scarf worn over the shoulders or head — paired with salwar-kameez.",
      related: "chunni, kameez",
      example: "Sohna dupatta. — A pretty dupatta." },
    { id: "cl7",  type: "vocab", punjabi: "chunni",    english: "head scarf / dupatta (Punjabi)",
      definition: "A Punjabi term for a long colorful dupatta, often worn over the head.",
      related: "dupatta",
      example: "Laal chunni. — A red chunni." },
    { id: "cl8",  type: "vocab", punjabi: "pagg",      english: "turban (Sikh)",
      definition: "The turban worn by Sikh men (and many Punjabi men). A symbol of pride and identity.",
      related: "sardar, dastar",
      example: "Pagg sardari di nishaani hai. — The turban is a mark of dignity." },
    { id: "cl9",  type: "vocab", punjabi: "juti",      english: "shoe / footwear",
      definition: "Shoe. 'Punjabi juti' = the famous embroidered Punjabi shoe.",
      related: "pair, jurab",
      example: "Juti utaar ke andar aao. — Take off your shoes and come in." },
    { id: "cl10", type: "vocab", punjabi: "jurab",     english: "sock",
      definition: "Worn on feet inside shoes.",
      related: "juti",
      example: "Jurab paao. — Wear socks." },
    { id: "cl11", type: "vocab", punjabi: "topi",      english: "cap / hat",
      definition: "A small hat. Different from 'pagg' (turban).",
      related: "pagg, sir",
      example: "Sardi vich topi paao. — Wear a cap in winter." },
    { id: "cl12", type: "vocab", punjabi: "chasme",    english: "glasses / spectacles",
      definition: "Eye glasses. Singular: 'chasma' — also means 'spring' (water).",
      related: "akh",
      example: "Chasme laa lo. — Put on your glasses." },

    // ===== Kitchen & cooking =====
    { id: "kc1",  type: "vocab", punjabi: "chulha",   english: "stove / hearth",
      definition: "A traditional cooking stove. Modern stoves are also called chulha.",
      related: "rasoi, aag",
      example: "Chulhe te roti pak rahi hai. — Roti is cooking on the stove." },
    { id: "kc2",  type: "vocab", punjabi: "tava",     english: "flat griddle",
      definition: "Flat iron pan used to cook roti.",
      related: "roti, chulha",
      example: "Tave te roti laao. — Put the roti on the tava." },
    { id: "kc3",  type: "vocab", punjabi: "bartan",   english: "utensils / dishes",
      definition: "All cookware and dishware.",
      related: "plate, glass",
      example: "Bartan dho lo. — Wash the dishes." },
    { id: "kc4",  type: "vocab", punjabi: "chamcha",  english: "spoon / ladle",
      definition: "A spoon or large serving ladle.",
      related: "kanda, chaaku",
      example: "Chamcha laao. — Bring a spoon." },
    { id: "kc5",  type: "vocab", punjabi: "chaaku",   english: "knife",
      definition: "A cutting tool. Use carefully!",
      related: "chamcha, sabzi",
      example: "Chaaku tikha hai. — The knife is sharp." },
    { id: "kc6",  type: "vocab", punjabi: "plet",    english: "plate",
      definition: "Borrowed from English. Also called 'thali' (a steel plate).",
      related: "thali, bartan",
      example: "Plate vich daal. — Daal in the plate." },
    { id: "kc7",  type: "vocab", punjabi: "glass",    english: "glass (cup)",
      definition: "Borrowed from English. A drinking glass.",
      related: "paani, doodh",
      example: "Paani da glass. — A glass of water." },
    { id: "kc8",  type: "vocab", punjabi: "atta",     english: "wheat flour",
      definition: "The flour used to make roti.",
      related: "roti, tava",
      example: "Atta gunno. — Knead the flour." },
    { id: "kc9",  type: "vocab", punjabi: "ghee",     english: "clarified butter",
      definition: "A staple Punjabi cooking fat — golden, fragrant.",
      related: "makhan, tadka",
      example: "Roti te ghee. — Ghee on the roti." },
    { id: "kc10", type: "vocab", punjabi: "makhan",   english: "butter",
      definition: "Soft butter — famously paired with sarson da saag and makki di roti.",
      related: "ghee, doodh",
      example: "Makki di roti te makhan. — Corn roti with butter." },
    { id: "kc11", type: "vocab", punjabi: "masala",   english: "spice mix",
      definition: "Any blend of spices. Punjabi cooking is built on masale.",
      related: "mirch, namak",
      example: "Garam masala paao. — Add garam masala." },
    { id: "kc12", type: "vocab", punjabi: "tadka",    english: "tempering (sizzled spice)",
      definition: "Hot ghee/oil with spices poured over a dish for flavor — the soul of daal.",
      related: "daal, ghee",
      example: "Daal te tadka. — Tempering on the daal." },

    // ===== More food: vegetables & sweets =====
    { id: "fd12", type: "vocab", punjabi: "gobhi",        english: "cauliflower",
      definition: "A white vegetable; aloo gobhi is a classic Punjabi dish.",
      related: "aaloo, sabzi",
      example: "Aaloo-gobhi banai. — Made aloo-gobhi." },
    { id: "fd13", type: "vocab", punjabi: "mooli",        english: "radish",
      definition: "A long white root vegetable; famous in mooli paronthe.",
      related: "paronthe, sabzi",
      example: "Mooli de paronthe. — Radish parathas." },
    { id: "fd14", type: "vocab", punjabi: "gajar",        english: "carrot",
      definition: "An orange root vegetable. Gajar da halwa is a winter sweet.",
      related: "halwa, sabzi",
      example: "Gajar khaao, akhaan tez. — Eat carrots, sharp eyes." },
    { id: "fd15", type: "vocab", punjabi: "palak",        english: "spinach",
      definition: "Leafy green; palak paneer is famous.",
      related: "paneer, sabzi",
      example: "Palak paneer. — Spinach with paneer." },
    { id: "fd16", type: "vocab", punjabi: "methi",        english: "fenugreek leaves",
      definition: "Bitter-fragrant green; aloo-methi is a Punjabi favorite.",
      related: "sabzi",
      example: "Methi di sabzi. — Methi vegetable." },
    { id: "fd17", type: "vocab", punjabi: "bhindi",       english: "okra",
      definition: "Long green pods, often cooked dry with masale.",
      related: "sabzi",
      example: "Bhindi sukhi. — Dry okra." },
    { id: "fd18", type: "vocab", punjabi: "paneer",       english: "Indian cheese",
      definition: "Fresh cottage-style cheese. Star of palak paneer, paneer tikka.",
      related: "doodh, palak",
      example: "Paneer di sabzi. — Paneer dish." },
    { id: "fd19", type: "vocab", punjabi: "gulab jamun",  english: "gulab jamun (sweet)",
      definition: "Soft fried dough balls in sugar syrup. Festival favorite.",
      related: "mithai, jalebi",
      example: "Garam gulab jamun. — Hot gulab jamun." },
    { id: "fd20", type: "vocab", punjabi: "jalebi",       english: "jalebi (sweet)",
      definition: "Crispy spiral sweet soaked in syrup. Often eaten with milk.",
      related: "mithai, doodh",
      example: "Doodh-jalebi. — Milk and jalebi." },
    { id: "fd21", type: "vocab", punjabi: "kheer",        english: "rice pudding",
      definition: "Sweet milk-and-rice pudding cooked slowly.",
      related: "doodh, chaaval",
      example: "Kheer thandi karke khaao. — Eat kheer chilled." },
    { id: "fd22", type: "vocab", punjabi: "ladoo",        english: "ladoo (sweet ball)",
      definition: "Round Indian sweet, common at celebrations and temples.",
      related: "mithai, vadhaiyaan",
      example: "Khushi vich ladoo vandde. — Ladoos handed out in joy." },
    { id: "fd23", type: "vocab", punjabi: "mithai",       english: "sweets / desserts",
      definition: "General term for Indian sweets.",
      related: "ladoo, jalebi, gulab jamun",
      example: "Mithai laao. — Bring sweets." },
    { id: "fd24", type: "vocab", punjabi: "masala chai",  english: "spiced tea",
      definition: "Tea brewed with milk, sugar, and warming spices (cardamom, ginger).",
      related: "chah, doodh",
      example: "Masala chai laao ji. — Bring masala chai please." },
    { id: "fd25", type: "vocab", punjabi: "doodh patti",  english: "milky tea (no water)",
      definition: "Tea boiled in pure milk — strong and creamy. Popular Punjabi style.",
      related: "chah",
      example: "Doodh patti pee lo. — Have some doodh patti." },

    // ===== Fruits expansion =====
    { id: "fr1",  type: "vocab", punjabi: "seb",        english: "apple",
      definition: "A round red, green, or yellow fruit.",
      related: "phal",
      example: "Roz ikk seb. — An apple a day." },
    { id: "fr2",  type: "vocab", punjabi: "kela",       english: "banana",
      definition: "A long yellow fruit.",
      related: "phal",
      example: "Kela peela hai. — The banana is yellow." },
    { id: "fr3",  type: "vocab", punjabi: "angoor",     english: "grapes",
      definition: "Small round fruits in a bunch.",
      related: "phal",
      example: "Angoor mitthay han. — The grapes are sweet." },
    { id: "fr4",  type: "vocab", punjabi: "santra",     english: "orange",
      definition: "A round citrus fruit.",
      related: "phal, rang",
      example: "Santre da juice. — Orange juice." },
    { id: "fr5",  type: "vocab", punjabi: "tarbooz",    english: "watermelon",
      definition: "A big green fruit with red watery flesh; perfect for summer.",
      related: "garmi, phal",
      example: "Garmi vich tarbooz. — Watermelon in summer." },
    { id: "fr6",  type: "vocab", punjabi: "anaar",      english: "pomegranate",
      definition: "A red fruit full of seed jewels.",
      related: "phal",
      example: "Anaar da rang. — The color of pomegranate." },
    { id: "fr7",  type: "vocab", punjabi: "papita",     english: "papaya",
      definition: "A soft orange tropical fruit.",
      related: "phal",
      example: "Papita pet layi changa. — Papaya is good for the stomach." },
    { id: "fr8",  type: "vocab", punjabi: "ananas",     english: "pineapple",
      definition: "A tropical fruit with spiky skin.",
      related: "phal",
      example: "Ananas khatta-mittha. — Pineapple is sweet-sour." },
    { id: "fr9",  type: "vocab", punjabi: "naashpaati", english: "pear",
      definition: "A green or yellow fruit, sweet and crunchy.",
      related: "phal, seb",
      example: "Naashpaati narm hai. — The pear is soft." },
    { id: "fr10", type: "vocab", punjabi: "kharbooja",  english: "muskmelon / cantaloupe",
      definition: "A summer melon, sweet and fragrant.",
      related: "tarbooz, garmi",
      example: "Kharbooja thanda khaao. — Eat muskmelon chilled." },

    // ===== More animals & insects =====
    { id: "a7",  type: "vocab", punjabi: "bakri",   english: "goat",
      definition: "A small farm animal, gives milk and wool.",
      related: "gaan, doodh",
      example: "Bakri ghaa khaandi hai. — The goat eats grass." },
    { id: "a8",  type: "vocab", punjabi: "chooha",  english: "mouse / rat",
      definition: "A small rodent.",
      related: "billi",
      example: "Chooha bhajj gaya. — The mouse ran away." },
    { id: "a9",  type: "vocab", punjabi: "kaan",    english: "crow",
      definition: "A common black bird; in folklore, brings news of guests.",
      related: "pakhi",
      example: "Kaan bolda hai. — The crow is calling." },
    { id: "a10", type: "vocab", punjabi: "kabootar", english: "pigeon / dove",
      definition: "A common city bird; symbol of peace.",
      related: "pakhi",
      example: "Kabootar udda. — The pigeon flew." },
    { id: "a11", type: "vocab", punjabi: "maccha",  english: "fish",
      definition: "An animal that lives in water.",
      related: "paani, naddi",
      example: "Maccha paani vich. — The fish is in water." },
    { id: "a12", type: "vocab", punjabi: "titli",   english: "butterfly",
      definition: "A pretty winged insect.",
      related: "phul",
      example: "Titli phul te. — A butterfly on the flower." },
    { id: "a13", type: "vocab", punjabi: "makkhi",  english: "fly",
      definition: "A small flying insect that bothers food.",
      related: "machhar",
      example: "Makkhi udaao. — Shoo the fly away." },
    { id: "a14", type: "vocab", punjabi: "machhar", english: "mosquito",
      definition: "A biting insect, especially in monsoon.",
      related: "makkhi, baarish",
      example: "Machhar kattda hai. — The mosquito bites." },
    { id: "a15", type: "vocab", punjabi: "saap",    english: "snake",
      definition: "A long crawling reptile.",
      related: "darr, jangle",
      example: "Saap khatarnaak hai. — The snake is dangerous." },
    { id: "a16", type: "vocab", punjabi: "hathi",   english: "elephant",
      definition: "The largest land animal.",
      related: "vadda, jangle",
      example: "Hathi bahut vadda hai. — The elephant is very big." },

    // ===== Nature extension =====
    { id: "na1",  type: "vocab", punjabi: "pahaad",   english: "mountain",
      definition: "A very tall landform.",
      related: "barf, ucha",
      example: "Pahaadan te barf. — Snow on the mountains." },
    { id: "na2",  type: "vocab", punjabi: "jangle",   english: "forest / jungle",
      definition: "A large area covered with trees.",
      related: "rukh, sher",
      example: "Jangle vich jaanvar. — Animals in the forest." },
    { id: "na3",  type: "vocab", punjabi: "samandar", english: "ocean / sea",
      definition: "A huge body of salt water.",
      related: "naddi, paani",
      example: "Samandar gehra hai. — The ocean is deep." },
    { id: "na4",  type: "vocab", punjabi: "jheel",    english: "lake",
      definition: "A still body of water surrounded by land.",
      related: "naddi, paani",
      example: "Jheel da paani saaf. — The lake's water is clear." },
    { id: "na5",  type: "vocab", punjabi: "ret",      english: "sand",
      definition: "Tiny grains found at beaches and deserts.",
      related: "samandar",
      example: "Ret te chalna. — Walking on sand." },
    { id: "na6",  type: "vocab", punjabi: "mitti",    english: "soil / earth",
      definition: "The dirt that plants grow in. Also poetic 'homeland'.",
      related: "khet, beej",
      example: "Apni mitti. — Our own soil (homeland)." },
    { id: "na7",  type: "vocab", punjabi: "patta",    english: "leaf",
      definition: "Part of a plant. Plural: 'patte'.",
      related: "rukh, hara",
      example: "Hare patte. — Green leaves." },
    { id: "na8",  type: "vocab", punjabi: "beej",     english: "seed",
      definition: "A small thing that grows into a plant.",
      related: "rukh, mitti",
      example: "Beej bo do. — Sow the seed." },
    { id: "na9",  type: "vocab", punjabi: "bagh",     english: "garden",
      definition: "A planted area with flowers or trees.",
      related: "phul, rukh",
      example: "Bagh vich gulaab. — Roses in the garden." },
    { id: "na10", type: "vocab", punjabi: "aag",      english: "fire",
      definition: "Hot bright flames.",
      related: "garam, chulha",
      example: "Aag naal door raho. — Stay away from fire." },

    // ===== Sports & games =====
    { id: "sp1",  type: "vocab", punjabi: "khel",          english: "game / sport",
      definition: "Any game or sport.",
      related: "khelna",
      example: "Mera pasandida khel. — My favorite sport." },
    { id: "sp2",  type: "vocab", punjabi: "kabaddi",       english: "kabaddi (Punjabi sport)",
      definition: "A traditional Punjabi contact sport — players raid the opposing side while chanting 'kabaddi'. Hugely popular in Punjab.",
      related: "khel, mela",
      example: "Pind vich kabaddi da match. — A kabaddi match in the village." },
    { id: "sp3",  type: "vocab", punjabi: "cricket",       english: "cricket",
      definition: "Bat-and-ball sport, beloved across the subcontinent.",
      related: "khel",
      example: "Cricket khedanga. — I'll play cricket." },
    { id: "sp4",  type: "vocab", punjabi: "hockey",        english: "field hockey",
      definition: "India's traditional national sport — Punjab has produced many stars.",
      related: "khel",
      example: "Punjab hockey vich aage. — Punjab is ahead in hockey." },
    { id: "sp5",  type: "vocab", punjabi: "football",      english: "soccer / football",
      definition: "A worldwide sport with a ball and net.",
      related: "khel",
      example: "Football match vekhange. — We'll watch the football match." },
    { id: "sp6",  type: "vocab", punjabi: "gulli-danda",   english: "gulli-danda (street game)",
      definition: "Traditional Punjabi street game with a small wooden 'gulli' and a stick 'danda'. Like cricket's ancestor.",
      example: "Gulli-danda khedde si. — We used to play gulli-danda." },
    { id: "sp7",  type: "vocab", punjabi: "kho-kho",       english: "kho-kho (chase game)",
      definition: "A traditional tag-style chasing game.",
      example: "Kho-kho da match. — A kho-kho match." },
    { id: "sp8",  type: "vocab", punjabi: "patang",        english: "kite",
      definition: "Paper kite. Punjabis fly kites on Lohri and Basant.",
      related: "Lohri, Basant",
      example: "Patang udaao. — Fly the kite." },
    { id: "sp9",  type: "vocab", punjabi: "taas",          english: "playing cards",
      definition: "A pack of playing cards. 'Taas khedna' = to play cards.",
      example: "Sham nu taas khedde. — We played cards in the evening." },
    { id: "sp10", type: "vocab", punjabi: "ludo",          english: "Ludo (board game)",
      definition: "A board game with dice and tokens, popular in homes.",
      example: "Bachche ludo khelde han. — The kids are playing Ludo." },

    // ===== Music & arts =====
    { id: "mu1",  type: "vocab", punjabi: "gaana",     english: "song",
      definition: "A piece of music with words. 'Gaana gauna' = to sing.",
      related: "geet, gauna",
      example: "Punjabi gaana laao. — Play a Punjabi song." },
    { id: "mu2",  type: "vocab", punjabi: "geet",      english: "song / poem (lyrical)",
      definition: "A more lyrical/poetic word for song.",
      related: "gaana, kavita",
      example: "Lok geet. — Folk song." },
    { id: "mu3",  type: "vocab", punjabi: "dhun",      english: "tune / melody",
      definition: "The musical melody of a song.",
      related: "gaana, vaja",
      example: "Sohni dhun. — A lovely tune." },
    { id: "mu5",  type: "vocab", punjabi: "tabla",     english: "tabla (drums)",
      definition: "A pair of small hand drums; rhythm of Indian classical music.",
      related: "dhol, sangeet",
      example: "Tabla taal vich. — The tabla in rhythm." },
    { id: "mu6",  type: "vocab", punjabi: "harmonium", english: "harmonium",
      definition: "A small keyboard instrument with bellows; central to Sikh kirtan.",
      related: "vaja, kirtan",
      example: "Harmonium te bhajan. — A bhajan on the harmonium." },
    { id: "mu7",  type: "vocab", punjabi: "sitar",     english: "sitar (string instrument)",
      definition: "A long-necked plucked string instrument.",
      related: "vaja, sangeet",
      example: "Sitar di awaaz. — The sound of the sitar." },
    { id: "mu8",  type: "vocab", punjabi: "naach",     english: "dance",
      definition: "Dancing. 'Naachna' = to dance.",
      related: "bhangra, gidda",
      example: "Naach paao! — Let's dance!" },
    { id: "mu9",  type: "vocab", punjabi: "kavi",      english: "poet",
      definition: "Someone who writes poetry. Punjab has a deep poetic tradition.",
      related: "kavita, geet",
      example: "Mera pasandida kavi. — My favorite poet." },
    { id: "mu10", type: "vocab", punjabi: "kavita",    english: "poem / poetry",
      definition: "Lines of verse. 'Kavita likhna' = to write poetry.",
      related: "kavi, geet",
      example: "Sohni kavita. — A beautiful poem." },

    // ===== Religion / Sikh terms =====
    { id: "rl1",  type: "vocab", punjabi: "Guru",                english: "Guru / spiritual teacher",
      definition: "A spiritual teacher. In Sikhism, the ten human Gurus and the eternal Guru Granth Sahib.",
      related: "Sikh, Granth",
      example: "Guru Nanak Dev Ji. — Guru Nanak (founder of Sikhi)." },
    { id: "rl2",  type: "vocab", punjabi: "Granth",              english: "scripture / holy book",
      definition: "Holy book. 'Sri Guru Granth Sahib' is the eternal Sikh scripture.",
      related: "Guru, paath",
      example: "Granth Sahib di hazoori. — In the presence of the Granth Sahib." },
    { id: "rl3",  type: "vocab", punjabi: "Ardas",               english: "Sikh prayer (standing supplication)",
      definition: "The formal Sikh prayer offered while standing, recalling the Gurus and asking blessings.",
      related: "Guru, Waheguru",
      example: "Ardas karan toon baad. — After offering Ardas." },
    { id: "rl4",  type: "vocab", punjabi: "Paath",               english: "scripture reading",
      definition: "Recitation from the Guru Granth Sahib. 'Paath karna' = to do recitation.",
      related: "Granth, Akhand Paath",
      example: "Ghar vich paath. — A paath at home." },
    { id: "rl5",  type: "vocab", punjabi: "Kirtan",              english: "devotional singing",
      definition: "Singing of the Guru's hymns, usually with harmonium and tabla.",
      related: "harmonium, gurudwara",
      example: "Kirtan sun ke man shaant. — Mind feels peace listening to kirtan." },
    { id: "rl6",  type: "vocab", punjabi: "Simran",              english: "meditation / remembrance",
      definition: "Remembering God's name silently or through chanting.",
      related: "Naam, Waheguru",
      example: "Naam Simran karo. — Practice Naam Simran." },
    { id: "rl8",  type: "vocab", punjabi: "Pangat",              english: "row of equal seating (langar)",
      definition: "Sitting in equal rows on the floor for langar — symbol of equality.",
      related: "langar, sangat",
      example: "Pangat vich baith ke khaana. — Eating while seated in pangat." },
    { id: "rl9",  type: "vocab", punjabi: "Khanda",              english: "Sikh emblem (double-edged sword)",
      definition: "The Sikh symbol — central double-edged sword with a chakkar and two kirpans. Symbolizes oneness, justice, and balance.",
      related: "Khalsa",
      example: "Khanda Sikhi da nishaan hai. — Khanda is the symbol of Sikhi." },
    { id: "rl10", type: "vocab", punjabi: "mandir",              english: "Hindu temple",
      definition: "A Hindu place of worship.",
      related: "gurudwara, masjid",
      example: "Mandir vich aarti. — Aarti in the temple." },
    { id: "rl11", type: "vocab", punjabi: "masjid",              english: "mosque",
      definition: "A Muslim place of worship.",
      related: "gurudwara, mandir",
      example: "Masjid vich namaaz. — Namaaz in the mosque." },
    { id: "rl12", type: "vocab", punjabi: "girja",               english: "church",
      definition: "A Christian place of worship.",
      related: "gurudwara, mandir, masjid",
      example: "Girja ghar. — Church." },

    // ===== Festivals =====
    { id: "fs1",  type: "vocab", punjabi: "Diwali",            english: "Diwali / Bandi Chhor Divas",
      definition: "Festival of lights — for Sikhs also Bandi Chhor Divas (Guru Hargobind's release of 52 kings).",
      related: "Bandi Chhor, mela",
      example: "Diwali diyaan vadhaiyaan! — Diwali greetings!" },
    { id: "fs2",  type: "vocab", punjabi: "Holi",              english: "Holi (festival of colors)",
      definition: "Spring festival of colors and play.",
      related: "rang, bahaar",
      example: "Holi mubarak ho! — Happy Holi!" },
    { id: "fs3",  type: "vocab", punjabi: "Hola Mohalla",      english: "Hola Mohalla (Sikh martial festival)",
      definition: "A Sikh festival started by Guru Gobind Singh — martial arts displays, processions, poetry, the day after Holi.",
      related: "Khalsa",
      example: "Hola Mohalla Anandpur Sahib vich. — Hola Mohalla at Anandpur Sahib." },
    { id: "fs4",  type: "vocab", punjabi: "Gurpurab",          english: "Guru's birth/death anniversary",
      definition: "A day commemorating a Sikh Guru — especially Guru Nanak's birth (Kartik Purnima).",
      related: "Guru",
      example: "Gurpurab diyaan vadhaiyaan. — Gurpurab greetings." },
    { id: "fs5",  type: "vocab", punjabi: "Eid",               english: "Eid (Muslim festival)",
      definition: "Major Muslim festival. Eid-ul-Fitr after Ramadan; Eid-ul-Adha later in the year.",
      related: "mubarak",
      example: "Eid mubarak! — Blessed Eid!" },
    { id: "fs6",  type: "vocab", punjabi: "Karva Chauth",      english: "Karva Chauth (women's fast day)",
      definition: "A day when married women fast for their husbands' long life.",
      example: "Karva Chauth da chand. — The Karva Chauth moon." },
    { id: "fs7",  type: "vocab", punjabi: "Raksha Bandhan",    english: "Raksha Bandhan (sister-brother day)",
      definition: "Sisters tie a 'rakhi' on brothers' wrists; brothers vow protection.",
      related: "bhain, bhra",
      example: "Bhain ne rakhi bandhi. — Sister tied a rakhi." },
    { id: "fs8",  type: "vocab", punjabi: "vivaah",            english: "wedding",
      definition: "A wedding ceremony. Sikh weddings are called 'Anand Karaj'.",
      related: "Anand Karaj, barat",
      example: "Bhra da vivaah hai. — My brother's wedding is on." },
    { id: "fs9",  type: "vocab", punjabi: "janamdin",          english: "birthday",
      definition: "Day someone was born. 'Janamdin mubarak' = happy birthday.",
      related: "mubarak",
      example: "Janamdin mubarak ho! — Happy birthday!" },
    { id: "fs10", type: "vocab", punjabi: "mela",              english: "fair / festival gathering",
      definition: "A fair — food stalls, rides, music, games. Common at festivals.",
      related: "festival, bhangra",
      example: "Pind da mela. — The village fair." },

    // ===== Wedding-specific =====
    { id: "wd1", type: "vocab", punjabi: "barat",       english: "groom's wedding procession",
      definition: "The groom's family procession arriving at the wedding venue, often with dhol and dancing.",
      related: "vivaah, dhol",
      example: "Barat aa gayi. — The barat has arrived." },
    { id: "wd2", type: "vocab", punjabi: "doli",        english: "bride's farewell ride",
      definition: "The bride's send-off in a decorated palanquin/car, leaving her parents' home.",
      related: "vidaai, vivaah",
      example: "Doli turi. — The doli set off." },
    { id: "wd3", type: "vocab", punjabi: "sagan",       english: "wedding gift / blessing",
      definition: "A small monetary gift placed in an envelope for blessings.",
      related: "vivaah, vadhaiyaan",
      example: "Sagan deo ji. — Please give the sagan." },
    { id: "wd4", type: "vocab", punjabi: "milni",       english: "introduction ceremony",
      definition: "Formal introduction of the two families at a Punjabi wedding — relatives meet their counterparts.",
      related: "vivaah",
      example: "Milni de baad chai. — Tea after the milni." },
    { id: "wd5", type: "vocab", punjabi: "Anand Karaj", english: "Sikh marriage ceremony",
      definition: "Sikh wedding ceremony performed in the gurdwara, with four lavaan (rounds).",
      related: "lavaan, gurudwara",
      example: "Anand Karaj sham nu. — Anand Karaj in the evening." },
    { id: "wd6", type: "vocab", punjabi: "lavaan",      english: "the four wedding rounds",
      definition: "The four hymns walked around the Guru Granth Sahib during a Sikh wedding.",
      related: "Anand Karaj",
      example: "Lavaan padhe gaye. — The lavaan were recited." },
    { id: "wd7", type: "vocab", punjabi: "vidaai",      english: "bride's send-off (tearful)",
      definition: "Emotional moment when the bride leaves her parents' home.",
      related: "doli",
      example: "Vidaai vele aansoo. — Tears at the time of vidaai." },
    { id: "wd8", type: "vocab", punjabi: "nikkah",      english: "Muslim marriage contract",
      definition: "The Islamic marriage ceremony.",
      related: "vivaah",
      example: "Nikkah hoya. — The nikkah took place." },

    // ===== City life / transport =====
    { id: "ct1",  type: "vocab", punjabi: "bas",          english: "bus",
      definition: "Public transport vehicle. Borrowed from English.",
      related: "rail, ticket",
      example: "Bus chhutt gayi. — The bus left." },
    { id: "ct2",  type: "vocab", punjabi: "rail",         english: "train",
      definition: "Train. Also 'gaddi' in everyday speech.",
      related: "stationer, ticket",
      example: "Rail late hai. — The train is late." },
    { id: "ct3",  type: "vocab", punjabi: "rickshaw",     english: "cycle rickshaw",
      definition: "A three-wheel pedal-powered taxi.",
      related: "auto",
      example: "Rickshaw walaa bhai. — Mr. Rickshaw driver." },
    { id: "ct4",  type: "vocab", punjabi: "auto",         english: "auto-rickshaw (three-wheeler)",
      definition: "Motorized three-wheel taxi — common across India.",
      related: "rickshaw",
      example: "Auto laao. — Get an auto." },
    { id: "ct5",  type: "vocab", punjabi: "traiktar",     english: "tractor",
      definition: "Farm vehicle — central to Punjab's agriculture.",
      related: "khet, kisaan",
      example: "Tractor khet vich. — The tractor is in the field." },
    { id: "ct6",  type: "vocab", punjabi: "hawai jahaaz", english: "airplane",
      definition: "A flying machine. Literally 'air ship'.",
      related: "airport, ticket",
      example: "Hawai jahaaz uddya. — The plane took off." },
    { id: "ct7",  type: "vocab", punjabi: "airport",      english: "airport",
      definition: "Where airplanes take off and land. Borrowed from English.",
      related: "hawai jahaaz",
      example: "Airport jaana hai. — I have to go to the airport." },
    { id: "ct8",  type: "vocab", punjabi: "tikat",        english: "ticket",
      definition: "A pass for travel. Borrowed from English.",
      related: "bus, rail",
      example: "Do ticket lao. — Get two tickets." },
    { id: "ct9",  type: "vocab", punjabi: "saikal",       english: "bicycle",
      definition: "A two-wheel pedal vehicle.",
      related: "gaddi",
      example: "Bachchey saikal sikhde han. — The kids are learning to cycle." },
    { id: "ct10", type: "vocab", punjabi: "trafic",       english: "traffic",
      definition: "Vehicles on the road. Borrowed from English.",
      related: "saddak, gaddi",
      example: "Bahut trafic hai. — There's a lot of traffic." },

    // ===== Work & business =====
    { id: "wk1",  type: "vocab", punjabi: "daftar",   english: "office",
      definition: "A workplace.",
      related: "kamm, naukri",
      example: "Daftar jaana hai. — I have to go to the office." },
    { id: "wk2",  type: "vocab", punjabi: "naukri",   english: "job",
      definition: "Paid employment. 'Naukri karna' = to be employed.",
      related: "kamm, daftar",
      example: "Navi naukri laggi. — Got a new job." },
    { id: "wk3",  type: "vocab", punjabi: "bos",      english: "boss",
      definition: "Manager / boss. Borrowed from English.",
      related: "daftar",
      example: "Bos da phone. — A call from the boss." },
    { id: "wk4",  type: "vocab", punjabi: "mulazim",  english: "employee / worker",
      definition: "Someone employed by another.",
      related: "naukri, bos",
      example: "Daftar de mulazim. — The office employees." },
    { id: "wk5",  type: "vocab", punjabi: "tanqaah",  english: "salary",
      definition: "Monthly pay.",
      related: "paisa, kamm",
      example: "Tanqaah aa gayi. — The salary has come in." },
    { id: "wk6",  type: "vocab", punjabi: "chutti",   english: "leave / holiday / vacation",
      definition: "Time off work or school.",
      related: "school, daftar",
      example: "Aaj chutti hai. — Today is a holiday." },
    { id: "wk7",  type: "vocab", punjabi: "meeting",  english: "meeting",
      definition: "A scheduled discussion. Borrowed from English.",
      related: "daftar",
      example: "Meeting nau vaje. — Meeting at nine." },
    { id: "wk8",  type: "vocab", punjabi: "file",     english: "file / document folder",
      definition: "A folder of papers. Borrowed from English.",
      related: "kaagaz, daftar",
      example: "File mez te hai. — The file is on the table." },
    { id: "wk9",  type: "vocab", punjabi: "kampyootar", english: "computer",
      definition: "An electronic machine for work and play. Borrowed from English.",
      related: "internet, file",
      example: "Computer chalu karo. — Turn on the computer." },
    { id: "wk10", type: "vocab", punjabi: "email",    english: "email",
      definition: "Electronic mail. Borrowed from English.",
      related: "computer, message",
      example: "Email bhej do. — Send the email." },

    // ===== Technology =====
    { id: "tc1",  type: "vocab", punjabi: "mobile",   english: "mobile phone",
      definition: "A cell phone. Borrowed from English.",
      related: "phone, charger",
      example: "Mera mobile kithe hai? — Where is my mobile?" },
    { id: "tc2",  type: "vocab", punjabi: "internet", english: "internet",
      definition: "The global network. Borrowed from English.",
      related: "computer",
      example: "Internet chalda nahin. — The internet isn't working." },
    { id: "tc3",  type: "vocab", punjabi: "video",    english: "video",
      definition: "A moving picture recording.",
      related: "photo, mobile",
      example: "Video bhej do. — Send the video." },
    { id: "tc4",  type: "vocab", punjabi: "message",  english: "message / text",
      definition: "A written message. Borrowed from English.",
      related: "phone, email",
      example: "Message likh do. — Type the message." },
    { id: "tc5",  type: "vocab", punjabi: "foto",     english: "photo",
      definition: "A still picture. Borrowed from English.",
      related: "camera",
      example: "Photo khich lo. — Take the photo." },
    { id: "tc6",  type: "vocab", punjabi: "kemara",   english: "camera",
      definition: "A device for taking photos. Borrowed from English.",
      related: "photo",
      example: "Camera laao. — Bring the camera." },
    { id: "tc7",  type: "vocab", punjabi: "TV",       english: "television / TV",
      definition: "A screen for watching shows.",
      related: "video",
      example: "TV band karo. — Turn off the TV." },
    { id: "tc8",  type: "vocab", punjabi: "redio",    english: "radio",
      definition: "A device that plays broadcast audio.",
      related: "gaana",
      example: "Radio te gaana. — A song on the radio." },
    { id: "tc9",  type: "vocab", punjabi: "chaarjar", english: "charger",
      definition: "Cable to charge devices. Borrowed from English.",
      related: "mobile, batti",
      example: "Charger laao. — Bring the charger." },
    { id: "tc10", type: "vocab", punjabi: "app",      english: "app",
      definition: "A program on your phone. Borrowed from English.",
      related: "mobile",
      example: "Eh app vadiya hai. — This app is great." },

    // ===== Body & health extension =====
    { id: "b15", type: "vocab", punjabi: "bahn",   english: "arm",
      definition: "From shoulder to wrist.",
      related: "hath, kohni",
      example: "Bahn dukhdi hai. — My arm hurts." },
    { id: "b16", type: "vocab", punjabi: "gardan", english: "neck",
      definition: "Connects head to body.",
      related: "sir, gala",
      example: "Gardan akkad gayi. — My neck is stiff." },
    { id: "b17", type: "vocab", punjabi: "pith",   english: "back",
      definition: "The back of the body.",
      related: "ghutna, bahn",
      example: "Pith te bojh. — Weight on the back." },
    { id: "b18", type: "vocab", punjabi: "ghutna", english: "knee",
      definition: "The middle joint of the leg.",
      related: "pair, kohni",
      example: "Ghutna dukhda hai. — My knee hurts." },
    { id: "b19", type: "vocab", punjabi: "kohni",  english: "elbow",
      definition: "The middle joint of the arm.",
      related: "bahn, ghutna",
      example: "Kohni te chot. — Injury on the elbow." },
    { id: "b20", type: "vocab", punjabi: "khoon",  english: "blood",
      definition: "Red liquid in the body.",
      related: "dil, chot",
      example: "Khoon vagda hai. — Blood is flowing." },
    { id: "b21", type: "vocab", punjabi: "saans",  english: "breath",
      definition: "Air in and out of lungs.",
      related: "nakk, hawa",
      example: "Gehri saans lo. — Take a deep breath." },
    { id: "h16", type: "vocab", punjabi: "bukhaar", english: "fever",
      definition: "A high body temperature when sick.",
      related: "bimaar, dawai",
      example: "Mainu bukhaar hai. — I have a fever." },
    { id: "h17", type: "vocab", punjabi: "khaansi", english: "cough",
      definition: "A reflex from a tickle in the throat.",
      related: "gala, zukam",
      example: "Khaansi nahin rukdi. — The cough won't stop." },
    { id: "h18", type: "vocab", punjabi: "zukam",   english: "cold (illness)",
      definition: "A runny nose and stuffy head.",
      related: "khaansi, bimaar",
      example: "Mainu zukam laggya. — I caught a cold." },
    { id: "h19", type: "vocab", punjabi: "chot",    english: "injury / wound",
      definition: "Hurt to the body. 'Chot lagna' = to get hurt.",
      related: "khoon, dukhna",
      example: "Pair te chot laggi. — I hurt my foot." },
    { id: "h20", type: "vocab", punjabi: "dard",    english: "pain",
      definition: "Physical pain. 'Dard hona' = to be in pain.",
      related: "dukhna, dawai",
      example: "Sir vich dard. — Pain in the head." },
    { id: "h21", type: "vocab", punjabi: "haspataal", english: "hospital",
      definition: "Where sick people get treatment. Borrowed from English.",
      related: "doctor, dawai",
      example: "Hospital lai chalo. — Take to the hospital." },
    { id: "h22", type: "vocab", punjabi: "tabiyat",  english: "health / state of well-being",
      definition: "How you're feeling. 'Tabiyat kive hai?' = How is your health?",
      related: "sehat, bimaar",
      example: "Tabiyat theek nahin. — My health isn't good." },

    // ===== Emotions extension =====
    { id: "fe13", type: "vocab", punjabi: "sharminda", english: "embarrassed / ashamed",
      definition: "Feeling shy from a mistake or attention. 'Sharminda hona' = to feel embarrassed.",
      related: "udaas",
      example: "Main sharminda haan. — I am embarrassed." },
    { id: "fe14", type: "vocab", punjabi: "hairaan",   english: "surprised",
      definition: "Caught off guard. 'Hairaani' = the noun (surprise).",
      related: "khush",
      example: "Main hairaan reh gaya. — I was left surprised." },
    { id: "fe15", type: "vocab", punjabi: "garv",      english: "pride (positive)",
      definition: "Healthy pride. 'Garv hai' = I'm proud.",
      related: "khush, izzat",
      example: "Mainu tuhade te garv hai. — I'm proud of you." },
    { id: "fe16", type: "vocab", punjabi: "shaqq",     english: "doubt / suspicion",
      definition: "Uncertainty. 'Shaqq pena' = to suspect.",
      related: "bharosa",
      example: "Mainu shaqq hai. — I have doubts." },
    { id: "fe17", type: "vocab", punjabi: "bharosa",   english: "trust / faith",
      definition: "Confidence in someone. 'Bharosa karna' = to trust.",
      related: "shaqq, pyar",
      example: "Mainu tuhade te bharosa hai. — I trust you." },
    { id: "fe18", type: "vocab", punjabi: "mafi",      english: "forgiveness / pardon",
      definition: "'Mafi mangna' = to ask forgiveness.",
      related: "Mainu maaf karo",
      example: "Mafi mango. — Apologize." },
    { id: "fe19", type: "vocab", punjabi: "shaanti",   english: "peace",
      definition: "Stillness; calm; absence of conflict. 'Sukh-shaanti' = well-being and peace.",
      related: "shaant, sukh",
      example: "Ghar vich shaanti rakho. — Keep peace at home." },
    { id: "fe20", type: "vocab", punjabi: "khauf",     english: "fear / dread",
      definition: "Stronger than 'darr' — deep fear.",
      related: "darr",
      example: "Khauf na khao. — Don't be terrified." },

    // ===== Personality adjectives =====
    { id: "pa1",  type: "vocab", punjabi: "siyaana",   english: "wise / clever",
      definition: "Smart and sensible. Used as praise.",
      related: "samajhdar, bewakoof",
      example: "Bahut siyaana munda. — A very wise boy." },
    { id: "pa2",  type: "vocab", punjabi: "bewakoof",  english: "foolish / silly",
      definition: "Without sense. Mild insult — use carefully.",
      related: "siyaana",
      example: "Bewakoof na bano. — Don't be foolish." },
    { id: "pa3",  type: "vocab", punjabi: "imaandar",  english: "honest",
      definition: "Truthful and trustworthy. Major compliment.",
      related: "sach, bharosa",
      example: "Imaandar bando. — Be honest." },
    { id: "pa4",  type: "vocab", punjabi: "bahadur",   english: "brave",
      definition: "Courageous. 'Bahaduri' = bravery (the noun).",
      related: "himmat, darpok",
      example: "Bahadur sipaahi. — A brave soldier." },
    { id: "pa5",  type: "vocab", punjabi: "darpok",    english: "cowardly / scared",
      definition: "Lacking courage. Mild insult.",
      related: "bahadur, darr",
      example: "Darpok na bano. — Don't be a coward." },
    { id: "pa6",  type: "vocab", punjabi: "ameer",     english: "rich / wealthy",
      definition: "Has lots of money.",
      related: "paisa, gareeb",
      example: "Ameer ghar. — A wealthy household." },
    { id: "pa7",  type: "vocab", punjabi: "gareeb",    english: "poor",
      definition: "Without much money. Use with respect.",
      related: "ameer",
      example: "Gareebaan di madad karo. — Help the poor." },
    { id: "pa8",  type: "vocab", punjabi: "mehnati",   english: "hardworking",
      definition: "From 'mehnat' (effort). Top compliment in Punjabi culture.",
      related: "mehnat, aalsi",
      example: "Mehnati bachcha. — A hardworking child." },
    { id: "pa9",  type: "vocab", punjabi: "aalsi",     english: "lazy",
      definition: "Doesn't like to work.",
      related: "mehnati",
      example: "Aalsi na bano. — Don't be lazy." },
    { id: "pa10", type: "vocab", punjabi: "pyaara",    english: "lovable / dear",
      definition: "Beloved. Feminine: 'pyaari'. Plural: 'pyaare'.",
      related: "pyar",
      example: "Mera pyaara puttar. — My dear son." },
    { id: "pa11", type: "vocab", punjabi: "dushman",   english: "enemy",
      definition: "An opponent or enemy.",
      related: "dost",
      example: "Dushman naal vi pyar. — Love even your enemy." },
    { id: "pa12", type: "vocab", punjabi: "apna",      english: "one's own",
      definition: "Belonging to oneself. Feminine: 'apni'. Used for family, friends, and home.",
      related: "mera, parivaar",
      example: "Apna ghar. — One's own home." },

    // ===== More verbs =====
    { id: "vb32", type: "vocab", punjabi: "banauna",       english: "to make / build",
      definition: "Make something. 'Khaana banauna' = to cook food.",
      related: "karna, todna",
      example: "Roti banai. — Made roti." },
    { id: "vb33", type: "vocab", punjabi: "todna",         english: "to break",
      definition: "Break something.",
      related: "jodna, banauna",
      example: "Glass todh dittha. — The glass broke." },
    { id: "vb34", type: "vocab", punjabi: "jodna",         english: "to join / to attach",
      definition: "Join two things together.",
      related: "todna",
      example: "Hath jod ke. — With folded hands." },
    { id: "vb35", type: "vocab", punjabi: "sambhalna",     english: "to take care of / handle",
      definition: "Care for or manage. 'Apne aap nu sambhalo' = take care of yourself.",
      related: "khayal rakhna",
      example: "Bachchey nu sambhalo. — Take care of the child." },
    { id: "vb36", type: "vocab", punjabi: "naachna",       english: "to dance",
      definition: "Move to music.",
      related: "naach, bhangra",
      example: "Sab naach rahe han. — Everyone is dancing." },
    { id: "vb37", type: "vocab", punjabi: "gauna",         english: "to sing",
      definition: "Sing a song.",
      related: "gaana, geet",
      example: "Mainu gaana gauna pasand. — I like to sing songs." },
    { id: "vb38", type: "vocab", punjabi: "dhona",         english: "to wash",
      definition: "Wash something.",
      related: "saaf",
      example: "Hath dho lo. — Wash your hands." },
    { id: "vb39", type: "vocab", punjabi: "intzar karna",  english: "to wait",
      definition: "Wait for someone or something.",
      related: "ruk",
      example: "Intzar karo. — Please wait." },
    { id: "vb40", type: "vocab", punjabi: "shuru karna",   english: "to start / begin",
      definition: "Begin something. 'Shuru' = beginning.",
      related: "khatam karna",
      example: "Kamm shuru karo. — Start the work." },
    { id: "vb41", type: "vocab", punjabi: "khatam karna",  english: "to finish / end",
      definition: "Complete something. 'Khatam' = finished.",
      related: "shuru karna",
      example: "Khaana khatam. — Food is finished." },
    { id: "vb42", type: "vocab", punjabi: "chunna",        english: "to choose / pick",
      definition: "Pick from options.",
      related: "pasand",
      example: "Ikk chuno. — Pick one." },
    { id: "vb43", type: "vocab", punjabi: "labhna",        english: "to find / search",
      definition: "Look for or find.",
      related: "milna",
      example: "Mainu chaabi labh nahin rahi. — I can't find the key." },
    { id: "vb44", type: "vocab", punjabi: "chhupna",       english: "to hide",
      definition: "Conceal yourself or something.",
      related: "labhna",
      example: "Bachche chhup gaye. — The kids hid." },
    { id: "vb45", type: "vocab", punjabi: "maarna",        english: "to hit / strike",
      definition: "Strike something. Often metaphorical too: 'phone maarna' = to call.",
      related: "chot",
      example: "Maaro mat! — Don't hit!" },
    { id: "vb46", type: "vocab", punjabi: "jagana",        english: "to wake (someone) up",
      definition: "Wake someone up. (Compare 'uthna' = to get up oneself.)",
      related: "uthna, sona",
      example: "Mainu satt vaje jagao. — Wake me at seven." },
    { id: "vb47", type: "vocab", punjabi: "kamana",        english: "to earn",
      definition: "Earn money. 'Kamana' is a celebrated value.",
      related: "paisa, kamm",
      example: "Mehnat naal kamana. — Earn through hard work." },
    { id: "vb49", type: "vocab", punjabi: "vechna",        english: "to sell",
      definition: "Give in exchange for money.",
      related: "khareedna, dukaan",
      example: "Ghar vech ditta. — Sold the house." },
    { id: "vb50", type: "vocab", punjabi: "ghussa karna",  english: "to get angry",
      definition: "Express anger. 'Ghussa' is the feeling.",
      related: "gussa, shaant",
      example: "Ghussa na karo. — Don't get angry." },

    // ===== Postpositions extension =====
    { id: "g29", type: "grammar", punjabi: "layi",  english: "for (postposition)",
      definition: "'Layi' = 'for' / 'in order to'. Comes after the noun.",
      related: "nu, naal",
      example: "Tuhade LAYI eh tohfa. — This gift is FOR you." },
    { id: "g30", type: "grammar", punjabi: "wargi", english: "like / similar to",
      definition: "Used to compare. Form changes by gender: warga (m), wargi (f), warge (pl).",
      example: "Maa WARGI. — Like a mother." },
    { id: "g31", type: "grammar", punjabi: "bina",  english: "without (postposition)",
      definition: "'Bina' = without. Comes after the noun.",
      related: "naal",
      example: "Paani BINA jeevan nahin. — No life WITHOUT water." },
    { id: "g32", type: "grammar", punjabi: "tak",   english: "until / up to",
      definition: "'Tak' marks the end-point of time or distance.",
      example: "Sham TAK aa jaana. — Come UNTIL evening (i.e., by evening)." },
    { id: "g33", type: "grammar", punjabi: "siwa",  english: "besides / except",
      definition: "'De siwa' = besides / except.",
      example: "Tuhade DE SIWA koi nahin. — There's no one BESIDES you." },
    { id: "g34", type: "grammar", punjabi: "vaste", english: "for the sake of",
      definition: "Stronger version of 'layi'. 'Tere vaste' = for your sake.",
      related: "layi",
      example: "Bachchey de VASTE. — FOR THE SAKE of the child." },

    // ===== Question patterns =====
    { id: "qp1", type: "phrase", punjabi: "Ki ___ hai?",
      english: "What is ___? / Is ___?",
      definition: "Yes/no question pattern. Add a noun in the blank.",
      example: "Ki paani hai? — Is there water? / Is it water?" },
    { id: "qp2", type: "phrase", punjabi: "Kithe ___?",
      english: "Where is ___?",
      definition: "Asking location.",
      example: "Kithe bazaar hai? — Where is the market?" },
    { id: "qp3", type: "phrase", punjabi: "Kis vele?",
      english: "At what time?",
      definition: "Asking specific time.",
      related: "Kinne vaje han?",
      example: "Kis vele aaoge? — At what time will you come?" },
    { id: "qp5", type: "phrase", punjabi: "Kithon aaye ho?",
      english: "Where have you come from?",
      definition: "Used for arrivals. 'Kithon' = from where.",
      related: "Tusi kithon ho?",
      example: "Kithon aaye ho ji? — Where have you come from, please?" },
    { id: "qp6", type: "phrase", punjabi: "Ki kar rahe ho?",
      english: "What are you doing?",
      definition: "Continuous tense question. Friendly check-in.",
      example: "Hun ki kar rahe ho? — What are you doing now?" },

    // ===== Time-of-day greetings =====
    { id: "gr1", type: "phrase", punjabi: "Subah bakhair",
      english: "Good morning.",
      definition: "Common across Hindi/Urdu/Punjabi. 'Bakhair' = with goodness.",
      related: "savere",
      example: "Subah bakhair ji! — Good morning!" },
    { id: "gr2", type: "phrase", punjabi: "Shubh subah",
      english: "Good morning (auspicious).",
      definition: "Slightly more formal/devotional. 'Shubh' = auspicious.",
      example: "Shubh subah ji. — Good morning." },
    { id: "gr3", type: "phrase", punjabi: "Shaam vadiya",
      english: "Good evening.",
      definition: "A friendly evening greeting. (More common: 'Sat sri akaal' any time of day.)",
      related: "sham",
      example: "Shaam vadiya ji. — Good evening." },
    { id: "gr4", type: "phrase", punjabi: "Shubh raat",
      english: "Good night.",
      definition: "Said at bedtime farewells.",
      related: "raat",
      example: "Shubh raat, mithe sapne. — Good night, sweet dreams." },
    { id: "gr5", type: "phrase", punjabi: "Sat sri akaal — har vele",
      english: "Hello — at any time of day.",
      definition: "Reminder: Sikhs use 'Sat sri akaal' as morning, evening, AND goodbye. When unsure, use it.",
      related: "Sat sri akaal",
      example: "Always safe: 'Sat sri akaal ji'." },

    // ===== Polite refusals =====
    { id: "nf1", type: "phrase", punjabi: "Nahin ji, shukriya",
      english: "No thank you (polite).",
      definition: "The standard polite decline. Adding 'ji' and 'shukriya' softens 'no'.",
      example: "Hor chai? Nahin ji, shukriya. — More tea? No thank you." },
    { id: "nf2", type: "phrase", punjabi: "Kade phir",
      english: "Some other time.",
      definition: "Soft postponement. 'Kade phir milaange' = we'll meet some other time.",
      example: "Aaj nahin, kade phir. — Not today, some other time." },
    { id: "nf3", type: "phrase", punjabi: "Aaj nahin ji",
      english: "Not today, please.",
      definition: "Polite decline for today specifically.",
      example: "Aaj nahin ji, kal aavaanga. — Not today, I'll come tomorrow." },
    { id: "nf4", type: "phrase", punjabi: "Bahut shukriya, par bas",
      english: "Many thanks, but enough.",
      definition: "When declining more food/drink politely.",
      related: "Bas ji bahut ho gaya",
      example: "Bahut shukriya, par bas, pet bhar gaya. — Thanks so much, but enough, I'm full." },
    { id: "nf5", type: "phrase", punjabi: "Mainu maaf karo, main nahin kar sakda",
      english: "Sorry, I cannot do that.",
      definition: "Polite firm refusal. (Female: 'sakdi'.)",
      example: "Maaf karo ji, main nahin kar sakda. — Sorry, I can't do it." },
    { id: "nf6", type: "phrase", punjabi: "Sochke dasaanga",
      english: "I'll think about it and let you know.",
      definition: "Buy time politely instead of saying no immediately.",
      example: "Sochke dasaanga ji. — I'll think and tell you." },

    // ===== Phone call etiquette =====
    { id: "ph1", type: "phrase", punjabi: "Hello ji",
      english: "Hello (on phone).",
      definition: "Standard phone opening. 'Ji' makes it warm.",
      example: "Hello ji, kaun? — Hello, who is this?" },
    { id: "ph2", type: "phrase", punjabi: "Kaun bol reha hai?",
      english: "Who is speaking?",
      definition: "Asking the caller's identity. (Female speaker: 'bol rahi hai'.)",
      example: "Maaf karna, kaun bol reha hai? — Excuse me, who's speaking?" },
    { id: "ph3", type: "phrase", punjabi: "Ravi naal gall karaani hai",
      english: "I'd like to speak with Ravi.",
      definition: "Pattern: '___ naal gall karaani hai'. Replace name as needed.",
      example: "Mami ji naal gall karaani hai. — I'd like to speak with Auntie." },
    { id: "ph4", type: "phrase", punjabi: "Ikk minute hold karo",
      english: "One minute, please hold.",
      definition: "Asking the caller to wait. 'Hold' borrowed from English.",
      related: "Mehrbaani karke ikk minute",
      example: "Ji, ikk minute hold karo. — Yes, hold one minute please." },
    { id: "ph5", type: "phrase", punjabi: "Baad vich phone karaanga",
      english: "I'll call later.",
      definition: "Polite postponement of a call. (Female: 'karaangi'.)",
      example: "Baad vich phone karaanga, hun busy haan. — I'll call later, I'm busy now." },
    { id: "ph6", type: "phrase", punjabi: "Awaaz nahin aa rahi",
      english: "I can't hear (your voice).",
      definition: "When the line is bad. 'Awaaz' = voice/sound.",
      example: "Awaaz nahin aa rahi, phir karo. — I can't hear, call again." },

    // ===== Classroom commands =====
    { id: "cr1", type: "phrase", punjabi: "Khol lo kitaab",
      english: "Please open your book.",
      definition: "Common teacher instruction.",
      related: "kholna, kitaab",
      example: "Khol lo kitaab, panna 10. — Open your book, page 10." },
    { id: "cr2", type: "phrase", punjabi: "Likh lo",
      english: "Please write it down.",
      definition: "Asking students to take notes.",
      related: "likhna",
      example: "Eh shabad likh lo. — Write down this word." },
    { id: "cr3", type: "phrase", punjabi: "Suno te dohrao",
      english: "Listen and repeat.",
      definition: "Classic language-class instruction.",
      related: "sunna",
      example: "Hun suno te dohrao. — Now listen and repeat." },
    { id: "cr4", type: "phrase", punjabi: "Sawaal puchho",
      english: "Please ask questions.",
      definition: "Inviting questions.",
      related: "saval",
      example: "Koi sawaal puchho? — Any questions to ask?" },
    { id: "cr5", type: "phrase", punjabi: "Theek hai?",
      english: "Is that okay? / Got it?",
      definition: "Quick check-in question.",
      related: "samajh aayi?",
      example: "Theek hai? Aage chaliye. — Okay? Let's continue." },
    { id: "cr6", type: "phrase", punjabi: "Samajh aayi?",
      english: "Did you understand?",
      definition: "Asks if a learner caught the lesson. Note the feminine ending matching 'samajh'.",
      related: "Mainu samajh aa gayi",
      example: "Samajh aayi ji? — Did you understand?" },
    { id: "cr7", type: "phrase", punjabi: "Phir koshish karo",
      english: "Try again, please.",
      definition: "Encouraging another attempt.",
      related: "Koshish karo",
      example: "Galat? Koi gall nahin, phir koshish karo. — Wrong? No problem, try again." },
    { id: "cr8", type: "phrase", punjabi: "Bahut vadiya!",
      english: "Excellent! / Very good!",
      definition: "Highest classroom praise.",
      related: "Shabaash, Vadiya kamm",
      example: "Bahut vadiya, shabaash! — Excellent, well done!" },

    // ===== Survival / emergency =====
    { id: "em1", type: "phrase", punjabi: "Madad!",
      english: "Help!",
      definition: "Single-word call for help.",
      related: "Madad chahidi hai?",
      example: "Madad! Koi aao! — Help! Someone come!" },
    { id: "em2", type: "phrase", punjabi: "Doctor bulao",
      english: "Call a doctor.",
      definition: "Emergency request.",
      related: "doctor, hospital",
      example: "Jaldi doctor bulao! — Quickly call a doctor!" },
    { id: "em3", type: "phrase", punjabi: "Aag laggi hai!",
      english: "There's a fire!",
      definition: "Fire emergency alert.",
      related: "aag",
      example: "Bahar nikalo, aag laggi hai! — Get out, there's a fire!" },
    { id: "em4", type: "phrase", punjabi: "Police bulao",
      english: "Call the police.",
      definition: "Emergency request.",
      example: "Police bulao, jaldi! — Call the police, quickly!" },
    { id: "em5", type: "phrase", punjabi: "Mainu chot laggi",
      english: "I am hurt.",
      definition: "Reporting injury. (Female: same; gender shows on the verb only when extended.)",
      related: "chot, dard",
      example: "Mainu chot laggi, madad karo. — I'm hurt, please help." },
    { id: "em6", type: "phrase", punjabi: "Hospital kithe hai?",
      english: "Where is the hospital?",
      definition: "Critical question to know.",
      related: "hospital",
      example: "Mainu dasso, hospital kithe hai? — Tell me, where is the hospital?" },
    { id: "em7", type: "phrase", punjabi: "Mainu darr lagda hai",
      english: "I'm scared.",
      definition: "Sharing fear. 'Lagda' is masculine; female speaker uses 'lagdi'.",
      related: "darr",
      example: "Mainu darr lagda hai, sath raho. — I'm scared, stay with me." },
    { id: "em8", type: "phrase", punjabi: "Sambhal ke!",
      english: "Be careful! / Watch out!",
      definition: "Warning to someone in danger.",
      related: "sambhalna",
      example: "Sambhal ke! Gaddi aa rahi! — Watch out! A car is coming!" },

    // ===== Idioms & sayings (beginner-safe) =====
    { id: "id1",  type: "phrase", punjabi: "Mehnat da phal mitha",
      english: "The fruit of hard work is sweet.",
      definition: "Classic Punjabi proverb. Effort eventually rewards you.",
      related: "mehnat",
      example: "Padhai jaari rakh — mehnat da phal mitha. — Keep studying — hard work's fruit is sweet." },
    { id: "id2",  type: "phrase", punjabi: "Sukh vele Rabb yaad",
      english: "We remember God only in good times (irony).",
      definition: "A wry saying — people forget God when comfortable. Reminds us to be grateful always.",
      related: "Rabb, sukh",
      example: "Quoted to remind someone to be grateful in easy times too." },
    { id: "id3",  type: "phrase", punjabi: "Naam vadda, darshan chhote",
      english: "Big name, small substance.",
      definition: "Used when something/someone has more reputation than reality.",
      example: "Eh dukaan da naam vadda, darshan chhote. — This shop's name is big, but reality is small." },
    { id: "id4",  type: "phrase", punjabi: "Hath joran",
      english: "To fold hands (= to plead / beg humbly).",
      definition: "Literally folding hands in prayer-like gesture; figuratively pleading.",
      related: "Mainu maaf karo",
      example: "Main hath jod ke benti karda haan. — I plead with folded hands." },
    { id: "id5",  type: "phrase", punjabi: "Pair pakadne",
      english: "To touch (someone's) feet (= to seek forgiveness/blessing).",
      definition: "Highest gesture of humility — touching elder's feet for blessing or apology.",
      related: "satkaar",
      example: "Bachche ne dada ji de pair pakade. — The child touched grandfather's feet." },
    { id: "id6",  type: "phrase", punjabi: "Akhaan vich paani",
      english: "Tears in the eyes (lit.).",
      definition: "Used when someone is moved emotionally — happy or sad.",
      related: "rona, dukh",
      example: "Vidaai vele akhaan vich paani aa gaya. — Tears came at the farewell." },
    { id: "id7",  type: "phrase", punjabi: "Dil te hath rakhke",
      english: "With your hand on your heart (= honestly).",
      definition: "Used when asking for an honest answer.",
      related: "sach, imaandar",
      example: "Dil te hath rakh ke das. — Tell me honestly." },
    { id: "id8",  type: "phrase", punjabi: "Apni-apni dhol",
      english: "Everyone plays their own drum (= everyone praises themselves).",
      definition: "Used when people talk only of their own merits.",
      related: "dhol, garv",
      example: "Sab apni-apni dhol vajaande han. — Everyone is beating their own drum." },
    { id: "id9",  type: "phrase", punjabi: "Munh nu lagam",
      english: "A bridle on the mouth (= speak less / hold your tongue).",
      definition: "Advice to think before speaking.",
      related: "bolna, sach",
      example: "Munh nu lagam de — soch ke bol. — Bridle your mouth — think before speaking." },
    { id: "id10", type: "phrase", punjabi: "Chardi kala vich rahe",
      english: "Stay in rising spirits.",
      definition: "Sikh blessing/farewell — stay optimistic and upbeat through everything.",
      related: "Chardi kala",
      example: "Hamesha chardi kala vich raho. — Always stay in rising spirits." },

    // ===== Round 3: Be-verb full paradigm (hona) =====
    { id: "bv1", type: "grammar", punjabi: "haan",
      english: "am (with main / asin)",
      definition: "Present 'be' for 1st person. 'Main haan' = I am. 'Asin haan' = we are.",
      related: "hain, hai, han",
      example: "Main theek HAAN. — I AM fine." },
    { id: "bv2", type: "grammar", punjabi: "hain",
      english: "are (with tu — informal you)",
      definition: "Present 'be' for informal singular 'you'. 'Tu kithe hain?' = Where are you?",
      related: "haan, ho, han",
      example: "Tu kithe HAIN? — Where ARE you?" },
    { id: "bv3", type: "grammar", punjabi: "ho",
      english: "are (with tusi — polite/plural you)",
      definition: "Present 'be' for polite or plural 'you'. 'Tusi kithon ho?' = Where are you from?",
      related: "haan, hain, han",
      example: "Tusi kive HO? — How ARE you (polite)?" },
    { id: "bv4", type: "grammar", punjabi: "hai",
      english: "is (singular 3rd person)",
      definition: "Present 'be' for 'he/she/it'. 'Oh ghar hai' = He/she is at home.",
      related: "han, haan",
      example: "Eh kitaab HAI. — This IS a book." },
    { id: "bv5", type: "grammar", punjabi: "han",
      english: "are (plural 3rd person)",
      definition: "Present 'be' for 'they' / plural. 'Oh ghar han' = They are at home.",
      related: "hai",
      example: "Bachche school HAN. — The kids ARE at school." },
    { id: "bv6", type: "grammar", punjabi: "si",
      english: "was (masculine singular)",
      definition: "Past 'be' for masculine singular. 'Main ghar si' = I was at home (male).",
      related: "sigi, sigee, san",
      example: "Oh kal ithe SI. — He WAS here yesterday." },
    { id: "bv7", type: "grammar", punjabi: "sigi",
      english: "was (feminine singular)",
      definition: "Past 'be' for feminine singular. 'Main ghar sigi' = I was at home (female).",
      related: "si, sigeean, san",
      example: "Oh kal ithe SIGI. — She WAS here yesterday." },
    { id: "bv8", type: "grammar", punjabi: "san",
      english: "were (plural)",
      definition: "Past 'be' plural. 'Asin ghar san' = We were at home.",
      related: "si, sigi",
      example: "Bachche school SAN. — The kids WERE at school." },
    { id: "bv9", type: "grammar", punjabi: "nahin hai / nahin han",
      english: "is not / are not",
      definition: "Negate present 'be' by adding 'nahin' before the form. 'Oh ghar nahin hai.'",
      related: "nahin",
      example: "Paani NAHIN HAI. — There IS NO water." },
    { id: "bv10", type: "grammar", punjabi: "nahin si / nahin sigi",
      english: "was not",
      definition: "Negate past 'be' the same way. Match gender on 'si/sigi'.",
      related: "si, sigi",
      example: "Main kal ithe NAHIN SI. — I WAS NOT here yesterday." },

    // ===== Pronoun cases full table =====
    { id: "pcs1", type: "grammar", punjabi: "main / mainu / mera",
      english: "I / to-me / my (m.)",
      definition: "Subject / object / possessive. Feminine possessive = 'meri'; plural = 'mere'.",
      related: "asin, sanu, saada",
      example: "MAIN aaya, MAINU bhukh, MERA ghar. — I came, I'm hungry, my home." },
    { id: "pcs2", type: "grammar", punjabi: "asin / sanu / saada",
      english: "we / to-us / our (m.)",
      definition: "1st person plural set. Fem. = 'saadi'; pl. = 'saade'.",
      related: "main",
      example: "ASIN jaa rahe, SANU dasso, SAADA pind. — We are going, tell us, our village." },
    { id: "pcs3", type: "grammar", punjabi: "tu / tainu / tera",
      english: "you (informal) / to-you / your",
      definition: "Informal singular — used with kids, close friends, God. Fem. = 'teri'; pl. = 'tere'.",
      related: "tusi, tuhanu",
      example: "TU aa, TAINU dasaan, TERA naam. — You come, I'll tell you, your name." },
    { id: "pcs4", type: "grammar", punjabi: "tusi / tuhanu / tuhada",
      english: "you (polite/plural) / to-you / your",
      definition: "Default polite 'you'. Use unless you know each other well. Fem. = 'tuhadi'.",
      related: "tu",
      example: "TUSI baitho, TUHANU chai?, TUHADA ghar. — Please sit, tea for you?, your home." },
    { id: "pcs5", type: "grammar", punjabi: "oh / ohnu / ohda",
      english: "he·she·that / to-him·her / his·her",
      definition: "3rd person singular (he/she/it/that). No gender split on the pronoun itself; only on possessive: ohda (m.) / ohdi (f.).",
      related: "ehnu, ehda",
      example: "OH aaya, OHNU dasso, OHDA ghar. — He came, tell him, his home." },
    { id: "pcs6", type: "grammar", punjabi: "eh / ehnu / ehda",
      english: "this / to-this / of-this",
      definition: "3rd person 'this' (close). Parallel to oh/ohnu/ohda but for nearby person/thing.",
      related: "oh",
      example: "EH meri bhain, EHNU bulao, EHDA naam Simran. — This is my sister, call her, her name is Simran." },
    { id: "pcs7", type: "grammar", punjabi: "oh (plural) / ohnaan / ohnaan da",
      english: "they / to-them / their",
      definition: "Plural 3rd person. 'Ohnaan' is the oblique form. Possessive: 'ohnaan da' (m.) / 'di' (f.).",
      related: "oh",
      example: "OH aaye, OHNAAN nu pucho, OHNAAN DA ghar. — They came, ask them, their home." },
    { id: "pcs8", type: "grammar", punjabi: "kaun / kis / kis da",
      english: "who / whom / whose",
      definition: "Question pronoun set. 'Kis' is oblique. 'Kis da' = whose (m.) / 'kis di' (f.).",
      related: "ki",
      example: "KAUN hai? KIS nu chahidi? KIS DA mobile? — Who is it? Whom does it belong to? Whose mobile?" },

    // ===== Present-tense verb conjugation (model: karna = to do) =====
    { id: "vc1", type: "grammar", punjabi: "main karda haan / kardi haan",
      english: "I do / I am doing (m./f.)",
      definition: "Habitual present. Pattern: stem + da/di/de + 'be' verb. Match gender (-da m., -di f.).",
      related: "karna, haan",
      example: "Main roz kamm KARDA HAAN. — I do work daily (male speaker)." },
    { id: "vc2", type: "grammar", punjabi: "tu karda hain / kardi hain",
      english: "you (informal) do",
      definition: "Singular informal. Match gender of subject.",
      related: "tu, hain",
      example: "Tu ki KARDA HAIN? — What do you do?" },
    { id: "vc3", type: "grammar", punjabi: "tusi karde ho / kardiyaan ho",
      english: "you (polite) do",
      definition: "Polite/plural. Plural ending '-de' (m.) or '-diyaan' (f.).",
      related: "tusi, ho",
      example: "Tusi kithe kamm KARDE HO? — Where do you (polite) work?" },
    { id: "vc4", type: "grammar", punjabi: "oh karda hai / kardi hai",
      english: "he/she does",
      definition: "Singular 3rd person. 'Hai' for both genders; '-da/-di' carries the gender.",
      related: "oh, hai",
      example: "Oh roz yoga KARDI HAI. — She does yoga daily." },
    { id: "vc5", type: "grammar", punjabi: "oh karde han / kardiyaan han",
      english: "they do",
      definition: "Plural 3rd person. Plural verb form + 'han'.",
      related: "han",
      example: "Bachche school vich padhai KARDE HAN. — The kids study at school." },
    { id: "vc6", type: "grammar", punjabi: "main jaanda / jaandi haan",
      english: "I go / I am going",
      definition: "Same pattern with 'jaana' (to go). Stem 'jaa' → jaanda (m.) / jaandi (f.).",
      related: "jaana",
      example: "Main daftar JAANDA HAAN. — I go to the office." },
    { id: "vc7", type: "grammar", punjabi: "main khaanda / khaandi haan",
      english: "I eat",
      definition: "From 'khaana'. Stem 'khaa' → khaanda / khaandi.",
      related: "khaana",
      example: "Main mass nahin KHAANDA. — I don't eat meat." },

    // ===== Past-tense verb conjugation =====
    { id: "vc8", type: "grammar", punjabi: "main kita / kiti",
      english: "I did (m./f.)",
      definition: "Simple past of 'karna'. 'Kita' (m. speaker), 'Kiti' (f. speaker). For transitive past, the verb agrees with the OBJECT, not subject — advanced point.",
      related: "karna",
      example: "Main kamm KITA. — I did the work." },
    { id: "vc9", type: "grammar", punjabi: "main gaya / gayi",
      english: "I went",
      definition: "Simple past of 'jaana'. Match gender of subject (intransitive).",
      related: "jaana",
      example: "Main bazaar GAYA. — I went to the market (male)." },
    { id: "vc10", type: "grammar", punjabi: "main aaya / aayi",
      english: "I came",
      definition: "Simple past of 'aana'. Aaya (m.) / Aayi (f.).",
      related: "aana",
      example: "Main hune AAYI. — I just came (female)." },
    { id: "vc11", type: "grammar", punjabi: "main khaada / khaadi",
      english: "I ate",
      definition: "Past of 'khaana'. The food (object) decides gender: 'roti khaadi', 'aam khaada'.",
      related: "khaana",
      example: "Main roti KHAADI. — I ate roti." },
    { id: "vc12", type: "grammar", punjabi: "main piti / pitta",
      english: "I drank",
      definition: "Past of 'peena'. 'Chai piti' (chai is fem.), 'paani pitta' (paani is masc.).",
      related: "peena",
      example: "Main chai PITI. — I drank tea." },

    // ===== Future-tense verb conjugation =====
    { id: "vc13", type: "grammar", punjabi: "main karaanga / karaangi",
      english: "I will do",
      definition: "Future tense. Add '-aanga' (m.) or '-aangi' (f.) to stem.",
      related: "karna",
      example: "Main kal kamm KARAANGA. — I will do the work tomorrow." },
    { id: "vc14", type: "grammar", punjabi: "tu karenga / karengi",
      english: "you (informal) will do",
      definition: "Informal singular future. '-enga' / '-engi'.",
      related: "tu",
      example: "Tu ki KARENGA? — What will you do?" },
    { id: "vc15", type: "grammar", punjabi: "tusi karoge / karogiyaan",
      english: "you (polite) will do",
      definition: "Polite/plural future. '-oge' (m.) / '-ogiyaan' (f.).",
      related: "tusi",
      example: "Tusi aaoge? — Will you (polite) come?" },
    { id: "vc16", type: "grammar", punjabi: "oh karega / karegi",
      english: "he/she will do",
      definition: "Singular 3rd person future. '-ega' (m.) / '-egi' (f.).",
      related: "oh",
      example: "Oh kal AAYEGA. — He will come tomorrow." },
    { id: "vc17", type: "grammar", punjabi: "oh karange / karangiyaan",
      english: "they will do",
      definition: "Plural 3rd person future.",
      related: "han",
      example: "Bachche khelange. — The kids will play." },
    { id: "vc18", type: "grammar", punjabi: "main jaaonga / jaaongi",
      english: "I will go",
      definition: "Future of 'jaana' (irregular vowel). Match gender.",
      related: "jaana",
      example: "Main pind JAAONGA. — I will go to the village." },

    // ===== Imperative & polite request forms =====
    { id: "im1", type: "grammar", punjabi: "kar",
      english: "do! (most informal)",
      definition: "Bare stem = command to a child or close friend. Avoid with strangers — sounds rude.",
      related: "karna",
      example: "Kamm KAR. — Do the work (informal)." },
    { id: "im2", type: "grammar", punjabi: "karo",
      english: "do (please) — polite/plural",
      definition: "Default polite imperative. Used in most situations.",
      related: "karna",
      example: "Mehrbaani karke kamm KARO. — Please do the work." },
    { id: "im4", type: "grammar", punjabi: "karna ji",
      english: "(would you) do, please",
      definition: "Even softer — uses the infinitive as a polite request. Common Punjabi style.",
      example: "Eh chithi pohanchaa dena JI. — Please deliver this letter." },
    { id: "im5", type: "phrase", punjabi: "Mehrbaani karke ___",
      english: "Please ___ (formal).",
      definition: "Formal request opener. Fill in any verb.",
      related: "Kirpa karke",
      example: "Mehrbaani karke darvaaza band karo. — Please close the door." },
    { id: "im6", type: "phrase", punjabi: "Kirpa karke ___",
      english: "Kindly ___.",
      definition: "More devotional/formal version. Common in announcements.",
      related: "Mehrbaani karke",
      example: "Kirpa karke shaant raho. — Kindly remain quiet." },

    // ===== Compound verbs — completion (light verbs) =====
    { id: "lvb1", type: "grammar", punjabi: "kar lo",
      english: "go ahead and do (it)",
      definition: "Adding 'lo/lai' adds the sense of 'completion FOR yourself'. Friendly, encouraging.",
      related: "karna, lena",
      example: "Khaana KHA LO. — Go ahead and eat (for yourself)." },
    { id: "lvb2", type: "grammar", punjabi: "de do",
      english: "give (it away)",
      definition: "'Do/de' adds 'completion FOR someone else'. 'De do' = give (to them).",
      related: "denna",
      example: "Eh ohnu DE DO. — Give this to him." },
    { id: "lvb3", type: "grammar", punjabi: "ho gaya",
      english: "(it) happened / is done",
      definition: "'Ho gaya' = completed. Very common. Feminine: 'ho gayi'.",
      related: "hona, jaana",
      example: "Kamm HO GAYA. — The work is done." },
    { id: "lvb4", type: "grammar", punjabi: "aa gaya",
      english: "(he) has come / arrived",
      definition: "'Aa gaya' = arrived. The 'gaya' adds completion to 'aa' (come).",
      related: "aana, jaana",
      example: "Bus AA GAYI. — The bus has arrived." },
    { id: "lvb5", type: "grammar", punjabi: "kha lo",
      english: "go ahead and eat",
      definition: "Friendly invitation to eat. The 'lo' is warm — 'for yourself'.",
      related: "khaana",
      example: "Garam roti KHA LO. — Eat the warm roti." },
    { id: "lvb6", type: "grammar", punjabi: "pee lo",
      english: "go ahead and drink",
      definition: "Same pattern with 'peena'.",
      related: "peena",
      example: "Chai PEE LO. — Drink your tea." },
    { id: "lvb7", type: "grammar", punjabi: "le lo",
      english: "take (it for yourself)",
      definition: "Offering. 'Le lo' = please take (it).",
      related: "lena",
      example: "Eh tohfa LE LO. — Take this gift." },
    { id: "lvb8", type: "grammar", punjabi: "dass do",
      english: "tell (someone)",
      definition: "'Do' adds direction toward the listener. 'Dass do' = tell (to them).",
      related: "dassna",
      example: "Mainu DASS DO. — Tell me." },

    // ===== Compound verbs — direction / benefit =====
    { id: "lvb9", type: "grammar", punjabi: "le aao",
      english: "bring (it)",
      definition: "'Le' (take) + 'aao' (come) = bring. A frequent compound.",
      related: "lena, aana",
      example: "Paani LE AAO. — Bring water." },
    { id: "lvb10", type: "grammar", punjabi: "le jao",
      english: "take (it away)",
      definition: "'Le' + 'jao' (go) = take away.",
      related: "lena, jaana",
      example: "Eh chithi LE JAO. — Take this letter (away)." },
    { id: "lvb11", type: "grammar", punjabi: "suna do",
      english: "tell / make (someone) hear",
      definition: "Causative + completion. 'Suna do' = make me hear it.",
      related: "sunna",
      example: "Apna gaana SUNA DO. — Sing me your song." },
    { id: "lvb12", type: "grammar", punjabi: "dikha do",
      english: "show (it)",
      definition: "'Dikha' (show) + 'do' (give-direction).",
      related: "vekhna",
      example: "Tasveer DIKHA DO. — Show me the picture." },
    { id: "lvb13", type: "grammar", punjabi: "bana do",
      english: "make (it for someone)",
      definition: "'Bana' (make) + 'do' = make for me/them.",
      related: "banauna",
      example: "Chai BANA DO. — Make tea (for me/us)." },
    { id: "lvb14", type: "grammar", punjabi: "rakh do",
      english: "place (it down)",
      definition: "'Rakh' (place) + 'do' = put it down (for someone or just complete it).",
      related: "rakhna",
      example: "Mez te RAKH DO. — Place it on the table." },

    // ===== Continuous aspect =====
    { id: "cs1", type: "grammar", punjabi: "main kar reha haan / rahi haan",
      english: "I am doing (right now)",
      definition: "Present continuous. Stem + 'reha/rahi/rahe' + 'be' verb. Match gender.",
      related: "karna",
      example: "Main padhai KAR REHA HAAN. — I am studying right now." },
    { id: "cs2", type: "grammar", punjabi: "tu kar reha hain / rahi hain",
      english: "you (informal) are doing",
      definition: "Informal singular continuous.",
      related: "tu",
      example: "Tu ki KAR REHA HAIN? — What are you doing?" },
    { id: "cs3", type: "grammar", punjabi: "tusi kar rahe ho",
      english: "you (polite) are doing",
      definition: "Polite/plural continuous. Plural form 'rahe' (m.) / 'rahiyaan' (f.).",
      related: "tusi",
      example: "Tusi ki KAR RAHE HO? — What are you doing (polite)?" },
    { id: "cs4", type: "grammar", punjabi: "oh kar reha hai / rahi hai",
      english: "he/she is doing",
      definition: "3rd person singular continuous. 'Hai' for both; 'reha/rahi' carries gender.",
      related: "oh",
      example: "Oh khaana BANA RAHI HAI. — She is making food." },
    { id: "cs5", type: "grammar", punjabi: "main ja raha si",
      english: "I was going",
      definition: "Past continuous. Stem + 'raha/rahi' + 'si/sigi'. Match gender.",
      related: "jaana, si",
      example: "Main bazaar JA RAHA SI jadon barish hoyi. — I was going to the market when it rained." },
    { id: "cs6", type: "grammar", punjabi: "kar reha hovega",
      english: "(he) will be doing / probably is doing",
      definition: "Future / probable continuous. Used to guess what someone is doing.",
      related: "hovega",
      example: "Hun oh so REHA HOVEGA. — He's probably sleeping now." },

    // ===== Conditional & hypothetical =====
    { id: "cd1", type: "grammar", punjabi: "Je ___, taan ___",
      english: "If ___, then ___",
      definition: "Basic conditional pattern. 'Je' = if, 'taan' = then.",
      related: "agar",
      example: "JE meeh peya, TAAN ghar reh javaange. — IF it rains, THEN we'll stay home." },
    { id: "cd2", type: "grammar", punjabi: "Je ___ hunda, taan ___ hunda",
      english: "If ___ had been, then ___ would have been",
      definition: "Past unreal conditional ('hunda' = would have been).",
      example: "Je main jaanda, TAAN dass ditta HUNDA. — If I had known, I would have told you." },
    { id: "cd3", type: "grammar", punjabi: "agar",
      english: "if (Urdu/Hindi loan)",
      definition: "Synonym of 'je'. Both are used. 'Agar… magar…' = if… but…",
      related: "je",
      example: "AGAR tusi aaoge taan acha hovega. — If you come, that'll be nice." },
    { id: "cd4", type: "grammar", punjabi: "magar",
      english: "but (conditional contrast)",
      definition: "Stronger contrast than 'par'. Often paired with 'agar'.",
      related: "par, agar",
      example: "Main aavaanga MAGAR der naal. — I'll come BUT late." },
    { id: "cd5", type: "phrase", punjabi: "shayad",
      english: "perhaps / maybe.",
      definition: "Used to soften a claim or guess.",
      related: "ho sakda",
      example: "SHAYAD oh kal aavega. — He'll PERHAPS come tomorrow." },
    { id: "cd6", type: "phrase", punjabi: "ho sakda hai",
      english: "it's possible / could be.",
      definition: "'Ho sakda hai ki…' = it's possible that…",
      related: "shayad",
      example: "HO SAKDA HAI ki barish hove. — It's possible that it might rain." },

    // ===== Conjunctions =====
    { id: "cj2", type: "grammar", punjabi: "ate",
      english: "and (formal)",
      definition: "More formal/written form of 'te'.",
      related: "te",
      example: "Punjabi ATE Hindi. — Punjabi AND Hindi." },
    { id: "cj4", type: "grammar", punjabi: "lekin",
      english: "but (formal)",
      definition: "Formal/written 'but'. From Urdu.",
      related: "par",
      example: "Acha plan, LEKIN mehnga. — Good plan, BUT expensive." },
    { id: "cj5", type: "grammar", punjabi: "ya",
      english: "or",
      definition: "Choosing between options.",
      example: "Chai YA coffee? — Tea OR coffee?" },
    { id: "cj6", type: "grammar", punjabi: "kyunki",
      english: "because",
      definition: "Gives a reason. Comes between two clauses.",
      related: "is layi",
      example: "Main nahin aaya KYUNKI bimaar si. — I didn't come BECAUSE I was sick." },
    { id: "cj7", type: "grammar", punjabi: "is layi",
      english: "therefore / so",
      definition: "Result connector. 'Bimaar si, IS LAYI nahin aaya.'",
      related: "kyunki",
      example: "Barish hoyi, IS LAYI ghar reh gaye. — It rained, SO we stayed home." },
    { id: "cj8", type: "grammar", punjabi: "bhaaven",
      english: "although / even though",
      definition: "Concession connector.",
      related: "phir vi",
      example: "BHAAVEN thakeya, PHIR VI aaya. — EVEN THOUGH tired, he came anyway." },
    { id: "cj9", type: "grammar", punjabi: "phir vi",
      english: "even so / still",
      definition: "Pairs with 'bhaaven' or stands alone.",
      related: "bhaaven",
      example: "Mehnga hai, PHIR VI khareedan. — It's expensive, STILL I'll buy it." },
    { id: "cj10", type: "grammar", punjabi: "jadon",
      english: "when (relative)",
      definition: "Used inside sentences ('when X, Y'). Different from question 'kadon?'.",
      related: "kadon",
      example: "JADON main pohanchaan, phone karaanga. — WHEN I arrive, I'll call." },
    { id: "cj11", type: "grammar", punjabi: "jithe",
      english: "where (relative)",
      definition: "Inside sentences. Different from question 'kithe?'.",
      related: "kithe",
      example: "JITHE tusi raho, oh ghar saaf hai. — WHEREVER you stay, that home is clean." },
    { id: "cj12", type: "grammar", punjabi: "jo",
      english: "who / which / that",
      definition: "Relative pronoun introducing a clause.",
      example: "Oh banda JO kal aaya si. — The man WHO came yesterday." },

    // ===== Discourse markers / fillers =====
    { id: "dm1", type: "phrase", punjabi: "oye",
      english: "hey! / oh! (informal).",
      definition: "Casual attention-getter. Use with friends only — can sound rude with strangers.",
      example: "OYE, kithe ja reha? — HEY, where are you going?" },
    { id: "dm2", type: "phrase", punjabi: "lai",
      english: "here, take this / well then.",
      definition: "Filler when handing something over or starting a new thought.",
      example: "LAI, eh paisa rakh. — HERE, keep this money." },
    { id: "dm3", type: "phrase", punjabi: "chal",
      english: "come on / let's go / okay.",
      definition: "Multipurpose: 'let's go', 'okay fine', 'come on'.",
      related: "chalo",
      example: "CHAL phir milange. — OK then, see you later." },
    { id: "dm4", type: "phrase", punjabi: "bas",
      english: "enough / just / that's it.",
      definition: "Marks completion or limit. 'Bas ho gaya' = that's enough.",
      example: "BAS ji bahut. — THAT'S enough, thank you." },
    { id: "dm5", type: "phrase", punjabi: "hor",
      english: "more / what else (filler).",
      definition: "'Hor ki?' is the classic Punjabi 'so what's up?' check-in.",
      example: "HOR ki haal? — WHAT ELSE is up?" },
    { id: "dm7", type: "phrase", punjabi: "sahi",
      english: "right / correct / true.",
      definition: "Quick agreement.",
      related: "theek",
      example: "SAHI gall! — RIGHT said!" },
    { id: "dm8", type: "phrase", punjabi: "yaar",
      english: "buddy / pal / man.",
      definition: "Term of friendly address — like 'man' or 'dude'. Used between close friends.",
      example: "YAAR, sun. — Listen, MAN." },
    { id: "dm9", type: "phrase", punjabi: "dekh",
      english: "look / see (informal).",
      definition: "Attention-getter. 'Dekho' for polite.",
      related: "vekhna",
      example: "DEKH, ainj kar. — LOOK, do it like this." },
    { id: "dm10", type: "phrase", punjabi: "suno",
      english: "listen / hey.",
      definition: "Polite attention-getter. Common to address strangers.",
      related: "sunna",
      example: "SUNO ji, station kithe? — LISTEN please, where's the station?" },

    // ===== Storytelling connectors =====
    { id: "st1", type: "phrase", punjabi: "ikk vaari",
      english: "once / one time.",
      definition: "Story opener — like 'once upon a time'.",
      example: "IKK VAARI di gall hai. — IT'S a story FROM ONE TIME." },
    { id: "st3", type: "phrase", punjabi: "achanak",
      english: "suddenly.",
      definition: "Adds drama to a story.",
      example: "ACHANAK barish shuru ho gayi. — SUDDENLY rain started." },
    { id: "st4", type: "phrase", punjabi: "akhir vich",
      english: "in the end / finally.",
      definition: "Closing the story.",
      related: "akhri",
      example: "AKHIR VICH sab khush. — IN THE END everyone was happy." },
    { id: "st5", type: "phrase", punjabi: "us toon baad",
      english: "after that.",
      definition: "Sequence connector. 'Us' = that.",
      related: "phir",
      example: "US TOON BAAD asin ghar gaye. — AFTER THAT we went home." },
    { id: "st6", type: "phrase", punjabi: "pehlaan",
      english: "first / before.",
      definition: "Opens the first event. 'Pehlaan-pehlaan' = at first.",
      related: "pehla",
      example: "PEHLAAN chai banai, phir nashta. — FIRST I made tea, then breakfast." },
    { id: "st7", type: "phrase", punjabi: "is to ilawa",
      english: "besides this / additionally.",
      definition: "Adds another point.",
      example: "IS TO ILAWA oh gaana vi gaunda. — BESIDES THIS, he also sings." },

    // ===== Hundreds & thousands =====
    { id: "nh2", type: "vocab", punjabi: "do sau",
      english: "two hundred (200)",
      definition: "Pattern: number + 'sau'. Works for 100s.",
      related: "sau",
      example: "Do sau bachche. — Two hundred children." },
    { id: "nh3", type: "vocab", punjabi: "panj sau",
      english: "five hundred (500)",
      definition: "500.",
      related: "sau, hazaar",
      example: "Panj sau da note. — A 500-rupee note." },
    { id: "nh5", type: "vocab", punjabi: "das hazaar",
      english: "ten thousand (10,000)",
      definition: "10,000.",
      related: "hazaar, lakh",
      example: "Das hazaar log. — Ten thousand people." },
    { id: "nh6", type: "vocab", punjabi: "lakh",
      english: "one hundred thousand (100,000)",
      definition: "South Asian counting unit = 100,000. NOT a million.",
      related: "hazaar, crore",
      example: "Ikk lakh rupaye. — One hundred thousand rupees." },
    { id: "nh7", type: "vocab", punjabi: "crore",
      english: "ten million (10,000,000)",
      definition: "South Asian unit = 10 million = 100 lakh.",
      related: "lakh",
      example: "Ikk crore. — Ten million." },
    { id: "nh8", type: "vocab", punjabi: "sava sau",
      english: "one hundred twenty-five (125)",
      definition: "'Sava' (1¼) + sau = 125. Common in money/age.",
      related: "savaa, dhaayi sau",
      example: "Sava sau saal. — 125 years." },
    { id: "nh9", type: "vocab", punjabi: "dhaayi sau",
      english: "two hundred fifty (250)",
      definition: "'Dhaayi' (2½) + sau = 250.",
      related: "dhaayi",
      example: "Dhaayi sau gram. — 250 grams." },
    { id: "nh10", type: "vocab", punjabi: "adha",
      english: "half",
      definition: "'Adha' (m.) / 'adhi' (f.). 'Adha kilo' = half a kilo.",
      related: "savaa, derh",
      example: "Adha glass paani. — Half a glass of water." },

    // ===== Ordinals =====
    { id: "or4", type: "vocab", punjabi: "chautha",
      english: "fourth",
      definition: "4th. Fem. 'chauthi'.",
      related: "char",
      example: "Chautha mahina. — The fourth month." },
    { id: "or5", type: "vocab", punjabi: "panjvaan",
      english: "fifth",
      definition: "5th. From 'panj'. Pattern: number + 'vaan'.",
      related: "panj",
      example: "Panjvaan saal. — The fifth year." },

    // ===== Directions & navigation =====
    { id: "dr4", type: "vocab", punjabi: "modh",
      english: "turn / bend",
      definition: "A turn. 'Modh lao' = take a turn.",
      example: "Agle MODH te ruko. — Stop at the next turn." },
    { id: "dr5", type: "vocab", punjabi: "uttar",
      english: "north",
      definition: "Cardinal direction.",
      related: "dakkhan",
      example: "UTTAR vall jao. — Go toward the north." },
    { id: "dr6", type: "vocab", punjabi: "dakkhan",
      english: "south",
      definition: "Cardinal direction.",
      related: "uttar",
      example: "DAKKHAN da mausam. — Southern weather." },
    { id: "dr7", type: "vocab", punjabi: "poorab",
      english: "east",
      definition: "Where the sun rises.",
      related: "pachhim, suraj",
      example: "POORAB to suraj. — Sun from the east." },
    { id: "dr8", type: "vocab", punjabi: "pachhim",
      english: "west",
      definition: "Where the sun sets.",
      related: "poorab",
      example: "PACHHIM vall samandar. — Ocean to the west." },
    { id: "dr9", type: "vocab", punjabi: "najdik",
      english: "near / close",
      definition: "Nearby. 'Najdik hai' = it's nearby.",
      related: "door",
      example: "Bank NAJDIK hai. — The bank is NEAR." },

    // ===== Restaurant ordering =====
    { id: "rs1", type: "vocab", punjabi: "menu",
      english: "menu (food list)",
      definition: "Borrowed from English. 'Menu dikhao' = show the menu.",
      example: "Menu LAAO ji. — Bring the menu, please." },
    { id: "rs2", type: "vocab", punjabi: "waiter",
      english: "waiter / server",
      definition: "Borrowed. Polite address: 'Bhai sahab' (brother sir).",
      example: "Waiter bhai, ikk minute. — Waiter, one minute please." },
    { id: "rs3", type: "vocab", punjabi: "order",
      english: "order (food)",
      definition: "Borrowed. 'Order karna' = to place an order.",
      example: "Asin order karange. — We'll order." },
    { id: "rs4", type: "vocab", punjabi: "bill",
      english: "bill / check",
      definition: "Borrowed. 'Bill lao' = bring the bill.",
      example: "Bill LAO ji. — Bring the bill, please." },
    { id: "rs5", type: "phrase", punjabi: "Ikk plate ___ mil sakdi?",
      english: "Could I get a plate of ___?",
      definition: "Polite ordering pattern. Replace blank with the dish.",
      example: "Ikk plate daal-makhni MIL SAKDI? — Could I get a plate of daal-makhni?" },
    { id: "rs6", type: "phrase", punjabi: "Eh kis da swaad hai?",
      english: "What does this taste like?",
      definition: "Asking about flavor before ordering.",
      related: "swaad, mitha, namkeen",
      example: "Eh sabzi KIS DA SWAAD HAI? — What does this veggie taste like?" },
    { id: "rs7", type: "phrase", punjabi: "Tikha nahin chahida",
      english: "I don't want it spicy.",
      definition: "Critical phrase. 'Halka tikha' = mildly spicy.",
      related: "tikha",
      example: "Mainu TIKHA NAHIN CHAHIDA. — I don't want it spicy." },
    { id: "rs8", type: "phrase", punjabi: "Bill lao ji",
      english: "Bring the bill, please.",
      definition: "Standard close to a meal.",
      example: "Bill LAO JI. — The bill, please." },
    { id: "rs9", type: "phrase", punjabi: "Khaana bahut vadiya si",
      english: "The food was excellent.",
      definition: "Compliment to give before leaving.",
      example: "Khaana BAHUT VADIYA SI, shukriya. — The food was excellent, thanks." },
    { id: "rs10", type: "phrase", punjabi: "Paani la dyo",
      english: "Bring water, please.",
      definition: "Common request — Punjabi style 'la dyo' = bring (please).",
      related: "paani",
      example: "Thanda PAANI LA DYO. — Bring cold water, please." },

    // ===== Bargaining at the bazaar =====
    { id: "bg1", type: "phrase", punjabi: "Kinne da?",
      english: "How much is it?",
      definition: "Quick price question. (Same as 'Kinne paise?'.)",
      example: "Eh KINNE DA? — How much is this?" },
    { id: "bg2", type: "phrase", punjabi: "Bahut jyada hai",
      english: "That's too much.",
      definition: "Standard pushback on price. Said with a smile.",
      related: "jyada",
      example: "Nahin ji, BAHUT JYADA HAI. — No, that's too much." },
    { id: "bg3", type: "phrase", punjabi: "Ghatt karo",
      english: "Lower it / reduce the price.",
      definition: "Direct ask for a discount. 'Thoda ghatt karo' = a little less.",
      related: "ghatt",
      example: "Thoda GHATT KARO ji. — Lower it a bit, please." },
    { id: "bg4", type: "phrase", punjabi: "Akhri keemat",
      english: "Final price.",
      definition: "Asking for the seller's bottom line.",
      related: "akhri, keemat",
      example: "AKHRI KEEMAT dasso. — Tell me the final price." },
    { id: "bg5", type: "phrase", punjabi: "Hor sasta nahin?",
      english: "Any cheaper?",
      definition: "Polite negotiation question.",
      related: "sasta",
      example: "HOR SASTA NAHIN? — Nothing cheaper?" },
    { id: "bg6", type: "phrase", punjabi: "Theek hai, le laanga",
      english: "Okay, I'll take it.",
      definition: "Closing the deal. (F. speaker: 'le laangi'.)",
      example: "THEEK HAI, LE LAANGA. — Okay, I'll take it." },
    { id: "bg7", type: "phrase", punjabi: "Reh do",
      english: "Leave it / never mind.",
      definition: "Walk-away phrase. Use sparingly — sometimes the price drops!",
      example: "Eh mehnga, REH DO. — This is expensive, leave it." },
    { id: "bg8", type: "phrase", punjabi: "Pakka rate kya?",
      english: "What's the firm rate?",
      definition: "'Pakka' = firm/fixed. Asking for the no-negotiation price.",
      related: "pakka",
      example: "PAKKA RATE KYA hai? — What's the firm rate?" },

    // ===== Doctor visit =====
    { id: "dv1", type: "phrase", punjabi: "Ki takleef hai?",
      english: "What's the trouble? (doctor's question).",
      definition: "Standard doctor opener. 'Takleef' = trouble/discomfort.",
      example: "Doctor: KI TAKLEEF HAI? — What seems to be the problem?" },
    { id: "dv2", type: "phrase", punjabi: "Kadon toon?",
      english: "Since when?",
      definition: "Doctor asking about onset of symptoms.",
      related: "kadon",
      example: "Bukhaar KADON TOON hai? — Since when is the fever?" },
    { id: "dv3", type: "vocab", punjabi: "parchi",
      english: "prescription / slip",
      definition: "The slip the doctor gives — take to the pharmacy.",
      related: "dawai, doctor",
      example: "Parchi LE LO. — Take the prescription." },
    { id: "dv5", type: "phrase", punjabi: "Dard kithe hai?",
      english: "Where does it hurt?",
      definition: "Doctor's locator question.",
      related: "dard",
      example: "DARD KITHE HAI? — Where is the pain?" },
    { id: "dv6", type: "phrase", punjabi: "Mainu ___ hai",
      english: "I have ___.",
      definition: "Symptom-reporting pattern. Fill in the symptom.",
      example: "MAINU bukhaar HAI. — I have a fever." },
    { id: "dv7", type: "phrase", punjabi: "Gehri saans lao",
      english: "Take a deep breath.",
      definition: "Doctor's instruction during exam.",
      related: "saans",
      example: "GEHRI SAANS LAO. — Take a deep breath." },
    { id: "dv8", type: "phrase", punjabi: "Test karaana paina",
      english: "(You'll) have to get a test done.",
      definition: "Doctor recommending tests. 'Paina' = will have to.",
      example: "Khoon da TEST KARAANA PAINA. — You'll need a blood test." },
    { id: "dv9", type: "phrase", punjabi: "Aaraam karo",
      english: "Take rest.",
      definition: "Doctor's universal advice.",
      related: "aaraam",
      example: "Do din AARAAM KARO. — Rest for two days." },
    { id: "dv10", type: "phrase", punjabi: "Theek ho jaaoge",
      english: "You'll get well.",
      definition: "Reassurance. 'Jaldi theek ho jaaoge' = you'll get well soon.",
      example: "Chinta na karo, THEEK HO JAAOGE. — Don't worry, you'll get well." },

    // ===== Travel & station =====
    { id: "tv1", type: "vocab", punjabi: "platform",
      english: "platform (railway)",
      definition: "Borrowed from English. 'Platform number do' = platform 2.",
      example: "Platform NUMBER tinn. — Platform 3." },
    { id: "tv2", type: "vocab", punjabi: "gaddi number",
      english: "train number",
      definition: "'Gaddi' = train (here). Each train has a number.",
      related: "rail",
      example: "Tuhadi GADDI NUMBER 12471 hai. — Your train is number 12471." },
    { id: "tv3", type: "vocab", punjabi: "ticket counter",
      english: "ticket counter",
      definition: "Where you buy tickets. Borrowed from English.",
      related: "ticket",
      example: "TICKET COUNTER kithe? — Where's the ticket counter?" },
    { id: "tv4", type: "phrase", punjabi: "Kithon chaldi hai?",
      english: "Where does it leave from?",
      definition: "Asking departure point.",
      related: "kithon",
      example: "Eh bus KITHON CHALDI HAI? — Where does this bus leave from?" },
    { id: "tv5", type: "phrase", punjabi: "Kinne vaje chaldi?",
      english: "What time does it leave?",
      definition: "Asking departure time.",
      related: "vaje",
      example: "Gaddi KINNE VAJE CHALDI? — What time does the train leave?" },
    { id: "tv6", type: "phrase", punjabi: "Kinna time lagega?",
      english: "How long will it take?",
      definition: "Asking journey duration.",
      example: "Othe pohanchan nu KINNA TIME LAGEGA? — How long to get there?" },
    { id: "tv7", type: "phrase", punjabi: "Eh seat khaali hai?",
      english: "Is this seat free?",
      definition: "Polite seat-check.",
      example: "Maaf karo, EH SEAT KHAALI HAI? — Excuse me, is this seat free?" },
    { id: "tv8", type: "phrase", punjabi: "Mainu ___ jaana hai",
      english: "I need to go to ___.",
      definition: "Telling driver/agent your destination.",
      example: "MAINU Amritsar JAANA HAI. — I need to go to Amritsar." },
    { id: "tv9", type: "vocab", punjabi: "saaman",
      english: "luggage / belongings",
      definition: "Your bags. 'Saaman rakho' = put the luggage.",
      related: "bag",
      example: "SAAMAN sambhalo. — Watch your luggage." },
    { id: "tv10", type: "phrase", punjabi: "Akhri stop kithe?",
      english: "Where's the last stop?",
      definition: "Useful on buses.",
      related: "akhri",
      example: "Eh bus da AKHRI STOP KITHE? — Where's this bus's last stop?" },

    // ===== Extended kinship =====
    { id: "fk2", type: "vocab", punjabi: "mami",
      english: "maternal uncle's wife",
      definition: "Wife of mama (mother's brother).",
      related: "mama",
      example: "MAMI ne kheer banai. — Mami made kheer." },
    { id: "fk4", type: "vocab", punjabi: "chachi",
      english: "chacha's wife",
      definition: "Wife of chacha.",
      related: "chacha",
      example: "CHACHI ne pyar kita. — Chachi showed love." },
    { id: "fk5", type: "vocab", punjabi: "taya",
      english: "father's elder brother",
      definition: "Paternal uncle OLDER than your father. Different word from chacha!",
      related: "tayi, chacha, papa",
      example: "TAYA ji vadde han. — Taya ji is older." },
    { id: "fk6", type: "vocab", punjabi: "tayi",
      english: "taya's wife",
      definition: "Wife of taya.",
      related: "taya",
      example: "TAYI ji da khaana. — Tayi ji's food." },
    { id: "fk7", type: "vocab", punjabi: "mausi",
      english: "maternal aunt (mother's sister)",
      definition: "Mother's sister. Like a second mother.",
      related: "maa, bua",
      example: "MAUSI gharon aayi. — Mausi came from her home." },
    { id: "fk8", type: "vocab", punjabi: "bua",
      english: "paternal aunt (father's sister)",
      definition: "Father's sister. Special bond — buaji often dotes on nieces/nephews.",
      related: "papa, mausi",
      example: "BUA da pyar. — Bua's love." },

    // ===== Punjabi farming life =====
    { id: "fm1", type: "vocab", punjabi: "kheti",
      english: "farming / agriculture",
      definition: "The traditional backbone of Punjab. 'Kheti karna' = to farm.",
      related: "kisaan, khet",
      example: "Punjab di KHETI mashoor hai. — Punjab's farming is famous." },
    { id: "fm2", type: "vocab", punjabi: "fasal",
      english: "crop / harvest",
      definition: "What's grown in the field.",
      related: "kanak, kheti",
      example: "Eh saal di FASAL vadiya. — This year's crop is good." },
    { id: "fm3", type: "vocab", punjabi: "kanak",
      english: "wheat",
      definition: "The main rabi crop of Punjab. Harvested at Vaisakhi.",
      related: "fasal, atta, Vaisakh",
      example: "KANAK di fasal pakk gayi. — The wheat crop has ripened." },
    { id: "fm4", type: "vocab", punjabi: "basmati",
      english: "basmati rice",
      definition: "Famous long-grain fragrant rice grown in Punjab.",
      related: "chaaval",
      example: "BASMATI chaaval. — Basmati rice." },
    { id: "fm6", type: "vocab", punjabi: "mandi",
      english: "marketplace (esp. for crops)",
      definition: "Where farmers sell their produce.",
      related: "bazaar, fasal",
      example: "MANDI vich fasal vechi. — Sold the crop at the mandi." },
    { id: "fm7", type: "vocab", punjabi: "kothi",
      english: "large house / mansion",
      definition: "A big house — often what successful Punjabis build in their village.",
      related: "ghar, pind",
      example: "Pind vich KOTHI banai. — Built a kothi in the village." },
    { id: "fm8", type: "vocab", punjabi: "dhaaba",
      english: "highway/roadside eatery",
      definition: "Punjabi roadside restaurant — famous for daal, roti, and lassi.",
      related: "khaana, lassi",
      example: "DHAABE da khaana. — Dhaba food." },

    // ===== Diaspora & code-switching =====
    { id: "ds1", type: "vocab", punjabi: "vilayat",
      english: "foreign land (esp. UK)",
      definition: "Old-school Punjabi for 'abroad', historically the UK. Source of English 'Blighty'.",
      related: "pardes, des",
      example: "Mere mama VILAYAT vich. — My uncle is abroad." },
    { id: "ds2", type: "vocab", punjabi: "pardes",
      english: "foreign country / abroad",
      definition: "General term for living away from one's homeland. Tinged with longing.",
      related: "vilayat, des",
      example: "PARDES vich saal beet gaya. — A year passed in pardes." },
    { id: "ds3", type: "vocab", punjabi: "des",
      english: "homeland / country",
      definition: "Your country (often: India/Punjab). 'Apna des' = our own land.",
      related: "pardes",
      example: "DES yaad aanda hai. — I miss my homeland." },
    { id: "ds4", type: "vocab", punjabi: "NRI",
      english: "non-resident Indian",
      definition: "Used widely. Often refers to the Punjabi diaspora (UK, Canada, US, Australia).",
      related: "pardes",
      example: "Bahut NRI Vaisakhi te aande. — Many NRIs come for Vaisakhi." },
    { id: "ds5", type: "phrase", punjabi: "Call back karaanga",
      english: "I'll call back. (code-switched).",
      definition: "Common diaspora pattern: English verbs + Punjabi 'karna/karaanga'.",
      related: "phone, karna",
      example: "Hun busy haan, CALL BACK KARAANGA. — Busy now, will call back." },
    { id: "ds6", type: "phrase", punjabi: "Drop kar dyo",
      english: "Please drop (me/it) off.",
      definition: "English 'drop' + Punjabi 'kar dyo'. Used in cabs, with friends.",
      related: "karna",
      example: "Mainu station DROP KAR DYO. — Please drop me at the station." },
    { id: "ds7", type: "phrase", punjabi: "Update kar dyo",
      english: "Please update (me).",
      definition: "Modern code-switched request. Hugely common with NRIs.",
      example: "Khabar miln te UPDATE KAR DYO. — Update me when you have news." },

    // ===== Reduplication patterns =====
    { id: "rd1", type: "phrase", punjabi: "chhoti-moti",
      english: "small / minor / trivial.",
      definition: "Reduplication for vagueness — 'small-and-such'. Casual.",
      related: "chhota",
      example: "CHHOTI-MOTI cheezaan. — Little odds and ends." },
    { id: "rd2", type: "phrase", punjabi: "jaldi-jaldi",
      english: "quickly! quickly!",
      definition: "Doubled for emphasis. Urgency.",
      related: "jaldi",
      example: "JALDI-JALDI karo. — Quickly, quickly do it." },
    { id: "rd3", type: "phrase", punjabi: "theek-theek",
      english: "exactly / properly.",
      definition: "Doubled for precision.",
      related: "theek",
      example: "THEEK-THEEK dasso. — Tell me exactly." },
    { id: "rd4", type: "phrase", punjabi: "alag-alag",
      english: "separate / different.",
      definition: "Distributive — 'each one separate'.",
      related: "alag",
      example: "ALAG-ALAG plates. — Separate plates each." },
    { id: "rd5", type: "phrase", punjabi: "dhire-dhire",
      english: "slowly slowly / gradually.",
      definition: "Doubled — gentle pace.",
      related: "haule",
      example: "DHIRE-DHIRE bolo. — Speak slowly." },
    { id: "rd6", type: "phrase", punjabi: "ghar-ghar",
      english: "house-to-house / every home.",
      definition: "Distributive — implies all/each.",
      related: "ghar",
      example: "GHAR-GHAR vich Diwali. — Diwali in every home." },
    { id: "rd7", type: "phrase", punjabi: "phir-phir",
      english: "again and again.",
      definition: "Doubled — repeated action.",
      related: "phir",
      example: "PHIR-PHIR mat puchho. — Don't ask again and again." },
    { id: "rd8", type: "phrase", punjabi: "sohna-sohna",
      english: "really lovely / just beautiful.",
      definition: "Doubled adjective — affectionate intensifier.",
      related: "sohna",
      example: "SOHNA-SOHNA bachcha. — A really lovely child." },

    // ===== Daily-routine narrative (connected first-person paragraph) =====
    { id: "dn1", type: "phrase", punjabi: "Main savere chhe vaje uthda haan.",
      english: "I get up at six in the morning.",
      definition: "Routine sentence #1. Use 'uthdi' if female.",
      related: "savere, uthna",
      example: "Practice this as part of a connected paragraph." },
    { id: "dn2", type: "phrase", punjabi: "Phir munh dho ke chai peenda haan.",
      english: "Then I wash my face and drink tea.",
      definition: "Routine #2. 'Dho ke' = having washed. Connector: 'phir'.",
      related: "phir, dhona, peena",
      example: "Sequence link to the previous sentence." },
    { id: "dn3", type: "phrase", punjabi: "Nashta karke kamm te jaanda haan.",
      english: "After breakfast I go to work.",
      definition: "Routine #3. 'Karke' = having done.",
      related: "nashta, kamm",
      example: "'Karke' is a key sequence connector — do this, then that." },
    { id: "dn4", type: "phrase", punjabi: "Dupehre baarah vaje khaana khaanda haan.",
      english: "I eat lunch at twelve noon.",
      definition: "Routine #4. 'Dupehre' = at midday.",
      related: "dupehre, khaana",
      example: "Time + activity pattern." },
    { id: "dn5", type: "phrase", punjabi: "Sham nu dostaan naal milda haan.",
      english: "In the evening I meet friends.",
      definition: "Routine #5. 'Sham nu' = in the evening. 'Naal' = with.",
      related: "sham, dost, milna",
      example: "Time-of-day phrase." },
    { id: "dn6", type: "phrase", punjabi: "Raat nu khaana khaake TV vekhda haan.",
      english: "At night I eat dinner and watch TV.",
      definition: "Routine #6. 'Khaake' = having eaten.",
      related: "raat, vekhna",
      example: "Two actions linked by '-ke'." },
    { id: "dn7", type: "phrase", punjabi: "Soun toon pehlaan kitaab padhda haan.",
      english: "Before sleeping I read a book.",
      definition: "Routine #7. 'Toon pehlaan' = before. 'Sona' = to sleep.",
      related: "pehlaan, sona, padhna",
      example: "'Toon pehlaan' / 'toon baad' time pattern." },
    { id: "dn8", type: "phrase", punjabi: "Aainj mera ikk din khatam ho jaanda hai.",
      english: "And so my day comes to an end.",
      definition: "Routine #8 — closing line. 'Aainj' = like this.",
      related: "khatam, akhir vich",
      example: "Use this entire 8-card set as a shadowing paragraph." },

    // ===== Round 4: Colors — full palette =====
    { id: "co8",  type: "vocab", punjabi: "baingani", english: "purple / violet",
      definition: "Purple. From 'baingan' (eggplant).",
      related: "rang",
      example: "BAINGANI phul. — PURPLE flower." },
    { id: "co10", type: "vocab", punjabi: "sleti",    english: "grey",
      definition: "Grey. From 'slate'. Same for m./f.",
      related: "rang",
      example: "SLETI baal. — GREY hair." },
    { id: "co11", type: "vocab", punjabi: "sunehri",  english: "golden",
      definition: "Golden. Same for m./f. The Sri Harimandir Sahib is called the 'Sunehri Mandir'.",
      related: "rang, sona",
      example: "SUNEHRI gumbad. — GOLDEN dome." },

    // ===== Shapes & sizes =====
    { id: "sz1",  type: "vocab", punjabi: "gol",       english: "round / circular",
      definition: "Round shape. Same for m./f.",
      related: "chowkor",
      example: "GOL roti. — ROUND roti." },
    { id: "sz2",  type: "vocab", punjabi: "chowkor",   english: "square",
      definition: "Square shape. From 'four corners'.",
      related: "gol",
      example: "CHOWKOR mez. — SQUARE table." },
    { id: "sz3",  type: "vocab", punjabi: "tikona",    english: "triangular",
      definition: "Three-cornered. Like a samosa.",
      related: "samosa",
      example: "TIKONA samosa. — TRIANGULAR samosa." },
    { id: "sz4",  type: "vocab", punjabi: "lamma",     english: "long / tall (m.)",
      definition: "Long or tall. Fem. 'lammi'.",
      related: "ucha",
      example: "LAMMA raasta. — A LONG road." },
    { id: "sz5",  type: "vocab", punjabi: "chaurra",   english: "wide (m.)",
      definition: "Wide. Fem. 'chaurri'.",
      related: "lamma, sankra",
      example: "CHAURRA darvaaza. — WIDE door." },
    { id: "sz6",  type: "vocab", punjabi: "patla",     english: "thin / slim (m.)",
      definition: "Thin. Fem. 'patli'. Used for objects and people.",
      related: "motta",
      example: "PATLI roti. — THIN roti." },
    { id: "sz7",  type: "vocab", punjabi: "motta",     english: "thick / fat (m.)",
      definition: "Thick or fat. Fem. 'motti'. Be careful — calling a person 'motta' is rude.",
      related: "patla",
      example: "MOTTI kitaab. — THICK book." },

    // ===== Tastes & textures =====
    { id: "tx1",  type: "vocab", punjabi: "mitha",     english: "sweet (m.)",
      definition: "Sweet taste. Fem. 'mithi'. Also used for kind speech.",
      related: "swaad",
      example: "MITHI lassi. — SWEET lassi." },
    { id: "tx2",  type: "vocab", punjabi: "namkeen",   english: "salty",
      definition: "Salty. Same word for snacks (savory snacks).",
      related: "namak",
      example: "NAMKEEN lassi. — SALTY lassi." },
    { id: "tx3",  type: "vocab", punjabi: "khatta",    english: "sour (m.)",
      definition: "Sour. Fem. 'khatti'. Used for tamarind, lemon.",
      related: "swaad",
      example: "KHATTA nimboo. — SOUR lemon." },
    { id: "tx4",  type: "vocab", punjabi: "kaira",     english: "bitter (m.)",
      definition: "Bitter. Fem. 'kairi'. Used for karela (bitter gourd), bitter speech.",
      related: "swaad",
      example: "KAIRA karela. — BITTER gourd." },
    { id: "tx5",  type: "vocab", punjabi: "tikha",     english: "spicy / hot (m.)",
      definition: "Spicy hot. Fem. 'tikhi'. Critical word at any restaurant.",
      related: "mirch",
      example: "TIKHA khaana. — SPICY food." },
    { id: "tx6",  type: "vocab", punjabi: "pheeka",    english: "bland / unsalted (m.)",
      definition: "Lacking flavor / unsalted. Fem. 'pheeki'.",
      related: "namkeen",
      example: "PHEEKI sabzi. — BLAND vegetable." },
    { id: "tx7",  type: "vocab", punjabi: "narm",      english: "soft",
      definition: "Soft to touch. Same for m./f.",
      related: "sakht",
      example: "NARM bistar. — SOFT bed." },
    { id: "tx8",  type: "vocab", punjabi: "sakht",     english: "hard / strict",
      definition: "Hard texture, or a strict person.",
      related: "narm",
      example: "SAKHT pathar. — HARD stone." },
    { id: "tx9",  type: "vocab", punjabi: "geela",     english: "wet (m.)",
      definition: "Wet. Fem. 'geeli'.",
      related: "sukha",
      example: "GEELE kapre. — WET clothes." },
    { id: "tx10", type: "vocab", punjabi: "sukha",     english: "dry (m.)",
      definition: "Dry. Fem. 'sukhi'.",
      related: "geela",
      example: "SUKHI lakkad. — DRY wood." },
    { id: "tx11", type: "vocab", punjabi: "chikna",    english: "smooth / oily (m.)",
      definition: "Smooth or oily. Fem. 'chikni'.",
      related: "khurdura",
      example: "CHIKNA farsh. — SMOOTH floor." },
    { id: "tx12", type: "vocab", punjabi: "khurdura",  english: "rough (m.)",
      definition: "Rough texture. Fem. 'khurduri'.",
      related: "chikna",
      example: "KHURDURI deewar. — ROUGH wall." },

    // ===== Senses — smell / sound / sight =====
    { id: "sn1", type: "vocab", punjabi: "khushboo", english: "fragrance / good smell",
      definition: "Pleasant smell. 'Khush' (happy) + 'boo' (smell).",
      related: "badboo",
      example: "Phulaan di KHUSHBOO. — Fragrance of flowers." },
    { id: "sn2", type: "vocab", punjabi: "badboo",   english: "bad smell / stink",
      definition: "Unpleasant smell. 'Bad' + 'boo'.",
      related: "khushboo",
      example: "BADBOO aa rahi hai. — A bad smell is coming." },
    { id: "sn3", type: "vocab", punjabi: "awaaz",    english: "voice / sound",
      definition: "Voice or sound. 'Tuhadi awaaz vadiya' = your voice is great.",
      related: "shor, gaana",
      example: "AWAAZ uchi karo. — Raise the volume." },
    { id: "sn4", type: "vocab", punjabi: "shor",     english: "noise (loud)",
      definition: "Disturbing noise. 'Shor mat machao' = don't make noise.",
      related: "awaaz, shaant",
      example: "Bahut SHOR hai. — There's too much noise." },
    { id: "sn5", type: "vocab", punjabi: "chamak",   english: "shine / sparkle",
      definition: "Brightness or sparkle. 'Chamakda' = shining.",
      related: "rosni",
      example: "Akhaan vich CHAMAK. — Sparkle in the eyes." },
    { id: "sn6", type: "vocab", punjabi: "dhundla",  english: "blurry / dim",
      definition: "Unclear, hazy. Fem. 'dhundli'.",
      related: "saaf",
      example: "DHUNDLA tasveer. — Blurry picture." },

    // ===== Quantity & quality words =====
    { id: "qy3",  type: "grammar", punjabi: "kuchh",  english: "some / something",
      definition: "Some indefinite amount or thing. 'Kuchh nahin' = nothing.",
      related: "koi, sab",
      example: "KUCHH khaa lo. — Eat something." },
    { id: "qy4",  type: "grammar", punjabi: "sara",   english: "all / entire (m.)",
      definition: "All of it. Fem. 'saari'. 'Sara din' = the whole day.",
      related: "sab",
      example: "SARA khaana khatam. — All the food is finished." },
    { id: "qy5",  type: "grammar", punjabi: "koi",    english: "any / someone",
      definition: "An indefinite person or thing. 'Koi nahin' = nobody / no problem.",
      related: "kuchh",
      example: "KOI hai? — Is anyone there?" },
    { id: "qy6",  type: "grammar", punjabi: "har",    english: "every",
      definition: "'Har din' = every day, 'har koi' = everyone.",
      related: "sab",
      example: "HAR insaan alag hai. — Every person is different." },
    { id: "qy8",  type: "grammar", punjabi: "kaafi",  english: "enough / quite",
      definition: "Sufficient or 'quite a lot'. Same for m./f.",
      related: "bas, bahut",
      example: "KAAFI ho gaya. — That's enough." },
    { id: "qy9",  type: "grammar", punjabi: "jyada",  english: "more / too much",
      definition: "More than needed. 'Jyada nahin' = not too much.",
      related: "ghatt, bahut",
      example: "JYADA mat khaao. — Don't eat too much." },
    { id: "qy10", type: "grammar", punjabi: "ghatt",  english: "less / few",
      definition: "Less. 'Ghatt karo' = reduce.",
      related: "jyada",
      example: "Namak GHATT paao. — Add less salt." },

    // ===== Function words: vi / hi / sirf / bhi =====
    { id: "fw2", type: "grammar", punjabi: "bhi",
      english: "also / too (Hindi loan)",
      definition: "Same as 'vi'. Both are heard in Punjab — 'vi' is more native.",
      related: "vi",
      example: "Main BHI jaaonga. — I'll go TOO." },
    { id: "fw3", type: "grammar", punjabi: "hi",
      english: "only / itself (emphatic)",
      definition: "Adds emphasis after a word. 'Tu hi karna' = only YOU do it.",
      related: "sirf",
      example: "Aaj HI kar lo. — Do it TODAY itself." },
    { id: "fw5", type: "grammar", punjabi: "kewal",
      english: "only (formal)",
      definition: "Formal/written 'only'. Same as 'sirf'.",
      related: "sirf",
      example: "KEWAL membraan layi. — For members ONLY." },
    { id: "fw6", type: "grammar", punjabi: "khaas",
      english: "special / particular",
      definition: "'Khaas tor te' = especially.",
      related: "vishesh",
      example: "KHAAS tohfa. — A SPECIAL gift." },

    // ===== Frequency adverbs =====
    { id: "fa1", type: "vocab", punjabi: "hamesha",   english: "always",
      definition: "All the time, every time.",
      related: "kade nahin",
      example: "Main HAMESHA tuhade naal. — I'm always with you." },
    { id: "fa2", type: "vocab", punjabi: "aksar",     english: "often",
      definition: "Frequently but not always.",
      related: "kade-kade",
      example: "AKSAR shaam nu sair. — Often a walk in the evening." },
    { id: "fa3", type: "vocab", punjabi: "kade-kade", english: "sometimes",
      definition: "Occasionally. The doubled 'kade' softens it.",
      related: "aksar",
      example: "KADE-KADE mil lainde. — We meet sometimes." },
    { id: "fa4", type: "vocab", punjabi: "kade nahin", english: "never",
      definition: "Not ever. 'Kade' alone = ever; 'kade nahin' = never.",
      related: "hamesha",
      example: "Main KADE NAHIN jhooth boldi. — I never lie (f.)." },
    { id: "fa5", type: "vocab", punjabi: "roz",       english: "every day / daily",
      definition: "Daily. Same as 'rozaana'.",
      related: "har din",
      example: "ROZ yoga karo. — Do yoga daily." },
    { id: "fa6", type: "vocab", punjabi: "har vele",  english: "all the time / every moment",
      definition: "Every single moment. Stronger than 'hamesha'.",
      related: "hamesha",
      example: "HAR VELE phone te. — On the phone all the time." },
    { id: "fa8", type: "vocab", punjabi: "fauran",    english: "immediately / at once",
      definition: "Right away. From Urdu, common in spoken Punjabi.",
      related: "jaldi",
      example: "FAURAN aao! — Come immediately!" },

    // ===== Manner adverbs =====
    { id: "ma1", type: "vocab", punjabi: "chhetee",      english: "quickly",
      definition: "Quickly. Same as 'jaldi' but very Punjabi.",
      related: "jaldi, haule",
      example: "CHHETEE karo. — Do it quickly." },
    { id: "ma3", type: "vocab", punjabi: "dhyan naal",   english: "with attention / carefully",
      definition: "'Dhyan' = attention. Used to advise care.",
      related: "sambhal ke",
      example: "DHYAN NAAL chalo. — Walk carefully." },
    { id: "ma4", type: "vocab", punjabi: "ainj",         english: "this way / like this",
      definition: "Indicates a manner. 'Ainj karo' = do it this way.",
      related: "ainven",
      example: "AINJ likho. — Write it this way." },
    { id: "ma5", type: "vocab", punjabi: "ainven",       english: "just / for no reason",
      definition: "Casually, without purpose. 'Ainven hi' = just because.",
      related: "ainj",
      example: "AINVEN puch reha si. — Was just asking." },
    { id: "ma6", type: "vocab", punjabi: "asaani naal",  english: "easily",
      definition: "'Asaani' = ease.",
      related: "mushkil naal",
      example: "ASAANI NAAL ho jaaega. — It'll happen easily." },
    { id: "ma7", type: "vocab", punjabi: "mushkil naal", english: "with difficulty",
      definition: "'Mushkil' = difficulty.",
      related: "asaani naal",
      example: "MUSHKIL NAAL pohanche. — We barely arrived." },

    // ===== Question-word gendered forms =====
    { id: "qg2", type: "grammar", punjabi: "konsa / konsi / konse",
      english: "which",
      definition: "Match noun gender. 'Konsa rang?' (m.) / 'Konsi kitaab?' (f.).",
      related: "ki",
      example: "KONSA gaana? — Which song?" },
    { id: "qg3", type: "grammar", punjabi: "kaisa / kaisi / kaise",
      english: "how (= what kind of)",
      definition: "Asks about quality/type. Different from 'kive' (how = in what way).",
      related: "kive",
      example: "KAISA mausam? — How is the weather?" },
    { id: "qg4", type: "grammar", punjabi: "kis tarha",
      english: "in what manner / how",
      definition: "Formal 'how'. 'Tarha' = manner.",
      related: "kive",
      example: "Eh KIS TARHA hoya? — How did this happen?" },

    // ===== Days of the week =====

    // ===== Measure words & units =====
    { id: "mw1",  type: "vocab", punjabi: "kilo",    english: "kilogram",
      definition: "Borrowed. 'Ikk kilo aaloo' = one kilo of potatoes.",
      related: "gram",
      example: "Do KILO atta. — Two kilos of flour." },
    { id: "mw2",  type: "vocab", punjabi: "graam",   english: "gram",
      definition: "1/1000 kilo.",
      related: "kilo",
      example: "Sau GRAM. — 100 grams." },
    { id: "mw3",  type: "vocab", punjabi: "litre",   english: "liter",
      definition: "Used for milk, oil, petrol.",
      related: "doodh",
      example: "Ikk LITRE doodh. — One liter of milk." },
    { id: "mw4",  type: "vocab", punjabi: "meetar",  english: "meter",
      definition: "Length. Borrowed.",
      related: "lamma",
      example: "Char METER kapra. — Four meters of cloth." },
    { id: "mw5",  type: "vocab", punjabi: "foot",    english: "foot (length unit)",
      definition: "Borrowed. 'Panj foot lamma' = 5 feet tall.",
      related: "meter",
      example: "Chhe FOOT lamma. — Six feet tall." },
    { id: "mw6",  type: "vocab", punjabi: "dabba",   english: "box / container",
      definition: "Any small box. 'Tiffin dabba' = lunch box.",
      related: "peti, dabbi",
      example: "Mithai da DABBA. — Box of sweets." },
    { id: "mw7",  type: "vocab", punjabi: "paiket", english: "packet",
      definition: "Borrowed.",
      related: "dabba",
      example: "Doodh da PACKET. — Milk packet." },
    { id: "mw8",  type: "vocab", punjabi: "jodi",    english: "pair",
      definition: "A pair of two. 'Juti di jodi' = pair of shoes.",
      related: "do",
      example: "Ikk JODI juti. — One pair of shoes." },
    { id: "mw9",  type: "vocab", punjabi: "do-do",   english: "two each",
      definition: "Reduplicated number = distributive ('two each'). Works for any number.",
      related: "do",
      example: "DO-DO laddoo lao. — Take two each (laddoos)." },
    { id: "mw10", type: "vocab", punjabi: "darjan",  english: "dozen",
      definition: "12 pieces. Borrowed via Hindi.",
      example: "Ikk DARJAN ande. — One dozen eggs." },

    // ===== Containers & vessels =====
    { id: "vs1", type: "vocab", punjabi: "katora", english: "small bowl",
      definition: "A small round bowl, often steel. For daal or sabzi.",
      related: "thali, bartan",
      example: "Daal da KATORA. — Bowl of daal." },
    { id: "vs2", type: "vocab", punjabi: "thali",  english: "metal plate (round)",
      definition: "A round metal serving plate. Also a meal layout.",
      related: "plate, katora",
      example: "Punjabi THALI. — A Punjabi thali meal." },
    { id: "vs3", type: "vocab", punjabi: "lota",   english: "spouted water pot",
      definition: "A small water vessel — used for pouring water (esp. in bathroom or rituals).",
      related: "paani",
      example: "LOTA bhar lao. — Fill the lota." },
    { id: "vs4", type: "vocab", punjabi: "botal", english: "bottle",
      definition: "Borrowed. Water/oil bottle.",
      related: "paani",
      example: "Paani di BOTTLE. — Water bottle." },
    { id: "vs5", type: "vocab", punjabi: "jhola",  english: "cloth bag / sack",
      definition: "Cloth shopping bag. The classic Punjabi market companion.",
      related: "bag, peti",
      example: "JHOLA lai ke jaao. — Take a bag with you." },
    { id: "vs6", type: "vocab", punjabi: "peti",   english: "trunk / large box",
      definition: "Big storage box. Also suitcase.",
      related: "saaman, dabba",
      example: "Vivah di PETI. — Wedding trunk." },
    { id: "vs7", type: "vocab", punjabi: "tokri",  english: "basket",
      definition: "Woven basket. For fruits, vegetables.",
      related: "phal, sabzi",
      example: "Phulaan di TOKRI. — Basket of flowers." },
    { id: "vs8", type: "vocab", punjabi: "balti",  english: "bucket",
      definition: "Bucket — for water, washing.",
      related: "paani",
      example: "BALTI bhar paani. — Bucketful of water." },

    // ===== Body parts extension 2 =====
    { id: "bx4",  type: "vocab", punjabi: "angootha", english: "thumb",
      definition: "Thumb. Also 'big toe' for the foot.",
      related: "ungal, hath",
      example: "ANGOOTHA dikha. — Show your thumb." },
    { id: "bx5",  type: "vocab", punjabi: "nahun",    english: "fingernail / toenail",
      definition: "Nails. 'Nahun katte' = trim your nails.",
      related: "ungal",
      example: "NAHUN vaddh gaye. — Nails have grown." },
    { id: "bx7",  type: "vocab", punjabi: "dhaadi",   english: "beard",
      definition: "Beard. Sikh men keep dhaadi as a religious commitment.",
      related: "Sikh, mucchaan",
      example: "DHAADI lammi. — Long beard." },
    { id: "bx8",  type: "vocab", punjabi: "mucchaan", english: "moustache",
      definition: "Moustache. A symbol of pride in Punjabi culture.",
      related: "dhaadi",
      example: "Ucchi MUCCHAAN. — A grand moustache." },
    { id: "bx9",  type: "vocab", punjabi: "kandh",    english: "shoulder",
      definition: "Shoulder. 'Kandh te' = on the shoulder.",
      related: "bahn",
      example: "Bachcha KANDH te. — Child on the shoulder." },
    { id: "bx10", type: "vocab", punjabi: "chhati",   english: "chest",
      definition: "Chest. Also figurative 'heart/courage'.",
      related: "dil, pith",
      example: "CHHATI vich dard. — Pain in the chest." },

    // ===== Bathroom & hygiene =====
    { id: "hg1", type: "vocab", punjabi: "ghuslkhana", english: "bathroom",
      definition: "The bathroom — for bathing. Different from 'pakhana' (toilet).",
      related: "pakhana, sabun",
      example: "GHUSLKHANE vich naha reha. — Bathing in the bathroom." },
    { id: "hg2", type: "vocab", punjabi: "pakhana",    english: "toilet",
      definition: "The toilet. Also 'tatti' (very informal/crude).",
      related: "ghuslkhana",
      example: "PAKHANA jaana hai. — Need to use the toilet." },
    { id: "hg3", type: "vocab", punjabi: "sabun",      english: "soap",
      definition: "Bar soap or liquid.",
      related: "shampoo, hath",
      example: "SABUN naal hath dho. — Wash hands with soap." },
    { id: "hg4", type: "vocab", punjabi: "brush",      english: "toothbrush",
      definition: "Borrowed. For teeth.",
      related: "dand, manjan",
      example: "BRUSH karo. — Brush your teeth." },
    { id: "hg5", type: "vocab", punjabi: "manjan",     english: "toothpaste / tooth powder",
      definition: "Old word for tooth-cleaning paste/powder.",
      related: "brush, dand",
      example: "MANJAN laao. — Apply toothpaste." },
    { id: "hg6", type: "vocab", punjabi: "tauliya",    english: "towel",
      definition: "For drying after bath.",
      related: "ghuslkhana",
      example: "TAULIYA fado. — Pass the towel." },
    { id: "hg7", type: "vocab", punjabi: "shampoo",    english: "shampoo",
      definition: "Borrowed. For hair.",
      related: "baal, sabun",
      example: "SHAMPOO khatam. — Shampoo is finished." },
    { id: "hg8", type: "vocab", punjabi: "kanghi",     english: "comb",
      definition: "For combing hair. Sikhs carry a kangha as one of the five Ks.",
      related: "baal",
      example: "KANGHI naal baal sambhalo. — Manage your hair with a comb." },

    // ===== Speech-act verbs =====
    { id: "sv4", type: "vocab", punjabi: "samajhauna",    english: "to explain",
      definition: "Causative of 'samajhna'. To make someone understand.",
      related: "samajhna",
      example: "Mainu SAMAJHAO. — Explain to me." },
    { id: "sv6", type: "vocab", punjabi: "jawab denna",   english: "to answer / reply",
      definition: "'Jawab' = answer. 'Denna' = to give.",
      related: "puchhna",
      example: "JAWAB DEO ji. — Please answer." },
    { id: "sv7", type: "vocab", punjabi: "sun-na",        english: "to listen / hear",
      definition: "To listen. 'Suno' = listen (polite imperative).",
      related: "awaaz, gaana",
      example: "Gaur naal SUN-NA. — Listen carefully." },
    { id: "sv8", type: "vocab", punjabi: "chup karna",    english: "to be quiet",
      definition: "'Chup' = silent. 'Chup karo' = be quiet (firm).",
      related: "shaant",
      example: "CHUP KARO ji. — Please be quiet." },

    // ===== Body-action verbs =====
    { id: "bv23", type: "vocab", punjabi: "chalna",   english: "to walk / to move",
      definition: "To walk; also 'to function' (machines).",
      related: "daudna",
      example: "CHALO! — Let's go!" },
    { id: "bv25", type: "vocab", punjabi: "leytna",   english: "to lie down",
      definition: "To lie down (recline).",
      related: "sona, baithna",
      example: "Bistar te LEYT jao. — Lie down on the bed." },
    { id: "bv26", type: "vocab", punjabi: "jhukna",   english: "to bend / to bow",
      definition: "Bend forward. Used in greeting elders.",
      related: "satkaar",
      example: "Sir JHUKAO. — Bow your head." },
    { id: "bv27", type: "vocab", punjabi: "uthauna",  english: "to lift / pick up",
      definition: "Causative — lift something. (Compare 'uthna' = to get up.)",
      related: "rakhna",
      example: "Bag UTHAO. — Pick up the bag." },
    { id: "bv28", type: "vocab", punjabi: "sutna",    english: "to throw / to toss",
      definition: "To throw (away or toward).",
      related: "fadna",
      example: "Ball SUT. — Throw the ball." },
    { id: "bv29", type: "vocab", punjabi: "fadna",    english: "to catch / hold",
      definition: "To catch or grab. 'Hath fad' = hold my hand.",
      related: "sutna, lena",
      example: "Ball FAD! — Catch the ball!" },
    { id: "bv30", type: "vocab", punjabi: "hilauna",  english: "to shake / move",
      definition: "Causative — shake something. 'Hilna' = to move oneself.",
      related: "uthauna",
      example: "Sir HILAO. — Shake your head." },

    // ===== Emotion-action verbs =====
    { id: "ev3", type: "vocab", punjabi: "muskurana",    english: "to smile",
      definition: "To smile (gentler than laughing).",
      related: "hasna",
      example: "MUSKURAO! — Smile!" },
    { id: "ev4", type: "vocab", punjabi: "chillauna",    english: "to shout / scream",
      definition: "To yell. 'Mat chillao' = don't shout.",
      related: "shor, awaaz",
      example: "Mat CHILLAO. — Don't shout." },
    { id: "ev5", type: "vocab", punjabi: "ghabraauna",   english: "to panic / be nervous",
      definition: "To get anxious. 'Mat ghabrao' = don't panic.",
      related: "darna, shaant",
      example: "GHABRAO mat. — Don't panic." },
    { id: "ev6", type: "vocab", punjabi: "sharmana",     english: "to feel shy",
      definition: "To feel shy or bashful.",
      related: "sharminda",
      example: "Mat SHARMAO. — Don't be shy." },
    { id: "ev7", type: "vocab", punjabi: "pyar karna",   english: "to love",
      definition: "'Pyar' = love. 'Pyar karna' = to love.",
      related: "pyar, dil",
      example: "Main tuhanu PYAR KARDA HAAN. — I love you." },

    // ===== Public places =====
    { id: "pp1",  type: "vocab", punjabi: "park",         english: "park",
      definition: "Public park. Borrowed.",
      related: "bagh",
      example: "PARK vich sair. — A walk in the park." },
    { id: "pp2",  type: "vocab", punjabi: "library",      english: "library",
      definition: "Borrowed. 'Pustakalaya' is the formal Hindi.",
      related: "kitaab",
      example: "LIBRARY vich kitaaban. — Books in the library." },
    { id: "pp3",  type: "vocab", punjabi: "dak ghar",     english: "post office",
      definition: "'Dak' = post / mail; 'ghar' = house.",
      related: "chithi",
      example: "DAK GHAR jaa raha. — Going to the post office." },
    { id: "pp4",  type: "vocab", punjabi: "petrol pump",  english: "petrol / gas station",
      definition: "Borrowed. Where you fill fuel.",
      related: "gaddi",
      example: "PETROL PUMP najdik hai. — Gas station is nearby." },
    { id: "pp5",  type: "vocab", punjabi: "ATM",          english: "ATM machine",
      definition: "Borrowed. 'ATM mashin'.",
      related: "bank, paisa",
      example: "ATM kithe? — Where's the ATM?" },
    { id: "pp6",  type: "vocab", punjabi: "thaana",       english: "police station",
      definition: "The police station.",
      related: "police",
      example: "THAANE riport karo. — Report at the police station." },
    { id: "pp7",  type: "vocab", punjabi: "court",        english: "court (legal)",
      definition: "Borrowed. Also 'kachehri' (older word).",
      example: "COURT vich peshi. — Hearing in court." },
    { id: "pp8",  type: "vocab", punjabi: "stadium",      english: "stadium",
      definition: "Borrowed. Sports venue.",
      related: "khel",
      example: "STADIUM vich match. — Match at the stadium." },
    { id: "pp9",  type: "vocab", punjabi: "cinema",       english: "movie theater / cinema",
      definition: "Borrowed.",
      related: "film",
      example: "CINEMA jaa rahe. — Going to the cinema." },
    { id: "pp10", type: "vocab", punjabi: "mall",         english: "shopping mall",
      definition: "Borrowed. Modern Indian cities are full of malls.",
      related: "bazaar",
      example: "MALL vich shopping. — Shopping at the mall." },

    // ===== House interior extension =====
    { id: "hi1",  type: "vocab", punjabi: "chhat",            english: "roof / ceiling",
      definition: "Top of the house. Punjabi homes traditionally have flat roofs you can sit on.",
      related: "ghar",
      example: "CHHAT te baith ke chai. — Tea sitting on the roof." },
    { id: "hi2",  type: "vocab", punjabi: "deewar",           english: "wall",
      definition: "A wall.",
      related: "ghar, parda",
      example: "DEEWAR te tasveer. — Picture on the wall." },
    { id: "hi3",  type: "vocab", punjabi: "farsh",            english: "floor",
      definition: "The floor of a room.",
      related: "chhat",
      example: "FARSH saaf karo. — Clean the floor." },
    { id: "hi4",  type: "vocab", punjabi: "balkani",         english: "balcony",
      definition: "Borrowed. A balcony or veranda.",
      related: "chhat",
      example: "BALCONY vich khade. — Standing on the balcony." },
    { id: "hi5",  type: "vocab", punjabi: "baithak",          english: "living room / sitting room",
      definition: "Where guests are received.",
      related: "ghar",
      example: "BAITHAK vich aao. — Come into the living room." },
    { id: "hi6",  type: "vocab", punjabi: "sone wala kamra",  english: "bedroom",
      definition: "Literally 'the room for sleeping'. Also 'bedroom' (borrowed).",
      related: "kamra, sona",
      example: "SONE WALA KAMRA upar hai. — The bedroom is upstairs." },
    { id: "hi7",  type: "vocab", punjabi: "almari",           english: "cupboard / wardrobe",
      definition: "Storage cabinet for clothes or dishes.",
      related: "kapre",
      example: "ALMARI vich kapre. — Clothes in the cupboard." },
    { id: "hi8",  type: "vocab", punjabi: "parda",            english: "curtain",
      definition: "Window curtain. Also figurative 'veil/secrecy'.",
      related: "deewar",
      example: "PARDA hata. — Pull aside the curtain." },

    // ===== Digital / online vocab =====
    { id: "dg1",  type: "vocab", punjabi: "WiFi",          english: "Wi-Fi",
      definition: "Borrowed. 'WiFi da password?' = What's the WiFi password?",
      related: "internet",
      example: "WiFi DA password ki? — What's the WiFi password?" },
    { id: "dg2",  type: "vocab", punjabi: "password",      english: "password",
      definition: "Borrowed.",
      related: "WiFi, login",
      example: "Apna PASSWORD nahin dasso. — Don't share your password." },
    { id: "dg3",  type: "vocab", punjabi: "link",          english: "link / URL",
      definition: "Borrowed. 'Link bhejo' = send the link.",
      related: "internet",
      example: "LINK bhejo. — Send the link." },
    { id: "dg4",  type: "vocab", punjabi: "OTP",           english: "OTP (one-time password)",
      definition: "Borrowed. Used for verification.",
      related: "password",
      example: "OTP aaya? — Did the OTP arrive?" },
    { id: "dg5",  type: "vocab", punjabi: "account",       english: "account (online)",
      definition: "Borrowed. Bank, email, social media.",
      related: "khaata, login",
      example: "Account banao. — Make an account." },
    { id: "dg6",  type: "vocab", punjabi: "login",         english: "login",
      definition: "Borrowed. 'Login karo' = log in.",
      related: "password, account",
      example: "LOGIN karo. — Log in." },
    { id: "dg7",  type: "vocab", punjabi: "screenshot",    english: "screenshot",
      definition: "Borrowed. 'Screenshot lao' = take a screenshot.",
      related: "photo",
      example: "SCREENSHOT bhejo. — Send a screenshot." },
    { id: "dg8",  type: "vocab", punjabi: "video call",    english: "video call",
      definition: "Borrowed.",
      related: "phone, video",
      example: "VIDEO CALL karo. — Make a video call." },
    { id: "dg9",  type: "vocab", punjabi: "group",         english: "group (chat / WhatsApp)",
      definition: "Borrowed. Used for WhatsApp groups, friend groups.",
      related: "WhatsApp",
      example: "Family GROUP vich pao. — Add to family group." },
    { id: "dg10", type: "vocab", punjabi: "share karna",   english: "to share (online)",
      definition: "Code-switched. Sharing photos, links, etc.",
      related: "bhejna",
      example: "Photo SHARE KARO. — Share the photo." },

    // ===== Greetings & farewells extension =====
    { id: "gx1", type: "phrase", punjabi: "Namaste ji",
      english: "Hello (Hindu greeting).",
      definition: "Universal Indian greeting — folded hands. Used by Hindus and many others.",
      related: "Sat sri akaal",
      example: "NAMASTE JI! — Hello!" },
    { id: "gx2", type: "phrase", punjabi: "Ram Ram",
      english: "Greeting (Hindu, esp. rural).",
      definition: "Common village/rural greeting between Hindus.",
      example: "RAM RAM bhai sahab. — Ram Ram, brother sir." },
    { id: "gx3", type: "phrase", punjabi: "Adaab",
      english: "Greeting (Muslim, courteous).",
      definition: "Polite Muslim/Urdu greeting — right hand raised toward forehead.",
      related: "Salaam",
      example: "ADAAB arz hai. — Respectful greetings." },
    { id: "gx4", type: "phrase", punjabi: "Salaam",
      english: "Salutations (Muslim).",
      definition: "Short for 'Assalam-o-alaikum' (peace be upon you).",
      related: "Adaab",
      example: "SALAAM walekum. — Peace upon you (reply)." },
    { id: "gx5", type: "phrase", punjabi: "Alvida",
      english: "Goodbye (formal/poetic).",
      definition: "A formal/dramatic farewell. From Urdu.",
      related: "Phir milange",
      example: "ALVIDA, dost. — Farewell, friend." },
    { id: "gx7", type: "phrase", punjabi: "Jaldi miln di umeed",
      english: "Hope to meet you soon.",
      definition: "Warm closing line.",
      related: "Phir milange",
      example: "JALDI MILN DI UMEED. — Hope to see you soon." },

    // ===== Yes / No / Okay variations =====
    { id: "yn3", type: "phrase", punjabi: "Bilkul",
      english: "Absolutely / certainly.",
      definition: "Strong yes / total agreement.",
      related: "ekdam",
      example: "BILKUL theek. — Absolutely right." },
    { id: "yn4", type: "phrase", punjabi: "Ekdam",
      english: "Exactly / completely.",
      definition: "Used to intensify. 'Ekdam sahi' = exactly right.",
      related: "bilkul",
      example: "EKDAM sahi. — Exactly correct." },
    { id: "yn5", type: "phrase", punjabi: "Galat",
      english: "Wrong / incorrect.",
      definition: "Opposite of 'sahi'.",
      related: "sahi",
      example: "Eh GALAT hai. — This is wrong." },
    { id: "yn6", type: "phrase", punjabi: "Pakka",
      english: "For sure / confirmed.",
      definition: "'Pakka?' = for sure? 'Pakka!' = definitely!",
      related: "bilkul",
      example: "PAKKA aaonga. — Will definitely come." },
    { id: "yn7", type: "phrase", punjabi: "Mushkil",
      english: "Difficult / hard.",
      definition: "'Mushkil hai' = it's hard. Opposite: 'asaan'.",
      related: "asaan",
      example: "Eh MUSHKIL hai. — This is difficult." },
    { id: "yn8", type: "phrase", punjabi: "Asaan",
      english: "Easy.",
      definition: "Opposite of 'mushkil'.",
      related: "mushkil",
      example: "Punjabi ASAAN hai. — Punjabi is easy." },

    // ===== Compliments & encouragement =====
    { id: "cm2", type: "phrase", punjabi: "Mubarak ho",
      english: "Blessed / congratulations (Urdu).",
      definition: "Used for festivals, weddings, big news.",
      related: "Vadhaiyaan",
      example: "Eid MUBARAK HO. — Blessed Eid." },
    { id: "cm3", type: "phrase", punjabi: "Kamaal!",
      english: "Wonderful! / Amazing!",
      definition: "Single-word exclamation of admiration.",
      related: "Vadiya, Bahut khoob",
      example: "KAMAAL ho gaya! — Amazing!" },
    { id: "cm4", type: "phrase", punjabi: "Bahut khoob",
      english: "Very well done.",
      definition: "Compliment from Urdu, common in formal speech.",
      related: "Shabaash",
      example: "BAHUT KHOOB ji! — Very well done!" },
    { id: "cm5", type: "phrase", punjabi: "Dil khush ho gaya",
      english: "My heart is delighted.",
      definition: "Heartfelt compliment after enjoying something.",
      related: "khush, dil",
      example: "Tuhada gaana sun ke DIL KHUSH HO GAYA. — Heart is delighted hearing your song." },
    { id: "cm6", type: "phrase", punjabi: "Kya baat!",
      english: "What a thing! (admiration).",
      definition: "Punjabi/Hindi exclamation of admiration. Often doubled: 'Kya baat, kya baat!'",
      example: "KYA BAAT! Bahut sohna. — What a thing! Very beautiful." },
    { id: "cm7", type: "phrase", punjabi: "Tuhada jawab nahin",
      english: "You're unmatched.",
      definition: "Literal 'there's no answer to you' — high praise.",
      example: "TUHADA JAWAB NAHIN. — You're one of a kind." },

    // ===== Apology & gratitude variations =====
    { id: "ag3", type: "phrase", punjabi: "Bahut shukriya",
      english: "Many thanks.",
      definition: "Stronger than 'shukriya'.",
      related: "Dhanvaad",
      example: "BAHUT SHUKRIYA tuhada. — Many thanks to you." },
    { id: "ag6", type: "phrase", punjabi: "Tuhada ehsaan",
      english: "I owe you.",
      definition: "Literally 'your favor' — heartfelt thanks for a big help.",
      example: "TUHADA EHSAAN hamesha yaad rahega. — I'll always remember your favor." },

    // ===== "I'm learning Punjabi" toolkit =====
    { id: "lm5", type: "phrase", punjabi: "Eh shabad da matlab ki?",
      english: "What does this word mean?",
      definition: "'Shabad' = word; 'matlab' = meaning.",
      related: "shabad",
      example: "EH SHABAD DA MATLAB KI hai? — What does this word mean?" },
    { id: "lm6", type: "phrase", punjabi: "Spelling dasso ji",
      english: "Please tell me the spelling.",
      definition: "Borrowed 'spelling'. Useful when writing things down.",
      example: "SPELLING DASSO JI. — Please tell me the spelling." },
    { id: "lm7", type: "phrase", punjabi: "Galti ho gayi taan theek karo",
      english: "If I make a mistake, please correct me.",
      definition: "Open invitation for corrections — turbocharges your learning.",
      related: "galti",
      example: "GALTI HO GAYI TAAN THEEK KARO ji. — If I'm wrong, please correct me." },
    { id: "lm8", type: "phrase", punjabi: "Mainu thoda thoda Punjabi aandi hai",
      english: "I know just a little Punjabi.",
      definition: "Honest learner-disclaimer. Locks in goodwill from native speakers.",
      example: "MAINU THODA THODA PUNJABI AANDI HAI. — I know a little Punjabi." },
    { id: "lm9", type: "phrase", punjabi: "Tuhadi madad chahidi hai",
      english: "I need your help.",
      definition: "Polite request. 'Madad' = help.",
      related: "madad",
      example: "TUHADI MADAD CHAHIDI HAI ji. — I need your help, please." },
    { id: "lm10", type: "phrase", punjabi: "Sikhauna shuru karange",
      english: "Let's begin learning.",
      definition: "Encouraging opener for a practice session.",
      related: "shuru karna, sikhna",
      example: "Chalo, SIKHAUNA SHURU KARANGE! — Come on, let's begin learning!" },
  ];

  // ---------- Ranks -----------------------------------------------------------
  const RANKS = [
    { level: 1,        title: "Peshtigo Beginner",          badge: "🥋" },
    { level: 50,       title: "Punjabi Trainee",            badge: "🧑‍🎓" },
    { level: 500,      title: "Village Warrior",            badge: "🛡️" },
    { level: 5000,     title: "Saiyan Speaker",             badge: "🔥" },
    { level: 25000,    title: "Super Saiyan Student",       badge: "⚡" },
    { level: 100000,   title: "Super Saiyan Scholar",       badge: "🌟" },
    { level: 500000,   title: "Ultra Instinct Translator",  badge: "🌀" },
    { level: 1000000,  title: "Legendary Super Saiyan Linguist", badge: "👑" },
  ];

  function getRank(level) {
    let r = RANKS[0];
    for (const e of RANKS) if (level >= e.level) r = e;
    return r;
  }

  // Gentle XP curve: lvl 1->2 = 50 xp, lvl 50 reachable in roughly an hour of play.
  function xpForNext(level) {
    return Math.max(20, Math.round(50 * Math.pow(level, 1.35)));
  }

  // ---------- Enemies ---------------------------------------------------------
  // Tiers: 'minion' (emoji), 'elite' (emoji + purple aura), 'boss' (uses enemy.png)
  const ENEMIES = [
    { name: "Training Bot",  emoji: "🤖", baseHp: 60,  tier: "minion", flavor: "A friendly first opponent. Warm up.",
      flavorAlts: ["Wakes up. Already disappointed in you.", "Beep boop. Boring boop."] },
    { name: "Saibaman",      emoji: "👽", baseHp: 90,  tier: "minion", flavor: "Small but tricky. Watch your timing." },
    { name: "Goblin Scout",  emoji: "👺", baseHp: 110, tier: "minion", flavor: "Fast on its feet — answer quickly." },
    { name: "Frieza Minion", emoji: "🦖", baseHp: 140, tier: "elite",  flavor: "Elite mook. Hits harder than it looks." },
    { name: "Cell Mini-Boss",emoji: "🐉", baseHp: 220, tier: "boss",   flavor: "A perfect copy. Only perfect answers will do.",
      flavorAlts: ["He copied you, then improved on it."],
      quote: "Show me your perfect form." },
    { name: "Cell Jr.",      emoji: "🐲", baseHp: 170, tier: "minion", flavor: "Energetic and dangerous in packs." },
    { name: "Phantom Wraith",emoji: "👻", baseHp: 190, tier: "elite",  flavor: "Its telegraphs are louder. Listen." },
    { name: "Storm Djinn",   emoji: "🌪️", baseHp: 210, tier: "minion", flavor: "Whirlwind attacks come fast." },
    { name: "Frost Lich",    emoji: "🧟", baseHp: 230, tier: "elite",  flavor: "Chills your timer. Stay sharp.",
      flavorAlts: ["Breath like January in Manali."] },
    { name: "Buu Spawn",     emoji: "🟣", baseHp: 270, tier: "boss",   flavor: "Stretchy and stubborn. Big reward.",
      flavorAlts: ["Pink, stretchy, rude."],
      quote: "Mmm... candy or fight?" },
    { name: "Shadow Naga",   emoji: "🐍", baseHp: 290, tier: "minion", flavor: "Strikes from the dark." },
    { name: "Final Tyrant",  emoji: "💀", baseHp: 380, tier: "boss",   flavor: "The end of the arena. Everything you've trained for.",
      flavorAlts: ["You've trained 1,000 cards for this moment. Don't choke."],
      quote: "Kneel, learner." },
    // ---- New roster (Section A) ----
    { name: "Tea Slug",          emoji: "🐌", baseHp: 75,  tier: "minion", flavor: "Slow drip, sticky leaves." },
    { name: "Bazaar Thief",      emoji: "🦝", baseHp: 100, tier: "minion", flavor: "Snatches your focus mid-answer." },
    { name: "Pind Crow",         emoji: "🐦", baseHp: 95,  tier: "minion", flavor: "Caws your wrong answers back at you." },
    { name: "Mango Imp",         emoji: "🥭", baseHp: 120, tier: "minion", flavor: "Sweet outside, savage inside." },
    { name: "Gym Bro Saiyan",    emoji: "💪", baseHp: 160, tier: "elite",  flavor: "All sets, no rest day." },
    { name: "Frieza Lieutenant", emoji: "🦎", baseHp: 200, tier: "elite",  flavor: "Cold-blooded and well-paid." },
    { name: "Dhol Demon",        emoji: "🥁", baseHp: 175, tier: "elite",  flavor: "Hits on every beat." },
    { name: "Kali-Yuga Warrior", emoji: "⚔️", baseHp: 220, tier: "elite",  flavor: "Born for the worst age. Thrives in it." },
    { name: "Jungle Tigress",    emoji: "🐅", baseHp: 240, tier: "elite",  flavor: "Stalks your hesitation." },
    { name: "Cyber Naga",        emoji: "🐍", baseHp: 260, tier: "elite",  flavor: "Bytes harder than it bites." },
    { name: "Ghost Pandit",      emoji: "👳", baseHp: 250, tier: "boss",   flavor: "Recites your mistakes back as mantra.",
      quote: "Your roots forgot you." },
    { name: "Mahishasura",       emoji: "🐃", baseHp: 320, tier: "boss",   flavor: "A bull-demon king. No mortal weapon will do.",
      quote: "No mortal weapon. No chance." },
    { name: "Shadow Guru",       emoji: "🕯️", baseHp: 340, tier: "boss",   flavor: "Teaches one lesson: humility.",
      quote: "Unlearn, then bow." },
    { name: "Cell Perfect Form", emoji: "🧬", baseHp: 360, tier: "boss",   flavor: "Every cell has improved. Yours haven't.",
      quote: "I am completion itself." },
    { name: "Zero Saiyan",       emoji: "🌌", baseHp: 420, tier: "boss",   flavor: "Beyond the arena. Beyond you.",
      quote: "Beyond the arena. Beyond you." },
  ];

  // ---------- Tuning constants (random training interrupts) ------------------
  const INTERRUPT = {
    MIN_CARDS_BETWEEN: 5,
    MAX_CARDS_BETWEEN: 12,
    BASE_CHANCE: 0.30,
    WEIGHTS: { speed: 35, recall: 40, incoming: 25 },
    SPEED_DURATION_MS: 20000,
    INCOMING_DURATION_MS: 6000,
    RECALL_DURATION_MS: 8000,
    IDLE_MS: 25000,
    REPEAT_MISS_THRESHOLD: 2,
    RECENT_BUFFER_SIZE: 15,
    SHIELD_CAP: 3,
  };

  // ---------- Tuning constants (battle) --------------------------------------
  const BATTLE = {
    QUESTION_MS_BASE: 9000,
    QUESTION_MS_MIN: 5500,
    SPEED_BONUS_MAX: 0.5,        // up to +50% damage for very fast answers
    TELEGRAPH_EVERY: 4,          // enemy charges special every N questions
    TELEGRAPH_TURNS: 2,          // turns to charge
    TELEGRAPH_DAMAGE_MULT: 2.4,  // multiplier on enemyAttack() damage
    // 9-tier DBZ transformation ladder (streak thresholds, dmg mults, names).
    // Index 0 is base form. Thresholds are ascending streak counts.
    TIER_THRESHOLDS: [5, 10, 15, 20, 30, 45, 60, 80, 100],
    TIER_DMG_MULT:   [1.0, 1.10, 1.20, 1.30, 1.40, 1.55, 1.70, 1.90, 2.10, 2.35],
    TIER_NAMES:      [
      "",
      "Kaioken",
      "Super Saiyan",
      "Super Saiyan 2",
      "Super Saiyan 3",
      "Super Saiyan 4",
      "Super Saiyan God",
      "Super Saiyan Blue",
      "Ultra Instinct Sign",
      "Mastered Ultra Instinct",
    ],
    KI_SPECIAL_COST: 100,
    KI_SPECIAL_DMG_BASE: 30,
    KI_SPECIAL_DMG_PER_LVL: 1.2,
  };

  // Per-difficulty tuning. Modifiers applied at run start in startBattle().
  const DIFFICULTY = {
    easy:    { label: "Easy",    desc: "Easy — 7 fights, gentle timer, fewer specials.",   fights: 7,  timerMult: 1.30, dmgMult: 0.75, telegraphEvery: 6, healPerKO: 25,  endless: false },
    normal:  { label: "Normal",  desc: "Normal — 10 fights, classic timer.",                fights: 10, timerMult: 1.00, dmgMult: 1.00, telegraphEvery: 4, healPerKO: 20,  endless: false },
    hard:    { label: "Hard",    desc: "Hard — 12 fights, tight timer, no inter-fight heal.", fights: 12, timerMult: 0.85, dmgMult: 1.20, telegraphEvery: 3, healPerKO: 0,   endless: false },
    endless: { label: "Endless", desc: "Endless — survive as long as you can. Heal every 3 KOs.", fights: Infinity, timerMult: 1.00, dmgMult: 1.00, telegraphEvery: 4, healPerKO: 0, healEveryNKOs: 3, healAmount: 18, endless: true },
  };

  // ---------- Spaced-Repetition tuning --------------------------------------
  // All SRS knobs in one place. Modeled after Anki: explicit learning steps,
  // gentle lapse handling (interval halves rather than full reset), interval
  // fuzz, and a separate "shaky cards" channel fed by Battle Mode without
  // polluting review timing.
  const SRS = {
    SCHEMA_VERSION: 3,
    // Learning steps for brand-new cards. Minutes.
    LEARNING_STEPS_MIN: [1, 10, 60 * 24], // 1m, 10m, 1d
    // Relearning steps after a "again" on a graduated card. Minutes.
    RELEARNING_STEPS_MIN: [10, 60 * 24], // 10m, 1d
    // First two graduated intervals (days) before SM-2 takes over.
    GRAD_INTERVAL_GOOD: 1,
    GRAD_INTERVAL_EASY: 4,
    // Ease bounds + starting ease.
    EASE_MIN: 1.3,
    EASE_MAX: 2.8,
    EASE_START: 2.3,
    // Interval multipliers in review queue.
    HARD_MULT: 1.2,
    EASY_BONUS: 1.3,
    // Fuzz applied to review intervals (±FUZZ_PCT). Deterministic per card.
    FUZZ_PCT: 0.05,
    // After a lapse, new interval = max(1, oldInterval * LAPSE_MULT).
    LAPSE_MULT: 0.5,
    // Hard upper bound on any single interval (days). Prevents cards from
    // disappearing into multi-year intervals.
    MAX_INTERVAL_DAYS: 365,
    // Mastery threshold for the "Mastered" badge.
    MASTERY_INTERVAL_DAYS: 21,
    MASTERY_MAX_LAPSES: 1,
    // Adaptive new-card pacing. Not user-tunable: we want every learner on
    // a research-backed schedule (5/day baseline, ~10 cards/day max for a
    // language deck this size, scaled down by recent backlog/lapses).
    NEW_PER_DAY_BASE: 5,
    NEW_PER_DAY_MIN: 1,
    NEW_PER_DAY_MAX: 10,
    BACKLOG_SOFT_CAP: 30,           // reviews beyond this start shrinking new cap
    LAPSE_LOOKBACK_MS: 7 * 86400_000,
    // Battle soft-writeback ease deltas.
    BATTLE_EASE_FAST: 0.02,
    BATTLE_EASE_SLOW: 0.01,
    BATTLE_EASE_MISS: -0.05,
    BATTLE_FAST_MS: 2000,
    // Shaky-card boost: training reviews from shakyCards get sorted earlier.
    SHAKY_PRIORITY_BONUS: 1,
    // Auto-clear shaky flag if the card hasn't been seen in this long.
    SHAKY_DECAY_MS: 14 * 86400_000,
    // Leech: a card with this many lapses is auto-suspended from training
    // and battle until the user explicitly resets it.
    LEECH_LAPSE_THRESHOLD: 8,
    // "Day" rolls over at 4 AM local so late-night sessions stay on the
    // same study day.
    STUDY_DAY_OFFSET_HOURS: 4,
  };

  function srsHash(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  function fuzzInterval(id, days) {
    if (days < 2) return Math.min(days, SRS.MAX_INTERVAL_DAYS);
    const h = srsHash(id);
    // Deterministic offset in [-FUZZ_PCT, +FUZZ_PCT].
    const norm = ((h % 1000) / 1000) * 2 - 1;
    const fuzzed = Math.max(1, Math.round(days * (1 + SRS.FUZZ_PCT * norm)));
    return Math.min(fuzzed, SRS.MAX_INTERVAL_DAYS);
  }
  function capInterval(days) {
    return Math.min(Math.max(1, Math.round(days)), SRS.MAX_INTERVAL_DAYS);
  }
  function todayKey(now = Date.now()) {
    // Subtract the offset so anything before 4 AM counts as "yesterday".
    const d = new Date(now - SRS.STUDY_DAY_OFFSET_HOURS * 3600_000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function getDailyStats(now = Date.now()) {
    if (!state.dailyStats) state.dailyStats = {};
    const k = todayKey(now);
    if (!state.dailyStats[k]) state.dailyStats[k] = { newIntroduced: 0, lapses: 0, reviews: 0 };
    return state.dailyStats[k];
  }
  function recentLapses(ms = SRS.LAPSE_LOOKBACK_MS) {
    if (!state.dailyStats) return 0;
    const cutoff = Date.now() - ms;
    let n = 0;
    for (const [k, v] of Object.entries(state.dailyStats)) {
      const ts = new Date(k + "T00:00:00").getTime();
      if (!isNaN(ts) && ts >= cutoff) n += (v.lapses || 0);
    }
    return n;
  }
  function isLeech(s) {
    return !!s && (s.lapses || 0) >= SRS.LEECH_LAPSE_THRESHOLD;
  }
  function dueReviewCount(now = Date.now()) {
    let n = 0;
    for (const c of DECK) {
      const s = state.srs[c.id];
      if (!s || s.suspended || isLeech(s)) continue;
      if ((s.queue === "review" || s.queue === "relearning") && (s.due || 0) <= now) n++;
    }
    return n;
  }
  function masteryPctRaw() {
    let mastered = 0, denom = 0;
    for (const c of DECK) {
      const s = state.srs[c.id];
      if (!s || s.suspended) continue;
      denom++;
      if (s.queue === "review" && s.interval >= SRS.MASTERY_INTERVAL_DAYS && (s.lapses || 0) <= SRS.MASTERY_MAX_LAPSES) mastered++;
    }
    return denom ? Math.round((mastered / denom) * 100) : 0;
  }
  function dailyNewCardLimit() {
    const backlog = dueReviewCount();
    const lapses = recentLapses();
    let cap = SRS.NEW_PER_DAY_BASE;
    if (backlog > SRS.BACKLOG_SOFT_CAP) {
      cap -= Math.floor((backlog - SRS.BACKLOG_SOFT_CAP) / 10);
    }
    cap -= Math.floor(lapses / 5);
    if (masteryPctRaw() > 60 && backlog < 10) cap += 2;
    return clamp(cap, SRS.NEW_PER_DAY_MIN, SRS.NEW_PER_DAY_MAX);
  }
  function forecastDueByDay(days = 7) {
    const now = Date.now();
    const buckets = new Array(days).fill(0);
    for (const c of DECK) {
      const s = state.srs[c.id];
      if (!s || s.queue === "new" || s.suspended || isLeech(s)) continue;
      if ((s.due || 0) <= now) { buckets[0]++; continue; }
      const offset = Math.floor(((s.due || 0) - now) / 86400_000);
      if (offset < days) buckets[offset]++;
    }
    return buckets;
  }
  // Sweep shaky-card flags older than SHAKY_DECAY_MS. Cheap; called on session start.
  function decayShakyCards() {
    if (!state.shakyCards) return;
    const cutoff = Date.now() - SRS.SHAKY_DECAY_MS;
    for (const [id, ts] of Object.entries(state.shakyCards)) {
      if (!ts || ts < cutoff) delete state.shakyCards[id];
    }
  }
  // Compute the interval (in days) that a given grade WOULD produce, without
  // mutating state. Used to render preview labels on the SRS buttons.
  function previewGradeInterval(cardId, grade) {
    const s = state.srs[cardId];
    if (!s) return null;
    const min = 1, day = 1440;
    const inLearning = s.queue === "new" || s.queue === "learning" || s.queue === "relearning";
    if (inLearning) {
      const steps = (s.queue === "relearning") ? SRS.RELEARNING_STEPS_MIN : SRS.LEARNING_STEPS_MIN;
      const step = Math.min(s.step || 0, steps.length - 1);
      switch (grade) {
        case "again": return { minutes: steps[0] };
        case "hard":  return { minutes: steps[step] };
        case "good": {
          const next = step + 1;
          if (next >= steps.length) {
            const days = (s.queue === "relearning") ? Math.max(1, s.interval || 1) : SRS.GRAD_INTERVAL_GOOD;
            return { days };
          }
          return { minutes: steps[next] };
        }
        case "easy": {
          const days = (s.queue === "relearning") ? Math.max(1, s.interval || 1) : SRS.GRAD_INTERVAL_EASY;
          return { days };
        }
      }
    }
    // Review queue.
    const prev = Math.max(1, s.interval || 1);
    switch (grade) {
      case "again": return { minutes: SRS.RELEARNING_STEPS_MIN[0] };
      case "hard":  return { days: capInterval(Math.max(prev + 1, prev * SRS.HARD_MULT)) };
      case "good":  return { days: capInterval(Math.max(prev + 1, prev * s.ease)) };
      case "easy":  return { days: capInterval(Math.max(prev + 2, prev * Math.min(SRS.EASE_MAX, s.ease + 0.1) * SRS.EASY_BONUS)) };
    }
    return null;
  }

  // ---------- Haptics --------------------------------------------------------
  function buzz(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch {}
  }

  // ---------- Punjabi Text-to-Speech ----------------------------------------
  // Strategy: prefer a real `pa-IN` Web Speech voice if the OS provides one
  // (Edge ships one; some Android Chrome builds do too). Otherwise fall back
  // to Google Translate's free TTS endpoint with `tl=pa`, which has a real
  // Punjabi voice and works in any browser via a plain <audio> element.
  // For best pronunciation we feed it Gurmukhi script. Cards without a
  // Gurmukhi mapping still attempt audio with the romanized text (imperfect
  // but functional) — extend GURMUKHI below to improve quality over time.
  const GURMUKHI = {
    // Core vocab
    v1: "ਪਾਣੀ", v2: "ਰੋਟੀ", v3: "ਘਰ", v4: "ਮਾਂ", v5: "ਪਿਓ",
    v6: "ਬਜ਼ਾਰ", v7: "ਗੱਡੀ", v8: "ਜਲਦੀ", v9: "ਰੁਕ", v10: "ਸੁਣ",
    v11: "ਕਿਤਾਬ", v12: "ਦੋਸਤ", v13: "ਸਕੂਲ", v14: "ਚਾਹ", v15: "ਦੁੱਧ",
    v16: "ਰੰਗ", v17: "ਦਿਨ", v18: "ਰਾਤ", v19: "ਖਾਣਾ", v20: "ਨਾਮ",
    // Numbers
    n1: "ਇੱਕ", n2: "ਦੋ", n3: "ਤਿੰਨ", n4: "ਚਾਰ", n5: "ਪੰਜ",
    n6: "ਛੇ", n7: "ਸੱਤ", n8: "ਅੱਠ", n9: "ਨੌਂ", n10: "ਦਸ",
    n11: "ਗਿਆਰਾਂ", n12: "ਬਾਰਾਂ", n13: "ਤੇਰਾਂ", n14: "ਚੌਦਾਂ", n15: "ਪੰਦਰਾਂ",
    n16: "ਸੋਲਾਂ", n17: "ਸਤਾਰਾਂ", n18: "ਅਠਾਰਾਂ", n19: "ਉੱਨੀ",
    n20: "ਵੀਹ", n30: "ਤੀਹ", n40: "ਚਾਲੀ", n50: "ਪੰਜਾਹ",
    n100: "ਸੌ", n1000: "ਹਜ਼ਾਰ",
    // Family
    f1: "ਭਰਾ", f2: "ਭੈਣ", f3: "ਦਾਦਾ", f4: "ਦਾਦੀ", f5: "ਨਾਨਾ",
    f6: "ਨਾਨੀ", f7: "ਚਾਚਾ", f8: "ਮਾਮਾ", f9: "ਪੁੱਤਰ", f10: "ਧੀ",
    f11: "ਪਰਿਵਾਰ",
    // Body
    b1: "ਸਿਰ", b2: "ਅੱਖ", b3: "ਕੰਨ", b4: "ਨੱਕ", b5: "ਮੂੰਹ",
    b6: "ਹੱਥ", b7: "ਪੈਰ", b8: "ਪੇਟ", b9: "ਦਿਲ", b10: "ਵਾਲ",
    b11: "ਦੰਦ", b12: "ਜੀਭ", b13: "ਗਲਾ", b14: "ਉਂਗਲ",
    // Colors
    c1: "ਲਾਲ", c2: "ਨੀਲਾ", c3: "ਪੀਲਾ", c4: "ਹਰਾ", c5: "ਕਾਲਾ",
    c6: "ਚਿੱਟਾ", c7: "ਭੂਰਾ", c8: "ਗੁਲਾਬੀ",
    // Days
    d1: "ਸੋਮਵਾਰ", d2: "ਮੰਗਲਵਾਰ", d3: "ਬੁੱਧਵਾਰ", d4: "ਵੀਰਵਾਰ",
    d5: "ਸ਼ੁੱਕਰਵਾਰ", d6: "ਸ਼ਨੀਵਾਰ", d7: "ਐਤਵਾਰ",
    // Time
    t1: "ਅੱਜ", t2: "ਕੱਲ੍ਹ", t3: "ਸਵੇਰੇ", t4: "ਸ਼ਾਮ", t5: "ਦੁਪਹਿਰ",
    t6: "ਹੁਣ", t7: "ਸਾਲ", t8: "ਮਹੀਨਾ", t9: "ਹਫ਼ਤਾ",
    // Food
    fd1: "ਚਾਵਲ", fd2: "ਦਾਲ", fd3: "ਸਬਜ਼ੀ", fd4: "ਆਲੂ", fd5: "ਫਲ",
    fd6: "ਅੰਬ", fd7: "ਲੱਸੀ", fd8: "ਨਮਕ", fd9: "ਮਿਰਚ", fd10: "ਅੰਡਾ",
    fd11: "ਪਰੌਂਠੇ",
    // Animals
    a1: "ਕੁੱਤਾ", a2: "ਬਿੱਲੀ", a3: "ਗਾਂ", a4: "ਘੋੜਾ", a5: "ਪੰਛੀ", a6: "ਸ਼ੇਰ",
    // Places
    pl1: "ਪਿੰਡ", pl2: "ਸ਼ਹਿਰ", pl3: "ਖੇਤ", pl4: "ਨਦੀ",
    pl5: "ਗੁਰਦੁਆਰਾ", pl6: "ਦੁਕਾਨ",
    // Adjectives
    ad1: "ਵੱਡਾ", ad2: "ਛੋਟਾ", ad3: "ਚੰਗਾ", ad4: "ਮਾੜਾ", ad5: "ਸੋਹਣਾ",
    ad6: "ਗਰਮ", ad7: "ਠੰਡਾ", ad8: "ਨਵਾਂ", ad9: "ਪੁਰਾਣਾ", ad10: "ਸੌਖਾ",
    ad11: "ਔਖਾ",
    // Verbs
    vb1: "ਜਾਣਾ", vb2: "ਆਉਣਾ", vb3: "ਕਰਨਾ", vb4: "ਬੋਲਣਾ", vb5: "ਪੜ੍ਹਨਾ",
    vb6: "ਲਿਖਣਾ", vb7: "ਦੇਖਣਾ", vb8: "ਸਮਝਣਾ", vb9: "ਸਿੱਖਣਾ",
    vb10: "ਸੌਣਾ", vb11: "ਖਰੀਦਣਾ", vb12: "ਦੇਣਾ", vb13: "ਲੈਣਾ",
    // Pronouns
    pr1: "ਮੈਂ", pr2: "ਤੂੰ", pr3: "ਤੁਸੀਂ", pr4: "ਅਸੀਂ", pr5: "ਉਹ", pr6: "ਇਹ",
    // Question words
    q1: "ਕੀ", q2: "ਕਿੱਥੇ", q3: "ਕਦੋਂ", q4: "ਕਿਉਂ", q5: "ਕਿਵੇਂ",
    q6: "ਕੌਣ", q7: "ਕਿੰਨਾ",
    // Phrases
    p1: "ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?", p2: "ਮੈਂ ਠੀਕ ਹਾਂ", p3: "ਤੁਹਾਡਾ ਨਾਮ ਕੀ ਹੈ?",
    p4: "ਮੇਰਾ ਨਾਮ ___ ਹੈ", p5: "ਮੈਂ ਪੰਜਾਬੀ ਸਿੱਖ ਰਿਹਾ ਹਾਂ",
    p6: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", p7: "ਸ਼ੁਕਰੀਆ",
    p8: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ ਜੀ", p9: "ਫਿਰ ਮਿਲਾਂਗੇ", p10: "ਰੱਬ ਰਾਖਾ",
    p11: "ਮਾਫ਼ ਕਰਨਾ", p12: "ਕੋਈ ਗੱਲ ਨਹੀਂ", p13: "ਮਿਹਰਬਾਨੀ",
    p14: "ਜੀ ਹਾਂ", p15: "ਜੀ ਨਹੀਂ", p16: "ਤੁਹਾਨੂੰ ਮਿਲ ਕੇ ਖੁਸ਼ੀ ਹੋਈ",
    p17: "ਤੁਸੀਂ ਕਿੱਥੋਂ ਹੋ?", p18: "ਮੈਂ ਅਮਰੀਕਾ ਤੋਂ ਹਾਂ",
    p19: "ਮੈਨੂੰ ਸਮਝ ਨਹੀਂ ਆਈ", p20: "ਹੌਲੇ ਬੋਲੋ", p21: "ਫਿਰ ਕਹੋ",
    p22: "ਮੈਨੂੰ ਭੁੱਖ ਲੱਗੀ ਹੈ", p23: "ਮੈਨੂੰ ਪਿਆਸ ਲੱਗੀ ਹੈ",
    p24: "ਮੈਨੂੰ ਪਸੰਦ ਹੈ", p25: "ਮੈਨੂੰ ਪਤਾ ਨਹੀਂ", p26: "ਕਿੰਨੇ ਪੈਸੇ?",
    p27: "ਬਹੁਤ ਮਹਿੰਗਾ ਹੈ", p28: "ਚਲੋ!", p29: "ਅੱਛਾ", p30: "ਖੁਸ਼ ਰਹੋ",
    // Kindness phrases
    k1: "ਜੀ", k2: "ਜੀ ਆਇਆ ਨੂੰ", k3: "ਤਸ਼ਰੀਫ਼ ਰੱਖੋ", k4: "ਬੈਠ ਜਾਓ ਜੀ",
    k5: "ਪਾਣੀ ਪੀਓ ਜੀ", k6: "ਚਾਹ ਪੀ ਕੇ ਜਾਣਾ", k7: "ਕਿਰਪਾ ਕਰਕੇ",
    k8: "ਮਿਹਰਬਾਨੀ ਕਰਕੇ", k9: "ਬਹੁਤ ਸ਼ੁਕਰੀਆ ਜੀ", k10: "ਧੰਨਵਾਦ",
    k11: "ਮੈਨੂੰ ਮਾਫ਼ ਕਰੋ", k12: "ਗ਼ਲਤੀ ਹੋ ਗਈ", k13: "ਤੁਹਾਡੀ ਮਿਹਰਬਾਨੀ",
    k14: "ਰੱਬ ਤੁਹਾਡਾ ਭਲਾ ਕਰੇ", k15: "ਖ਼ੈਰ", k16: "ਸਭ ਠੀਕ ਹੈ",
    k17: "ਕੀ ਹਾਲ ਹੈ?", k18: "ਸਭ ਵਧੀਆ", k19: "ਤੁਹਾਡਾ ਦਿਨ ਵਧੀਆ ਰਹੇ",
    k20: "ਆਰਾਮ ਨਾਲ", k21: "ਫ਼ਿਕਰ ਨਾ ਕਰੋ", k22: "ਮਦਦ ਚਾਹੀਦੀ ਹੈ?",
    k23: "ਮੈਂ ਮਦਦ ਕਰਾਂ?", k24: "ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ", k25: "ਬੇਸ਼ੱਕ",
    k26: "ਜ਼ਰੂਰ", k27: "ਖਿਆਲ ਰੱਖਣਾ", k28: "ਆਪਣਾ ਧਿਆਨ ਰੱਖੋ",
    k29: "ਵਧਾਈਆਂ!", k30: "ਮੁਬਾਰਕ",
    // Weather
    w1: "ਮੌਸਮ", w2: "ਗਰਮੀ", w3: "ਸਰਦੀ", w4: "ਬਾਰਿਸ਼", w5: "ਬੱਦਲ",
    w6: "ਆਸਮਾਨ", w7: "ਸੂਰਜ", w8: "ਚੰਦ", w9: "ਤਾਰੇ", w10: "ਹਵਾ",
    w11: "ਬਰਫ਼", w12: "ਫੁੱਲ", w13: "ਰੁੱਖ",
    // House
    ho1: "ਕਮਰਾ", ho2: "ਰਸੋਈ", ho3: "ਦਰਵਾਜ਼ਾ", ho4: "ਖਿੜਕੀ", ho5: "ਮੇਜ਼",
    ho6: "ਕੁਰਸੀ", ho7: "ਪਲੰਘ", ho8: "ਘੜੀ", ho9: "ਬੱਤੀ", ho10: "ਚਾਬੀ",
    // Health
    h11: "ਦਵਾਈ", h12: "ਡਾਕਟਰ", h13: "ਬੀਮਾਰ", h14: "ਦੁਖਣਾ", h15: "ਆਰਾਮ",
    // School
    s1: "ਉਸਤਾਦ", s2: "ਵਿਦਿਆਰਥੀ", s3: "ਸਬਕ", s4: "ਇਮਤਿਹਾਨ",
    s5: "ਕਲਮ", s6: "ਕਾਗਜ਼",
    // Honorifics
    h1: "ਸਾਹਿਬ", h2: "ਸਰਦਾਰ ਜੀ", h3: "ਵੀਰ ਜੀ", h4: "ਪਾ ਜੀ",
    h5: "ਭੈਣ ਜੀ", h6: "ਬੇਟਾ", h7: "ਪੁੱਤਰ ਜੀ", h8: "ਬਜ਼ੁਰਗ",
    h9: "ਸਤਿਕਾਰ", h10: "ਇੱਜ਼ਤ",
    // Feelings
    fe1: "ਖੁਸ਼", fe2: "ਉਦਾਸ", fe3: "ਗੁੱਸਾ", fe4: "ਸ਼ਾਂਤ", fe5: "ਡਰ",
    fe6: "ਥੱਕ", fe7: "ਪਿਆਰ", fe8: "ਯਾਦ", fe9: "ਦੁੱਖ", fe10: "ਸੁੱਖ",
    fe11: "ਉਮੀਦ", fe12: "ਸਿਹਤ",
    // Daily essentials
    de1: "ਪੈਸਾ", de2: "ਕੰਮ", de3: "ਸਮਾਨ", de4: "ਕੱਪੜਾ", de5: "ਰਸਤਾ",
    de6: "ਸਮਾਂ", de7: "ਵੇਲੇ", de8: "ਫ਼ੋਨ", de9: "ਗੱਲ", de10: "ਸਵਾਲ",
    de11: "ਜਵਾਬ", de12: "ਸੱਚ", de13: "ਝੂਠ", de14: "ਮਿਹਨਤ", de15: "ਹਿੰਮਤ",
    // Ordinals
    no1: "ਪਹਿਲਾ", no2: "ਦੂਜਾ", no3: "ਤੀਜਾ", no4: "ਆਖਰੀ",

    // ===== Phase-2 expansion (single-word vocab; phrases fall back to roman) =====
    // Numbers 21-29, 60-90
    n21: "ਇੱਕੀ", n22: "ਬਾਈ", n23: "ਤੇਈ", n24: "ਚੌਵੀ", n25: "ਪੰਜੀ",
    n26: "ਛੱਬੀ", n27: "ਸਤਾਈ", n28: "ਅਠਾਈ", n29: "ਉਨੱਤੀ",
    n60: "ਸੱਠ", n70: "ਸੱਤਰ", n80: "ਅੱਸੀ", n90: "ਨੱਬੇ",
    // Big numbers
    nh1: "ਸੌ", nh2: "ਦੋ ਸੌ", nh3: "ਪੰਜ ਸੌ", nh4: "ਹਜ਼ਾਰ", nh5: "ਦਸ ਹਜ਼ਾਰ",
    nh6: "ਲੱਖ", nh7: "ਕਰੋੜ", nh8: "ਸਵਾ ਸੌ", nh9: "ਢਾਈ ਸੌ", nh10: "ਅੱਧਾ",
    // Ordinals (or*)
    or1: "ਪਹਿਲਾ", or2: "ਦੂਜਾ", or3: "ਤੀਜਾ", or4: "ਚੌਥਾ", or5: "ਪੰਜਵਾਂ", or6: "ਆਖ਼ਰੀ",
    // More verbs
    vb14: "ਖਾਣਾ", vb15: "ਪੀਣਾ", vb16: "ਖੇਡਣਾ", vb17: "ਹੱਸਣਾ", vb18: "ਰੋਣਾ",
    vb19: "ਤੁਰਨਾ", vb20: "ਦੌੜਨਾ", vb21: "ਬੈਠਣਾ", vb22: "ਖਲੋਣਾ", vb23: "ਉੱਠਣਾ",
    vb24: "ਮਿਲਣਾ", vb25: "ਖੋਲ੍ਹਣਾ", vb26: "ਬੰਦ ਕਰਨਾ", vb27: "ਪੁੱਛਣਾ", vb28: "ਦੱਸਣਾ",
    vb29: "ਸੋਚਣਾ", vb30: "ਯਾਦ ਕਰਨਾ", vb31: "ਭੁੱਲਣਾ",
    vb32: "ਬਣਾਉਣਾ", vb33: "ਤੋੜਨਾ", vb34: "ਜੋੜਨਾ", vb35: "ਸੰਭਾਲਣਾ", vb36: "ਨੱਚਣਾ",
    vb37: "ਗਾਉਣਾ", vb38: "ਧੋਣਾ", vb39: "ਇੰਤਜ਼ਾਰ ਕਰਨਾ", vb40: "ਸ਼ੁਰੂ ਕਰਨਾ",
    vb41: "ਖਤਮ ਕਰਨਾ", vb42: "ਚੁਣਨਾ", vb43: "ਲੱਭਣਾ", vb44: "ਛੁਪਣਾ", vb45: "ਮਾਰਨਾ",
    vb46: "ਜਗਾਉਣਾ", vb47: "ਕਮਾਉਣਾ", vb48: "ਖਰੀਦਣਾ", vb49: "ਵੇਚਣਾ", vb50: "ਗੁੱਸਾ ਕਰਨਾ",
    // Opposites / common adjectives
    op1: "ਲੰਬਾ", op2: "ਉੱਚਾ", op3: "ਨੀਵਾਂ", op4: "ਤੇਜ਼", op5: "ਹੌਲੇ",
    op6: "ਖਾਲੀ", op7: "ਭਰਿਆ", op8: "ਸਾਫ਼", op9: "ਗੰਦਾ", op10: "ਸਸਤਾ", op11: "ਮਹਿੰਗਾ",
    // Personality adjectives
    pa1: "ਸਿਆਣਾ", pa2: "ਬੇਵਕੂਫ਼", pa3: "ਇਮਾਨਦਾਰ", pa4: "ਬਹਾਦਰ", pa5: "ਡਰਪੋਕ",
    pa6: "ਅਮੀਰ", pa7: "ਗਰੀਬ", pa8: "ਮਿਹਨਤੀ", pa9: "ਆਲਸੀ", pa10: "ਪਿਆਰਾ",
    pa11: "ਦੁਸ਼ਮਣ", pa12: "ਆਪਣਾ",
    // Body (extra)
    b15: "ਬਾਂਹ", b16: "ਗਰਦਨ", b17: "ਪਿੱਠ", b18: "ਗੋਡਾ", b19: "ਕੂਹਣੀ",
    b20: "ਖ਼ੂਨ", b21: "ਸਾਹ",
    // Health
    h16: "ਬੁਖ਼ਾਰ", h17: "ਖਾਂਸੀ", h18: "ਜ਼ੁਕਾਮ", h19: "ਚੋਟ", h20: "ਦਰਦ",
    h21: "ਹਸਪਤਾਲ", h22: "ਤਬੀਅਤ",
    // Feelings (extra)
    fe13: "ਸ਼ਰਮਿੰਦਾ", fe14: "ਹੈਰਾਨ", fe15: "ਗਰਵ", fe16: "ਸ਼ੱਕ", fe17: "ਭਰੋਸਾ",
    fe18: "ਮਾਫ਼ੀ", fe19: "ਸ਼ਾਂਤੀ", fe20: "ਖੌਫ਼",
    // Food (extra)
    fd12: "ਗੋਭੀ", fd13: "ਮੂਲੀ", fd14: "ਗਾਜਰ", fd15: "ਪਾਲਕ", fd16: "ਮੇਥੀ",
    fd17: "ਭਿੰਡੀ", fd18: "ਪਨੀਰ", fd19: "ਗੁਲਾਬ ਜਾਮਨ", fd20: "ਜਲੇਬੀ", fd21: "ਖੀਰ",
    fd22: "ਲੱਡੂ", fd23: "ਮਿਠਾਈ", fd24: "ਮਸਾਲਾ ਚਾਹ", fd25: "ਦੁੱਧ ਪੱਤੀ",
    // Fruits
    fr1: "ਸੇਬ", fr2: "ਕੇਲਾ", fr3: "ਅੰਗੂਰ", fr4: "ਸੰਤਰਾ", fr5: "ਤਰਬੂਜ਼",
    fr6: "ਅਨਾਰ", fr7: "ਪਪੀਤਾ", fr8: "ਅਨਾਨਾਸ", fr9: "ਨਾਸ਼ਪਾਤੀ", fr10: "ਖਰਬੂਜਾ",
    // Animals (extra)
    a7: "ਬੱਕਰੀ", a8: "ਚੂਹਾ", a9: "ਕਾਂ", a10: "ਕਬੂਤਰ", a11: "ਮੱਛੀ",
    a12: "ਤਿਤਲੀ", a13: "ਮੱਖੀ", a14: "ਮੱਛਰ", a15: "ਸੱਪ", a16: "ਹਾਥੀ",
    // Nature
    na1: "ਪਹਾੜ", na2: "ਜੰਗਲ", na3: "ਸਮੁੰਦਰ", na4: "ਝੀਲ", na5: "ਰੇਤ",
    na6: "ਮਿੱਟੀ", na7: "ਪੱਤਾ", na8: "ਬੀਜ", na9: "ਬਾਗ਼", na10: "ਅੱਗ",
    // Sports
    sp1: "ਖੇਡ", sp2: "ਕਬੱਡੀ", sp3: "ਕ੍ਰਿਕਟ", sp4: "ਹਾਕੀ", sp5: "ਫੁੱਟਬਾਲ",
    sp6: "ਗੁੱਲੀ-ਡੰਡਾ", sp7: "ਖੋ-ਖੋ", sp8: "ਪਤੰਗ", sp9: "ਤਾਸ਼", sp10: "ਲੂਡੋ",
    // Music
    mu1: "ਗਾਣਾ", mu2: "ਗੀਤ", mu3: "ਧੁਨ", mu4: "ਵਾਜਾ", mu5: "ਤਬਲਾ",
    mu6: "ਹਾਰਮੋਨੀਅਮ", mu7: "ਸਿਤਾਰ", mu8: "ਨਾਚ", mu9: "ਕਵੀ", mu10: "ਕਵਿਤਾ",
    // Religion
    rl1: "ਗੁਰੂ", rl2: "ਗ੍ਰੰਥ", rl3: "ਅਰਦਾਸ", rl4: "ਪਾਠ", rl5: "ਕੀਰਤਨ",
    rl6: "ਸਿਮਰਨ", rl7: "ਨਾਮ", rl8: "ਪੰਗਤ", rl9: "ਖੰਡਾ", rl10: "ਮੰਦਰ",
    rl11: "ਮਸਜਿਦ", rl12: "ਗਿਰਜਾ",
    // Festivals
    fs1: "ਦੀਵਾਲੀ", fs2: "ਹੋਲੀ", fs3: "ਹੋਲਾ ਮਹੱਲਾ", fs4: "ਗੁਰਪੁਰਬ", fs5: "ਈਦ",
    fs6: "ਕਰਵਾ ਚੌਥ", fs7: "ਰੱਖੜੀ", fs8: "ਵਿਆਹ", fs9: "ਜਨਮਦਿਨ", fs10: "ਮੇਲਾ",
    // Wedding
    wd1: "ਬਰਾਤ", wd2: "ਡੋਲੀ", wd3: "ਸਗਨ", wd4: "ਮਿਲਣੀ", wd5: "ਅਨੰਦ ਕਾਰਜ",
    wd6: "ਲਾਵਾਂ", wd7: "ਵਿਦਾਈ", wd8: "ਨਿਕਾਹ",
    // Transport / city
    ct1: "ਬੱਸ", ct2: "ਰੇਲ", ct3: "ਰਿਕਸ਼ਾ", ct4: "ਆਟੋ", ct5: "ਟਰੈਕਟਰ",
    ct6: "ਹਵਾਈ ਜਹਾਜ਼", ct7: "ਏਅਰਪੋਰਟ", ct8: "ਟਿਕਟ", ct9: "ਸਾਈਕਲ", ct10: "ਟ੍ਰੈਫ਼ਿਕ",
    // Work
    wk1: "ਦਫ਼ਤਰ", wk2: "ਨੌਕਰੀ", wk3: "ਬੌਸ", wk4: "ਮੁਲਾਜ਼ਮ", wk5: "ਤਨਖ਼ਾਹ",
    wk6: "ਛੁੱਟੀ", wk7: "ਮੀਟਿੰਗ", wk8: "ਫ਼ਾਈਲ", wk9: "ਕੰਪਿਊਟਰ", wk10: "ਈਮੇਲ",
    // Tech
    tc1: "ਮੋਬਾਈਲ", tc2: "ਇੰਟਰਨੈੱਟ", tc3: "ਵੀਡੀਓ", tc4: "ਮੈਸੇਜ", tc5: "ਫੋਟੋ",
    tc6: "ਕੈਮਰਾ", tc7: "ਟੀਵੀ", tc8: "ਰੇਡੀਓ", tc9: "ਚਾਰਜਰ", tc10: "ਐਪ",
    // Family kinship
    fk1: "ਮਾਮਾ", fk2: "ਮਾਮੀ", fk3: "ਚਾਚਾ", fk4: "ਚਾਚੀ", fk5: "ਤਾਇਆ",
    fk6: "ਤਾਈ", fk7: "ਮਾਸੀ", fk8: "ਭੂਆ", fk9: "ਦਾਦਾ", fk10: "ਦਾਦੀ",
    fk11: "ਨਾਨਾ", fk12: "ਨਾਨੀ",
    // Punjabi months
    mo1: "ਚੇਤ", mo2: "ਵੈਸਾਖ", mo3: "ਜੇਠ", mo4: "ਹਾੜ੍ਹ", mo5: "ਸਾਉਣ",
    mo6: "ਭਾਦੋਂ", mo7: "ਅੱਸੂ", mo8: "ਕੱਤਕ", mo9: "ਮੱਘਰ", mo10: "ਪੋਹ",
    mo11: "ਮਾਘ", mo12: "ਫੱਗਣ",
    // Seasons
    se1: "ਰੁੱਤ", se2: "ਬਹਾਰ", se3: "ਬਰਸਾਤ", se4: "ਪੱਤਝੜ",
    // Time (single-word)
    tm1: "ਵਜਾ", tm2: "ਵਜੇ", tm3: "ਸਵਾ", tm4: "ਸਾਢੇ", tm5: "ਪੌਣੇ",
    tm6: "ਡੇਢ", tm7: "ਢਾਈ", tm8: "ਮਿੰਟ", tm9: "ਘੰਟਾ",
    // Money
    mn1: "ਰੁਪਇਆ", mn2: "ਚਿੱਲਰ", mn3: "ਨੋਟ", mn4: "ਬੈਂਕ", mn5: "ਖਾਤਾ",
    mn6: "ਉਧਾਰ", mn7: "ਮੁਫ਼ਤ", mn8: "ਖਰਚਾ",
    // Clothing
    cl1: "ਕੱਪੜੇ", cl2: "ਕਮੀਜ਼", cl3: "ਸਲਵਾਰ", cl4: "ਕੁੜਤਾ", cl5: "ਪਜਾਮਾ",
    cl6: "ਦੁਪੱਟਾ", cl7: "ਚੁੰਨੀ", cl8: "ਪੱਗ", cl9: "ਜੁੱਤੀ", cl10: "ਜੁਰਾਬ",
    cl11: "ਟੋਪੀ", cl12: "ਚਸ਼ਮੇ",
    // Kitchen
    kc1: "ਚੁੱਲ੍ਹਾ", kc2: "ਤਵਾ", kc3: "ਬਰਤਨ", kc4: "ਚਮਚਾ", kc5: "ਚਾਕੂ",
    kc6: "ਪਲੇਟ", kc7: "ਗਲਾਸ", kc8: "ਆਟਾ", kc9: "ਘਿਓ", kc10: "ਮੱਖਣ",
    kc11: "ਮਸਾਲਾ", kc12: "ਤੜਕਾ",
    // Travel single words
    tr1: "ਸਫ਼ਰ", tr2: "ਸੜਕ", tr3: "ਸਟੇਸ਼ਨ", tr4: "ਸੱਜੇ", tr5: "ਖੱਬੇ",
    tr6: "ਸਿੱਧਾ", tr7: "ਨੇੜੇ", tr8: "ਦੂਰ",
    // Directions
    dr1: "ਸੱਜੇ", dr2: "ਖੱਬੇ", dr3: "ਸਿੱਧਾ", dr4: "ਮੋੜ", dr5: "ਉੱਤਰ",
    dr6: "ਦੱਖਣ", dr7: "ਪੂਰਬ", dr8: "ਪੱਛਮ", dr9: "ਨਜ਼ਦੀਕ", dr10: "ਦੂਰ",
    // Discourse markers
    dm1: "ਓਏ", dm2: "ਲੈ", dm3: "ਚੱਲ", dm4: "ਬੱਸ", dm5: "ਹੋਰ",
    dm6: "ਅੱਛਾ", dm7: "ਸਹੀ", dm8: "ਯਾਰ", dm9: "ਦੇਖ", dm10: "ਸੁਣੋ",
    // Sequence words
    st1: "ਇੱਕ ਵਾਰੀ", st2: "ਫਿਰ", st3: "ਅਚਾਨਕ", st4: "ਆਖ਼ਰ ਵਿੱਚ",
    st5: "ਉਸ ਤੋਂ ਬਾਅਦ", st6: "ਪਹਿਲਾਂ", st7: "ਇਸ ਤੋਂ ਇਲਾਵਾ",
    // Conjunctions
    cj1: "ਤੇ", cj2: "ਅਤੇ", cj3: "ਪਰ", cj4: "ਲੇਕਿਨ", cj5: "ਜਾਂ",
    cj6: "ਕਿਉਂਕਿ", cj7: "ਇਸ ਲਈ", cj8: "ਭਾਵੇਂ", cj9: "ਫਿਰ ਵੀ",
    cj10: "ਜਦੋਂ", cj11: "ਜਿੱਥੇ", cj12: "ਜੋ",
    // Conditionals (single words only)
    cd3: "ਅਗਰ", cd4: "ਮਗਰ", cd5: "ਸ਼ਾਇਦ",
    // Be-verbs (single forms)
    bv1: "ਹਾਂ", bv2: "ਹੈਂ", bv3: "ਹੋ", bv4: "ਹੈ", bv5: "ਹਨ",
    bv6: "ਸੀ", bv7: "ਸੀਗੀ", bv8: "ਸਨ",
    // Light-verb compounds
    lvb1: "ਕਰ ਲੋ", lvb2: "ਦੇ ਦੋ", lvb3: "ਹੋ ਗਿਆ", lvb4: "ਆ ਗਿਆ",
    lvb5: "ਖਾ ਲੋ", lvb6: "ਪੀ ਲੋ", lvb7: "ਲੈ ਲੋ", lvb8: "ਦੱਸ ਦੋ",
    lvb9: "ਲੈ ਆਓ", lvb10: "ਲੈ ਜਾਓ", lvb11: "ਸੁਣਾ ਦੋ", lvb12: "ਦਿਖਾ ਦੋ",
    lvb13: "ਬਣਾ ਦੋ", lvb14: "ਰੱਖ ਦੋ",
    // Imperatives (single-word)
    im1: "ਕਰ", im2: "ਕਰੋ", im3: "ਕਰੋ ਜੀ",
    // Postpositions (g29-g34)
    g29: "ਲਈ", g30: "ਵਰਗੀ", g31: "ਬਿਨਾ", g32: "ਤੱਕ", g33: "ਸਿਵਾ", g34: "ਵਾਸਤੇ",
    // People/community (pc7-8, pr9-10)
    pc7: "ਕਿਸਾਨ", pc8: "ਦੁਕਾਨਦਾਰ", pr9: "ਡਰਾਈਵਰ", pr10: "ਇੰਜੀਨੀਅਰ",
    // Loose words
    lw1: "ਤੇ", lw2: "ਪਰ", lw3: "ਵੀ", lw4: "ਸਿਰਫ਼", lw5: "ਬਹੁਤ",
    lw6: "ਥੋੜ੍ਹਾ", lw7: "ਸਭ", lw8: "ਕੁਝ", lw9: "ਫਿਰ", lw10: "ਅਭੀ",
    // Culture (proper nouns mostly)
    cu1: "ਭੰਗੜਾ", cu2: "ਗਿੱਧਾ", cu3: "ਢੋਲ", cu4: "ਵਿਸਾਖੀ", cu5: "ਲੋਹੜੀ",
    cu6: "ਖ਼ਾਲਸਾ", cu7: "ਪੰਜ ਪਿਆਰੇ", cu8: "ਪਿੰਡ ਦੀ ਹਵਾ",
    // Encouragement (en1-en2 single-word)
    en1: "ਸ਼ਾਬਾਸ਼!", en2: "ਵਧੀਆ ਕੰਮ!",
    // Farming
    fm1: "ਖੇਤੀ", fm2: "ਫਸਲ", fm3: "ਕਣਕ", fm4: "ਬਾਸਮਤੀ", fm5: "ਕਿਸਾਨ",
    fm6: "ਮੰਡੀ", fm7: "ਕੋਠੀ", fm8: "ਢਾਬਾ",
    // Diaspora
    ds1: "ਵਿਲਾਇਤ", ds2: "ਪਰਦੇਸ", ds3: "ਦੇਸ", ds4: "ਐਨ ਆਰ ਆਈ",
    // Reduplication
    rd1: "ਛੋਟੀ-ਮੋਟੀ", rd2: "ਜਲਦੀ-ਜਲਦੀ", rd3: "ਠੀਕ-ਠੀਕ", rd4: "ਅਲੱਗ-ਅਲੱਗ",
    rd5: "ਧੀਰੇ-ਧੀਰੇ", rd6: "ਘਰ-ਘਰ", rd7: "ਫਿਰ-ਫਿਰ", rd8: "ਸੋਹਣਾ-ਸੋਹਣਾ",
    // Restaurant single words
    rs1: "ਮੀਨੂ", rs2: "ਵੇਟਰ", rs3: "ਆਰਡਰ", rs4: "ਬਿੱਲ",
    // Travel/transport extras
    tv1: "ਪਲੇਟਫਾਰਮ", tv9: "ਸਾਮਾਨ",
    // Doctor visit (single words)
    dv3: "ਪਰਚੀ", dv4: "ਦਵਾਈ",
    // Phrases (selected short ones)
    p28: "ਚਲੋ!", p45: "ਕੋਈ ਨਹੀਂ", p49: "ਵਾਹਿਗੁਰੂ", p50: "ਚੜ੍ਹਦੀ ਕਲਾ",
    // Religion proper nouns repeats already covered above
  };

  // Words/phrases that don't yet have a Gurmukhi mapping above will fall back
  // to the romanized text (imperfect; Google's pa TTS will best-effort it).
  function gurmukhiFor(card) {
    if (!card) return "";
    // Skip Gurmukhi for grammar rule entries whose `punjabi` field is a
    // descriptive label (often contains slashes or English-style names).
    if (card.type === "grammar" && !GURMUKHI[card.id] && !card.gurmukhi) return "";
    return card.gurmukhi || GURMUKHI[card.id] || "";
  }

  // ---------- Punjabi rendering helpers --------------------------------------
  // We display Punjabi as Gurmukhi on top, romanized below. When no Gurmukhi
  // mapping exists we fall back to roman-only so layout is never empty.
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  /** Build the Punjabi cell HTML (Gurmukhi over roman). */
  function punjabiHtml(card) {
    if (!card) return "";
    const gm = gurmukhiFor(card);
    const rom = card.punjabi || "";
    if (gm && rom && gm !== rom) {
      return `<span class="gm" lang="pa-Guru">${escapeHtml(gm)}</span>` +
             `<span class="rom">${escapeHtml(rom)}</span>`;
    }
    // Roman-only fallback — keep the .rom class so spacing stays consistent.
    return `<span class="rom solo">${escapeHtml(gm || rom)}</span>`;
  }
  function renderPunjabi(el, card) {
    if (!el) return;
    el.innerHTML = punjabiHtml(card);
  }
  /** True when the user's chosen direction means Punjabi is the ANSWER
   *  (i.e. English is the prompt). Default = "en2pa". */
  function isReverse() {
    const d = state.settings && state.settings.direction;
    return (d || "en2pa") === "en2pa";
  }
  /** Apply the body[data-direction] flag so CSS can flip the train flashcard. */
  function applyDirectionAttr() {
    const d = (state.settings && state.settings.direction) || "en2pa";
    try { document.body.setAttribute("data-direction", d); } catch {}
  }

  // ---- Dev-time mapping audit (runs once, console only) ---------------------
  function auditGurmukhiMap() {
    try {
      const missing = DECK.filter(c => c.type !== "grammar" && !gurmukhiFor(c));
      if (missing.length) {
        console.log(`[PPZ] ${missing.length} non-grammar cards lack a Gurmukhi mapping; they'll show roman-only.`);
      }
    } catch {}
  }

  const tts = {
    voice: null,         // legacy alias → Punjabi voice
    voicePunjabi: null,
    voiceEnglish: null,
    voicesReady: false,
    audio: null,         // current <audio> element (Google TTS fallback)
    utter: null,         // current SpeechSynthesisUtterance
    speakingButtons: new Set(),
    hintShown: false,
    primed: false,       // iOS Safari requires a user-gesture warm-up
  };

  // iOS Safari unlocks speechSynthesis the first time speak() is called from
  // a user gesture. We do NOT need a silent priming utterance — in fact, a
  // silent prime followed by cancel() races with the real utterance and kills
  // it. Just call speak() directly inside the user-gesture handler.
  function primeSpeech() {
    if (tts.primed) return;
    if (!("speechSynthesis" in window)) return;
    tts.primed = true;
    // Re-poll voices: iOS often returns [] until first speak in a gesture.
    setTimeout(() => { try { loadVoicesOnce(); } catch {} }, 100);
  }

  function loadVoicesOnce() {
    if (!("speechSynthesis" in window)) return;
    let attempts = 0;
    const pick = () => {
      const all = window.speechSynthesis.getVoices() || [];
      // iOS sometimes returns [] for ~1s after page load. Retry a few times.
      if (all.length === 0 && attempts < 10) {
        attempts++;
        setTimeout(pick, 250);
        return;
      }
      // Punjabi: prefer real Punjabi voice. If absent (default on iOS),
      // fall back to a Hindi voice — Hindi TTS reads Latin text using
      // Devanagari phonetics which sound very close to spoken Punjabi when
      // we feed it the roman transliteration.
      tts.voicePunjabi =
        all.find(v => /^pa(-|_|$)/i.test(v.lang)) ||
        all.find(v => /punjab/i.test(v.name)) ||
        null;
      tts.voiceHindi =
        all.find(v => /^hi(-|_|$)/i.test(v.lang)) ||
        all.find(v => /hindi/i.test(v.name)) ||
        null;
      // English: prefer high-quality AMERICAN MALE voices first.
      // Hard requirement on en-US locale, deep/authoritative male timbre.
      const en = all.filter(v => /^en(-|_|$)/i.test(v.lang));
      const isUS = (v) => /en[-_]us/i.test(v.lang);
      const score = (v) => {
        const n = (v.name || "").toLowerCase();
        let s = 0;

        // ---- Locale: en-US is REQUIRED to sound American ------------------
        if (isUS(v)) s += 200;
        else if (/en[-_]ca/i.test(v.lang)) s += 40;   // Canadian English ~ closest fallback
        else s -= 100;                                 // strongly avoid en-GB/AU/IE/IN

        // ---- Strong American MALE voices (top priority) -------------------
        // Microsoft Neural US males (Edge / Azure)
        if (/microsoft.*(guy|davis|tony|jason|brandon|christopher|eric|roger|steffan|brian)/.test(n)) s += 220;
        // Apple US males (macOS / iOS) — Alex/Tom/Aaron/Fred/Eddy/Reed are en-US
        if (/(alex|tom|aaron|fred|eddy|reed|rocko|grandpa|junior|albert|bruce|ralph|gordon)/.test(n)) s += 200;
        // Google US English male
        if (/google.*us english.*male/.test(n)) s += 180;
        if (/google\s+us\s+english/.test(n) && /\bmale\b/.test(n)) s += 180;
        // Generic male tag (must still be en-US to score high overall)
        if (/\bmale\b/.test(n) && !/female/.test(n)) s += 50;

        // ---- Premium / Neural / Natural quality bumps ---------------------
        if (/premium|enhanced/.test(n)) s += 90;
        if (/natural|neural|online|cloud|wavenet/.test(n)) s += 80;

        // ---- Penalties: weak / generic / female-only / non-US -------------
        if (/espeak/.test(n)) s -= 500;
        if (/^english$/.test(n)) s -= 200;
        // "Compact" iOS voices sound thin/distant — strongly penalize.
        if (/compact|eddy.*compact|fred.*compact/.test(n)) s -= 250;
        if (/novelty|whisper|bahh|bells|bubbles|cellos|deranged|hysterical|trinoids|zarvox/.test(n)) s -= 400;
        // Known British/AU/IE male names — penalize so they never beat a US voice
        if (/(daniel|oliver|arthur|karen|moira|tessa|sangeeta|veena|rishi)/.test(n)) s -= 80;

        if (v.localService) s += 8;
        return s;
      };
      en.sort((a, b) => score(b) - score(a));
      // Final guard: if the top pick somehow isn't en-US, prefer the best en-US
      // candidate even if it scores a hair lower.
      const topUS = en.find(isUS);
      tts.voiceEnglish = topUS || en[0] || null;
      if (tts.voiceEnglish) {
        console.log("[PPZ TTS] English voice:", tts.voiceEnglish.name, tts.voiceEnglish.lang, "score:", score(tts.voiceEnglish));
      }
      // Back-compat: legacy single-voice slot still points to the Punjabi one.
      tts.voice = tts.voicePunjabi;
      tts.voicesReady = true;
    };
    pick();
    if (!tts.voicePunjabi || !tts.voiceEnglish) {
      try { window.speechSynthesis.onvoiceschanged = pick; } catch {}
    }
  }

  function setSpeakingUI(on) {
    for (const b of tts.speakingButtons) {
      b.classList.toggle("speaking", on);
    }
  }

  function stopSpeaking() {
    try { if (tts.audio) { tts.audio.pause(); tts.audio.src = ""; tts.audio = null; } } catch {}
    try { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); } catch {}
    setSpeakingUI(false);
  }

  function speakViaWebSpeech(text, voice, langTag) {
    if (!("speechSynthesis" in window)) return false;
    const u = new SpeechSynthesisUtterance(text);
    // Use the matched voice when we have one (gives much better quality than
    // the system default on iOS too).
    if (voice) u.voice = voice;
    u.lang = langTag || (voice && voice.lang) || "pa-IN";
    // Natural defaults. Avoid pitch != 1 on iOS — it produces a tinny/distant
    // artifact in Apple's TTS engine.
    u.rate = 1.0;
    u.pitch = 1.0;
    u.volume = 1;
    u.onstart = () => { setSpeakingUI(true); try { audioDbgLog("start: \"" + (text||"").slice(0,30) + "\" voice=" + (u.voice ? u.voice.name : "(default)") + " lang=" + u.lang); } catch {} };
    u.onend = () => { setSpeakingUI(false); try { audioDbgLog("end"); } catch {} };
    u.onerror = (e) => {
      setSpeakingUI(false);
      const errMsg = (e && (e.error || e.message)) || "unknown";
      console.warn("[PPZ TTS] utterance error:", errMsg);
      try { audioDbgLog("error: " + errMsg); } catch {}
      if (!tts._errorShown) {
        tts._errorShown = true;
        toast("Audio error: " + errMsg, 3000);
        setTimeout(() => { tts._errorShown = false; }, 5000);
      }
    };
    tts.utter = u;
    try { window.speechSynthesis.speak(u); } catch (err) {
      console.warn("[PPZ TTS] speak() threw:", err);
      return false;
    }
    return true;
  }

  function speakViaGoogle(text, lang) {
    const tl = lang === "en" ? "en" : "pa";
    // translate_tts has a ~200 char limit. Truncate defensively.
    const safeText = text.length > 190 ? text.slice(0, 190) : text;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=`
              + encodeURIComponent(safeText);
    // Do NOT set crossOrigin — Google's TTS endpoint doesn't send CORS headers.
    const a = new Audio(url);
    a.preload = "auto";
    a.onplaying = () => setSpeakingUI(true);
    a.onended = () => { setSpeakingUI(false); tts.audio = null; };
    a.onerror = (ev) => {
      setSpeakingUI(false);
      tts.audio = null;
      console.warn("[PPZ TTS] Google audio error", ev, "url:", url);
      toast(lang === "pa"
        ? "Punjabi audio failed. Install a Punjabi voice in iOS Settings → Accessibility → Spoken Content → Voices."
        : "Audio failed — check your connection.", 4000);
    };
    tts.audio = a;
    const p = a.play();
    if (p && typeof p.catch === "function") {
      p.catch((err) => {
        console.warn("[PPZ TTS] audio.play() rejected:", err);
        toast("Tap the speaker again — iOS needs a fresh tap to start audio.", 3000);
      });
    }
  }

  /**
   * Speak text in the requested language.
   * @param {string|{gurmukhi?:string, roman?:string}} text
   * @param {"pa"|"en"} lang
   */
  function speakText(text, lang) {
    // Allow callers to pass either a plain string or an object with both
    // Gurmukhi script and Roman transliteration. The Hindi-voice fallback
    // needs the roman form to pronounce correctly.
    let primary = "";
    let roman = "";
    if (text && typeof text === "object") {
      primary = text.gurmukhi || text.roman || "";
      roman = text.roman || text.gurmukhi || "";
    } else {
      primary = roman = String(text || "");
    }
    if (!primary.trim()) return;
    primeSpeech();
    try {
      if ("speechSynthesis" in window && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
        window.speechSynthesis.cancel();
      }
    } catch {}
    try { if (tts.audio) { tts.audio.pause(); tts.audio.src = ""; tts.audio = null; } } catch {}

    if (lang === "en") {
      const voice = tts.voiceEnglish;
      console.log("[PPZ TTS] EN speak:", primary, "voice:", voice && voice.name);
      if ("speechSynthesis" in window && speakViaWebSpeech(primary, voice, "en-US")) return;
      if (navigator.onLine) speakViaGoogle(primary, "en");
      else toast("Audio needs internet (no English voice).");
      return;
    }

    // ---- Punjabi --------------------------------------------------------
    // Best: real Punjabi voice if installed.
    if (tts.voicePunjabi) {
      console.log("[PPZ TTS] PA (native) speak:", primary, "voice:", tts.voicePunjabi.name);
      if (speakViaWebSpeech(primary, tts.voicePunjabi, tts.voicePunjabi.lang || "pa-IN")) return;
    }
    // Fallback A: Hindi voice reading the ROMAN transliteration.
    // iOS ships with Hindi voices ("Lekha"/"Kiran"/etc.) and Hindi TTS
    // pronounces Latin letters using Indic phonetics — sounds very close to
    // actual Punjabi when given roman text.
    if (tts.voiceHindi && roman) {
      console.log("[PPZ TTS] PA (Hindi-roman) speak:", roman, "voice:", tts.voiceHindi.name);
      if (speakViaWebSpeech(roman, tts.voiceHindi, tts.voiceHindi.lang || "hi-IN")) return;
    }
    // Fallback B: Web Speech with hi-IN lang only (no specific voice).
    if ("speechSynthesis" in window && roman) {
      console.log("[PPZ TTS] PA (lang=hi-IN) speak:", roman);
      if (speakViaWebSpeech(roman, null, "hi-IN")) return;
    }
    // Fallback C: online Google TTS as last resort.
    if (navigator.onLine) {
      speakViaGoogle(primary, "pa");
    } else {
      toast("Punjabi voice not available. Install in iOS Settings → Accessibility → Spoken Content → Voices.", 4500);
    }
  }

  /**
   * Speak a card in the appropriate language for the current direction.
   * Default speaks the ANSWER side (en2pa => Punjabi, pa2en => English).
   * Pass `opts.lang` to force a specific language (used by the front/back
   * speaker buttons so each speaker matches the face it sits on).
   */
  function speakCard(card, opts = {}) {
    if (!card) return;
    const en2pa = isReverse();
    const lang = opts.lang || (en2pa ? "pa" : "en");
    if (lang === "pa") {
      // Pass both forms so the engine can pick the best (Punjabi voice → Gurmukhi,
      // Hindi-fallback voice → Roman transliteration).
      speakText({
        gurmukhi: gurmukhiFor(card) || card.punjabi || "",
        roman:    card.punjabi || "",
      }, "pa");
    } else {
      speakText(card.english || "", "en");
    }
  }

  function maybeShowVoiceHint() {
    if (tts.hintShown) return;
    try {
      if (localStorage.getItem("ppz_tts_hint_v1")) { tts.hintShown = true; return; }
    } catch {}
    if (!tts.voice && !navigator.onLine) {
      toast("Tip: connect to the internet for Punjabi audio.", 2600);
    }
    try { localStorage.setItem("ppz_tts_hint_v1", "1"); } catch {}
    tts.hintShown = true;
  }

  // ---------- Battle feedback helpers ----------------------------------------
  function popDamage(combatantSel, amount, kind = "dmg") {
    const host = document.querySelector(combatantSel);
    if (!host) return;
    const el = document.createElement("span");
    el.className = "dmg-pop";
    if (kind === "crit") el.classList.add("crit");
    else if (kind === "heal") el.classList.add("heal");
    else if (kind === "miss") el.classList.add("miss");
    el.textContent = (kind === "heal" ? "+" : kind === "miss" ? "" : "-") + amount;
    host.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }
  function flashHp(sel, kind = "hit") {
    const el = document.querySelector(sel);
    if (!el) return;
    el.classList.remove("hit", "heal");
    void el.offsetWidth;
    el.classList.add(kind === "heal" ? "heal" : "hit");
    setTimeout(() => el.classList.remove("hit", "heal"), 500);
  }
  function flashSprite(sel, opts = {}) {
    const el = document.querySelector(sel);
    if (!el) return;
    el.classList.remove("hit-flash", "crit-ring");
    void el.offsetWidth;
    el.classList.add("hit-flash");
    if (opts.crit) el.classList.add("crit-ring");
    setTimeout(() => el.classList.remove("hit-flash", "crit-ring"), 700);
  }
  function glowQuiz(kind) {
    const el = $(".quiz");
    if (!el) return;
    el.classList.remove("correct-glow", "wrong-glow");
    void el.offsetWidth;
    el.classList.add(kind === "correct" ? "correct-glow" : "wrong-glow");
    setTimeout(() => el.classList.remove("correct-glow", "wrong-glow"), 600);
  }
  function reanimateChoices() {
    const wrap = $("#choices");
    if (!wrap) return;
    wrap.classList.add("refresh");
    void wrap.offsetWidth;
    wrap.classList.add("run");
    setTimeout(() => wrap.classList.remove("refresh", "run"), 700);
  }
  function bumpStreakLabel() {
    const el = $("#streakLabel");
    if (!el) return;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }
  function flashAnswer(kind) {
    const fl = document.getElementById("answerFlash");
    if (fl) {
      fl.classList.remove("show", "good", "bad");
      void fl.offsetWidth;
      fl.classList.add("show", kind === "correct" ? "good" : "bad");
      setTimeout(() => fl.classList.remove("show", "good", "bad"), 600);
    }
    const prompt = $("#quizPrompt");
    if (prompt) {
      prompt.classList.remove("flash-good", "flash-bad");
      void prompt.offsetWidth;
      prompt.classList.add(kind === "correct" ? "flash-good" : "flash-bad");
      setTimeout(() => prompt.classList.remove("flash-good", "flash-bad"), 550);
    }
  }

  // ---------- State / persistence --------------------------------------------
  const SAVE_KEY = "ppz_save_v1";

  function defaultSrs() {
    const m = {};
    for (const c of DECK) m[c.id] = {
      ease: SRS.EASE_START,
      interval: 0,        // days; valid in review/relearning queues
      due: 0,             // ms epoch
      mastery: 0,         // 0..100, cosmetic UI score
      seen: 0,            // total times shown
      queue: "new",      // "new" | "learning" | "review" | "relearning"
      step: 0,            // index into LEARNING_STEPS_MIN / RELEARNING_STEPS_MIN
      reps: 0,            // graduated reviews
      lapses: 0,
      lastResult: null,   // "again"|"hard"|"good"|"easy"|"battle-ok"|"battle-miss"
      lastReviewAt: 0,    // ms epoch of last training grading
      previousInterval: 0,// days; for retention analytics later
      suspended: false,   // true => excluded from training/battle picks
      firstSeenAt: 0,
    };
    return m;
  }
  function defaultReview() {
    const m = {};
    for (const c of DECK) m[c.id] = { lastSeenAt: 0, missCount: 0, lastMissAt: 0 };
    return m;
  }
  function defaultState() {
    return {
      version: 1,
      level: 1,
      xp: 0,
      totalXp: 0,
      srs: defaultSrs(),
      sessionXp: 0,
      review: defaultReview(),
      streakShield: 0,
      kiCharge: 0,
      badges: { speed: 0, recall: 0, incoming: 0 },
      battleStats: {
        wins: 0, losses: 0, runs: 0,
        bestStreak: 0, fastestKoMs: 0, perfectRuns: 0,
        bestEnemyIdx: 0, totalQuestions: 0, totalCorrect: 0, kiSpecialsUsed: 0,
      },
      settings: {
        interrupts: true, ttsAutoplay: false,
        difficulty: "normal",
        direction: "en2pa",
        battleHints: true,
        confirmRetreat: true,
        audio: { sfx: 0.7, music: 0.4, master: 1.0, muted: false },
      },
      schemaVersion: SRS.SCHEMA_VERSION,
      dailyStats: {},
      shakyCards: {},
    };
  }

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const base = defaultState();
      // Merge to be forward-compatible if deck grows.
      const merged = {
        ...base,
        ...parsed,
        srs: { ...base.srs, ...(parsed.srs || {}) },
        review: { ...base.review, ...(parsed.review || {}) },
        badges: { ...base.badges, ...(parsed.badges || {}) },
        battleStats: { ...base.battleStats, ...(parsed.battleStats || {}) },
        settings: {
          ...base.settings,
          ...(parsed.settings || {}),
          audio: { ...base.settings.audio, ...((parsed.settings && parsed.settings.audio) || {}) },
        },
        dailyStats: { ...(parsed.dailyStats || {}) },
        shakyCards: { ...(parsed.shakyCards || {}) },
      };
      merged.sessionXp = 0;
      // Per-card SRS migration: backfill new schema fields without losing
      // legacy progress (ease/interval/due/mastery/seen).
      for (const c of DECK) {
        const s = merged.srs[c.id] || (merged.srs[c.id] = {});
        if (s.ease == null) s.ease = SRS.EASE_START;
        if (s.interval == null) s.interval = 0;
        if (s.due == null) s.due = 0;
        if (s.mastery == null) s.mastery = 0;
        if (s.seen == null) s.seen = 0;
        if (s.reps == null) s.reps = 0;
        if (s.lapses == null) s.lapses = 0;
        if (s.step == null) s.step = 0;
        if (s.lastResult == null) s.lastResult = null;
        if (s.firstSeenAt == null) s.firstSeenAt = 0;
        if (s.lastReviewAt == null) s.lastReviewAt = 0;
        if (s.previousInterval == null) s.previousInterval = 0;
        if (s.suspended == null) s.suspended = false;
        if (!s.queue) {
          // Infer queue from legacy data: any prior interval/seen => review.
          s.queue = (s.seen > 0 || s.interval > 0) ? "review" : "new";
          if (s.queue === "review" && !s.interval) s.interval = 1;
        }
      }
      merged.schemaVersion = SRS.SCHEMA_VERSION;
      // Trim daily-stats keys older than 30 days so the save blob stays small.
      try {
        const cutoff = Date.now() - 30 * 86400_000;
        for (const k of Object.keys(merged.dailyStats)) {
          const ts = new Date(k + "T00:00:00").getTime();
          if (!isNaN(ts) && ts < cutoff) delete merged.dailyStats[k];
        }
      } catch {}
      return merged;
    } catch {
      return defaultState();
    }
  }
  function saveState() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
  }
  function resetProgress() {
    state = defaultState();
    saveState();
  }

  // ---------- Utilities -------------------------------------------------------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function toast(msg, ms = 1600) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), ms);
  }

  // ---- Audio Debug Panel ----------------------------------------------------
  // Triple-tap the top HUD to open. Shows voice list + every TTS event.
  const audioDbg = { lines: [], el: null, taps: 0, lastTap: 0 };
  function audioDbgLog(msg) {
    const ts = new Date().toLocaleTimeString();
    audioDbg.lines.push(`[${ts}] ${msg}`);
    if (audioDbg.lines.length > 60) audioDbg.lines.shift();
    if (audioDbg.el) {
      const log = audioDbg.el.querySelector(".dbg-log");
      if (log) { log.textContent = audioDbg.lines.join("\n"); log.scrollTop = log.scrollHeight; }
    }
  }
  function installAudioDebugPanel() {
    // Triple-tap on rank/level area to open
    const trigger = document.querySelector(".hud") || document.body;
    trigger.addEventListener("click", () => {
      const now = Date.now();
      if (now - audioDbg.lastTap > 600) audioDbg.taps = 0;
      audioDbg.taps++;
      audioDbg.lastTap = now;
      if (audioDbg.taps >= 3) { audioDbg.taps = 0; openAudioDebug(); }
    });
  }
  function openAudioDebug() {
    if (audioDbg.el) { audioDbg.el.remove(); audioDbg.el = null; return; }
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.92);color:#0f0;font:12px/1.4 monospace;padding:12px;z-index:99999;overflow:auto;";
    const voices = ("speechSynthesis" in window) ? (window.speechSynthesis.getVoices() || []) : [];
    const voicesList = voices.map(v => `${v.lang}  ${v.name}${v.localService ? " [local]" : ""}${v.default ? " [default]" : ""}`).join("\n") || "(no voices)";
    wrap.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
        <button data-act="close" style="padding:8px 12px;background:#333;color:#fff;border:0;border-radius:6px;">Close</button>
        <button data-act="test-en" style="padding:8px 12px;background:#06c;color:#fff;border:0;border-radius:6px;">Test EN</button>
        <button data-act="test-pa" style="padding:8px 12px;background:#c60;color:#fff;border:0;border-radius:6px;">Test PA (gurmukhi)</button>
        <button data-act="test-roman" style="padding:8px 12px;background:#a40;color:#fff;border:0;border-radius:6px;">Test PA (roman/Hindi)</button>
        <button data-act="test-default" style="padding:8px 12px;background:#080;color:#fff;border:0;border-radius:6px;">Test default voice</button>
        <button data-act="reload-voices" style="padding:8px 12px;background:#444;color:#fff;border:0;border-radius:6px;">Reload voices</button>
      </div>
      <div><b>UA:</b> ${navigator.userAgent}</div>
      <div><b>speechSynthesis:</b> ${"speechSynthesis" in window ? "yes" : "NO"}</div>
      <div><b>voices.length:</b> ${voices.length}</div>
      <div><b>EN picked:</b> ${tts.voiceEnglish ? tts.voiceEnglish.name + " (" + tts.voiceEnglish.lang + ")" : "(none)"}</div>
      <div><b>PA picked:</b> ${tts.voicePunjabi ? tts.voicePunjabi.name + " (" + tts.voicePunjabi.lang + ")" : "(none)"}</div>
      <div><b>HI picked:</b> ${tts.voiceHindi ? tts.voiceHindi.name + " (" + tts.voiceHindi.lang + ")" : "(none)"}</div>
      <hr style="border-color:#333;">
      <details><summary style="cursor:pointer;">All voices (${voices.length})</summary><pre style="white-space:pre-wrap;color:#9cf;">${voicesList}</pre></details>
      <hr style="border-color:#333;">
      <pre class="dbg-log" style="white-space:pre-wrap;color:#0f0;max-height:50vh;overflow:auto;">${audioDbg.lines.join("\n")}</pre>
    `;
    document.body.appendChild(wrap);
    audioDbg.el = wrap;
    wrap.addEventListener("click", (e) => {
      const act = e.target?.dataset?.act;
      if (!act) return;
      if (act === "close") { wrap.remove(); audioDbg.el = null; return; }
      if (act === "test-en") { audioDbgLog("test EN: 'Hello, this is a test.'"); speakText("Hello, this is a test.", "en"); return; }
      if (act === "test-pa") { audioDbgLog("test PA gurmukhi: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ'"); speakText({gurmukhi:"ਸਤ ਸ੍ਰੀ ਅਕਾਲ", roman:"sat sri akaal"}, "pa"); return; }
      if (act === "test-roman") {
        audioDbgLog("test roman direct via Hindi voice");
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance("sat sri akaal, kiddan");
          u.lang = "hi-IN";
          if (tts.voiceHindi) u.voice = tts.voiceHindi;
          u.onstart = () => audioDbgLog("→ start (roman/hi)");
          u.onend = () => audioDbgLog("→ end (roman/hi)");
          u.onerror = (e) => audioDbgLog("→ error (roman/hi): " + (e.error||"?"));
          window.speechSynthesis.speak(u);
        }
        return;
      }
      if (act === "test-default") {
        audioDbgLog("test default voice (no voice set)");
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance("This is the default voice test.");
          u.onstart = () => audioDbgLog("→ start (default)");
          u.onend = () => audioDbgLog("→ end (default)");
          u.onerror = (e) => audioDbgLog("→ error (default): " + (e.error||"?"));
          window.speechSynthesis.speak(u);
        }
        return;
      }
      if (act === "reload-voices") { loadVoicesOnce(); audioDbgLog("reload-voices triggered"); }
    });
  }

  // ---------- HUD / XP / Level -----------------------------------------------
  function updateHud() {
    const rank = getRank(state.level);
    const rankEl = $("#rankBadge");
    const lvlEl = $("#levelLabel");
    const newRankText = `${rank.badge} ${rank.title}`;
    const newLvlText = `Lv ${state.level.toLocaleString()}`;
    if (rankEl.textContent !== newRankText) {
      rankEl.textContent = newRankText;
      rankEl.classList.remove("pop"); void rankEl.offsetWidth; rankEl.classList.add("pop");
    }
    if (lvlEl.textContent !== newLvlText) {
      lvlEl.textContent = newLvlText;
      lvlEl.classList.remove("pop"); void lvlEl.offsetWidth; lvlEl.classList.add("pop");
    }
    const need = xpForNext(state.level);
    const pct = clamp((state.xp / need) * 100, 0, 100);
    $("#xpFill").style.width = pct + "%";
    $("#xpText").textContent = `${state.xp.toLocaleString()} / ${need.toLocaleString()} XP`;
    const bar = $(".xpbar");
    if (bar) bar.setAttribute("aria-valuenow", String(Math.round(pct)));
  }

  function gainXp(amount) {
    if (amount <= 0) return;
    state.xp += amount;
    state.totalXp += amount;
    state.sessionXp += amount;
    let leveled = false;
    while (state.xp >= xpForNext(state.level) && state.level < 1_000_000) {
      state.xp -= xpForNext(state.level);
      const prevRank = getRank(state.level);
      state.level += 1;
      const newRank = getRank(state.level);
      leveled = true;
      if (newRank.title !== prevRank.title) {
        showLevelUp(true, newRank);
      }
    }
    if (leveled) {
      // Single quick flash if no rank-up overlay shown
      if (!$("#levelup").classList.contains("show")) showLevelUp(false, getRank(state.level));
    }
    saveState();
    updateHud();
  }

  function showLevelUp(isRankUp, rank) {
    const el = $("#levelup");
    $("#levelupTitle").textContent = isRankUp ? "RANK UP!" : "LEVEL UP!";
    $("#levelupSub").textContent   = `You reached Lv ${state.level.toLocaleString()}`;
    $("#levelupRank").textContent  = isRankUp ? `${rank.badge} ${rank.title}` : "";
    el.classList.add("show");
    clearTimeout(showLevelUp._t);
    showLevelUp._t = setTimeout(() => el.classList.remove("show"), isRankUp ? 1800 : 900);
  }

  // ---------- Router ----------------------------------------------------------
  // Order used to infer "forward" vs "back" navigation direction.
  const SCREEN_ORDER = ["start", "train", "battle", "battle-results", "settings"];
  // Veil color/kind by destination.
  const SCREEN_FX = { train: "train", battle: "battle", "battle-results": "battle", start: "home", settings: "home" };

  function playTransitionVeil(kind) {
    const veil = document.getElementById("transitionVeil");
    if (!veil) return;
    veil.classList.remove("show");
    veil.removeAttribute("data-kind");
    // Force reflow so the animation restarts cleanly.
    void veil.offsetWidth;
    veil.setAttribute("data-kind", kind);
    veil.classList.add("show");
    clearTimeout(playTransitionVeil._t);
    playTransitionVeil._t = setTimeout(() => {
      veil.classList.remove("show");
    }, 950);
  }

  let _routeBusy = false;
  function showScreen(name) {
    if (_routeBusy) return;
    const current = document.querySelector(".screen.active");
    const currentName = current ? current.dataset.screen : null;
    if (currentName === name) return;

    // Cleanup before switching
    stopSpeaking();
    if (battle && name !== "battle" && name !== "battle-results") {
      cancelAnimationFrame(battle.timerRaf);
      battle = null;
      try { Music.stop(); } catch {}
    } else if (battle && name === "battle-results") {
      // Stash summary before tearing down; results screen reads it.
      _lastRunSummary = battle._summary || _lastRunSummary;
      cancelAnimationFrame(battle.timerRaf);
      try { Music.stop(); } catch {}
      battle = null;
    }
    if (name !== "battle") {
      document.body.classList.remove("in-battle");
      // Hide any battle-scoped overlays so they don't linger when user
      // navigates away mid-pause/mid-coach/mid-prebattle.
      ["#pauseOverlay", "#confirmRetreat", "#coachOverlay", "#prebattleOverlay"]
        .forEach(sel => { const el = $(sel); if (el) el.hidden = true; });
    }
    if (name !== "train" && train) {
      clearTimeout(train.idleTimer);
      train.idleTimer = null;
      if (trainEvent) closeTrainEvent(true);
      train.eventActive = false;
    }
    if (name !== "train") { try { TrainMusic.stop(); } catch {} }

    // Direction inference
    const fromIdx = SCREEN_ORDER.indexOf(currentName);
    const toIdx   = SCREEN_ORDER.indexOf(name);
    const dir = (toIdx > fromIdx) ? "forward" : "back";
    const app = document.getElementById("app");
    if (app) {
      app.dataset.direction = dir;
      app.classList.remove("warp");
      void app.offsetWidth;
      app.classList.add("warp");
    }

    // Cinematic veil FX
    playTransitionVeil(SCREEN_FX[name] || "home");

    _routeBusy = true;

    const swap = () => {
      // Mark current as leaving (kept in DOM briefly for exit animation).
      $$(".screen").forEach(s => {
        if (s === current) {
          s.classList.remove("active");
          s.classList.add("leaving");
        } else {
          s.classList.remove("active", "leaving");
        }
        if (s.dataset.screen === name) s.classList.add("active");
      });
      $("#hud").hidden = (name === "start");
      if (name === "train")  { startTrainSession(); try { TrainMusic.start(); } catch {} }
      if (name === "battle") openPrebattle();
      if (name === "battle-results") renderResultsScreen();
      document.body.classList.toggle("in-battle", name === "battle");
      updateHud();

      // Remove the "leaving" copy after its exit animation completes.
      if (current) {
        setTimeout(() => current.classList.remove("leaving"), 460);
      }
      _routeBusy = false;
    };

    // Brief hold so the iris "closes" before content swaps under it.
    if (current) {
      setTimeout(swap, 200);
    } else {
      swap();
    }
  }

  // ---------- Train mode ------------------------------------------------------
  let train = {
    current: null,
    revealed: false,
    recentIds: [],
    cardsSinceInterrupt: 0,
    consecutiveCorrect: 0,
    repeatMissId: null,
    lastMissedId: null,
    idleTimer: null,
    revealedAt: 0,
    forceIdleSpeed: false,
    eventActive: false,
  };

  function logReview(cardId, wasCorrect, opts = {}) {
    if (!state.review) state.review = {};
    if (!state.review[cardId]) state.review[cardId] = { lastSeenAt: 0, missCount: 0, lastMissAt: 0 };
    const r = state.review[cardId];
    r.lastSeenAt = Date.now();
    if (wasCorrect === false) {
      // Light-touch logging (e.g., during Speed Burst) only updates timestamps,
      // never bumps missCount or repeat-miss tracking.
      if (!opts.light) {
        r.missCount = (r.missCount || 0) + 1;
        r.lastMissAt = Date.now();
        if (train.lastMissedId === cardId) {
          train.repeatMissId = cardId;
        }
        train.lastMissedId = cardId;
      }
    } else if (wasCorrect === true) {
      if (train.repeatMissId === cardId) train.repeatMissId = null;
      if (train.lastMissedId === cardId) train.lastMissedId = null;
    }
    // Update recent buffer
    train.recentIds = [cardId, ...train.recentIds.filter(id => id !== cardId)]
      .slice(0, INTERRUPT.RECENT_BUFFER_SIZE);
  }

  function updateTrainHud() {
    const sh = $("#trainShield"); if (sh) sh.textContent = String(state.streakShield || 0);
    const ki = $("#trainKi");     if (ki) ki.textContent = String(state.kiCharge || 0);
  }

  function pickNextCard() {
    const now = Date.now();

    // Bucket by queue.
    const learning = [];   // due learning/relearning (sub-day timing matters)
    const review = [];     // due reviews
    const newPool = [];
    for (const c of DECK) {
      const s = state.srs[c.id];
      if (!s) continue;
      if (s.suspended || isLeech(s)) continue;
      if (s.queue === "learning" || s.queue === "relearning") {
        if ((s.due || 0) <= now) learning.push(c);
      } else if (s.queue === "review") {
        if ((s.due || 0) <= now) review.push(c);
      } else if (s.queue === "new") {
        newPool.push(c);
      }
    }

    // 1) Learning/relearning first — earliest-due wins.
    if (learning.length) {
      learning.sort((a, b) => (state.srs[a.id].due || 0) - (state.srs[b.id].due || 0));
      return learning[0];
    }

    // 2) Review queue: oldest-overdue first, with shaky-card boost.
    if (review.length) {
      review.sort((a, b) => {
        const sa = state.srs[a.id], sb = state.srs[b.id];
        const shA = state.shakyCards?.[a.id] ? SRS.SHAKY_PRIORITY_BONUS : 0;
        const shB = state.shakyCards?.[b.id] ? SRS.SHAKY_PRIORITY_BONUS : 0;
        const dueA = (sa.due || 0) - shA * 86400_000;
        const dueB = (sb.due || 0) - shB * 86400_000;
        return dueA - dueB;
      });
      // Light randomness across the most-overdue cluster so sessions feel fresh.
      const top = review.slice(0, Math.max(3, Math.ceil(review.length / 8)));
      return top[Math.floor(Math.random() * top.length)];
    }

    // 3) New cards (no daily limit — learners can always pull in new material).
    if (newPool.length) {
      // Skip suspended cards (leeches).
      const live = newPool.filter(c => !state.srs[c.id]?.suspended && !isLeech(state.srs[c.id]));
      if (live.length) {
        live.sort((a, b) => {
          const sa = state.srs[a.id], sb = state.srs[b.id];
          if (sa.mastery !== sb.mastery) return sa.mastery - sb.mastery;
          return srsHash(a.id) - srsHash(b.id);
        });
        return live[0];
      }
    }

    // 4) Nothing due, nothing new — preview soonest review (so the user can
    //    keep practicing without an empty screen).
    const all = DECK.slice().filter(c => state.srs[c.id]);
    all.sort((a, b) => (state.srs[a.id].due || 0) - (state.srs[b.id].due || 0));
    return all[0] || DECK[0];
  }

  function startTrainSession() {
    state.sessionXp = 0;
    decayShakyCards();
    train.current = pickNextCard();
    train.revealed = false;
    train.cardsSinceInterrupt = 0;
    train.consecutiveCorrect = 0;
    train.eventActive = false;
    closeTrainEvent(true);
    renderCard();
    updateTrainStats();
    updateTrainHud();
    armIdleTimer();
  }

  function armIdleTimer() {
    clearTimeout(train.idleTimer);
    train.idleTimer = null;
    if (!state.settings?.interrupts) return;
    train.idleTimer = setTimeout(() => {
      if (train.eventActive) return;
      const trainScreen = document.querySelector("#screen-train");
      if (!trainScreen?.classList.contains("active")) return;
      // Idle while staring at front face: force a Speed Burst
      if (!train.revealed) {
        train.forceIdleSpeed = true;
        startInterruptEvent("speed");
      }
    }, INTERRUPT.IDLE_MS);
  }

  function renderCard() {
    const c = train.current;
    const en2pa = isReverse(); // true => English-prompt mode (default)
    applyDirectionAttr();
    $("#cardType").textContent = c.type;

    // Direction-aware front face:
    //  - en2pa: front shows ENGLISH; back reveals Punjabi (Gurmukhi + roman)
    //  - pa2en: front shows Punjabi (Gurmukhi + roman); back reveals English
    const cardPromptEl = $("#cardPrompt");
    if (en2pa) {
      // Front = English text only.
      if (cardPromptEl) cardPromptEl.textContent = c.english;
    } else {
      renderPunjabi(cardPromptEl, c);
    }

    // Back face always carries BOTH so learners see the full mapping.
    renderPunjabi($("#cardPromptBack"), c);
    $("#cardEnglish").textContent = c.english;
    $("#cardDef").textContent     = c.definition ? `Definition: ${c.definition}` : "";
    $("#cardRelated").textContent = c.related    ? `Related: ${c.related}` : "";
    $("#cardExample").textContent = c.example    ? `Example: ${c.example}` : "";

    // Standalone Gurmukhi line on back is now redundant (Gurmukhi sits inside
    // #cardPromptBack), but keep the element hidden for backwards-compat.
    const gmBack = $("#cardGurmukhiBack");
    if (gmBack) { gmBack.textContent = ""; gmBack.hidden = true; }

    const front = $(".flashcard .front");
    const back  = $("#cardBack");
    const srs   = $("#srsRow");
    if (train.revealed) {
      front.hidden = true;
      back.hidden = false;
      srs.hidden = false;
      renderSrsButtonHints(c.id);
    } else {
      front.hidden = false;
      back.hidden = true;
      srs.hidden = true;
    }

    // Auto-play audio when the ANSWER face is visible (i.e. after reveal).
    //  - en2pa: answer is Punjabi, spoken in pa-IN
    //  - pa2en: answer is English, spoken in en-US
    // NOTE: speak synchronously (no setTimeout) to preserve the user-gesture
    // chain that iOS Safari requires.
    if (state.settings?.ttsAutoplay) {
      if (train.revealed) {
        speakCard(train.current);
      }
    }
  }

  function updateTrainStats() {
    const total = DECK.length;
    const sum = DECK.reduce((acc, c) => acc + (state.srs[c.id]?.mastery || 0), 0);
    const masteryPct = Math.round(sum / total);
    $("#trainMastery").textContent = masteryPct + "%";
    $("#trainSessionXp").textContent = state.sessionXp.toString();

    // Queue counters (single pass).
    const now = Date.now();
    let dueCount = 0, learningCount = 0, relearningCount = 0;
    let bdNew = 0, bdLearn = 0, bdYoung = 0, bdMature = 0, bdMastered = 0;
    for (const c of DECK) {
      const s = state.srs[c.id];
      if (!s) continue;
      const isDue = (s.due || 0) <= now;
      if (s.queue === "learning") {
        learningCount++; bdLearn++;
        if (isDue) dueCount++;
      } else if (s.queue === "relearning") {
        relearningCount++; bdLearn++;
        if (isDue) dueCount++;
      } else if (s.queue === "review") {
        if (isDue) dueCount++;
        const mature = s.interval >= SRS.MASTERY_INTERVAL_DAYS;
        if (mature && (s.lapses || 0) <= SRS.MASTERY_MAX_LAPSES) bdMastered++;
        else if (mature) bdMature++;
        else bdYoung++;
      } else {
        bdNew++;
      }
    }

    const stats = getDailyStats(now);
    const set = (id, v) => { const el = $(id); if (el) el.textContent = String(v); };
    set("#srsDue", dueCount);
    set("#srsNew", stats.newIntroduced || 0);
    set("#srsLearning", learningCount);
    set("#srsRelearning", relearningCount);
    set("#bdNew", bdNew);
    set("#bdLearning", bdLearn);
    set("#bdYoung", bdYoung);
    set("#bdMature", bdMature);
    set("#bdMastered", bdMastered);

    // 7-day forecast bars (lightweight CSS).
    const wrap = $("#forecastBars");
    if (wrap) {
      const buckets = forecastDueByDay(7);
      const max = Math.max(1, ...buckets);
      const labels = ["Today", "+1", "+2", "+3", "+4", "+5", "+6"];
      wrap.innerHTML = buckets.map((n, i) => {
        const h = Math.round((n / max) * 100);
        return `<div class="fc-col" title="${labels[i]}: ${n} due">`
          + `<div class="fc-bar" style="height:${h}%"></div>`
          + `<span class="fc-num">${n}</span>`
          + `<span class="fc-lbl">${labels[i]}</span>`
          + `</div>`;
      }).join("");
    }
  }

  // Format an interval (days) into "1m" / "10m" / "1h" / "3d" / "2w" / "1mo".
  function formatNextDue(ms) {
    if (ms <= 0) return "now";
    const m = ms / 60000;
    if (m < 60) return `${Math.max(1, Math.round(m))}m`;
    const h = m / 60;
    if (h < 24) return `${Math.round(h)}h`;
    const d = h / 24;
    if (d < 14) return `${Math.round(d)}d`;
    const w = d / 7;
    if (w < 9) return `${Math.round(w)}w`;
    return `${Math.round(d / 30)}mo`;
  }
  function formatPreview(prev) {
    if (!prev) return "";
    if (prev.minutes != null) {
      if (prev.minutes < 60) return `${prev.minutes}m`;
      const h = Math.round(prev.minutes / 60);
      if (h < 24) return `${h}h`;
      return `${Math.round(h / 24)}d`;
    }
    if (prev.days != null) {
      if (prev.days < 14) return `${prev.days}d`;
      if (prev.days < 60) return `${Math.round(prev.days / 7)}w`;
      if (prev.days < 365) return `${Math.round(prev.days / 30)}mo`;
      return `${Math.round(prev.days / 365)}y`;
    }
    return "";
  }
  function renderSrsButtonHints(cardId) {
    const set = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt || ""; };
    if (!cardId || !state.srs[cardId]) {
      set("#srsSubAgain", ""); set("#srsSubHard", "");
      set("#srsSubGood", "");  set("#srsSubEasy", "");
      return;
    }
    set("#srsSubAgain", formatPreview(previewGradeInterval(cardId, "again")));
    set("#srsSubHard",  formatPreview(previewGradeInterval(cardId, "hard")));
    set("#srsSubGood",  formatPreview(previewGradeInterval(cardId, "good")));
    set("#srsSubEasy",  formatPreview(previewGradeInterval(cardId, "easy")));
  }

  function gradeCard(grade) {
    const c = train.current;
    const srs = state.srs[c.id];
    srs.seen += 1;
    if (!srs.firstSeenAt) srs.firstSeenAt = Date.now();
    srs.previousInterval = srs.interval || 0;
    srs.lastReviewAt = Date.now();
    const stats = getDailyStats();
    stats.reviews = (stats.reviews || 0) + 1;
    const xp = applySrsGrade(c.id, grade);
    gainXp(xp);
    // Treat "again" as a miss for interrupt-trigger purposes; everything else as success.
    logReview(c.id, grade !== "again");
    if (grade === "again") {
      train.consecutiveCorrect = 0;
    } else {
      train.consecutiveCorrect += 1;
      // Successful training review clears the shaky flag set by Battle Mode.
      if (state.shakyCards && state.shakyCards[c.id] && grade !== "hard") {
        delete state.shakyCards[c.id];
      }
    }
    train.cardsSinceInterrupt += 1;
    saveState();

    // Brief "Next review" hint so users can see scheduling in action.
    const dueIn = (state.srs[c.id].due || 0) - Date.now();
    if (dueIn > 0) toast(`Next review: ${formatNextDue(dueIn)}`, 900);

    // Try to fire a random training interrupt.
    if (maybeInterrupt()) return;

    train.current = pickNextCard();
    train.revealed = false;
    renderCard();
    updateTrainStats();
    armIdleTimer();
  }

  // Apply an SRS grade across queues. Returns XP earned.
  function applySrsGrade(cardId, grade) {
    const srs = state.srs[cardId];
    const now = Date.now();
    const minute = 60_000, day = 86_400_000;
    const xpMap = { again: 2, hard: 5, good: 10, easy: 15 };
    let xp = xpMap[grade] || 0;

    // Helper: graduate from learning to review.
    const graduate = (intervalDays, easeBump = 0) => {
      srs.queue = "review";
      srs.step = 0;
      srs.interval = intervalDays;
      srs.due = now + fuzzInterval(cardId, intervalDays) * day;
      srs.reps += 1;
      if (easeBump) srs.ease = clamp(srs.ease + easeBump, SRS.EASE_MIN, SRS.EASE_MAX);
    };

    // --- NEW or LEARNING queue ---------------------------------------------
    if (srs.queue === "new" || srs.queue === "learning") {
      if (srs.queue === "new") {
        srs.queue = "learning";
        srs.step = 0;
        const stats = getDailyStats(now);
        stats.newIntroduced = (stats.newIntroduced || 0) + 1;
      }
      const steps = SRS.LEARNING_STEPS_MIN;
      switch (grade) {
        case "again":
          srs.step = 0;
          srs.due = now + steps[0] * minute;
          srs.mastery = clamp(srs.mastery - 3, 0, 100);
          break;
        case "hard":
          // Repeat current step (don't advance).
          srs.due = now + steps[srs.step] * minute;
          srs.mastery = clamp(srs.mastery + 1, 0, 100);
          break;
        case "good":
          srs.step += 1;
          if (srs.step >= steps.length) {
            graduate(SRS.GRAD_INTERVAL_GOOD);
            srs.mastery = clamp(srs.mastery + 5, 0, 100);
          } else {
            srs.due = now + steps[srs.step] * minute;
            srs.mastery = clamp(srs.mastery + 3, 0, 100);
          }
          break;
        case "easy":
          // Easy graduates immediately at a longer interval.
          graduate(SRS.GRAD_INTERVAL_EASY, 0.05);
          srs.mastery = clamp(srs.mastery + 8, 0, 100);
          break;
      }
      srs.lastResult = grade;
      return xp;
    }

    // --- RELEARNING queue --------------------------------------------------
    if (srs.queue === "relearning") {
      const steps = SRS.RELEARNING_STEPS_MIN;
      switch (grade) {
        case "again":
          srs.step = 0;
          srs.due = now + steps[0] * minute;
          srs.mastery = clamp(srs.mastery - 4, 0, 100);
          break;
        case "hard":
          srs.due = now + steps[srs.step] * minute;
          break;
        case "good":
          srs.step += 1;
          if (srs.step >= steps.length) {
            // Re-graduate to review using the gentle lapse interval already
            // stored at lapse time on srs.interval.
            srs.queue = "review";
            srs.step = 0;
            srs.due = now + fuzzInterval(cardId, srs.interval) * day;
            srs.reps += 1;
            srs.mastery = clamp(srs.mastery + 4, 0, 100);
          } else {
            srs.due = now + steps[srs.step] * minute;
            srs.mastery = clamp(srs.mastery + 2, 0, 100);
          }
          break;
        case "easy":
          // Easy on relearning: jump back to review immediately, modest interval.
          srs.queue = "review";
          srs.step = 0;
          srs.interval = Math.max(srs.interval, 1);
          srs.due = now + fuzzInterval(cardId, srs.interval) * day;
          srs.reps += 1;
          srs.mastery = clamp(srs.mastery + 6, 0, 100);
          break;
      }
      srs.lastResult = grade;
      return xp;
    }

    // --- REVIEW queue (graduated SM-2) -------------------------------------
    const prevInterval = Math.max(1, srs.interval || 1);
    switch (grade) {
      case "again": {
        // Lapse: drop ease, half the interval (gentle), enter relearning.
        srs.ease = clamp(srs.ease - 0.20, SRS.EASE_MIN, SRS.EASE_MAX);
        srs.lapses = (srs.lapses || 0) + 1;
        srs.interval = capInterval(Math.max(1, Math.round(prevInterval * SRS.LAPSE_MULT)));
        srs.queue = "relearning";
        srs.step = 0;
        srs.due = now + SRS.RELEARNING_STEPS_MIN[0] * minute;
        srs.mastery = clamp(srs.mastery - 5, 0, 100);
        const stats = getDailyStats(now);
        stats.lapses = (stats.lapses || 0) + 1;
        // Auto-suspend leeches so they stop polluting the queue.
        if (isLeech(srs)) srs.suspended = true;
        break;
      }
      case "hard": {
        srs.ease = clamp(srs.ease - 0.05, SRS.EASE_MIN, SRS.EASE_MAX);
        srs.interval = capInterval(Math.max(prevInterval + 1, prevInterval * SRS.HARD_MULT));
        srs.due = now + fuzzInterval(cardId, srs.interval) * day;
        srs.reps += 1;
        srs.mastery = clamp(srs.mastery + 3, 0, 100);
        break;
      }
      case "good": {
        srs.interval = capInterval(Math.max(prevInterval + 1, prevInterval * srs.ease));
        srs.due = now + fuzzInterval(cardId, srs.interval) * day;
        srs.reps += 1;
        srs.mastery = clamp(srs.mastery + 8, 0, 100);
        break;
      }
      case "easy": {
        srs.ease = clamp(srs.ease + 0.10, SRS.EASE_MIN, SRS.EASE_MAX);
        srs.interval = capInterval(Math.max(prevInterval + 2, prevInterval * srs.ease * SRS.EASY_BONUS));
        srs.due = now + fuzzInterval(cardId, srs.interval) * day;
        srs.reps += 1;
        srs.mastery = clamp(srs.mastery + 14, 0, 100);
        break;
      }
    }
    srs.lastResult = grade;
    return xp;
  }

  // ---------- Battle mode -----------------------------------------------------
  let battle = null;

  function getDifficulty() {
    return DIFFICULTY[state.settings?.difficulty] || DIFFICULTY.normal;
  }

  function makeEnemy(index) {
    const diff = getDifficulty();
    // Cycle through templates; promote every 5th to a boss using enemy.png.
    const isBossWave = (index > 0) && (index % 5 === 0);
    let tmpl;
    if (isBossWave) {
      // Pick the strongest boss template from ENEMIES; in endless, scale up.
      const bosses = ENEMIES.filter(e => e.tier === "boss");
      tmpl = bosses[Math.min(Math.floor(index / 5) - 1, bosses.length - 1)] || bosses[bosses.length - 1];
    } else {
      const minions = ENEMIES.filter(e => e.tier !== "boss");
      tmpl = minions[index % minions.length];
    }
    const tier = isBossWave ? "boss" : (tmpl.tier || "minion");
    const tierHpMult = tier === "boss" ? 1.6 : tier === "elite" ? 1.2 : 1.0;
    // Endless: log scaling so it's not a wall.
    const endlessScale = diff.endless ? Math.log2(1 + index) * 18 : 0;
    const hp = Math.round((tmpl.baseHp + state.level * 4 + index * 25 + endlessScale) * tierHpMult);
    return {
      ...tmpl,
      tier,
      isBoss: tier === "boss",
      maxHp: hp,
      hp,
    };
  }

  function startBattle() {
    const diff = getDifficulty();
    battle = {
      enemyIdx: 0,
      enemy: makeEnemy(0),
      playerHp: 100, playerMax: 100,
      streak: 0, ki: 0,
      currentCard: null, currentChoices: [], currentChoiceCards: [], correctIdx: -1,
      reverse: false,
      busy: false,
      questionStart: 0,
      questionDuration: BATTLE.QUESTION_MS_BASE,
      timerRaf: 0,
      questionsThisFight: 0,
      telegraphTurns: 0,
      telegraphMaxTurns: 0,
      telegraphLabel: "",
      perfectRun: true,
      startedAt: performance.now(),
      runStartedAt: performance.now(),
      tier: 0,
      // V2 additions
      diff,
      kosThisRun: 0,
      questionsThisRun: 0,
      correctThisRun: 0,
      tierEverHit: [false, false, false, false, false, false, false, false, false, false],
      pausedAt: 0,
      pausedTotal: 0,
      ended: false,
      recentCards: [], // sliding window of last shown card ids (anti-repeat)
    };
    state.battleStats.runs = (state.battleStats.runs || 0) + 1;
    saveState();
    Sfx.init();
    Music.start();
    showStageHud();
    renderBattle();
    // Show pre-battle intro, then go to first question
    showIntroCard(battle.enemy, battle.enemyIdx, () => {
      nextQuestion();
      renderBattle();
      maybeStartOnboarding();
    });
  }

  function pickBattleCard() {
    // Weighted sampling across the WHOLE deck, with bias toward cards that
    // need practice (shaky / low-ease / low-mastery) and toward the current
    // tier's mastery band. Hard anti-repeat via a sliding window of recently
    // shown cards so you never see the same prompt back-to-back-to-back.
    const all = DECK.slice();
    const idx = battle?.enemyIdx ?? 0;
    const recent = (battle && battle.recentCards) || [];
    // Window size: ~1/3 of deck, clamped. With 305 cards this is 12; never
    // larger than half the deck so we always have candidates.
    const windowSize = Math.max(4, Math.min(Math.floor(all.length / 3), Math.floor(all.length / 2) - 1, 24));
    const recentSet = new Set(recent.slice(-windowSize));

    function weightFor(c) {
      const s = state.srs[c.id];
      if (!s) return 0.5;
      let w = 1;
      // Tier band bias.
      const m = s.mastery || 0;
      if (idx <= 1)       { if (m < 40) w *= 1.6; else if (m > 80) w *= 0.4; }
      else if (idx <= 3)  { if (m >= 20 && m < 80) w *= 1.4; else w *= 0.6; }
      else                { if (m >= 50) w *= 1.5; else w *= 0.5; }
      // Weakness bias.
      if ((s.ease || SRS.EASE_START) < SRS.EASE_START - 0.1) w *= 1.4;
      if (m < 40) w *= 1.3;
      // Shaky bias.
      if (state.shakyCards && state.shakyCards[c.id]) w *= 1.8;
      // Suspended/leech: skip entirely (training-only territory).
      if (s.suspended) w = 0;
      return w;
    }

    function weightedPick(pool) {
      let total = 0;
      for (const c of pool) total += c._w;
      if (total <= 0) return pool[Math.floor(Math.random() * pool.length)];
      let r = Math.random() * total;
      for (const c of pool) { r -= c._w; if (r <= 0) return c; }
      return pool[pool.length - 1];
    }

    // Build pool excluding recently shown.
    let pool = [];
    for (const c of all) {
      const w = weightFor(c);
      if (w <= 0) continue;
      if (recentSet.has(c.id)) continue;
      c._w = w;
      pool.push(c);
    }
    // Safety: if anti-repeat emptied everything, drop the constraint but still
    // forbid the immediate previous card.
    if (!pool.length) {
      const lastId = recent[recent.length - 1];
      for (const c of all) {
        const w = weightFor(c);
        if (w <= 0) continue;
        if (c.id === lastId) continue;
        c._w = w;
        pool.push(c);
      }
    }
    // Final safety: pure random over all eligible cards.
    if (!pool.length) {
      pool = all.filter(c => !state.srs[c.id]?.suspended);
      pool.forEach(c => { c._w = 1; });
    }

    const pick = weightedPick(pool);
    pool.forEach(c => { delete c._w; });

    if (battle) {
      battle.recentCards = battle.recentCards || [];
      battle.recentCards.push(pick.id);
      if (battle.recentCards.length > windowSize * 2) {
        battle.recentCards = battle.recentCards.slice(-windowSize * 2);
      }
    }
    return pick;
  }

  // Battle answers never reschedule a card; they only nudge ease and toggle
  // the "shaky" flag, which gives that card a slight priority bump in the
  // next training session. This keeps Train Mode the source of truth for SRS.
  function applyBattleSignal(cardId, correct, responseMs) {
    const srs = state.srs[cardId];
    if (!srs) return;
    if (correct) {
      const fast = responseMs <= SRS.BATTLE_FAST_MS;
      srs.ease = clamp(
        srs.ease + (fast ? SRS.BATTLE_EASE_FAST : SRS.BATTLE_EASE_SLOW),
        SRS.EASE_MIN, SRS.EASE_MAX
      );
      srs.lastResult = "battle-ok";
      // A win on a shaky card requires a clean answer in TRAINING to clear
      // the flag — battle alone shouldn't unflag it (otherwise grinding
      // battles would erase real weakness signals).
    } else {
      srs.ease = clamp(srs.ease + SRS.BATTLE_EASE_MISS, SRS.EASE_MIN, SRS.EASE_MAX);
      srs.lastResult = "battle-miss";
      if (!state.shakyCards) state.shakyCards = {};
      state.shakyCards[cardId] = Date.now();
    }
  }

  function nextQuestion() {
    const card = pickBattleCard();
    // Direction is now strictly user-controlled via Settings (no more random).
    const reverse = isReverse();
    const built = buildChoices(card, { mode: "normal", reverse });
    battle.currentCard = card;
    battle.currentChoices = built.choices;
    battle.currentChoiceCards = built.cards;
    battle.correctIdx = built.correctIdx;
    battle.reverse = reverse;
    battle.busy = false;
    battle.questionsThisFight = (battle.questionsThisFight || 0) + 1;
    battle.questionsThisRun = (battle.questionsThisRun || 0) + 1;
    state.battleStats.totalQuestions = (state.battleStats.totalQuestions || 0) + 1;
    // Question duration scales with enemy index AND difficulty.
    const idx = battle.enemyIdx || 0;
    const baseDur = Math.max(BATTLE.QUESTION_MS_MIN, BATTLE.QUESTION_MS_BASE - idx * 600);
    battle.questionDuration = Math.round(baseDur * (battle.diff?.timerMult || 1));
    // Telegraph: every Nth question (per-difficulty), enemy starts charging.
    const telegraphEvery = battle.diff?.telegraphEvery || BATTLE.TELEGRAPH_EVERY;
    if (battle.telegraphTurns === 0 && battle.questionsThisFight % telegraphEvery === 0) {
      battle.telegraphTurns = BATTLE.TELEGRAPH_TURNS;
      battle.telegraphMaxTurns = BATTLE.TELEGRAPH_TURNS;
      battle.telegraphLabel = pickTelegraphLabel();
      Sfx.play("telegraphWarn");
      buzz(40);
    }
    startQuestionTimer();
  }

  function pickTelegraphLabel() {
    const moves = [
      "Death Beam", "Eye Laser", "Galick Gun", "Special Beam", "Dark Wave",
      "Final Flash", "Big Bang Attack", "Hellzone Grenade", "Destructo Disc", "Solar Flare",
      "Masenko", "Burning Attack", "Crimson Lotus", "Thunder Mudra", "Naam-Bomb",
      "Sher Strike", "Tandoor Blaze", "Sarpanch Slam", "Monsoon Surge", "Kirpan Cross-Slash"
    ];
    return moves[Math.floor(Math.random() * moves.length)];
  }

  function startQuestionTimer() {
    cancelAnimationFrame(battle.timerRaf);
    battle.questionStart = performance.now();
    battle.pausedTotal = 0;
    const fill = $("#quizTimerFill");
    if (fill) { fill.classList.remove("danger"); fill.style.width = "100%"; }
    let lastTickSec = -1;
    const tick = (t) => {
      if (!battle || battle.busy) return;
      if (battle.pausedAt) { battle.timerRaf = requestAnimationFrame(tick); return; }
      const elapsed = (t - battle.questionStart) - battle.pausedTotal;
      const left = Math.max(0, battle.questionDuration - elapsed);
      const pct = (left / battle.questionDuration) * 100;
      if (fill) {
        fill.style.width = pct + "%";
        if (pct < 30) fill.classList.add("danger");
      }
      // Tick SFX in last 3 seconds
      const secLeft = Math.ceil(left / 1000);
      if (secLeft <= 3 && secLeft > 0 && secLeft !== lastTickSec) {
        lastTickSec = secLeft;
        Sfx.play("tick");
      }
      if (left <= 0) {
        onTimeout();
        return;
      }
      battle.timerRaf = requestAnimationFrame(tick);
    };
    battle.timerRaf = requestAnimationFrame(tick);
  }

  function onTimeout() {
    if (!battle || battle.busy) return;
    battle.busy = true;
    cancelAnimationFrame(battle.timerRaf);
    const buttons = $$("#choices .choice");
    const choicesWrap = $("#choices");
    buttons.forEach(b => b.disabled = true);
    if (choicesWrap) choicesWrap.classList.add("locked");
    if (buttons[battle.correctIdx]) buttons[battle.correctIdx].classList.add("correct");
    flashAnswer("wrong");
    battle.lastResult = "wrong";
    handleWrongAnswer({ timeout: true });
  }

  function renderBattle() {
    $("#enemyName").textContent   = battle.enemy.name;

    // Enemy sprite: emoji for minions/elites, image for bosses
    const enemyImg = $("#enemyImg");
    const enemyEmoji = $("#enemyEmoji");
    const enemyCombatant = document.querySelector(".combatant.enemy");
    if (enemyCombatant) {
      enemyCombatant.classList.remove("minion", "elite", "boss");
      enemyCombatant.classList.add(battle.enemy.tier || "minion");
    }
    if (battle.enemy.isBoss) {
      if (enemyImg) enemyImg.hidden = false;
      if (enemyEmoji) { enemyEmoji.hidden = true; enemyEmoji.textContent = ""; }
    } else {
      if (enemyImg) enemyImg.hidden = true;
      if (enemyEmoji) { enemyEmoji.hidden = false; enemyEmoji.textContent = battle.enemy.emoji || "👾"; }
    }
    // Enemy tier tag
    const enemyTierTag = $("#enemyTierTag");
    if (enemyTierTag) {
      const t = battle.enemy.tier || "minion";
      if (t === "minion") {
        enemyTierTag.hidden = true;
      } else {
        enemyTierTag.hidden = false;
        enemyTierTag.className = "enemy-tier-tag " + t;
        enemyTierTag.textContent = t === "boss" ? "BOSS" : "ELITE";
      }
    }
    // Charging aura
    if (enemyCombatant) {
      enemyCombatant.classList.toggle("charging", battle.telegraphTurns > 0);
    }

    $("#enemyHpFill").style.width = (battle.enemy.hp / battle.enemy.maxHp * 100) + "%";
    $("#enemyHpText").textContent = `${battle.enemy.hp}/${battle.enemy.maxHp}`;
    $("#playerHpFill").style.width = (battle.playerHp / battle.playerMax * 100) + "%";
    $("#playerHpText").textContent = `${battle.playerHp}/${battle.playerMax}`;
    $("#kiFill").style.width = battle.ki + "%";
    $("#streakLabel").textContent = String(battle.streak);
    const sb = $("#battleShield"); if (sb) sb.textContent = String(state.streakShield || 0);

    // Telegraph banner (replaces small badge)
    renderTelegraphBanner();

    // KI Special FAB state
    renderKiFab();

    // Stage HUD
    renderStageHud();

    // Prompt + label (direction-aware: battle.reverse means Punjabi is the answer)
    const lbl = $("#quizPromptLabel");
    if (lbl) lbl.textContent = battle.reverse ? "Translate to Punjabi:" : "Translate to English:";
    const promptEl = $("#quizPrompt");
    if (battle.currentCard) {
      if (battle.reverse) {
        // English prompt
        promptEl.textContent = battle.currentCard.english;
      } else {
        // Punjabi prompt — show Gurmukhi over roman
        renderPunjabi(promptEl, battle.currentCard);
      }
    }
    if (promptEl) promptEl.classList.remove("flash-good", "flash-bad");
    const choicesWrap = $("#choices");
    if (choicesWrap) choicesWrap.classList.remove("locked");
    $$("#choices .choice").forEach((btn, i) => {
      const card = battle.currentChoiceCards && battle.currentChoiceCards[i];
      if (battle.reverse && card) {
        // Punjabi answer choices — render Gurmukhi + roman
        btn.innerHTML = punjabiHtml(card);
      } else {
        btn.textContent = battle.currentChoices[i] || "";
      }
      btn.classList.remove("correct", "wrong");
      btn.disabled = false;
    });

    applyTransformVisual();
    applyShieldVisual();
  }

  function applyTransformVisual() {
    const sprite = $("#playerSprite");
    const tag = $("#tierTag");
    if (!sprite) return;
    sprite.classList.remove(
      "tier-1", "tier-2", "tier-3", "tier-4", "tier-5",
      "tier-6", "tier-7", "tier-8", "tier-9",
    );
    const tier = battle.tier || 0;
    if (tier > 0) sprite.classList.add(`tier-${tier}`);
    if (tag) {
      if (tier > 0) {
        tag.hidden = false;
        tag.textContent = BATTLE.TIER_NAMES[tier];
        tag.dataset.tier = String(tier);
      } else {
        tag.hidden = true;
        delete tag.dataset.tier;
      }
    }
  }

  function applyShieldVisual() {
    const aura = $("#shieldAura");
    if (!aura) return;
    aura.classList.remove("shatter");
    if ((state.streakShield || 0) > 0) aura.classList.add("on");
    else aura.classList.remove("on");
  }

  function shieldShatterFx() {
    const aura = $("#shieldAura");
    if (!aura) return;
    aura.classList.remove("on");
    void aura.offsetWidth;
    aura.classList.add("shatter");
    setTimeout(() => aura.classList.remove("shatter"), 500);
  }

  function computeTier(streak) {
    const t = BATTLE.TIER_THRESHOLDS;
    for (let i = t.length - 1; i >= 0; i--) {
      if (streak >= t[i]) return i + 1;
    }
    return 0;
  }

  function playerAttack(streak) {
    let dmg = 12 + Math.floor(state.level * 0.6);
    let label = null;
    if (streak >= 100 && streak % 100 === 0) { dmg += 250; label = "ULTIMATE FORM!"; playFx("spiritbomb"); Sfx.play("spirit"); }
    else if (streak >= 75 && streak % 75 === 0) { dmg += 180; label = "INSTANT TRANSMISSION KAMEHAMEHA!"; playFx("kamehameha"); Sfx.play("kameBeam"); }
    else if (streak >= 50 && streak % 50 === 0) { dmg += 120; label = "DRAGON FIST!"; playFx("spiritbomb"); Sfx.play("spirit"); }
    else if (streak >= 25 && streak % 25 === 0) { dmg += 80; label = "SPIRIT BOMB!"; playFx("spiritbomb"); Sfx.play("spirit"); }
    else if (streak >= 20 && streak % 20 === 0) { dmg += 30; label = "FINAL FLASH!"; playFx("kamehameha"); Sfx.play("kameBeam"); }
    else if (streak >= 15 && streak % 15 === 0) { dmg += 25; label = "GALICK GUN!"; playFx("kamehameha"); Sfx.play("kameBeam"); }
    else if (streak >= 10 && streak % 10 === 0) { dmg += 40; label = "KAMEHAMEHA!"; playFx("kamehameha"); Sfx.play("kameBeam"); }
    else if (streak >= 5  && streak % 5  === 0) { dmg += 18; label = "KI BLAST!";   playFx("kiblast"); Sfx.play("crit"); }
    if (label) toast(label);
    return dmg;
  }

  function enemyAttack() {
    const base = 8 + Math.floor(state.level * 0.3) + Math.floor(Math.random() * 6);
    return Math.round(base * (battle?.diff?.dmgMult || 1));
  }

  function onChoice(i) {
    if (!battle || battle.busy) return;
    battle.busy = true;
    cancelAnimationFrame(battle.timerRaf);
    const correct = (i === battle.correctIdx);
    const buttons = $$("#choices .choice");
    const choicesWrap = $("#choices");
    buttons.forEach(b => b.disabled = true);
    if (choicesWrap) choicesWrap.classList.add("locked");
    buttons[i].classList.add(correct ? "correct" : "wrong");
    if (!correct) buttons[battle.correctIdx].classList.add("correct");
    flashAnswer(correct ? "correct" : "wrong");

    if (correct) {
      battle.lastResult = "correct";
      handleCorrectAnswer();
    } else {
      battle.lastResult = "wrong";
      handleWrongAnswer({ timeout: false });
    }
  }

  function handleCorrectAnswer() {
    battle.streak += 1;
    battle.correctThisRun = (battle.correctThisRun || 0) + 1;
    state.battleStats.totalCorrect = (state.battleStats.totalCorrect || 0) + 1;
    battle.ki = clamp(battle.ki + 12, 0, 100);
    if (battle.streak > (state.battleStats?.bestStreak || 0)) {
      state.battleStats.bestStreak = battle.streak;
    }
    bumpStreakLabel();
    Sfx.play("swoosh");
    // Tier transformation announce
    const newTier = computeTier(battle.streak);
    if (newTier > (battle.tier || 0)) {
      battle.tier = newTier;
      tierUpFx(newTier);
      buzz([20, 40, 30]);
      applyTransformVisual();
    }
    // Damage = base * tier mult * speed bonus
    const base = playerAttack(battle.streak);
    const tierMult = BATTLE.TIER_DMG_MULT[battle.tier || 0];
    const elapsed = (performance.now() - battle.questionStart) - (battle.pausedTotal || 0);
    const speedFactor = clamp(1 - (elapsed / battle.questionDuration), 0, 1);
    const speedBonus = 1 + BATTLE.SPEED_BONUS_MAX * speedFactor;
    const dmg = Math.round(base * tierMult * speedBonus);
    battle.enemy.hp = Math.max(0, battle.enemy.hp - dmg);
    if (speedFactor > 0.6) {
      const pct = Math.round((speedBonus - 1) * 100);
      toast(pickRandom([`⚡ Quick! +${pct}% dmg`, `⚡ Lightning! +${pct}% dmg`]), 900);
    }
    gainXp(6 + Math.round(speedFactor * 4));
    // Soft writeback: battle ease nudge only — interval/due/lapses untouched.
    applyBattleSignal(battle.currentCard.id, true, elapsed);
    const srs = state.srs[battle.currentCard.id];
    if (srs) { srs.mastery = clamp(srs.mastery + 2, 0, 100); srs.seen += 1; }
    saveState();
    glowQuiz("correct");
    // Crit on SS2+ (tier 3+), fast answers, or every 5th streak hit.
    const isCrit = (battle.tier || 0) >= 3 || speedFactor > 0.7 || (battle.streak % 5 === 0);
    popDamage(".combatant.enemy", dmg, isCrit ? "crit" : "dmg");
    flashSprite("#enemySprite", { crit: isCrit });
    flashHp("#enemyHpFill");
    shakeEl("#enemySprite");
    Sfx.play(isCrit ? "crit" : "hit");
    buzz(isCrit ? [10, 20, 30] : 15);
    advanceBattle();
  }

  function handleWrongAnswer({ timeout }) {
    battle.perfectRun = false;
    // Soft writeback: flag the card as shaky and nudge ease down.
    if (battle.currentCard) {
      const elapsed = (performance.now() - battle.questionStart) - (battle.pausedTotal || 0);
      applyBattleSignal(battle.currentCard.id, false, elapsed);
    }
    if ((state.streakShield || 0) > 0) {
      state.streakShield -= 1;
      saveState();
      toast("🛡️ Streak Shield absorbed it!", 1500);
      shieldShatterFx();
      popDamage(".combatant.player", "BLOCK", "miss");
      updateTrainHud();
      const sb = $("#battleShield"); if (sb) sb.textContent = String(state.streakShield || 0);
      Sfx.play("block");
      buzz(25);
      advanceBattle();
      return;
    }
    battle.streak = 0;
    battle.tier = 0;
    bumpStreakLabel();
    battle.ki = clamp(battle.ki - 20, 0, 100);
    let dmg = enemyAttack();
    if (timeout) dmg = Math.round(dmg * 1.2);
    battle.playerHp = Math.max(0, battle.playerHp - dmg);
    glowQuiz("wrong");
    if (timeout) popDamage(".combatant.player", "TIMEOUT", "miss");
    popDamage(".combatant.player", dmg, "dmg");
    flashSprite("#playerSprite");
    flashHp("#playerHpFill");
    shakeEl("#playerSprite");
    Sfx.play("hit");
    buzz(timeout ? 60 : 40);
    advanceBattle();
  }

  function advanceBattle() {
    // Telegraph countdown: tick down, unleash on zero.
    if (battle.telegraphTurns > 0) {
      battle.telegraphTurns -= 1;
      if (battle.telegraphTurns === 0 && battle.telegraphLabel) {
        const dmg = Math.round(enemyAttack() * BATTLE.TELEGRAPH_DAMAGE_MULT);
        if ((state.streakShield || 0) > 0) {
          state.streakShield -= 1;
          saveState();
          toast(`🛡️ Shield absorbed ${battle.telegraphLabel}!`, 1800);
          shieldShatterFx();
          popDamage(".combatant.player", "BLOCK", "miss");
          updateTrainHud();
          Sfx.play("block");
        } else {
          battle.playerHp = Math.max(0, battle.playerHp - dmg);
          toast(`💥 ${battle.telegraphLabel} hits for ${dmg}!`, 1800);
          popDamage(".combatant.player", dmg, "crit");
          flashSprite("#playerSprite", { crit: true });
          flashHp("#playerHpFill");
          shakeEl("#playerSprite");
          shakeArena();
          playFx("tg-hit");
          flashAnswerBoom();
          Sfx.play("telegraphHit");
          buzz([0, 80, 30, 80]);
        }
        battle.telegraphLabel = "";
        battle.telegraphMaxTurns = 0;
      }
    }

    setTimeout(() => {
      if (!battle) return;
      if (battle.enemy.hp <= 0) {
        const reward = 30 + battle.enemyIdx * 20 + state.level + (battle.enemy.isBoss ? 50 : 0);
        gainXp(reward);
        toast(`Defeated ${battle.enemy.name}! +${reward} XP`, 2000);
        state.battleStats.wins = (state.battleStats.wins || 0) + 1;
        battle.kosThisRun = (battle.kosThisRun || 0) + 1;
        if (battle.diff?.endless) {
          state.battleStats.bestEnemyIdx = Math.max(state.battleStats.bestEnemyIdx || 0, battle.enemyIdx + 1);
        }
        const koMs = performance.now() - battle.startedAt;
        if (!state.battleStats.fastestKoMs || koMs < state.battleStats.fastestKoMs) {
          state.battleStats.fastestKoMs = Math.round(koMs);
        }
        if (battle.perfectRun) {
          state.battleStats.perfectRuns = (state.battleStats.perfectRuns || 0) + 1;
          toast(pickRandom(["✨ PERFECT RUN!", "✨ FLAWLESS VICTORY!", "✨ NO DAMAGE — UNREAL!"]), 1600);
        }
        saveState();
        Sfx.play("ko");
        playKoPuff();
        // Win condition
        const totalFights = battle.diff?.fights ?? 10;
        battle.enemyIdx += 1;
        if (!battle.diff?.endless && battle.enemyIdx >= totalFights) {
          finishRun("victory");
          return;
        }
        battle.enemy = makeEnemy(battle.enemyIdx);
        // Heal
        let heal = 0;
        if (battle.diff?.endless) {
          const everyN = battle.diff.healEveryNKOs || 3;
          if (battle.kosThisRun % everyN === 0) heal = battle.diff.healAmount || 18;
        } else {
          heal = battle.diff?.healPerKO ?? 20;
        }
        if (heal > 0) {
          const before = battle.playerHp;
          battle.playerHp = clamp(battle.playerHp + heal, 0, battle.playerMax);
          const actual = battle.playerHp - before;
          if (actual > 0) {
            popDamage(".combatant.player", actual, "heal");
            flashHp("#playerHpFill", "heal");
          }
        }
        battle.questionsThisFight = 0;
        battle.telegraphTurns = 0;
        battle.telegraphMaxTurns = 0;
        battle.perfectRun = true;
        battle.startedAt = performance.now();
        // Tempo ramps with progression; bosses get extra push
        Music.setBoss(!!battle.enemy.isBoss);
        // Battle tempo: mid-pace cinematic, climbs per stage, bosses harder-hitting.
        Music.setBpm(92 + Math.min(18, battle.enemyIdx * 2) + (battle.enemy.isBoss ? 4 : 0));

        // Pre-battle intro for next enemy, then continue
        showIntroCard(battle.enemy, battle.enemyIdx, () => {
          nextQuestion();
          renderBattle();
          requestAnimationFrame(() => reanimateChoices());
        });
        return;
      }
      if (battle.playerHp <= 0) {
        finishRun("defeat");
        return;
      }
      nextQuestion();
      renderBattle();
      requestAnimationFrame(() => reanimateChoices());
    }, battle.lastResult === "wrong" ? 1700 : 900);
  }

  function shakeEl(sel) {
    const el = $(sel);
    if (!el) return;
    const onEnd = () => { el.classList.remove("shake"); el.removeEventListener("animationend", onEnd); };
    el.classList.remove("shake");
    void el.offsetWidth;
    el.addEventListener("animationend", onEnd);
    el.classList.add("shake");
  }

  function playFx(kind) {
    const fx = $("#fx");
    fx.className = "fx";
    void fx.offsetWidth;
    fx.classList.add("show", kind);
    clearTimeout(playFx._t);
    const dur =
      kind === "spiritbomb"   ? 1600 :
      kind === "kamehameha"   ? 1200 :
      kind === "gold-burst"   ? 1000 :
      kind === "memory-clone" ? 1200 :
      kind === "frieza-trap"  ? 1100 :
      kind === "ki-cannon"    ? 900  :
      kind === "tg-hit"       ? 700  :
      kind === "victory"      ? 1700 :
      kind === "defeat"       ? 1500 : 900;
    playFx._t = setTimeout(() => {
      fx.classList.remove("show", kind);
    }, dur);
  }

  // ===================================================================
  // BATTLE V2 — Sfx, Music, KI Special, HUD, Intro, Results, Pause,
  // Onboarding, Pre-battle. All vanilla, no external deps.
  // ===================================================================

  // ---------- WebAudio engine -----------------------------------------------
  const Sfx = (() => {
    let ctx = null;
    let masterGain = null;
    let sfxGain = null;
    let musicGain = null;
    let initialized = false;
    function init() {
      if (initialized) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        masterGain = ctx.createGain();
        sfxGain = ctx.createGain();
        musicGain = ctx.createGain();
        sfxGain.connect(masterGain);
        musicGain.connect(masterGain);
        masterGain.connect(ctx.destination);
        applyVolumes();
        initialized = true;
      } catch {}
    }
    function applyVolumes() {
      if (!initialized) return;
      const s = state.settings?.audio || { sfx: 0.7, music: 0.4, master: 1.0, muted: false };
      const m = s.muted ? 0 : 1;
      masterGain.gain.setTargetAtTime((s.master ?? 1) * m, ctx.currentTime, 0.02);
      sfxGain.gain.setTargetAtTime(s.sfx ?? 0.7, ctx.currentTime, 0.02);
      musicGain.gain.setTargetAtTime(s.music ?? 0.4, ctx.currentTime, 0.02);
    }
    function tone({ type = "sine", freq = 440, dur = 0.15, vol = 0.4, attack = 0.005, release = 0.08, freqEnd = null, filter = null, dest = null }) {
      if (!initialized) init();
      if (!initialized || !ctx) return;
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (freqEnd != null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + attack);
      g.gain.linearRampToValueAtTime(vol * 0.6, t0 + dur - release);
      g.gain.linearRampToValueAtTime(0, t0 + dur);
      let node = osc;
      if (filter) {
        const f = ctx.createBiquadFilter();
        f.type = filter.type || "lowpass";
        f.frequency.value = filter.freq || 1000;
        f.Q.value = filter.Q || 1;
        node.connect(f); f.connect(g);
      } else {
        node.connect(g);
      }
      g.connect(dest || sfxGain);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }
    function noiseBurst({ dur = 0.2, vol = 0.4, filterFreq = 800, type = "lowpass" } = {}) {
      if (!initialized) init();
      if (!initialized || !ctx) return;
      const t0 = ctx.currentTime;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = type; f.frequency.value = filterFreq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(f); f.connect(g); g.connect(sfxGain);
      src.start(t0);
    }
    const VOICES = {
      swoosh:        () => { noiseBurst({ dur: 0.18, vol: 0.25, filterFreq: 1800, type: "bandpass" }); },
      hit:           () => { tone({ type: "square", freq: 220, freqEnd: 90, dur: 0.14, vol: 0.35 }); noiseBurst({ dur: 0.08, vol: 0.2, filterFreq: 600 }); },
      crit:          () => { tone({ type: "sawtooth", freq: 320, freqEnd: 110, dur: 0.22, vol: 0.4 }); tone({ type: "square", freq: 640, freqEnd: 220, dur: 0.18, vol: 0.25 }); },
      block:         () => { tone({ type: "triangle", freq: 880, dur: 0.12, vol: 0.3 }); tone({ type: "sine", freq: 1320, dur: 0.10, vol: 0.2 }); },
      crack:         () => { noiseBurst({ dur: 0.25, vol: 0.4, filterFreq: 2400, type: "highpass" }); },
      kiCharge:      () => { tone({ type: "sawtooth", freq: 220, freqEnd: 880, dur: 0.5, vol: 0.25 }); },
      kiFire:        () => { tone({ type: "sawtooth", freq: 660, freqEnd: 110, dur: 0.5, vol: 0.4 }); noiseBurst({ dur: 0.3, vol: 0.25, filterFreq: 1200 }); },
      kameBeam:      () => { tone({ type: "sine", freq: 110, dur: 0.55, vol: 0.35 }); tone({ type: "sawtooth", freq: 440, freqEnd: 880, dur: 0.55, vol: 0.25 }); },
      spirit:        () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone({ type: "sine", freq: f, dur: 0.5, vol: 0.3 }), i * 120)); },
      telegraphWarn: () => { tone({ type: "triangle", freq: 880, freqEnd: 440, dur: 0.4, vol: 0.35 }); },
      telegraphHit:  () => { tone({ type: "sawtooth", freq: 80,  freqEnd: 30, dur: 0.6, vol: 0.5 }); noiseBurst({ dur: 0.45, vol: 0.45, filterFreq: 400 }); },
      tierUp:        () => { [392, 523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone({ type: "triangle", freq: f, dur: 0.18, vol: 0.32 }), i * 60)); },
      ko:            () => { tone({ type: "sawtooth", freq: 440, freqEnd: 60, dur: 0.5, vol: 0.4 }); noiseBurst({ dur: 0.4, vol: 0.3, filterFreq: 800 }); },
      victory:       () => { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone({ type: "triangle", freq: f, dur: 0.22, vol: 0.35 }), i * 90)); },
      defeat:        () => { [523, 466, 392, 311, 247].forEach((f, i) => setTimeout(() => tone({ type: "triangle", freq: f, dur: 0.28, vol: 0.32 }), i * 120)); },
      tick:          () => { tone({ type: "square", freq: 1200, dur: 0.04, vol: 0.18 }); },
      select:        () => { tone({ type: "triangle", freq: 660, dur: 0.06, vol: 0.18 }); },
    };
    function play(name) {
      if (!initialized) init();
      if (!initialized) return;
      const v = VOICES[name]; if (!v) return;
      try { if (ctx.state === "suspended") ctx.resume(); v(); } catch {}
    }
    return { init, play, applyVolumes, get ctx() { return ctx; }, get musicGain() { return musicGain; } };
  })();

  // ---------- Procedural Music loop -----------------------------------------
  const Music = (() => {
    // Cinematic battle theme inspired by Kanye West's "Stronger" (sampling
    // Daft Punk's "Harder Better Faster Stronger"): a driving F#-minor loop
    // F#m – D – A – E  (i – VI – III – VII).
    // Chord-forward Rhodes voicings, but driven on every 8th by a tight
    // straight (no-swing) drum kit — kick on 1 & 3, snare on 2 & 4, busy
    // hats — sub-bass pulse, and a saw-edged lead for tension.
    let timer = null;
    let currentBpm = 92;          // mid-tempo, walking battle pace
    let isBoss = false;
    let step = 0;                 // 16th-note step within a 4-bar loop (0..63)
    let nextNoteTime = 0;
    const LOOKAHEAD_MS = 25;
    const SCHED_AHEAD = 0.15;

    // Bass roots, one octave below tonic.
    const BASS_ROOTS = [46.25, 73.42, 55.00, 82.41]; // F#1, D2, A1, E2

    // Rhodes-style chord voicings — F#-minor family with 7th/9th colors.
    // Mid-register so the chord stays the focus.
    // F#m9   : F# A C# E G#
    // Dmaj7  : D F# A C#
    // Amaj7  : A C# E G#
    // E7     : E G# B D
    const CHORDS = [
      [185.00, 220.00, 277.18, 329.63, 415.30], // F#m9
      [146.83, 185.00, 220.00, 277.18],         // Dmaj7
      [220.00, 277.18, 329.63, 415.30],         // Amaj7
      [164.81, 207.65, 246.94, 293.66],         // E7
    ];

    // Top-voice melody — F#-minor pentatonic (F# A B C# E). Driven, hooky.
    const FS5=739.99, A5=880.00, B5=987.77, CS6=1108.73, E6=1318.51, FS6=1479.98;
    const LEAD = [
      // Bar 1 (F#m9): hook on the tonic
      [null,null,null,null, FS5,null,null,null, null,null,null,null, A5,null,CS6,null],
      // Bar 2 (Dmaj7): lift
      [null,null,null,null, A5,null,null,null, CS6,null,null,null, B5,null,A5,null],
      // Bar 3 (Amaj7): peak
      [null,null,null,null, CS6,null,null,null, E6,null,null,null, CS6,null,B5,null],
      // Bar 4 (E7): drive home with a leading tone (G#=415 already in chord)
      [null,null,null,null, B5,null,A5,null, null,null,null,null, FS5,null,null,null],
    ];

    // Battle drum pattern (16 sixteenths). Straight, no swing.
    // Kick on 1 + "and of 2" + 3, snare on 2 & 4, hats on every 8th
    // with two ghosted 16ths for a driving feel.
    const KICK  = [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,0];
    const SNARE = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1]; // ghost lead-in to bar
    const HAT   = [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1]; // open-hat lift on the 'and of 4'

    // Continuous vinyl/tape noise — initialized once.
    let noiseSrc = null, noiseGain = null;

    function start() {
      Sfx.init();
      stop();
      step = 0;
      nextNoteTime = (Sfx.ctx && Sfx.ctx.currentTime) || 0;
      startVinyl();
      schedule();
    }
    function stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      stopVinyl();
    }
    function setBoss(b) { isBoss = b; }
    function setBpm(bpm) { currentBpm = Math.max(75, Math.min(140, bpm | 0)); }

    // ---- vinyl/tape hiss bed ----
    function startVinyl() {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      try {
        const dur = 2; // 2s noise loop
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const d = buf.getChannelData(0);
        // Pink-ish noise: low-passed white noise with occasional crackle.
        let last = 0;
        for (let i = 0; i < d.length; i++) {
          const w = Math.random() * 2 - 1;
          last = (last + 0.02 * w) * 0.985;
          let s = last * 4;
          if (Math.random() < 0.0008) s += (Math.random() * 2 - 1) * 0.6; // crackle
          d[i] = s;
        }
        noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = buf;
        noiseSrc.loop = true;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4500;
        const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 200;
        noiseGain = ctx.createGain();
        noiseGain.gain.value = isBoss ? 0.045 : 0.035;
        noiseSrc.connect(hp); hp.connect(lp); lp.connect(noiseGain); noiseGain.connect(Sfx.musicGain);
        noiseSrc.start();
      } catch {}
    }
    function stopVinyl() {
      try { noiseSrc && noiseSrc.stop(); } catch {}
      noiseSrc = null; noiseGain = null;
    }

    // ---- voices ----
    function tone(freq, t0, dur, vol, type, cutoff, attack = 0.012, q = 0.7) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = cutoff;
      filt.Q.value = q;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(filt); filt.connect(g); g.connect(Sfx.musicGain);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    }

    // Rhodes-style EP voice: soft sine fundamental + bell-ish triangle 2nd
    // harmonic, slow attack, long decay. This is the star of the show.
    function rhodes(freq, t0, dur, vol) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      // Fundamental (sine) — warm body.
      tone(freq, t0, dur, vol * 1.0, "sine", 2200, 0.025, 0.5);
      // Octave shimmer (triangle) — Rhodes "tine".
      tone(freq * 2, t0, dur * 0.65, vol * 0.28, "triangle", 3500, 0.008, 0.5);
      // Subtle 5th color
      tone(freq * 1.5, t0, dur * 0.5, vol * 0.10, "sine", 2800, 0.02, 0.5);
    }

    // Soft sub-bass: pure sine + a touch of triangle for definition.
    function bass(freq, t0, dur) {
      tone(freq, t0, dur, 0.16, "sine", 600, 0.02, 0.5);
      tone(freq * 2, t0, dur * 0.7, 0.04, "triangle", 700, 0.02, 0.5);
    }

    // Lead — mellow sine + a touch of saw for battle edge.
    function lead(freq, t0, dur) {
      const cutoff = isBoss ? 3200 : 2600;
      tone(freq, t0, dur, 0.07, "sine", cutoff, 0.02, 0.5);
      tone(freq * 1.005, t0, dur, 0.030, "triangle", cutoff, 0.02, 0.5);
      // Subtle saw layer adds bite without going full rock.
      tone(freq, t0, dur * 0.85, 0.022, "sawtooth", cutoff * 0.7, 0.02, 0.6);
      if (isBoss) tone(freq * 2, t0, dur * 0.7, 0.018, "triangle", 4200, 0.02, 0.5);
    }

    // Punchy battle kick — thicker thump with a bit of click.
    function kick(t0) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, t0);
      osc.frequency.exponentialRampToValueAtTime(40, t0 + 0.10);
      g.gain.setValueAtTime(0.30, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
      osc.connect(g); g.connect(Sfx.musicGain);
      osc.start(t0); osc.stop(t0 + 0.25);
    }

    // Snare — noise burst through bandpass + tonal layer.
    function snare(t0) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const dur = 0.16;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1700; bp.Q.value = 0.9;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.20, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(bp); bp.connect(g); g.connect(Sfx.musicGain);
      src.start(t0); src.stop(t0 + dur);
      // Tonal thwack
      const osc = ctx.createOscillator(); const g2 = ctx.createGain();
      osc.type = "triangle"; osc.frequency.setValueAtTime(220, t0);
      osc.frequency.exponentialRampToValueAtTime(150, t0 + 0.07);
      g2.gain.setValueAtTime(0.09, t0);
      g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.10);
      osc.connect(g2); g2.connect(Sfx.musicGain);
      osc.start(t0); osc.stop(t0 + 0.12);
    }

    // Brushed hat — short, soft noise burst, gentle high-pass.
    function hat(t0) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const dur = 0.05;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 6500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.025, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(hp); hp.connect(g); g.connect(Sfx.musicGain);
      src.start(t0); src.stop(t0 + dur);
    }

    function playStep(s, t) {
      const bar = Math.floor(s / 16) % 4;
      const inBar = s % 16;
      const sixteenth = 60 / currentBpm / 4;
      const beatDur = sixteenth * 4;

      // Drums (driving battle kit)
      if (KICK[inBar])  kick(t);
      if (SNARE[inBar]) snare(t);
      if (HAT[inBar])   hat(t);

      // Sub-bass pulse — root on every quarter note for forward motion.
      if (inBar % 4 === 0) bass(BASS_ROOTS[bar], t, beatDur * 1.0);

      // === Chord emphasis ===
      const chord = CHORDS[bar];
      const vol = isBoss ? 0.085 : 0.075;

      // Big sustained chord on the downbeat (strummed, slight roll).
      if (inBar === 0) {
        chord.forEach((f, i) => {
          rhodes(f, t + i * 0.010, beatDur * 3.7, vol);
        });
      }

      // Drive the chord on every off-beat (the "and" of each beat) — keeps
      // harmonic motion present without muddying the downbeat strum.
      if (inBar === 2 || inBar === 6 || inBar === 10 || inBar === 14) {
        chord.forEach((f, i) => {
          rhodes(f, t + i * 0.005, beatDur * 0.55, vol * 0.5);
        });
      }

      // Re-strike on beat 3 with medium sustain to anchor the bar.
      if (inBar === 8) {
        chord.forEach((f, i) => {
          rhodes(f, t + i * 0.008, beatDur * 1.8, vol * 0.75);
        });
      }

      // Top-line melody.
      const note = LEAD[bar][inBar];
      if (note) {
        let hold = 1;
        for (let i = inBar + 1; i < 16; i++) { if (LEAD[bar][i]) break; hold++; }
        lead(note, t, sixteenth * hold * 0.95);
      }
    }

    function schedule() {
      const ctx = Sfx.ctx;
      if (!ctx) { timer = setTimeout(schedule, LOOKAHEAD_MS); return; }
      const sixteenth = 60 / currentBpm / 4;
      // Straight time — no swing, drives the battle.
      while (nextNoteTime < ctx.currentTime + SCHED_AHEAD) {
        if (nextNoteTime < ctx.currentTime) nextNoteTime = ctx.currentTime + 0.02;
        playStep(step, nextNoteTime);
        nextNoteTime += sixteenth;
        step = (step + 1) % 64;
      }
      timer = setTimeout(schedule, LOOKAHEAD_MS);
    }
    return { start, stop, setBoss, setBpm };
  })();

  // ---------- Training-screen lofi loop -------------------------------------
  // Inspired by Kanye West's "Runaway": a single haunting high-E piano motif
  // over Em – Am – Em – B7. Same lofi engine as the battle Music (Rhodes
  // chords, vinyl bed, swung brushed hats, soft sub-bass), gentler tempo so
  // it sits under the study session without pulling focus.
  const TrainMusic = (() => {
    let timer = null;
    let bpm = 72;
    let step = 0;
    let nextNoteTime = 0;
    const LOOKAHEAD_MS = 25;
    const SCHED_AHEAD = 0.15;

    // Em – Am – Em – B7  (i – iv – i – V), one bar each (16 sixteenths).
    const BASS_ROOTS = [82.41, 55.00, 82.41, 61.74]; // E2, A1, E2, B1
    // Lofi 7th/9th chord voicings — Rhodes mid-register.
    // Em9   : E G B D F#
    // Am9   : A C E G B
    // Em9   : E G B D F#
    // B7    : B D# F# A
    const CHORDS = [
      [164.81, 196.00, 246.94, 293.66, 369.99], // Em9
      [220.00, 261.63, 329.63, 392.00, 493.88], // Am9
      [164.81, 196.00, 246.94, 293.66, 369.99], // Em9
      [246.94, 311.13, 369.99, 440.00],         // B7
    ];

    // The Runaway motif: a single repeated high E (E5) — sparse and ringing.
    // Pattern per bar (16 sixteenths). Two soft strikes per bar, with a
    // small ornament on bar 4 leading back to the loop.
    const E5 = 659.25, G5 = 783.99, B5 = 987.77, D6 = 1174.66;
    const MOTIF = [
      [E5,null,null,null, null,null,null,null, E5,null,null,null, null,null,null,null],
      [E5,null,null,null, null,null,null,null, E5,null,null,null, null,null,null,null],
      [E5,null,null,null, null,null,null,null, E5,null,null,null, null,null,null,null],
      [E5,null,null,null, null,null,null,null, E5,null,null,null, G5,null,B5,D6 ],
    ];

    // Drums: even sparser than battle. Kick on 1 and "and of 2" only,
    // rim on beat 3, soft swung brushed hats every 8th.
    const KICK = [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0];
    const RIM  = [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0];
    const HAT  = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0];

    let noiseSrc = null, noiseGain = null;

    function start() {
      Sfx.init();
      stop();
      step = 0;
      nextNoteTime = (Sfx.ctx && Sfx.ctx.currentTime) || 0;
      startVinyl();
      schedule();
    }
    function stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      stopVinyl();
    }

    function startVinyl() {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      try {
        const dur = 2;
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const d = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < d.length; i++) {
          const w = Math.random() * 2 - 1;
          last = (last + 0.02 * w) * 0.985;
          let s = last * 4;
          if (Math.random() < 0.0007) s += (Math.random() * 2 - 1) * 0.55;
          d[i] = s;
        }
        noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = buf;
        noiseSrc.loop = true;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4200;
        const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 200;
        noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.030;
        noiseSrc.connect(hp); hp.connect(lp); lp.connect(noiseGain); noiseGain.connect(Sfx.musicGain);
        noiseSrc.start();
      } catch {}
    }
    function stopVinyl() {
      try { noiseSrc && noiseSrc.stop(); } catch {}
      noiseSrc = null; noiseGain = null;
    }

    function tone(freq, t0, dur, vol, type, cutoff, attack = 0.012) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = cutoff;
      filt.Q.value = 0.5;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(filt); filt.connect(g); g.connect(Sfx.musicGain);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    }
    function rhodes(freq, t0, dur, vol) {
      tone(freq, t0, dur, vol * 1.0, "sine", 2000, 0.025);
      tone(freq * 2, t0, dur * 0.6, vol * 0.25, "triangle", 3200, 0.008);
      tone(freq * 1.5, t0, dur * 0.45, vol * 0.08, "sine", 2500, 0.02);
    }
    // Piano-ish bell for the Runaway motif: bright triangle + soft sine
    // with a slow release so each strike rings out.
    function piano(freq, t0, dur, vol) {
      tone(freq, t0, dur, vol * 0.85, "triangle", 4000, 0.005);
      tone(freq * 2, t0, dur * 0.4, vol * 0.18, "sine", 5000, 0.005);
      tone(freq * 0.5, t0, dur * 0.7, vol * 0.10, "sine", 1800, 0.01);
    }
    function bass(freq, t0, dur) {
      tone(freq, t0, dur, 0.14, "sine", 600, 0.02);
      tone(freq * 2, t0, dur * 0.6, 0.03, "triangle", 700, 0.02);
    }
    function kick(t0) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(115, t0);
      osc.frequency.exponentialRampToValueAtTime(38, t0 + 0.14);
      g.gain.setValueAtTime(0.18, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
      osc.connect(g); g.connect(Sfx.musicGain);
      osc.start(t0); osc.stop(t0 + 0.32);
    }
    function rim(t0) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const dur = 0.05;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2100; bp.Q.value = 4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.085, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(bp); bp.connect(g); g.connect(Sfx.musicGain);
      src.start(t0); src.stop(t0 + dur);
    }
    function hat(t0) {
      const ctx = Sfx.ctx;
      if (!ctx || !Sfx.musicGain) return;
      const dur = 0.04;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 6500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.022, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(hp); hp.connect(g); g.connect(Sfx.musicGain);
      src.start(t0); src.stop(t0 + dur);
    }

    function playStep(s, t) {
      const bar = Math.floor(s / 16) % 4;
      const inBar = s % 16;
      const sixteenth = 60 / bpm / 4;
      const beatDur = sixteenth * 4;

      if (KICK[inBar]) kick(t);
      if (RIM[inBar])  rim(t);
      if (HAT[inBar])  hat(t);

      // Bass on the downbeat only — minimal, lets the chord & motif breathe.
      if (inBar === 0) bass(BASS_ROOTS[bar], t, beatDur * 3.2);

      // Chord on downbeat (long sustain), gentle restrike on beat 3.
      const chord = CHORDS[bar];
      if (inBar === 0) {
        chord.forEach((f, i) => rhodes(f, t + i * 0.014, beatDur * 3.7, 0.065));
      }
      if (inBar === 8) {
        chord.forEach((f, i) => rhodes(f, t + i * 0.011, beatDur * 1.6, 0.045));
      }

      // The "Runaway" piano motif on top.
      const note = MOTIF[bar][inBar];
      if (note) {
        let hold = 1;
        for (let i = inBar + 1; i < 16; i++) { if (MOTIF[bar][i]) break; hold++; }
        // The high E sustains long; ornament notes are short.
        const len = sixteenth * Math.min(hold, 8) * 0.95;
        piano(note, t, len, 0.10);
      }
    }

    function schedule() {
      const ctx = Sfx.ctx;
      if (!ctx) { timer = setTimeout(schedule, LOOKAHEAD_MS); return; }
      const sixteenth = 60 / bpm / 4;
      while (nextNoteTime < ctx.currentTime + SCHED_AHEAD) {
        if (nextNoteTime < ctx.currentTime) nextNoteTime = ctx.currentTime + 0.02;
        const swung = (step % 2 === 1) ? nextNoteTime + sixteenth * 0.20 : nextNoteTime;
        playStep(step, swung);
        nextNoteTime += sixteenth;
        step = (step + 1) % 64;
      }
      timer = setTimeout(schedule, LOOKAHEAD_MS);
    }
    return { start, stop };
  })();
  function tierUpFx(tier) {
    if (!tier) return;
    const name = BATTLE.TIER_NAMES[tier] || "POWER UP";
    Sfx.play("tierUp");
    let el = $("#tierSplash");
    if (!el) {
      el = document.createElement("div");
      el.id = "tierSplash";
      el.className = "tier-splash";
      el.innerHTML = `<div class="ts-flash"></div><div class="ts-text"></div>`;
      document.body.appendChild(el);
    }
    el.setAttribute("data-tier", String(tier));
    el.querySelector(".ts-text").textContent = name + "!";
    el.classList.remove("show");
    void el.offsetWidth;
    el.classList.add("show");
    document.body.classList.add("tier-slowmo");
    clearTimeout(tierUpFx._t);
    tierUpFx._t = setTimeout(() => {
      el.classList.remove("show");
      document.body.classList.remove("tier-slowmo");
    }, 1200);
    if (battle && !battle.tierEverHit[tier]) battle.tierEverHit[tier] = true;
  }

  // ---------- Arena shake / boom vignette -----------------------------------
  function shakeArena() {
    const arena = document.querySelector("#screen-battle .arena");
    if (!arena) return;
    arena.classList.remove("arena-shake");
    void arena.offsetWidth;
    arena.classList.add("arena-shake");
    setTimeout(() => arena.classList.remove("arena-shake"), 600);
  }
  function flashAnswerBoom() {
    const f = $("#answerFlash");
    if (!f) return;
    f.classList.remove("boom"); void f.offsetWidth;
    f.classList.add("boom");
    setTimeout(() => f.classList.remove("boom"), 600);
  }

  // ---------- KO puff -------------------------------------------------------
  function playKoPuff() {
    const sprite = $("#enemySprite");
    if (!sprite) return;
    const emoji = $("#enemyEmoji");
    if (emoji && !emoji.hidden) {
      emoji.classList.remove("ko-spin"); void emoji.offsetWidth;
      emoji.classList.add("ko-spin");
      setTimeout(() => emoji.classList.remove("ko-spin"), 600);
    }
    for (let i = 0; i < 6; i++) {
      const p = document.createElement("span");
      p.className = "ko-puff";
      const ang = (i / 6) * Math.PI * 2;
      const dist = 60 + Math.random() * 40;
      p.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      p.style.setProperty("--dy", Math.sin(ang) * dist + "px");
      sprite.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }
  }

  // ---------- Telegraph banner ----------------------------------------------
  function renderTelegraphBanner() {
    const banner = $("#telegraphBanner");
    if (!banner) return;
    if (battle.telegraphTurns > 0 && battle.telegraphLabel) {
      banner.hidden = false;
      $("#tbMove").textContent = battle.telegraphLabel;
      const max = battle.telegraphMaxTurns || BATTLE.TELEGRAPH_TURNS;
      const pct = (battle.telegraphTurns / max) * 100;
      $("#tbBarFill").style.width = pct + "%";
      banner.classList.toggle("final", battle.telegraphTurns === 1);
    } else {
      banner.hidden = true;
      banner.classList.remove("final");
    }
  }

  // ---------- KI Special FAB ------------------------------------------------
  function renderKiFab() {
    const fab = $("#kiFab");
    if (!fab) return;
    const ready = battle && battle.ki >= BATTLE.KI_SPECIAL_COST;
    fab.classList.toggle("ready", !!ready);
    fab.disabled = !ready;
  }
  function fireKiSpecial() {
    if (!battle || battle.ki < BATTLE.KI_SPECIAL_COST) return;
    if (battle.busy) return;
    const fab = $("#kiFab");
    if (fab) { fab.classList.add("firing"); setTimeout(() => fab.classList.remove("firing"), 500); }
    Sfx.play("kiCharge");
    setTimeout(() => Sfx.play("kiFire"), 200);
    playFx("ki-cannon");
    shakeArena();
    const dmg = Math.round(BATTLE.KI_SPECIAL_DMG_BASE + state.level * BATTLE.KI_SPECIAL_DMG_PER_LVL);
    battle.enemy.hp = Math.max(0, battle.enemy.hp - dmg);
    popDamage(".combatant.enemy", dmg, "crit");
    flashSprite("#enemySprite", { crit: true });
    flashHp("#enemyHpFill");
    shakeEl("#enemySprite");
    // Cancel any charging telegraph
    if (battle.telegraphTurns > 0) {
      battle.telegraphTurns = 0;
      battle.telegraphLabel = "";
      battle.telegraphMaxTurns = 0;
      toast(pickRandom(["⚡ Telegraph CANCELLED!", "💥 Telegraph SHATTERED!"]), 1400);
    }
    battle.ki = 0;
    state.battleStats.kiSpecialsUsed = (state.battleStats.kiSpecialsUsed || 0) + 1;
    saveState();
    buzz([15, 30, 60]);
    renderBattle();
    // If KO'd, advance like a normal kill (without re-firing answer logic)
    if (battle.enemy.hp <= 0) {
      battle.lastResult = "correct";
      advanceBattle();
    }
  }

  // ---------- Stage HUD -----------------------------------------------------
  function showStageHud() {
    const hud = $("#stageHud");
    if (hud) hud.style.display = "flex";
  }
  function renderStageHud() {
    const hud = $("#stageHud");
    if (!hud || !battle) return;
    const dotsWrap = $("#stageDots");
    const label = $("#stageLabel");
    const total = Number.isFinite(battle.diff?.fights) ? battle.diff.fights : 12;
    const isEndless = !!battle.diff?.endless;
    if (label) label.textContent = isEndless ? `Stage ${battle.enemyIdx + 1} · Endless` : `Stage ${battle.enemyIdx + 1} / ${total}`;
    if (dotsWrap) {
      dotsWrap.innerHTML = "";
      const count = isEndless ? Math.max(10, battle.enemyIdx + 5) : total;
      for (let i = 0; i < count; i++) {
        const d = document.createElement("span");
        d.className = "stage-dot";
        if (i > 0 && i % 5 === 0) d.classList.add("boss");
        if (i < battle.enemyIdx) d.classList.add("lit");
        if (i === battle.enemyIdx) d.classList.add("current");
        dotsWrap.appendChild(d);
      }
    }
  }

  // ---------- Pre-battle intro card -----------------------------------------
  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function flavorFor(enemy, idx) {
    const all = [enemy.flavor, ...(enemy.flavorAlts || [])].filter(Boolean);
    if (all.length) return pickRandom(all);
    return enemy.isBoss ? "A serious threat. Stay focused." : "Another challenger appears.";
  }
  function showIntroCard(enemy, idx, onDone) {
    const card = $("#introCard");
    if (!card) { onDone && onDone(); return; }
    Music.setBoss(!!enemy.isBoss);
    $("#introTag").textContent = enemy.isBoss ? `BOSS · STAGE ${idx + 1}` : `STAGE ${idx + 1}`;
    const ie = $("#introEmoji");
    if (enemy.isBoss) { ie.textContent = "👑"; }
    else { ie.textContent = enemy.emoji || "👾"; }
    $("#introName").textContent = enemy.name;
    $("#introFlavor").textContent = flavorFor(enemy, idx);
    const introQuote = $("#introQuote");
    if (introQuote) {
      if (enemy.quote) { introQuote.textContent = `“${enemy.quote}”`; introQuote.hidden = false; }
      else { introQuote.textContent = ""; introQuote.hidden = true; }
    }
    $("#introHp").textContent = `HP ${enemy.maxHp}`;
    $("#introTier").textContent = (enemy.tier || "minion").toUpperCase();
    card.classList.toggle("boss", !!enemy.isBoss);
    card.hidden = false;
    if (enemy.isBoss) Sfx.play("telegraphWarn");
    const dur = enemy.isBoss ? 1400 : 700;
    const dismiss = () => {
      card.hidden = true;
      card.removeEventListener("click", dismiss);
      // Trigger enemy-enter animation
      const em = $("#enemyEmoji");
      if (em && !em.hidden) { em.classList.remove("enter"); void em.offsetWidth; em.classList.add("enter"); }
      onDone && onDone();
    };
    card.addEventListener("click", dismiss);
    setTimeout(dismiss, dur);
  }

  // ---------- Pause / Resume / Retreat -------------------------------------
  function pauseBattle() {
    if (!battle || battle.pausedAt) return;
    battle.pausedAt = performance.now();
    $("#pauseOverlay").hidden = false;
  }
  function resumeBattle() {
    if (!battle || !battle.pausedAt) { $("#pauseOverlay").hidden = true; return; }
    const delta = performance.now() - battle.pausedAt;
    // Shift questionStart so timer math sees no missed time
    battle.questionStart += delta;
    battle.pausedAt = 0;
    $("#pauseOverlay").hidden = true;
  }
  function tryRetreat() {
    if (!battle) { showScreen("start"); return; }
    if (state.settings?.confirmRetreat && battle.enemyIdx > 0) {
      // Freeze timer without showing the pause overlay (we're showing the
      // retreat confirm overlay instead). Resume on cancel will unfreeze.
      if (!battle.pausedAt) battle.pausedAt = performance.now();
      $("#confirmRetreat").hidden = false;
    } else {
      showScreen("start");
    }
  }

  // ---------- Onboarding coach marks ----------------------------------------
  const COACH_STEPS = [
    { title: "Welcome, warrior!", body: "Tap the right answer to attack. Wrong answers (or the timer running out) hit you back." },
    { title: "Streak = Power", body: "Keep correct answers chained. At streak 5/10/25 you transform — Kaioken, Super Saiyan, SS Blue." },
    { title: "Watch telegraphs", body: "When you see a red banner, the enemy is charging. It lands in 2 turns. Block with a Streak Shield, or…" },
    { title: "Use your KI Special", body: "When the ⚡ button is gold, tap it to cancel a charging telegraph and deal big damage." },
  ];
  let coachIdx = 0;
  function maybeStartOnboarding() {
    if (!state.settings?.battleHints) return;
    coachIdx = 0;
    showCoachStep();
  }
  function showCoachStep() {
    const overlay = $("#coachOverlay");
    if (!overlay) return;
    if (coachIdx >= COACH_STEPS.length) { closeCoach(); return; }
    overlay.hidden = false;
    pauseBattle();
    const s = COACH_STEPS[coachIdx];
    $("#coachTitle").textContent = s.title;
    $("#coachBody").textContent = s.body;
  }
  function closeCoach() {
    const overlay = $("#coachOverlay");
    if (overlay) overlay.hidden = true;
    resumeBattle();
  }

  // ---------- Pre-battle difficulty selector -------------------------------
  function openPrebattle() {
    const overlay = $("#prebattleOverlay");
    if (!overlay) { startBattle(); return; }
    overlay.hidden = false;
    const cur = state.settings?.difficulty || "normal";
    $$("#diffSegment .diff-opt").forEach(b => b.classList.toggle("active", b.dataset.diff === cur));
    $("#diffDesc").textContent = (DIFFICULTY[cur] || DIFFICULTY.normal).desc;
  }
  function closePrebattleAndStart() {
    $("#prebattleOverlay").hidden = true;
    startBattle();
  }

  // ---------- Run end / Results screen --------------------------------------
  function finishRun(outcome) {
    if (!battle || battle.ended) return;
    battle.ended = true;
    cancelAnimationFrame(battle.timerRaf);
    if (outcome === "victory") {
      Sfx.play("victory");
      playFx("victory");
    } else {
      Sfx.play("defeat");
      playFx("defeat");
      state.battleStats.losses = (state.battleStats.losses || 0) + 1;
    }
    Music.stop();
    saveState();
    // Stash a snapshot for the results screen
    battle._summary = {
      outcome,
      stage: battle.enemyIdx + (outcome === "victory" ? 0 : 1),
      totalFights: battle.diff?.fights ?? 0,
      isEndless: !!battle.diff?.endless,
      streakBest: battle.streak,
      kos: battle.kosThisRun || 0,
      questions: battle.questionsThisRun || 0,
      correct: battle.correctThisRun || 0,
      ki: state.battleStats.kiSpecialsUsed,
      perfect: !!battle.perfectRun && outcome === "victory",
      runMs: performance.now() - battle.runStartedAt,
      diffLabel: battle.diff?.label || "",
    };
    setTimeout(() => showScreen("battle-results"), outcome === "victory" ? 1500 : 1300);
  }
  let _lastRunSummary = null;
  function renderResultsScreen() {
    if (battle && battle._summary) _lastRunSummary = battle._summary;
    const s = _lastRunSummary;
    const banner = $("#resultsBanner");
    const stage = $("#resultsStage");
    const stats = $("#resultsStats");
    const pbs = $("#resultsPbs");
    if (!s) {
      if (banner) banner.textContent = "—";
      if (stage) stage.textContent = "No recent run.";
      if (stats) stats.innerHTML = "";
      if (pbs) pbs.innerHTML = "";
      return;
    }
    banner.classList.remove("defeat", "endless");
    if (s.outcome === "victory") {
      banner.textContent = s.isEndless ? "ENDLESS RUN" : "VICTORY";
      if (s.isEndless) banner.classList.add("endless");
    } else {
      banner.textContent = "DEFEATED";
      banner.classList.add("defeat");
    }
    stage.textContent = s.isEndless
      ? `Reached stage ${s.stage} on ${s.diffLabel}`
      : (s.outcome === "victory" ? `${s.diffLabel} arena cleared` : `Fell at stage ${s.stage} of ${s.totalFights} (${s.diffLabel})`);
    const acc = s.questions > 0 ? Math.round((s.correct / s.questions) * 100) : 0;
    const fmtMs = (ms) => ms < 60000 ? (ms/1000).toFixed(1) + "s" : Math.floor(ms/60000) + "m " + Math.round((ms%60000)/1000) + "s";
    stats.innerHTML = [
      ["Stage", s.stage],
      ["KOs", s.kos],
      ["Accuracy", acc + "%"],
      ["Best Streak", s.streakBest],
      ["KI Specials", s.ki],
      ["Run Time", fmtMs(s.runMs)],
    ].map(([k, v]) => `<div class="results-stat"><div class="label">${k}</div><div class="value">${v}</div></div>`).join("");
    // PB callouts
    const callouts = [];
    if (s.perfect) callouts.push("✨ Perfect Run!");
    if (s.streakBest > 0 && s.streakBest === state.battleStats.bestStreak) callouts.push(`🏆 New best streak: ${s.streakBest}`);
    if (s.isEndless && s.stage >= state.battleStats.bestEnemyIdx) callouts.push(`🏆 New best endless stage: ${s.stage}`);
    pbs.innerHTML = callouts.map(c => `<div class="results-pb">${c}</div>`).join("");
    // Auto-disable hints after first victory
    if (s.outcome === "victory" && state.settings?.battleHints) {
      state.settings.battleHints = false;
      saveState();
    }
  }

  // ---------- Battle Records (settings panel) -------------------------------
  function renderBattleRecords() {
    const ul = $("#recordsList");
    if (!ul) return;
    const s = state.battleStats || {};
    const fmtMs = (ms) => !ms ? "—" : (ms < 60000 ? (ms/1000).toFixed(1) + "s" : Math.floor(ms/60000) + "m " + Math.round((ms%60000)/1000) + "s");
    const acc = (s.totalQuestions || 0) > 0 ? Math.round(((s.totalCorrect || 0) / s.totalQuestions) * 100) : 0;
    const rows = [
      ["Wins", s.wins || 0],
      ["Losses", s.losses || 0],
      ["Runs started", s.runs || 0],
      ["Best streak", s.bestStreak || 0],
      ["Perfect runs", s.perfectRuns || 0],
      ["Fastest KO", fmtMs(s.fastestKoMs)],
      ["Best endless stage", s.bestEnemyIdx || 0],
      ["KI specials used", s.kiSpecialsUsed || 0],
      ["Lifetime accuracy", acc + "%"],
    ];
    ul.innerHTML = rows.map(([k, v]) => `<li><span class="label">${k}</span><span class="value">${v}</span></li>`).join("");
  }

  // ---------- Random Training Interrupts -------------------------------------
  // Multiple-choice helper; supports "confuse" mode (similar-prefix distractors).
  function buildChoices(card, opts = {}) {
    const { mode = "normal", reverse = false } = opts;
    const others = DECK.filter(c => c.id !== card.id);
    let pool;
    if (mode === "confuse") {
      const prefix = (card.punjabi || "").slice(0, 2).toLowerCase();
      const sim = others.filter(c => (c.punjabi || "").toLowerCase().startsWith(prefix));
      pool = sim.length >= 3 ? sim : others.filter(c => c.type === card.type);
      if (pool.length < 3) pool = others;
    } else {
      const sameType = others.filter(c => c.type === card.type);
      pool = sameType.length >= 3 ? sameType : others;
    }
    const distract = shuffle(pool).slice(0, 3);
    const allCards = shuffle([card, ...distract]);
    const choices = allCards.map(c => reverse ? c.punjabi : c.english);
    const correctIdx = allCards.indexOf(card);
    return {
      choices,
      cards: allCards,           // parallel array of card objects per slot
      correctIdx,
      correctText: reverse ? card.punjabi : card.english,
      reverse,
    };
  }

  function pickWeightedKind() {
    const w = INTERRUPT.WEIGHTS;
    const total = w.speed + w.recall + w.incoming;
    let r = Math.random() * total;
    if ((r -= w.speed)    < 0) return "speed";
    if ((r -= w.recall)   < 0) return "recall";
    return "incoming";
  }

  function maybeInterrupt() {
    if (!state.settings?.interrupts) return false;
    if (train.eventActive) return false;

    // 1) Forced: same word missed twice -> Incoming Attack with that word.
    if (train.repeatMissId) {
      return startInterruptEvent("incoming", { forcedCardId: train.repeatMissId });
    }

    // 2) Forced: very stale cards exist -> Recall Attack (with 3-card cooldown).
    if (hasStaleCards() && train.cardsSinceInterrupt >= 3) {
      if (Math.random() < 0.7) return startInterruptEvent("recall");
    }

    // 3) Probabilistic: respect cooldown window.
    if (train.cardsSinceInterrupt < INTERRUPT.MIN_CARDS_BETWEEN) return false;
    const window = INTERRUPT.MAX_CARDS_BETWEEN - INTERRUPT.MIN_CARDS_BETWEEN;
    const ramp = Math.min(1, (train.cardsSinceInterrupt - INTERRUPT.MIN_CARDS_BETWEEN) / Math.max(1, window));
    const chance = INTERRUPT.BASE_CHANCE * (0.5 + 0.5 * ramp);
    if (Math.random() > chance && train.cardsSinceInterrupt < INTERRUPT.MAX_CARDS_BETWEEN) return false;

    return startInterruptEvent(pickWeightedKind());
  }

  function hasStaleCards() {
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    if (!state.review) return false;
    return DECK.some(c => {
      const r = state.review[c.id];
      const seen = state.srs[c.id]?.seen || 0;
      return seen > 0 && r && r.lastSeenAt > 0 && (now - r.lastSeenAt) > week;
    });
  }

  function pickRecallTarget() {
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    const day  = 24 * 60 * 60 * 1000;
    const fiveMin = 5 * 60 * 1000;
    const seenIds = DECK.filter(c => (state.srs[c.id]?.seen || 0) > 0);
    const tiers = [
      seenIds.filter(c => now - (state.review?.[c.id]?.lastSeenAt || 0) > week),
      seenIds.filter(c => now - (state.review?.[c.id]?.lastSeenAt || 0) > day),
      seenIds.filter(c => now - (state.review?.[c.id]?.lastSeenAt || 0) > fiveMin),
    ];
    for (const t of tiers) if (t.length) return t[Math.floor(Math.random() * t.length)];
    if (train.recentIds.length) {
      const id = train.recentIds[Math.floor(Math.random() * train.recentIds.length)];
      const card = DECK.find(c => c.id === id);
      if (card) return card;
    }
    return train.current || DECK[Math.floor(Math.random() * DECK.length)];
  }

  function pickIncomingTarget(forcedCardId) {
    if (forcedCardId) {
      const c = DECK.find(c => c.id === forcedCardId);
      if (c) return c;
    }
    // Highest miss count among seen cards
    const seen = DECK.filter(c => (state.srs[c.id]?.seen || 0) > 0);
    seen.sort((a, b) => (state.review?.[b.id]?.missCount || 0) - (state.review?.[a.id]?.missCount || 0));
    if (seen.length && (state.review?.[seen[0].id]?.missCount || 0) > 0) return seen[0];
    return train.current || DECK[Math.floor(Math.random() * DECK.length)];
  }

  // Active event runtime
  let trainEvent = null;

  function startInterruptEvent(kind, opts = {}) {
    if (train.eventActive) return false;
    train.eventActive = true;
    train.cardsSinceInterrupt = 0;
    clearTimeout(train.idleTimer);

    const panel = $("#trainEvent");
    if (!panel) { train.eventActive = false; return false; }
    panel.dataset.kind = kind;
    panel.hidden = false;
    $("#flashcard").hidden = true;
    $("#srsRow").hidden = true;

    trainEvent = {
      kind,
      score: 0,
      combo: 0,
      maxCombo: 0,
      durationMs: 0,
      startedAt: 0,
      busy: false,
      currentCard: null,
      currentCorrectIdx: -1,
      mode: "normal",
      reverse: false,
    };

    if (kind === "speed")    setupSpeedBurst();
    if (kind === "recall")   setupRecallAttack();
    if (kind === "incoming") setupIncomingAttack(opts.forcedCardId);
    return true;
  }

  function setupSpeedBurst() {
    const en2pa = isReverse();
    $("#eventIcon").textContent = "⚡";
    $("#eventTitle").textContent = "ENERGY SURGE DETECTED!";
    $("#eventPromptLabel").textContent = en2pa
      ? "Translate to Punjabi:"
      : "Translate to English:";
    trainEvent.durationMs = INTERRUPT.SPEED_DURATION_MS;
    trainEvent.mode = "normal";
    trainEvent.reverse = en2pa;
    trainEvent.askedIds = new Set();
    playFx("gold-burst");
    shakeEl("#trainEvent");
    nextEventQuestion();
    startEventTimer();
  }

  function setupRecallAttack() {
    const en2pa = isReverse();
    $("#eventIcon").textContent = "🧠";
    $("#eventTitle").textContent = "MEMORY CLONE HAS RETURNED!";
    $("#eventPromptLabel").textContent = en2pa
      ? "What's this in Punjabi?"
      : "What did this mean?";
    trainEvent.durationMs = INTERRUPT.RECALL_DURATION_MS;
    trainEvent.mode = "normal";
    trainEvent.reverse = en2pa;
    trainEvent.fixedCard = pickRecallTarget();
    playFx("memory-clone");
    nextEventQuestion();
    startEventTimer();
  }

  function setupIncomingAttack(forcedCardId) {
    // Frieza Mind Trap stays the HARDER direction relative to user's mode:
    //  - en2pa user => still ask in English with Punjabi answers (already harder)
    //  - pa2en user => flip to ask in Punjabi with English answers
    const en2pa = isReverse();
    $("#eventIcon").textContent = "☠️";
    $("#eventTitle").textContent = "INCOMING ATTACK — FRIEZA MIND TRAP!";
    $("#eventPromptLabel").textContent = en2pa
      ? "Which Punjabi word means:"
      : "What does this Punjabi word mean?";
    trainEvent.durationMs = INTERRUPT.INCOMING_DURATION_MS;
    trainEvent.mode = "confuse";
    trainEvent.reverse = en2pa; // en2pa: Punjabi answer (hard); pa2en: English answer
    trainEvent.fixedCard = pickIncomingTarget(forcedCardId);
    train.repeatMissId = null;
    playFx("frieza-trap");
    nextEventQuestion();
    startEventTimer();
  }

  function nextEventQuestion() {
    let card;
    if (trainEvent.kind === "speed") {
      // Avoid asking the same card twice within a single burst.
      const asked = trainEvent.askedIds || new Set();
      const fresh = DECK.filter(c => !asked.has(c.id));
      const pool = fresh.length ? fresh : DECK;
      if (!fresh.length) asked.clear();
      card = pool[Math.floor(Math.random() * pool.length)];
      asked.add(card.id);
      trainEvent.askedIds = asked;
    } else {
      card = trainEvent.fixedCard;
    }
    const built = buildChoices(card, { mode: trainEvent.mode, reverse: trainEvent.reverse });
    trainEvent.currentCard = card;
    trainEvent.currentCorrectIdx = built.correctIdx;
    trainEvent.currentChoiceCards = built.cards;
    const promptEl = $("#eventPrompt");
    if (trainEvent.reverse) {
      // English prompt
      promptEl.textContent = card.english;
    } else {
      // Punjabi prompt — Gurmukhi over roman
      renderPunjabi(promptEl, card);
    }
    const btns = $$("#eventChoices .choice");
    btns.forEach((b, i) => {
      const cardI = built.cards[i];
      if (trainEvent.reverse && cardI) {
        b.innerHTML = punjabiHtml(cardI);
      } else {
        b.textContent = built.choices[i] || "";
      }
      b.classList.remove("correct", "wrong");
      b.disabled = false;
    });
    $("#eventCombo").textContent = String(trainEvent.combo);
    $("#eventScore").textContent = String(trainEvent.score);
    trainEvent.busy = false;
    // Focus first choice for keyboard / a11y
    if (btns[0]) {
      try { btns[0].focus({ preventScroll: true }); } catch {}
    }
  }

  function startEventTimer() {
    trainEvent.startedAt = performance.now();
    cancelAnimationFrame(startEventTimer._raf);
    const tick = (t) => {
      if (!trainEvent) return;
      const elapsed = t - trainEvent.startedAt;
      const left = Math.max(0, trainEvent.durationMs - elapsed);
      const pct = (left / trainEvent.durationMs) * 100;
      const fill = $("#eventTimerFill");
      if (fill) fill.style.width = pct + "%";
      if (left <= 0) {
        finishTrainEvent("timeout");
        return;
      }
      startEventTimer._raf = requestAnimationFrame(tick);
    };
    startEventTimer._raf = requestAnimationFrame(tick);
  }

  function onEventChoice(i) {
    if (!trainEvent || trainEvent.busy) return;
    trainEvent.busy = true;
    const correct = (i === trainEvent.currentCorrectIdx);
    const btns = $$("#eventChoices .choice");
    btns.forEach(b => b.disabled = true);
    btns[i].classList.add(correct ? "correct" : "wrong");
    if (!correct) btns[trainEvent.currentCorrectIdx].classList.add("correct");

    const card = trainEvent.currentCard;
    if (correct) {
      trainEvent.combo += 1;
      trainEvent.maxCombo = Math.max(trainEvent.maxCombo, trainEvent.combo);
      trainEvent.score += 1;
      logReview(card.id, true);
      shakeEl("#trainEvent");
    } else {
      trainEvent.combo = 0;
      // Speed Burst is high-pressure; don't over-penalize the SRS miss counters.
      logReview(card.id, false, { light: trainEvent.kind === "speed" });
    }

    if (trainEvent.kind === "speed") {
      // Rapid loop: continue until timer expires
      setTimeout(() => {
        if (!trainEvent) return;
        nextEventQuestion();
      }, 220);
    } else {
      // Single-question events
      setTimeout(() => finishTrainEvent(correct ? "correct" : "wrong"), 700);
    }
  }

  function finishTrainEvent(reason) {
    if (!trainEvent) return;
    cancelAnimationFrame(startEventTimer._raf);
    const ev = trainEvent;
    let summary = "";

    if (ev.kind === "speed") {
      const xp = ev.score * 3 + ev.maxCombo * 5;
      gainXp(xp);
      state.kiCharge = clamp((state.kiCharge || 0) + Math.min(20, ev.score * 2), 0, 999);
      state.badges.speed = (state.badges.speed || 0) + 1;
      summary = `⚡ Speed Burst: ${ev.score} correct, x${ev.maxCombo} combo → +${xp} XP`;
    } else if (ev.kind === "recall") {
      if (reason === "correct") {
        gainXp(15);
        const srs = state.srs[ev.currentCard.id];
        if (srs) srs.mastery = clamp(srs.mastery + 5, 0, 100);
        state.badges.recall = (state.badges.recall || 0) + 1;
        summary = "🧠 Recall Attack defeated! +15 XP & mastery boost";
      } else {
        const srs = state.srs[ev.currentCard.id];
        if (srs) {
          srs.interval = Math.max(0, Math.round((srs.interval || 1) * 0.5));
          srs.due = Date.now() + 60_000;
        }
        summary = "🧠 Memory faded… we'll review it sooner.";
      }
    } else if (ev.kind === "incoming") {
      if (reason === "correct") {
        gainXp(12);
        state.streakShield = clamp((state.streakShield || 0) + 1, 0, INTERRUPT.SHIELD_CAP);
        state.badges.incoming = (state.badges.incoming || 0) + 1;
        summary = `☠️ Trap survived! +1 🛡️ Streak Shield (${state.streakShield}/${INTERRUPT.SHIELD_CAP})`;
      } else {
        train.repeatMissId = ev.currentCard.id;
        summary = "☠️ Trap caught you! That word will return.";
      }
    }

    saveState();
    if (summary) toast(summary, 2200);
    closeTrainEvent(false);
    train.eventActive = false;
    train.forceIdleSpeed = false;
    // Resume normal flow
    train.current = pickNextCard();
    train.revealed = false;
    renderCard();
    updateTrainStats();
    updateTrainHud();
    armIdleTimer();
  }

  function closeTrainEvent(silent) {
    cancelAnimationFrame(startEventTimer._raf);
    const panel = $("#trainEvent");
    if (panel) {
      panel.hidden = true;
      panel.removeAttribute("data-kind");
    }
    const fc = $("#flashcard"); if (fc) fc.hidden = false;
    if (!silent) {/* no-op */}
    trainEvent = null;
  }

  // ---------- Wire up DOM -----------------------------------------------------
  function wire() {
    // Ripple coordinates for .big-btn (radial highlight follows the press point)
    document.body.addEventListener("pointerdown", (e) => {
      const btn = e.target.closest(".big-btn");
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      btn.style.setProperty("--my", ((e.clientY - r.top)  / r.height) * 100 + "%");
    }, { passive: true });

    document.body.addEventListener("click", (e) => {
      const t = e.target.closest("[data-action]");
      if (!t) return;
      switch (t.dataset.action) {
        case "goto-train":    showScreen("train"); break;
        case "goto-battle":   showScreen("battle"); break;
        case "goto-settings": showScreen("settings"); break;
        case "goto-start":    showScreen("start"); break;
      }
    });

    $("#hudHomeBtn").addEventListener("click", () => showScreen("start"));

    $("#revealBtn").addEventListener("click", () => {
      train.revealed = true;
      train.revealedAt = Date.now();
      renderCard();
      armIdleTimer();
    });

    $("#srsRow").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-grade]");
      if (!btn) return;
      gradeCard(btn.dataset.grade);
    });

    // Allow space/enter to reveal on flashcard
    $("#flashcard").addEventListener("keydown", (e) => {
      if ((e.key === " " || e.key === "Enter") && !train.revealed) {
        e.preventDefault();
        train.revealed = true;
        train.revealedAt = Date.now();
        renderCard();
        armIdleTimer();
      }
    });

    $("#choices").addEventListener("click", (e) => {
      const b = e.target.closest(".choice");
      if (!b) return;
      onChoice(Number(b.dataset.i));
    });

    // Train event panel: choice clicks + forfeit
    $("#eventChoices").addEventListener("click", (e) => {
      const b = e.target.closest(".choice");
      if (!b) return;
      onEventChoice(Number(b.dataset.i));
    });
    $("#eventForfeit").addEventListener("click", () => {
      if (trainEvent) finishTrainEvent("forfeit");
    });
    document.addEventListener("keydown", (e) => {
      if (!trainEvent) return;
      if (e.key === "Escape") { finishTrainEvent("forfeit"); return; }
      // Numeric 1-4 to pick a choice during any train event.
      if (e.key >= "1" && e.key <= "4") {
        const idx = Number(e.key) - 1;
        const btns = $$("#eventChoices .choice");
        if (btns[idx] && !btns[idx].disabled) {
          e.preventDefault();
          onEventChoice(idx);
        }
      }
    });

    // Settings: interrupts toggle
    const intToggle = $("#interruptsToggle");
    if (intToggle) {
      intToggle.checked = !!state.settings?.interrupts;
      intToggle.addEventListener("change", () => {
        if (!state.settings) state.settings = {};
        state.settings.interrupts = intToggle.checked;
        saveState();
        toast(`Random events ${intToggle.checked ? "enabled" : "disabled"}`);
      });
    }

    // Settings: Punjabi audio auto-play toggle
    const ttsToggle = $("#ttsAutoplayToggle");
    if (ttsToggle) {
      ttsToggle.checked = !!state.settings?.ttsAutoplay;
      ttsToggle.addEventListener("change", () => {
        if (!state.settings) state.settings = {};
        state.settings.ttsAutoplay = ttsToggle.checked;
        saveState();
        toast(`Audio auto-play ${ttsToggle.checked ? "enabled" : "disabled"}`);
      });
    }

    // Settings: Learning Direction segmented control
    const dirSeg = $("#directionSegment");
    if (dirSeg) {
      const refreshDirUI = () => {
        const cur = (state.settings && state.settings.direction) || "en2pa";
        dirSeg.querySelectorAll(".diff-opt").forEach(b => {
          b.classList.toggle("active", b.dataset.dir === cur);
        });
      };
      refreshDirUI();
      dirSeg.addEventListener("click", (e) => {
        const btn = e.target.closest(".diff-opt");
        if (!btn) return;
        const dir = btn.dataset.dir;
        if (dir !== "en2pa" && dir !== "pa2en") return;
        if (!state.settings) state.settings = {};
        if (state.settings.direction === dir) return;
        state.settings.direction = dir;
        saveState();
        applyDirectionAttr();
        refreshDirUI();
        toast(dir === "en2pa" ? "Mode: English → Punjabi" : "Mode: Punjabi → English");
        // Re-render Train flashcard now if visible (no in-flight question to disrupt).
        const trainScreen = document.querySelector("#screen-train");
        if (trainScreen?.classList.contains("active") && train?.current) {
          renderCard();
        }
        // Battle: applies on the next question to avoid jarring mid-fight swap.
      });
    }

    // Speaker buttons. The BACK face now has explicit per-language buttons
    // (PA + EN) so learners can hear either side at will. The FRONT face has
    // a single button that matches whichever language is shown there.
    const langForFront = () => (isReverse() ? "en" : "pa");
    const speakAt = (lang) => (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (train?.current) speakCard(train.current, { lang });
    };
    const sFront   = $("#speakFront");
    const sBackPa  = $("#speakBackPa");
    const sBackEn  = $("#speakBackEn");
    if (sFront)  { tts.speakingButtons.add(sFront);  sFront.addEventListener("click",  (e) => speakAt(langForFront())(e)); }
    if (sBackPa) { tts.speakingButtons.add(sBackPa); sBackPa.addEventListener("click", speakAt("pa")); }
    if (sBackEn) { tts.speakingButtons.add(sBackEn); sBackEn.addEventListener("click", speakAt("en")); }

    // Initialize TTS voice list (async on some browsers)
    loadVoicesOnce();
    // Show one-time hint if we likely have no Punjabi audio path
    setTimeout(maybeShowVoiceHint, 1500);

    // ---- Audio Debug Panel (triple-tap header to open) ----------------------
    // Lets us see on the iPhone exactly which voices are detected and what
    // happens on each speak call.
    installAudioDebugPanel();

    // Apply learning-direction body flag and audit Gurmukhi coverage
    applyDirectionAttr();
    auditGurmukhiMap();

    $("#resetBtn").addEventListener("click", () => {
      if (confirm("Reset all progress? This cannot be undone.")) {
        resetProgress();
        toast("Progress reset.");
        updateHud();
        showScreen("start");
      }
    });

    // ============== BATTLE V2 WIRE-UP ===============
    // Pause / resume
    const pauseBtn = $("#pauseBtn");
    if (pauseBtn) pauseBtn.addEventListener("click", () => { Sfx.play("select"); pauseBattle(); });
    const resumeBtn = $("#resumeBtn");
    if (resumeBtn) resumeBtn.addEventListener("click", () => { Sfx.play("select"); resumeBattle(); });
    const pauseRetreatBtn = $("#pauseRetreatBtn");
    if (pauseRetreatBtn) pauseRetreatBtn.addEventListener("click", () => {
      $("#pauseOverlay").hidden = true;
      $("#confirmRetreat").hidden = false;
    });

    // Retreat flow
    const retreatBtn = $("#retreatBtn");
    if (retreatBtn) retreatBtn.addEventListener("click", () => { Sfx.play("select"); tryRetreat(); });
    const cancelRetreat = $("#cancelRetreat");
    if (cancelRetreat) cancelRetreat.addEventListener("click", () => {
      $("#confirmRetreat").hidden = true;
      // Always reach back into resume — handles both pause-overlay path
      // (from #pauseRetreatBtn) and freeze-only path (from #retreatBtn).
      resumeBattle();
    });
    const confirmRetreatBtn = $("#confirmRetreatBtn");
    if (confirmRetreatBtn) confirmRetreatBtn.addEventListener("click", () => {
      $("#confirmRetreat").hidden = true;
      if (battle) { battle.ended = true; Music.stop(); cancelAnimationFrame(battle.timerRaf); }
      battle = null;
      showScreen("start");
    });

    // KI special FAB
    const kiFab = $("#kiFab");
    if (kiFab) kiFab.addEventListener("click", () => fireKiSpecial());

    // Coach overlay
    const coachNext = $("#coachNext");
    if (coachNext) coachNext.addEventListener("click", () => { Sfx.play("select"); coachIdx += 1; if (coachIdx >= COACH_STEPS.length) closeCoach(); else showCoachStep(); });
    const coachSkip = $("#coachSkip");
    if (coachSkip) coachSkip.addEventListener("click", () => { state.settings.battleHints = false; saveState(); closeCoach(); });

    // Pre-battle difficulty selector
    const diffSeg = $("#diffSegment");
    if (diffSeg) diffSeg.addEventListener("click", (e) => {
      const btn = e.target.closest(".diff-opt"); if (!btn) return;
      const d = btn.dataset.diff;
      if (!DIFFICULTY[d]) return;
      state.settings.difficulty = d;
      saveState();
      $$("#diffSegment .diff-opt").forEach(b => b.classList.toggle("active", b === btn));
      $("#diffDesc").textContent = DIFFICULTY[d].desc;
      Sfx.play("select");
    });
    const startRunBtn = $("#startRunBtn");
    if (startRunBtn) startRunBtn.addEventListener("click", () => { Sfx.init(); Sfx.play("select"); closePrebattleAndStart(); });
    const prebattleCancel = $("#prebattleCancel");
    if (prebattleCancel) prebattleCancel.addEventListener("click", () => {
      $("#prebattleOverlay").hidden = true;
      showScreen("start");
    });

    // Settings: audio sliders
    const syncSliderFill = (el) => {
      if (!el) return;
      const min = Number(el.min || 0), max = Number(el.max || 100);
      const pct = ((Number(el.value) - min) / (max - min)) * 100;
      el.style.setProperty("--val", pct + "%");
    };
    const sfxVol = $("#sfxVol");
    if (sfxVol) {
      sfxVol.value = String(Math.round((state.settings?.audio?.sfx ?? 0.7) * 100));
      const lbl = $("#sfxVolLabel"); if (lbl) lbl.textContent = sfxVol.value + "%";
      syncSliderFill(sfxVol);
      sfxVol.addEventListener("input", () => {
        state.settings.audio.sfx = Number(sfxVol.value) / 100;
        if (lbl) lbl.textContent = sfxVol.value + "%";
        syncSliderFill(sfxVol);
        Sfx.applyVolumes();
        saveState();
      });
      sfxVol.addEventListener("change", () => { Sfx.init(); Sfx.play("select"); });
    }
    const musicVol = $("#musicVol");
    if (musicVol) {
      musicVol.value = String(Math.round((state.settings?.audio?.music ?? 0.4) * 100));
      const lbl = $("#musicVolLabel"); if (lbl) lbl.textContent = musicVol.value + "%";
      syncSliderFill(musicVol);
      musicVol.addEventListener("input", () => {
        state.settings.audio.music = Number(musicVol.value) / 100;
        if (lbl) lbl.textContent = musicVol.value + "%";
        syncSliderFill(musicVol);
        Sfx.applyVolumes();
        saveState();
      });
    }
    // Settings: confirm-retreat toggle
    const crToggle = $("#confirmRetreatToggle");
    if (crToggle) {
      crToggle.checked = state.settings?.confirmRetreat !== false;
      crToggle.addEventListener("change", () => {
        state.settings.confirmRetreat = crToggle.checked;
        saveState();
      });
    }
    // Settings: reset struggling cards (shaky flags + leech suspensions).
    const resetShaky = $("#resetShakyBtn");
    if (resetShaky) {
      resetShaky.addEventListener("click", () => {
        state.shakyCards = {};
        let unsus = 0;
        for (const c of DECK) {
          const s = state.srs[c.id];
          if (s && s.suspended) { s.suspended = false; unsus++; }
        }
        saveState();
        toast(unsus ? `Reset shaky + un-suspended ${unsus}` : "Shaky-card flags cleared", 1400);
      });
    }
    // Settings: render battle records on entering settings
    const settingsScreen = document.querySelector('[data-screen="settings"]');
    if (settingsScreen) {
      const obs = new MutationObserver(() => {
        if (settingsScreen.classList.contains("active")) renderBattleRecords();
      });
      obs.observe(settingsScreen, { attributes: true, attributeFilter: ["class"] });
    }

    // Battle keyboard shortcuts (1-4 answers, Space = KI special, Esc = pause toggle)
    document.addEventListener("keydown", (e) => {
      if (!battle || trainEvent) return;
      const battleScreen = document.querySelector('[data-screen="battle"]');
      if (!battleScreen?.classList.contains("active")) return;
      if (e.key >= "1" && e.key <= "4") {
        const idx = Number(e.key) - 1;
        const btns = $$("#choices .choice");
        if (btns[idx] && !btns[idx].disabled) { e.preventDefault(); onChoice(idx); }
      } else if (e.key === " ") {
        const fab = $("#kiFab");
        if (fab && fab.classList.contains("ready")) { e.preventDefault(); fireKiSpecial(); }
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (battle.pausedAt) resumeBattle(); else pauseBattle();
      }
    });

    updateHud();

    // SRS self-test harness (gated by ?srsTest=1).
    if (/[?&]srsTest=1\b/.test(location.search)) runSrsSelfTest();
  }

  // ---------- SRS self-test --------------------------------------------------
  // Lightweight regression checks. Run from devtools console:
  //   location.search = "?srsTest=1"
  // Non-destructive: snapshots state.srs[id] for the test card and restores.
  function runSrsSelfTest() {
    const log = (...a) => console.log("[srsTest]", ...a);
    const fail = (msg) => { console.error("[srsTest] FAIL:", msg); failures++; };
    let failures = 0;
    const id = DECK[0].id;
    const snapshot = JSON.parse(JSON.stringify(state.srs[id]));
    const snapShaky = JSON.parse(JSON.stringify(state.shakyCards || {}));
    const snapStats = JSON.parse(JSON.stringify(state.dailyStats || {}));
    try {
      // Reset card to a fresh "new" state.
      state.srs[id] = {
        ease: SRS.EASE_START, interval: 0, due: 0, mastery: 0, seen: 0,
        queue: "new", step: 0, reps: 0, lapses: 0, lastResult: null, firstSeenAt: 0,
      };
      // 1. New card: "good" advances learning step, doesn't graduate immediately.
      applySrsGrade(id, "good");
      if (state.srs[id].queue !== "learning" || state.srs[id].step !== 1) {
        fail(`new+good should advance to learning step 1; got queue=${state.srs[id].queue} step=${state.srs[id].step}`);
      }
      // 2. Easy graduates immediately to review.
      applySrsGrade(id, "easy");
      if (state.srs[id].queue !== "review" || state.srs[id].interval < SRS.GRAD_INTERVAL_EASY - 1) {
        fail(`learning+easy should graduate; got queue=${state.srs[id].queue} interval=${state.srs[id].interval}`);
      }
      // 3. Build up a long interval.
      state.srs[id].interval = 30;
      state.srs[id].queue = "review";
      const easeBefore = state.srs[id].ease;
      // 4. Lapse: should NOT reset to 1d, should go to relearning.
      applySrsGrade(id, "again");
      if (state.srs[id].queue !== "relearning") fail("lapse should enter relearning queue");
      if (state.srs[id].interval < 10) fail(`lapse interval too small; got ${state.srs[id].interval}, expected ~15`);
      if (state.srs[id].lapses !== 1) fail(`lapses should be 1; got ${state.srs[id].lapses}`);
      if (state.srs[id].ease >= easeBefore) fail("lapse should drop ease");
      // 5. Relearning good x N graduates back to review with preserved interval.
      for (let i = 0; i < SRS.RELEARNING_STEPS_MIN.length; i++) applySrsGrade(id, "good");
      if (state.srs[id].queue !== "review") fail("relearning should re-graduate after all steps");
      if (state.srs[id].interval < 10) fail(`re-graduated interval should preserve gentle lapse value; got ${state.srs[id].interval}`);
      // 6. Battle signal must NOT touch interval/lapses/due/queue.
      const before = JSON.parse(JSON.stringify(state.srs[id]));
      applyBattleSignal(id, false, 1500);
      if (state.srs[id].interval !== before.interval) fail("battle miss must not change interval");
      if (state.srs[id].due !== before.due) fail("battle miss must not change due");
      if (state.srs[id].lapses !== before.lapses) fail("battle miss must not change lapses");
      if (state.srs[id].queue !== before.queue) fail("battle miss must not change queue");
      if (state.srs[id].ease >= before.ease) fail("battle miss must drop ease");
      if (!state.shakyCards[id]) fail("battle miss must flag shaky");
      // 7. Adaptive cap honors min/max bounds.
      const cap = dailyNewCardLimit();
      if (cap < SRS.NEW_PER_DAY_MIN || cap > SRS.NEW_PER_DAY_MAX) fail(`cap out of bounds: ${cap}`);
      // 8. Fuzz is bounded.
      for (let i = 0; i < 5; i++) {
        const f = fuzzInterval(id, 100);
        if (f < 90 || f > 110) fail(`fuzzInterval out of range: ${f}`);
      }
      log(failures === 0 ? "ALL PASS" : `${failures} failure(s)`);
    } finally {
      state.srs[id] = snapshot;
      state.shakyCards = snapShaky;
      state.dailyStats = snapStats;
      saveState();
    }
  }

  // Boot
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
