import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { QuestionImportRecord } from "../src/domain/content.ts";

const DIFFICULTY_BANDS = ["easy", "medium", "hard"] as const;
const PRESSURE_TAGS = ["calm", "neutral", "spiky"] as const;

function withMeta(index: number, category: string, prompt: string, options: [string, string, string, string], correct: number): QuestionImportRecord {
  return {
    external_key: `launch-v2-q-${String(index + 1).padStart(3, "0")}`,
    prompt,
    options,
    correct_answer_index: correct,
    category,
    difficulty_band: DIFFICULTY_BANDS[index % DIFFICULTY_BANDS.length],
    pressure_tag: PRESSURE_TAGS[Math.floor(index / 3) % PRESSURE_TAGS.length],
    is_active: true,
    question_set_version: "launch-v2",
    source_label: "curated-launch-v2"
  };
}

function buildMathQuestions(start: number) {
  const rows: QuestionImportRecord[] = [];
  let index = start;
  for (let n = 12; n <= 51; n += 1) {
    const answer = n * n;
    rows.push(
      withMeta(index++, "Math", `What is ${n} squared?`, [
        String(answer - n),
        String(answer),
        String(answer + n),
        String(answer + n + 3)
      ], 1)
    );
  }
  return { rows, next: index };
}

function buildScienceQuestions(start: number) {
  const facts = [
    ["What gas do plants primarily absorb for photosynthesis?", ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], 1],
    ["Which blood cells mainly carry oxygen?", ["Platelets", "Red blood cells", "White blood cells", "Plasma cells"], 1],
    ["What is the pH of pure water at room temperature?", ["5", "6", "7", "8"], 2],
    ["Which planet has the shortest year in our solar system?", ["Earth", "Mars", "Mercury", "Venus"], 2],
    ["What force pulls objects toward Earth?", ["Friction", "Magnetism", "Gravity", "Radiation"], 2],
    ["Which part of the cell contains most genetic material?", ["Ribosome", "Nucleus", "Golgi body", "Lysosome"], 1],
    ["What is the chemical symbol for potassium?", ["Po", "Pt", "K", "P"], 2],
    ["Which organ filters blood to make urine?", ["Liver", "Kidney", "Pancreas", "Lung"], 1],
    ["What is the nearest star to Earth?", ["Sirius", "Polaris", "Betelgeuse", "Sun"], 3],
    ["What state of matter has a definite volume but no fixed shape?", ["Solid", "Gas", "Plasma", "Liquid"], 3],
    ["What is the boiling point of water at sea level in Celsius?", ["90", "95", "100", "105"], 2],
    ["Which vitamin is produced in skin with sunlight exposure?", ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin K"], 2],
    ["What is the largest organ in the human body?", ["Heart", "Liver", "Skin", "Lung"], 2],
    ["Which layer of Earth is liquid iron-rich material?", ["Crust", "Mantle", "Outer core", "Inner core"], 2],
    ["Which wave has the highest frequency?", ["Radio", "Microwave", "Visible light", "Gamma"], 3],
    ["Which gas is most abundant in Earth’s atmosphere?", ["Oxygen", "Carbon dioxide", "Nitrogen", "Argon"], 2],
    ["What unit measures electric current?", ["Volt", "Watt", "Ampere", "Ohm"], 2],
    ["Which process turns liquid water into vapor?", ["Condensation", "Evaporation", "Sublimation", "Freezing"], 1],
    ["What is the speed of light closest to?", ["300,000 km/s", "30,000 km/s", "3,000 km/s", "3,000,000 km/s"], 0],
    ["Which blood type is known as the universal donor?", ["O negative", "AB positive", "A positive", "B negative"], 0]
  ] as const;

  const rows: QuestionImportRecord[] = [];
  let index = start;
  for (const [prompt, options, correct] of facts) {
    rows.push(withMeta(index++, "Science", prompt, options as [string, string, string, string], correct));
  }
  return { rows, next: index };
}

function buildHistoryQuestions(start: number) {
  const facts = [
    ["Which wall fell in 1989, symbolizing the end of the Cold War split in Germany?", ["Great Wall", "Berlin Wall", "Hadrian’s Wall", "Western Wall"], 1],
    ["Who was Britain’s prime minister for most of World War II?", ["Winston Churchill", "Neville Chamberlain", "Clement Attlee", "Harold Macmillan"], 0],
    ["In which year did the Titanic sink?", ["1905", "1912", "1918", "1924"], 1],
    ["Which civilization built Machu Picchu?", ["Aztec", "Maya", "Inca", "Olmec"], 2],
    ["Who wrote the Communist Manifesto with Karl Marx?", ["Friedrich Engels", "Lenin", "Trotsky", "Stalin"], 0],
    ["Which empire was ruled by Julius Caesar?", ["Greek", "Roman", "Ottoman", "Persian"], 1],
    ["What year did India gain independence?", ["1942", "1947", "1950", "1955"], 1],
    ["Who was known as the Maid of Orleans?", ["Joan of Arc", "Catherine de Medici", "Eleanor of Aquitaine", "Marie Antoinette"], 0],
    ["Which war was fought between the North and South regions in the United States?", ["War of 1812", "Civil War", "Revolutionary War", "Spanish-American War"], 1],
    ["Which ancient city was buried by Mount Vesuvius in 79 CE?", ["Athens", "Sparta", "Pompeii", "Carthage"], 2],
    ["Which treaty ended World War I?", ["Treaty of Paris", "Treaty of Versailles", "Treaty of Ghent", "Treaty of Tordesillas"], 1],
    ["Who was the first woman to fly solo across the Atlantic?", ["Amelia Earhart", "Bessie Coleman", "Sally Ride", "Valentina Tereshkova"], 0],
    ["Which dynasty built much of the Great Wall sections seen today?", ["Han", "Ming", "Qin", "Tang"], 1],
    ["What event began on July 14, 1789, in France?", ["Reign of Terror", "Storming of the Bastille", "Napoleonic Wars", "Congress of Vienna"], 1],
    ["Which explorer completed the first circumnavigation expedition?", ["Christopher Columbus", "Ferdinand Magellan’s expedition", "Vasco da Gama", "James Cook"], 1],
    ["Who was the first emperor of unified China?", ["Qin Shi Huang", "Kublai Khan", "Sun Yat-sen", "Emperor Wu"], 0],
    ["Which city served as the capital of the Byzantine Empire?", ["Rome", "Athens", "Constantinople", "Alexandria"], 2],
    ["Who led the Salt March in 1930?", ["Jawaharlal Nehru", "Subhas Chandra Bose", "Mahatma Gandhi", "Sardar Patel"], 2],
    ["Which country gifted the Statue of Liberty to the U.S.?", ["Spain", "France", "Italy", "Germany"], 1],
    ["What was the primary language of the Roman Empire?", ["Greek", "Latin", "Aramaic", "French"], 1]
  ] as const;

  const rows: QuestionImportRecord[] = [];
  let index = start;
  for (const [prompt, options, correct] of facts) {
    rows.push(withMeta(index++, "History", prompt, options as [string, string, string, string], correct));
  }
  return { rows, next: index };
}

function buildCategorySet(start: number, category: string, items: Array<[string, [string, string, string, string], number]>) {
  const rows: QuestionImportRecord[] = [];
  let index = start;
  for (const [prompt, options, correct] of items) {
    rows.push(withMeta(index++, category, prompt, options, correct));
  }
  return { rows, next: index };
}

function rebalanceCorrectAnswerIndexes(rows: QuestionImportRecord[]) {
  return rows.map((row, index) => {
    const desiredIndex = index % 4;
    const currentIndex = row.correct_answer_index;
    if (currentIndex === desiredIndex) {
      return row;
    }

    const options = [...row.options] as [string, string, string, string];
    [options[currentIndex], options[desiredIndex]] = [options[desiredIndex]!, options[currentIndex]!];

    return {
      ...row,
      options,
      correct_answer_index: desiredIndex
    };
  });
}

function main() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const v1Path = path.join(repoRoot, "content", "question-bank-v1.json");
  const outPath = path.join(repoRoot, "content", "question-bank-v2.json");
  const v1 = JSON.parse(readFileSync(v1Path, "utf8")) as QuestionImportRecord[];

  let index = 0;
  const generated: QuestionImportRecord[] = [];

  const math = buildMathQuestions(index);
  generated.push(...math.rows); index = math.next;

  const science = buildScienceQuestions(index);
  generated.push(...science.rows); index = science.next;

  const history = buildHistoryQuestions(index);
  generated.push(...history.rows); index = history.next;

  const geography = buildCategorySet(index, "Geography", [
    ["Which river is the longest in the world by common textbook convention?", ["Amazon", "Nile", "Yangtze", "Mississippi"], 1],
    ["What is the capital of Canada?", ["Toronto", "Vancouver", "Ottawa", "Montreal"], 2],
    ["Which desert is the largest hot desert?", ["Gobi", "Kalahari", "Atacama", "Sahara"], 3],
    ["Mount Kilimanjaro is located in which country?", ["Kenya", "Tanzania", "Ethiopia", "Uganda"], 1],
    ["Which ocean lies between Africa and Australia?", ["Atlantic", "Pacific", "Indian", "Arctic"], 2],
    ["What is the smallest country in the world by area?", ["Monaco", "San Marino", "Vatican City", "Liechtenstein"], 2],
    ["Which U.S. state has the most volcanoes?", ["Hawaii", "Alaska", "California", "Washington"], 1],
    ["What is the capital of Japan?", ["Seoul", "Kyoto", "Osaka", "Tokyo"], 3],
    ["Which continent has the most countries?", ["Asia", "Africa", "Europe", "South America"], 1],
    ["The Danube River flows into which sea?", ["Black Sea", "Baltic Sea", "Adriatic Sea", "Aegean Sea"], 0],
    ["Which line divides Earth into northern and southern hemispheres?", ["Prime Meridian", "Tropic of Cancer", "Equator", "International Date Line"], 2],
    ["What is the capital of Australia?", ["Sydney", "Melbourne", "Canberra", "Perth"], 2],
    ["Which country has the largest population?", ["India", "China", "United States", "Indonesia"], 0],
    ["Which mountain range separates Europe and Asia in Russia?", ["Alps", "Andes", "Urals", "Himalayas"], 2],
    ["Which African lake is the largest by area?", ["Lake Victoria", "Lake Tanganyika", "Lake Malawi", "Lake Chad"], 0],
    ["What is the capital of Brazil?", ["Rio de Janeiro", "Sao Paulo", "Brasilia", "Salvador"], 2],
    ["Which country is known as the Land of the Rising Sun?", ["China", "Japan", "Thailand", "South Korea"], 1],
    ["What is the deepest known ocean trench?", ["Puerto Rico Trench", "Java Trench", "Mariana Trench", "Tonga Trench"], 2],
    ["Which sea is shrinking due to diversion of rivers in Central Asia?", ["Caspian Sea", "Aral Sea", "Dead Sea", "Red Sea"], 1],
    ["What is the capital city of Egypt?", ["Alexandria", "Giza", "Cairo", "Luxor"], 2]
  ]);
  generated.push(...geography.rows); index = geography.next;

  const tech = buildCategorySet(index, "Technology", [
    ["What does RAM stand for?", ["Read Access Memory", "Random Access Memory", "Rapid Array Module", "Runtime Allocation Matrix"], 1],
    ["Which company created the Linux kernel?", ["Apple", "Microsoft", "Linus Torvalds-led open source community", "IBM"], 2],
    ["What does HTTP stand for?", ["HyperText Transfer Protocol", "High Transfer Text Process", "Host Transmission Type Protocol", "Hyper Transfer Terminal Process"], 0],
    ["Which language powers most modern web page styling?", ["HTML", "JavaScript", "CSS", "SQL"], 2],
    ["What is two-factor authentication primarily used for?", ["Faster downloads", "Account security", "Battery saving", "Image compression"], 1],
    ["Which storage type has no moving mechanical parts?", ["HDD", "SSD", "Magnetic tape", "Blu-ray"], 1],
    ["What does VPN stand for?", ["Virtual Private Network", "Variable Proxy Node", "Visual Protocol Network", "Verified Personal Network"], 0],
    ["Which company develops the Android operating system?", ["Apple", "Microsoft", "Google", "Samsung"], 2],
    ["What does AI stand for?", ["Automated Internet", "Artificial Intelligence", "Adaptive Interface", "Algorithmic Input"], 1],
    ["Which protocol secures website traffic with encryption?", ["FTP", "HTTP", "SMTP", "HTTPS"], 3],
    ["What is the main purpose of a firewall in computing?", ["Enhance speakers", "Manage display color", "Filter network traffic", "Defragment storage"], 2],
    ["Which file format is typically used for lossless text documents?", [".mp3", ".pdf", ".exe", ".png"], 1],
    ["What does GPU stand for?", ["Graphics Processing Unit", "General Purpose Utility", "Graph Program Unit", "Global Pixel Unit"], 0],
    ["Which command-line tool tracks source code changes in many projects?", ["Docker", "Git", "Nginx", "Webpack"], 1],
    ["What does URL stand for?", ["Unified Resource Link", "Universal Routing Layer", "Uniform Resource Locator", "User Reference Locator"], 2],
    ["Which database language is used to query relational data?", ["CSS", "SQL", "JSON", "YAML"], 1],
    ["What is phishing in cybersecurity?", ["A backup strategy", "A social engineering scam", "A hardware failure", "A database migration"], 1],
    ["Which company originally created the iPhone?", ["Nokia", "Apple", "Samsung", "Motorola"], 1],
    ["What does API stand for?", ["Application Programming Interface", "Automated Program Input", "Applied Process Integration", "Application Process Internet"], 0],
    ["What is cloud computing primarily about?", ["Local-only execution", "On-demand remote computing resources", "Mechanical networking", "Offline storage only"], 1]
  ]);
  generated.push(...tech.rows); index = tech.next;

  const worldFacts = buildCategorySet(index, "World Facts", [
    ["What is the official currency of the United Kingdom?", ["Euro", "Pound sterling", "Dollar", "Franc"], 1],
    ["How many continents are there on Earth?", ["5", "6", "7", "8"], 2],
    ["Which language has the most native speakers globally by common estimates?", ["English", "Hindi", "Spanish", "Mandarin Chinese"], 3],
    ["What is the busiest ocean for global shipping lanes?", ["Pacific", "Atlantic", "Indian", "Arctic"], 0],
    ["Which country hosts the city of Barcelona?", ["Portugal", "Italy", "Spain", "France"], 2],
    ["What does UNESCO primarily focus on?", ["Weather forecasting", "Education, science, and culture", "Space launches", "Trade tariffs"], 1],
    ["Which country is both in Europe and Asia?", ["Turkey", "Poland", "Sweden", "Norway"], 0],
    ["What is the most spoken language in South America?", ["Spanish", "Portuguese", "English", "French"], 1],
    ["Which city is known as the City of Canals?", ["Prague", "Amsterdam", "Venice", "Bruges"], 2],
    ["What is the global emergency phone number in many countries?", ["911", "112", "999", "110"], 1],
    ["Which country has maple leaf on its flag?", ["United States", "Canada", "Australia", "New Zealand"], 1],
    ["Which is the largest island in the world?", ["Borneo", "Greenland", "Madagascar", "New Guinea"], 1],
    ["Which nation is famous for tulip fields and windmills?", ["Belgium", "Netherlands", "Denmark", "Austria"], 1],
    ["Which city hosts the Eiffel Tower?", ["Rome", "Madrid", "Paris", "Vienna"], 2],
    ["What is the largest ocean on Earth?", ["Atlantic", "Indian", "Arctic", "Pacific"], 3],
    ["Which country is home to the Great Barrier Reef?", ["South Africa", "Australia", "Mexico", "Indonesia"], 1],
    ["What is the main language of Brazil?", ["Spanish", "French", "Portuguese", "Italian"], 2],
    ["Which nation is known for fjords and midnight sun routes?", ["Norway", "Greece", "Turkey", "Morocco"], 0],
    ["Which city is the capital of South Korea?", ["Busan", "Seoul", "Incheon", "Daegu"], 1],
    ["Which country has the city of Marrakech?", ["Algeria", "Morocco", "Tunisia", "Libya"], 1]
  ]);
  generated.push(...worldFacts.rows); index = worldFacts.next;

  const language = buildCategorySet(index, "Language", [
    ["Which punctuation mark ends a direct question?", ["Comma", "Semicolon", "Question mark", "Colon"], 2],
    ["What is the plural of 'analysis'?", ["Analysises", "Analyses", "Analysis", "Analysi"], 1],
    ["Which part of speech names a person, place, or thing?", ["Verb", "Adjective", "Noun", "Adverb"], 2],
    ["What is the opposite of 'ancient'?", ["Modern", "Narrow", "Vast", "Calm"], 0],
    ["Which word is a synonym for 'brief'?", ["Lengthy", "Short", "Complex", "Hidden"], 1],
    ["What does the prefix 'pre-' usually mean?", ["After", "Before", "Under", "Without"], 1],
    ["Which word is an antonym of 'expand'?", ["Enlarge", "Stretch", "Contract", "Increase"], 2],
    ["In English, which article is indefinite?", ["The", "A", "Those", "This"], 1],
    ["Which sentence is in past tense?", ["I walk home", "I am walking home", "I walked home", "I will walk home"], 2],
    ["What is the adjective form of 'danger'?", ["Dangered", "Dangerly", "Dangerous", "Dangerness"], 2],
    ["Which word is a conjunction?", ["And", "Quickly", "Bright", "Teacher"], 0],
    ["What is the comparative form of 'good'?", ["Gooder", "More good", "Better", "Best"], 2],
    ["Which symbol is used for an apostrophe?", ["'", "\"", "-", "/"], 0],
    ["Which is a proper noun?", ["city", "river", "India", "book"], 2],
    ["What does 'bilingual' mean?", ["Speaking one language", "Speaking two languages", "Writing in symbols", "Reading silently"], 1],
    ["Which word is a verb?", ["Run", "Blue", "Quiet", "Table"], 0],
    ["What is a synonym of 'rapid'?", ["Slow", "Swift", "Heavy", "Tiny"], 1],
    ["Which sentence is imperative?", ["Close the door.", "The door is closed.", "Is the door closed?", "The door closes slowly."], 0],
    ["Which pronoun is first person singular?", ["They", "We", "I", "You"], 2],
    ["What is the past tense of 'teach'?", ["Teached", "Taught", "Teachen", "Teaching"], 1]
  ]);
  generated.push(...language.rows); index = language.next;

  const literature = buildCategorySet(index, "Literature", [
    ["Who wrote 'To Kill a Mockingbird'?", ["Harper Lee", "Toni Morrison", "Maya Angelou", "Emily Dickinson"], 0],
    ["Who wrote 'The Odyssey'?", ["Virgil", "Homer", "Socrates", "Plato"], 1],
    ["Which playwright wrote 'Hamlet'?", ["William Shakespeare", "George Bernard Shaw", "Arthur Miller", "T. S. Eliot"], 0],
    ["Who wrote 'Moby-Dick'?", ["Herman Melville", "Mark Twain", "Nathaniel Hawthorne", "Jack London"], 0],
    ["Who authored 'The Great Gatsby'?", ["Ernest Hemingway", "F. Scott Fitzgerald", "John Steinbeck", "J. D. Salinger"], 1],
    ["Who wrote 'The Divine Comedy'?", ["Dante Alighieri", "Boccaccio", "Petrarch", "Machiavelli"], 0],
    ["Who is the author of 'Frankenstein'?", ["Mary Shelley", "Bram Stoker", "Jane Austen", "Virginia Woolf"], 0],
    ["Who wrote 'War and Peace'?", ["Fyodor Dostoevsky", "Leo Tolstoy", "Anton Chekhov", "Nikolai Gogol"], 1],
    ["Who created detective Sherlock Holmes?", ["Agatha Christie", "Arthur Conan Doyle", "Ian Fleming", "Dorothy L. Sayers"], 1],
    ["Who wrote 'One Hundred Years of Solitude'?", ["Isabel Allende", "Gabriel García Márquez", "Mario Vargas Llosa", "Pablo Neruda"], 1],
    ["Who wrote 'The Catcher in the Rye'?", ["J. D. Salinger", "Kurt Vonnegut", "Ray Bradbury", "Ken Kesey"], 0],
    ["Who wrote 'Pride and Prejudice'?", ["Charlotte Bronte", "Jane Austen", "George Eliot", "Louisa May Alcott"], 1],
    ["Who wrote 'Animal Farm'?", ["George Orwell", "Aldous Huxley", "Ayn Rand", "H. G. Wells"], 0],
    ["Who wrote 'The Trial'?", ["Franz Kafka", "Albert Camus", "Thomas Mann", "Hermann Hesse"], 0],
    ["Who wrote 'The Old Man and the Sea'?", ["John Steinbeck", "Ernest Hemingway", "William Faulkner", "Joseph Conrad"], 1],
    ["Who wrote 'Don Quixote'?", ["Miguel de Cervantes", "Federico Garcia Lorca", "Jorge Luis Borges", "Pablo Picasso"], 0],
    ["Who wrote 'The Iliad'?", ["Homer", "Sophocles", "Euripides", "Aristophanes"], 0],
    ["Who wrote 'The Metamorphosis'?", ["Franz Kafka", "Rainer Maria Rilke", "Thomas Mann", "Hermann Hesse"], 0],
    ["Who wrote 'The Alchemist'?", ["Paulo Coelho", "José Saramago", "Umberto Eco", "Italo Calvino"], 0],
    ["Who wrote 'Jane Eyre'?", ["Charlotte Bronte", "Emily Bronte", "Jane Austen", "George Eliot"], 0]
  ]);
  generated.push(...literature.rows); index = literature.next;

  const art = buildCategorySet(index, "Art", [
    ["Who painted the 'Mona Lisa'?", ["Vincent van Gogh", "Leonardo da Vinci", "Michelangelo", "Raphael"], 1],
    ["Which art movement is Pablo Picasso strongly associated with?", ["Impressionism", "Cubism", "Surrealism", "Baroque"], 1],
    ["What medium is traditionally used in fresco painting?", ["Wet plaster", "Marble", "Bronze", "Charcoal"], 0],
    ["Who sculpted 'David' in Renaissance Florence?", ["Donatello", "Michelangelo", "Bernini", "Rodin"], 1],
    ["Which Dutch painter cut off part of his ear?", ["Rembrandt", "Vincent van Gogh", "Vermeer", "Frans Hals"], 1],
    ["What is the Louvre primarily known as?", ["A museum", "A cathedral", "A library", "A palace hotel"], 0],
    ["Which artist painted the ceiling of the Sistine Chapel?", ["Raphael", "Michelangelo", "Titian", "Caravaggio"], 1],
    ["Which period came first?", ["Baroque", "Renaissance", "Romanticism", "Modernism"], 1],
    ["Which painter is known for water lilies series?", ["Claude Monet", "Edgar Degas", "Paul Cezanne", "Henri Matisse"], 0],
    ["What is pottery hardened by heat called?", ["Textile", "Ceramic", "Mosaic", "Fresco"], 1],
    ["Who painted 'The Starry Night'?", ["Paul Gauguin", "Vincent van Gogh", "Claude Monet", "Salvador Dali"], 1],
    ["Which country is artist Frida Kahlo from?", ["Spain", "Mexico", "Argentina", "Peru"], 1],
    ["What does 'avant-garde' usually imply in art?", ["Traditional imitation", "Experimental innovation", "Religious-only themes", "Industrial design only"], 1],
    ["Which sculptor created 'The Thinker'?", ["Auguste Rodin", "Constantin Brancusi", "Henry Moore", "Alberto Giacometti"], 0],
    ["Which museum houses Van Gogh’s 'Sunflowers' (one major version)?", ["The National Gallery, London", "Uffizi Gallery", "Prado Museum", "Rijksmuseum"], 0],
    ["What is chiaroscuro in painting?", ["Use of bright neon only", "Strong contrast of light and dark", "Painting on wet plaster", "Abstract geometric style"], 1],
    ["Which movement focused on dream-like imagery?", ["Realism", "Surrealism", "Neoclassicism", "Rococo"], 1],
    ["Who painted 'The Persistence of Memory'?", ["Joan Miro", "Salvador Dali", "Marc Chagall", "Henri Rousseau"], 1],
    ["Which artist painted 'Guernica'?", ["Pablo Picasso", "Diego Rivera", "Henri Matisse", "Amedeo Modigliani"], 0],
    ["What does a triptych contain?", ["Three panels", "Two panels", "Four panels", "One circular panel"], 0]
  ]);
  generated.push(...art.rows); index = art.next;

  const music = buildCategorySet(index, "Music", [
    ["How many lines does a standard musical staff have?", ["4", "5", "6", "7"], 1],
    ["Which clef is commonly used for higher-pitched instruments?", ["Bass clef", "Treble clef", "Alto clef", "Tenor clef"], 1],
    ["Who composed the 'Moonlight Sonata'?", ["Mozart", "Bach", "Beethoven", "Chopin"], 2],
    ["What is the tempo term for very fast?", ["Adagio", "Largo", "Presto", "Andante"], 2],
    ["Which instrument has 88 keys in a standard form?", ["Violin", "Piano", "Flute", "Trumpet"], 1],
    ["Which family does the clarinet belong to?", ["Brass", "Woodwind", "String", "Percussion"], 1],
    ["Who composed 'The Four Seasons'?", ["Vivaldi", "Handel", "Haydn", "Schubert"], 0],
    ["What does 'forte' indicate in sheet music?", ["Soft", "Loud", "Slow", "Fast"], 1],
    ["Which note value is half of a whole note?", ["Quarter note", "Half note", "Eighth note", "Sixteenth note"], 1],
    ["Which composer became deaf later in life?", ["Mozart", "Brahms", "Beethoven", "Liszt"], 2],
    ["What does BPM stand for in music timing?", ["Beats per minute", "Bars per measure", "Bass per mode", "Balance per movement"], 0],
    ["Which instrument is known as the king of instruments?", ["Piano", "Organ", "Violin", "Cello"], 1],
    ["What is a duet?", ["A piece for one performer", "A piece for two performers", "A piece for three performers", "A piece without rhythm"], 1],
    ["Which symbol raises a note by a semitone?", ["Flat", "Natural", "Sharp", "Rest"], 2],
    ["Which era includes composers like Mozart and Haydn?", ["Baroque", "Classical", "Romantic", "Modern"], 1],
    ["Which instrument keeps rhythm in many bands?", ["Drums", "Oboe", "Harp", "Bassoon"], 0],
    ["What does 'a cappella' mean?", ["With orchestra", "Without instrumental accompaniment", "Played very fast", "In triple meter"], 1],
    ["What is the relative minor of C major?", ["A minor", "E minor", "D minor", "G minor"], 0],
    ["Which composer wrote many famous waltzes and was nicknamed the Waltz King?", ["Johann Strauss II", "Richard Wagner", "Anton Bruckner", "Claude Debussy"], 0],
    ["What does a metronome help musicians maintain?", ["Pitch", "Tempo", "Volume", "Timbre"], 1]
  ]);
  generated.push(...music.rows); index = music.next;

  const astronomy = buildCategorySet(index, "Astronomy", [
    ["What is the name of our galaxy?", ["Andromeda", "Milky Way", "Whirlpool", "Triangulum"], 1],
    ["Which planet is known as the Red Planet?", ["Venus", "Mars", "Jupiter", "Saturn"], 1],
    ["What causes tides on Earth most directly?", ["Solar wind", "Moon’s gravity", "Earth’s core heat", "Comet paths"], 1],
    ["Which planet has the most prominent ring system?", ["Mercury", "Saturn", "Neptune", "Mars"], 1],
    ["What is a supernova?", ["A newborn planet", "An exploding star", "A moon shadow", "A comet tail"], 1],
    ["Which body orbits a planet?", ["Asteroid belt", "Moon", "Nebula", "Galaxy"], 1],
    ["What is the Sun mostly made of?", ["Oxygen and nitrogen", "Hydrogen and helium", "Iron and nickel", "Carbon and silicon"], 1],
    ["What term describes a path around a star or planet?", ["Vector", "Orbit", "Axis", "Pulse"], 1],
    ["Which mission first landed humans on the Moon?", ["Apollo 11", "Apollo 8", "Gemini 4", "Soyuz 1"], 0],
    ["What is a light-year a measure of?", ["Time", "Distance", "Brightness", "Mass"], 1],
    ["Which planet is closest to the Sun?", ["Mercury", "Venus", "Earth", "Mars"], 0],
    ["Which planet is famous for its Great Red Spot?", ["Saturn", "Jupiter", "Uranus", "Neptune"], 1],
    ["What is the term for a rocky object entering Earth’s atmosphere?", ["Asteroid", "Meteor", "Comet", "Planet"], 1],
    ["Which telescope launched in 2021 to observe deep space infrared?", ["Hubble", "Chandra", "James Webb", "Kepler"], 2],
    ["What lies at the center of many galaxies?", ["White dwarf", "Black hole", "Neutron cloud", "Comet cluster"], 1],
    ["Which phase comes after first quarter moon?", ["New moon", "Full moon", "Waning crescent", "Waxing gibbous"], 3],
    ["What do we call a system of millions or billions of stars bound by gravity?", ["Nebula", "Galaxy", "Orbit", "Eclipse"], 1],
    ["Which planet rotates on its side with an extreme axial tilt?", ["Earth", "Uranus", "Mars", "Venus"], 1],
    ["What causes a solar eclipse?", ["Earth between sun and moon", "Moon between sun and Earth", "Cloud cover", "Sunspot activity"], 1],
    ["What is the nearest large galaxy to the Milky Way?", ["Andromeda", "Triangulum", "Sombrero", "Large Magellanic Cloud"], 0]
  ]);
  generated.push(...astronomy.rows); index = astronomy.next;

  const biology = buildCategorySet(index, "Biology", [
    ["What is the basic unit of life?", ["Atom", "Cell", "Tissue", "Organ"], 1],
    ["DNA stands for deoxyribonucleic what?", ["Acid", "Salt", "Protein", "Base"], 0],
    ["Which organ pumps blood through the body?", ["Lung", "Heart", "Kidney", "Liver"], 1],
    ["Photosynthesis mainly occurs in which plant organelle?", ["Mitochondria", "Chloroplast", "Nucleus", "Ribosome"], 1],
    ["What type of blood vessel carries blood away from the heart?", ["Vein", "Artery", "Capillary", "Ventricle"], 1],
    ["Which molecule carries genetic instructions?", ["RNA", "DNA", "ATP", "Glucose"], 1],
    ["What process do cells use to divide for growth and repair?", ["Meiosis", "Mitosis", "Fermentation", "Diffusion"], 1],
    ["What is the largest part of the human brain?", ["Cerebellum", "Cerebrum", "Brainstem", "Medulla"], 1],
    ["Which system includes bones and joints?", ["Circulatory", "Skeletal", "Digestive", "Nervous"], 1],
    ["What is the function of red blood cells?", ["Fight infection", "Carry oxygen", "Form antibodies", "Digest food"], 1],
    ["Which macromolecule is made of amino acids?", ["Carbohydrate", "Lipid", "Protein", "Nucleic acid"], 2],
    ["What is the powerhouse of the cell?", ["Mitochondria", "Nucleus", "Golgi apparatus", "Lysosome"], 0],
    ["Which process converts glucose into usable cellular energy?", ["Transpiration", "Respiration", "Pollination", "Mutation"], 1],
    ["What is the main gas humans exhale?", ["Nitrogen", "Carbon dioxide", "Hydrogen", "Helium"], 1],
    ["Which blood cells help defend against pathogens?", ["Red blood cells", "White blood cells", "Platelets", "Plasma"], 1],
    ["Which kingdom do mushrooms belong to?", ["Plantae", "Fungi", "Protista", "Animalia"], 1],
    ["What is the inherited material passed from parents to offspring?", ["Genes", "Minerals", "Hormones", "Vitamins"], 0],
    ["What process moves water through a selectively permeable membrane?", ["Combustion", "Osmosis", "Sublimation", "Sedimentation"], 1],
    ["Which organ is central to detoxification in the body?", ["Heart", "Liver", "Skin", "Pancreas"], 1],
    ["What is the name of the pigment that gives plants green color?", ["Melanin", "Chlorophyll", "Keratin", "Hemoglobin"], 1]
  ]);
  generated.push(...biology.rows); index = biology.next;

  const normalized = new Set<string>();
  for (const row of v1) {
    normalized.add(row.prompt.trim().toLowerCase().replace(/\s+/g, " "));
  }

  const dedupedGenerated = generated.filter((row) => {
    const key = row.prompt.trim().toLowerCase().replace(/\s+/g, " ");
    if (normalized.has(key)) {
      return false;
    }
    normalized.add(key);
    return true;
  });

  const balancedGenerated = rebalanceCorrectAnswerIndexes(dedupedGenerated);
  const all = [...v1, ...balancedGenerated];

  writeFileSync(outPath, JSON.stringify(all, null, 2) + "\n");
  console.log(
    `Generated ${balancedGenerated.length} launch-v2 rows and wrote ${all.length} total rows to ${path.relative(repoRoot, outPath)}.`
  );
}

main();
