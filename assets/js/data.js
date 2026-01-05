let myData = [
    {
        id: 'gk_001',
        title: 'General Knowledge',
        description: 'Test your awareness of world facts, culture, and current events.',
        duration: 30, // 20 questions at 1.5 minutes each
        questions: [
            {
                id: 1,
                text: "What is the capital of France?",
                options: ["London", "Berlin", "Paris", "Madrid"],
                correct: 2
            },
            {
                id: 2,
                text: "Which planet is known as the Red Planet?",
                options: ["Venus", "Mars", "Jupiter", "Saturn"],
                correct: 1
            },
            {
                id: 3,
                text: "Who wrote 'Hamlet'?",
                options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
                correct: 1
            },
            {
                id: 4,
                text: "What is the chemical symbol for Gold?",
                options: ["Ag", "Fe", "Au", "Cu"],
                correct: 2
            },
            {
                id: 5,
                text: "Which is the largest ocean on Earth?",
                options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
                correct: 3
            },
            {
                id: 6,
                text: "What year did World War II end?",
                options: ["1943", "1945", "1947", "1950"],
                correct: 1
            },
            {
                id: 7,
                text: "Who painted the Mona Lisa?",
                options: ["Vincent van Gogh", "Leonardo da Vinci", "Pablo Picasso", "Michelangelo"],
                correct: 1
            },
            {
                id: 8,
                text: "What is the hardest natural substance on Earth?",
                options: ["Gold", "Iron", "Diamond", "Platinum"],
                correct: 2
            },
            {
                id: 9,
                text: "Which country gifted the Statue of Liberty to the United States?",
                options: ["Spain", "England", "France", "Italy"],
                correct: 2
            },
            {
                id: 10,
                text: "What is the largest organ in the human body?",
                options: ["Liver", "Heart", "Skin", "Lungs"],
                correct: 2
            },
            {
                id: 11,
                text: "Which planet has the most moons?",
                options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
                correct: 1
            },
            {
                id: 12,
                text: "What is the currency of Japan?",
                options: ["Won", "Yuan", "Yen", "Ringgit"],
                correct: 2
            },
            {
                id: 13,
                text: "Who discovered gravity?",
                options: ["Albert Einstein", "Isaac Newton", "Galileo Galilei", "Nikola Tesla"],
                correct: 1
            },
            {
                id: 14,
                text: "What is the smallest country in the world?",
                options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
                correct: 1
            },
            {
                id: 15,
                text: "Which language has the most native speakers?",
                options: ["English", "Hindi", "Spanish", "Mandarin Chinese"],
                correct: 3
            },
            {
                id: 16,
                text: "What is the chemical formula for table salt?",
                options: ["NaCl", "H2O", "CO2", "C6H12O6"],
                correct: 0
            },
            {
                id: 17,
                text: "Which continent is the Sahara Desert located in?",
                options: ["Asia", "Australia", "Africa", "South America"],
                correct: 2
            },
            {
                id: 18,
                text: "Who is known as the father of computers?",
                options: ["Alan Turing", "Charles Babbage", "Bill Gates", "Steve Jobs"],
                correct: 1
            },
            {
                id: 19,
                text: "What is the longest river in the world?",
                options: ["Amazon River", "Nile River", "Yangtze River", "Mississippi River"],
                correct: 1
            },
            {
                id: 20,
                text: "Which element has the atomic number 1?",
                options: ["Helium", "Oxygen", "Hydrogen", "Carbon"],
                correct: 2
            }
        ]
    },
    {
        id: 'math_001',
        title: 'Mathematics',
        description: 'Arithmetic, algebra, geometry, and logical reasoning problems.',
        duration: 45, // 25 questions at 1.8 minutes each
        questions: [
            {
                id: 1,
                text: "What is 15 + 27?",
                options: ["32", "42", "43", "52"],
                correct: 1
            },
            {
                id: 2,
                text: "What is the square root of 144?",
                options: ["10", "11", "12", "13"],
                correct: 2
            },
            {
                id: 3,
                text: "What is 7 × 8?",
                options: ["48", "54", "56", "64"],
                correct: 2
            },
            {
                id: 4,
                text: "Solve for x: 2x + 5 = 15",
                options: ["x = 3", "x = 4", "x = 5", "x = 6"],
                correct: 2
            },
            {
                id: 5,
                text: "What is the area of a rectangle with length 8cm and width 5cm?",
                options: ["13 cm²", "26 cm²", "40 cm²", "45 cm²"],
                correct: 2
            },
            {
                id: 6,
                text: "What is 3/4 as a percentage?",
                options: ["25%", "50%", "75%", "100%"],
                correct: 2
            },
            {
                id: 7,
                text: "What is the value of π to two decimal places?",
                options: ["3.12", "3.14", "3.16", "3.18"],
                correct: 1
            },
            {
                id: 8,
                text: "Simplify: 4² + 3³",
                options: ["25", "31", "43", "49"],
                correct: 2
            },
            {
                id: 9,
                text: "What is 15% of 200?",
                options: ["15", "20", "30", "45"],
                correct: 2
            },
            {
                id: 10,
                text: "If a triangle has angles 45° and 55°, what is the third angle?",
                options: ["60°", "70°", "80°", "90°"],
                correct: 2
            },
            {
                id: 11,
                text: "What is 0.75 as a fraction in simplest form?",
                options: ["3/5", "3/4", "4/5", "5/6"],
                correct: 1
            },
            {
                id: 12,
                text: "Calculate: 12 × 7 ÷ 3",
                options: ["24", "28", "32", "36"],
                correct: 1
            },
            {
                id: 13,
                text: "What is the perimeter of a square with side 6cm?",
                options: ["12 cm", "18 cm", "24 cm", "36 cm"],
                correct: 2
            },
            {
                id: 14,
                text: "Solve: (5 + 3) × (10 - 4)",
                options: ["32", "40", "48", "52"],
                correct: 2
            },
            {
                id: 15,
                text: "What is 2⁵?",
                options: ["16", "25", "32", "64"],
                correct: 2
            },
            {
                id: 16,
                text: "Find the average: 12, 18, 24",
                options: ["16", "18", "20", "22"],
                correct: 1
            },
            {
                id: 17,
                text: "Convert 3.5 hours to minutes",
                options: ["180 minutes", "200 minutes", "210 minutes", "240 minutes"],
                correct: 2
            },
            {
                id: 18,
                text: "What is the next prime number after 17?",
                options: ["18", "19", "21", "23"],
                correct: 1
            },
            {
                id: 19,
                text: "Calculate: 1/2 + 1/3",
                options: ["2/5", "3/5", "5/6", "2/3"],
                correct: 2
            },
            {
                id: 20,
                text: "What is 25% of 80?",
                options: ["15", "20", "25", "30"],
                correct: 1
            },
            {
                id: 21,
                text: "Find the circumference of a circle with radius 7cm (π = 22/7)",
                options: ["22 cm", "44 cm", "66 cm", "88 cm"],
                correct: 1
            },
            {
                id: 22,
                text: "What is 12.5 × 8?",
                options: ["90", "100", "110", "120"],
                correct: 1
            },
            {
                id: 23,
                text: "Solve: 3x - 7 = 14",
                options: ["x = 5", "x = 6", "x = 7", "x = 8"],
                correct: 2
            },
            {
                id: 24,
                text: "What is the median of: 4, 7, 9, 12, 15?",
                options: ["7", "8", "9", "10"],
                correct: 2
            },
            {
                id: 25,
                text: "Calculate: 15² - 10²",
                options: ["100", "125", "150", "175"],
                correct: 1
            }
        ]
    },
    {
        id: 'sci_001',
        title: 'Science',
        description: 'Physics, chemistry, biology, and earth science questions.',
        duration: 40, // 25 questions at 1.6 minutes each
        questions: [
            {
                id: 1,
                text: "What is the chemical formula for water?",
                options: ["H2O", "CO2", "NaCl", "O2"],
                correct: 0
            },
            {
                id: 2,
                text: "Which gas do plants absorb during photosynthesis?",
                options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
                correct: 2
            },
            {
                id: 3,
                text: "What is the hardest natural substance on Earth?",
                options: ["Gold", "Iron", "Diamond", "Platinum"],
                correct: 2
            },
            {
                id: 4,
                text: "Which particle in an atom has a negative charge?",
                options: ["Proton", "Neutron", "Electron", "Nucleus"],
                correct: 2
            },
            {
                id: 5,
                text: "What is the unit of electric current?",
                options: ["Volt", "Watt", "Ampere", "Ohm"],
                correct: 2
            },
            {
                id: 6,
                text: "What is the largest organ in the human body?",
                options: ["Liver", "Heart", "Skin", "Lungs"],
                correct: 2
            },
            {
                id: 7,
                text: "Which planet is known as the 'Morning Star'?",
                options: ["Mars", "Venus", "Mercury", "Jupiter"],
                correct: 1
            },
            {
                id: 8,
                text: "What does DNA stand for?",
                options: ["Deoxyribonucleic Acid", "Dioxyribose Nucleic Acid", "Deoxyribose Nucleic Acid", "Deoxyribonucleic Atom"],
                correct: 0
            },
            {
                id: 9,
                text: "What is the chemical symbol for Iron?",
                options: ["Ir", "Fe", "In", "Au"],
                correct: 1
            },
            {
                id: 10,
                text: "Which blood type is known as the universal donor?",
                options: ["A", "B", "AB", "O"],
                correct: 3
            },
            {
                id: 11,
                text: "What force keeps planets in orbit around the sun?",
                options: ["Magnetism", "Gravity", "Electricity", "Nuclear Force"],
                correct: 1
            },
            {
                id: 12,
                text: "What is the main component of the Sun?",
                options: ["Oxygen", "Helium", "Hydrogen", "Carbon"],
                correct: 2
            },
            {
                id: 13,
                text: "What is the pH of pure water?",
                options: ["5", "6", "7", "8"],
                correct: 2
            },
            {
                id: 14,
                text: "Which gas makes up about 78% of Earth's atmosphere?",
                options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"],
                correct: 2
            },
            {
                id: 15,
                text: "What is the speed of light in vacuum?",
                options: ["299,792 km/s", "300,000 km/s", "299,792 m/s", "300,000 m/s"],
                correct: 0
            },
            {
                id: 16,
                text: "Which metal is liquid at room temperature?",
                options: ["Sodium", "Mercury", "Lead", "Aluminum"],
                correct: 1
            },
            {
                id: 17,
                text: "What part of the plant conducts photosynthesis?",
                options: ["Roots", "Stem", "Leaves", "Flowers"],
                correct: 2
            },
            {
                id: 18,
                text: "What is the study of fossils called?",
                options: ["Geology", "Paleontology", "Archaeology", "Meteorology"],
                correct: 1
            },
            {
                id: 19,
                text: "Which vitamin is produced when human skin is exposed to sunlight?",
                options: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin K"],
                correct: 2
            },
            {
                id: 20,
                text: "What is the atomic number of Carbon?",
                options: ["4", "6", "8", "12"],
                correct: 1
            },
            {
                id: 21,
                text: "What is Newton's First Law of Motion?",
                options: [
                    "F = ma",
                    "For every action, there is an equal and opposite reaction",
                    "An object at rest stays at rest unless acted upon by a force",
                    "Energy cannot be created or destroyed"
                ],
                correct: 2
            },
            {
                id: 22,
                text: "What is the largest mammal on Earth?",
                options: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
                correct: 1
            },
            {
                id: 23,
                text: "Which element is essential for human blood?",
                options: ["Calcium", "Iron", "Sodium", "Potassium"],
                correct: 1
            },
            {
                id: 24,
                text: "What type of energy is stored in a battery?",
                options: ["Kinetic", "Thermal", "Chemical", "Nuclear"],
                correct: 2
            },
            {
                id: 25,
                text: "What is the center of an atom called?",
                options: ["Electron Cloud", "Proton Center", "Nucleus", "Core"],
                correct: 2
            }
        ]
    },
    {
        id: 'hist_001',
        title: 'World History',
        description: 'Ancient civilizations, world wars, and historical milestones.',
        duration: 45, // 25 questions at 1.8 minutes each
        questions: [
            {
                id: 1,
                text: "In which year did World War II end?",
                options: ["1943", "1945", "1947", "1950"],
                correct: 1
            },
            {
                id: 2,
                text: "Who was the first President of the United States?",
                options: ["Thomas Jefferson", "Abraham Lincoln", "George Washington", "John Adams"],
                correct: 2
            },
            {
                id: 3,
                text: "Which ancient civilization built the pyramids of Giza?",
                options: ["Romans", "Greeks", "Egyptians", "Mayans"],
                correct: 2
            },
            {
                id: 4,
                text: "What was the name of the ship that brought the Pilgrims to America in 1620?",
                options: ["Santa Maria", "Mayflower", "Endeavour", "Victory"],
                correct: 1
            },
            {
                id: 5,
                text: "Who discovered penicillin?",
                options: ["Marie Curie", "Alexander Fleming", "Louis Pasteur", "Isaac Newton"],
                correct: 1
            },
            {
                id: 6,
                text: "Which empire was ruled by Genghis Khan?",
                options: ["Ottoman Empire", "Roman Empire", "Mongol Empire", "British Empire"],
                correct: 2
            },
            {
                id: 7,
                text: "What year did the Titanic sink?",
                options: ["1905", "1912", "1915", "1920"],
                correct: 1
            },
            {
                id: 8,
                text: "Who was the first man to walk on the moon?",
                options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"],
                correct: 1
            },
            {
                id: 9,
                text: "Which war was fought between North and South Korea?",
                options: ["Vietnam War", "Korean War", "Cold War", "Gulf War"],
                correct: 1
            },
            {
                id: 10,
                text: "What ancient city was destroyed by Mount Vesuvius in 79 AD?",
                options: ["Athens", "Rome", "Pompeii", "Carthage"],
                correct: 2
            },
            {
                id: 11,
                text: "Who wrote the Declaration of Independence?",
                options: ["George Washington", "Benjamin Franklin", "Thomas Jefferson", "John Adams"],
                correct: 2
            },
            {
                id: 12,
                text: "What year did the Berlin Wall fall?",
                options: ["1985", "1989", "1991", "1993"],
                correct: 1
            },
            {
                id: 13,
                text: "Who was the Egyptian queen known for her relationships with Roman leaders?",
                options: ["Nefertiti", "Hatshepsut", "Cleopatra", "Sobekneferu"],
                correct: 2
            },
            {
                id: 14,
                text: "What was the main cause of the French Revolution?",
                options: ["Religious conflict", "Economic inequality", "Foreign invasion", "Disease outbreak"],
                correct: 1
            },
            {
                id: 15,
                text: "Who painted the ceiling of the Sistine Chapel?",
                options: ["Raphael", "Donatello", "Michelangelo", "Leonardo da Vinci"],
                correct: 2
            },
            {
                id: 16,
                text: "What ancient civilization invented paper?",
                options: ["Greek", "Roman", "Chinese", "Egyptian"],
                correct: 2
            },
            {
                id: 17,
                text: "Which treaty ended World War I?",
                options: ["Treaty of Versailles", "Treaty of Paris", "Treaty of London", "Treaty of Berlin"],
                correct: 0
            },
            {
                id: 18,
                text: "Who was the first female Prime Minister of the United Kingdom?",
                options: ["Queen Elizabeth II", "Theresa May", "Margaret Thatcher", "Indira Gandhi"],
                correct: 2
            },
            {
                id: 19,
                text: "What year did the American Civil War end?",
                options: ["1863", "1865", "1867", "1870"],
                correct: 1
            },
            {
                id: 20,
                text: "Which explorer is credited with discovering America?",
                options: ["Christopher Columbus", "Vasco da Gama", "Ferdinand Magellan", "Marco Polo"],
                correct: 0
            },
            {
                id: 21,
                text: "What ancient wonder was located in Alexandria?",
                options: ["Great Pyramid", "Hanging Gardens", "Lighthouse", "Colossus"],
                correct: 2
            },
            {
                id: 22,
                text: "Who led the Russian Revolution in 1917?",
                options: ["Joseph Stalin", "Vladimir Lenin", "Leon Trotsky", "Karl Marx"],
                correct: 1
            },
            {
                id: 23,
                text: "What ancient civilization built Machu Picchu?",
                options: ["Aztec", "Maya", "Inca", "Olmec"],
                correct: 2
            },
            {
                id: 24,
                text: "Which war featured the Battle of Waterloo?",
                options: ["Thirty Years War", "Napoleonic Wars", "Hundred Years War", "War of the Roses"],
                correct: 1
            },
            {
                id: 25,
                text: "What year did World War I begin?",
                options: ["1912", "1914", "1916", "1918"],
                correct: 1
            }
        ]
    },
    {
        id: 'geo_001',
        title: 'Geography',
        description: 'Countries, capitals, physical features, and cultural geography.',
        duration: 40, // 25 questions at 1.6 minutes each
        questions: [
            {
                id: 1,
                text: "Which country has the largest population?",
                options: ["India", "United States", "China", "Indonesia"],
                correct: 2
            },
            {
                id: 2,
                text: "What is the longest river in the world?",
                options: ["Amazon", "Nile", "Yangtze", "Mississippi"],
                correct: 1
            },
            {
                id: 3,
                text: "In which continent is the Sahara Desert located?",
                options: ["Asia", "Australia", "Africa", "South America"],
                correct: 2
            },
            {
                id: 4,
                text: "Which mountain range includes Mount Everest?",
                options: ["Andes", "Rockies", "Himalayas", "Alps"],
                correct: 2
            },
            {
                id: 5,
                text: "What is the capital of Japan?",
                options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
                correct: 2
            },
            {
                id: 6,
                text: "What is the smallest country in the world?",
                options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
                correct: 1
            },
            {
                id: 7,
                text: "Which continent is the largest by area?",
                options: ["Africa", "North America", "Asia", "Europe"],
                correct: 2
            },
            {
                id: 8,
                text: "What is the capital of Australia?",
                options: ["Sydney", "Melbourne", "Canberra", "Perth"],
                correct: 2
            },
            {
                id: 9,
                text: "Which sea is the Dead Sea located in?",
                options: ["Red Sea", "Mediterranean Sea", "Caspian Sea", "It's not in a sea"],
                correct: 3
            },
            {
                id: 10,
                text: "What is the largest island in the world?",
                options: ["Greenland", "Australia", "Borneo", "New Guinea"],
                correct: 0
            },
            {
                id: 11,
                text: "Which country is known as the 'Land of the Rising Sun'?",
                options: ["China", "Thailand", "Japan", "South Korea"],
                correct: 2
            },
            {
                id: 12,
                text: "What is the capital of Brazil?",
                options: ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"],
                correct: 2
            },
            {
                id: 13,
                text: "Which desert is the largest in the world?",
                options: ["Gobi Desert", "Sahara Desert", "Arabian Desert", "Antarctic Desert"],
                correct: 1
            },
            {
                id: 14,
                text: "What river flows through Paris?",
                options: ["Thames", "Seine", "Danube", "Rhine"],
                correct: 1
            },
            {
                id: 15,
                text: "Which country has the most time zones?",
                options: ["United States", "China", "Russia", "Canada"],
                correct: 2
            },
            {
                id: 16,
                text: "What is the highest mountain in Africa?",
                options: ["Mount Kenya", "Mount Kilimanjaro", "Mount Stanley", "Mount Meru"],
                correct: 1
            },
            {
                id: 17,
                text: "Which two countries share the longest international border?",
                options: ["Russia-China", "USA-Mexico", "Canada-USA", "Argentina-Chile"],
                correct: 2
            },
            {
                id: 18,
                text: "What is the capital of Egypt?",
                options: ["Alexandria", "Cairo", "Giza", "Luxor"],
                correct: 1
            },
            {
                id: 19,
                text: "Which European country is shaped like a boot?",
                options: ["Greece", "Spain", "Italy", "Portugal"],
                correct: 2
            },
            {
                id: 20,
                text: "What is the largest lake in the world?",
                options: ["Lake Superior", "Caspian Sea", "Lake Victoria", "Lake Baikal"],
                correct: 1
            },
            {
                id: 21,
                text: "Which country is both in Europe and Asia?",
                options: ["Turkey", "Egypt", "Russia", "Greece"],
                correct: 0
            },
            {
                id: 22,
                text: "What is the deepest ocean trench?",
                options: ["Java Trench", "Puerto Rico Trench", "Mariana Trench", "Tonga Trench"],
                correct: 2
            },
            {
                id: 23,
                text: "Which African country was never colonized?",
                options: ["Ethiopia", "South Africa", "Kenya", "Nigeria"],
                correct: 0
            },
            {
                id: 24,
                text: "What is the capital of Canada?",
                options: ["Toronto", "Vancouver", "Montreal", "Ottawa"],
                correct: 3
            },
            {
                id: 25,
                text: "Which continent has the most countries?",
                options: ["Asia", "Africa", "Europe", "South America"],
                correct: 1
            }
        ]
    },
    {
        id: 'eng_001',
        title: 'English Language',
        description: 'Grammar, vocabulary, literature, and language usage.',
        duration: 45, // 25 questions at 1.8 minutes each
        questions: [
            {
                id: 1,
                text: "Which of these is a synonym for 'happy'?",
                options: ["Sad", "Joyful", "Angry", "Tired"],
                correct: 1
            },
            {
                id: 2,
                text: "What is the plural of 'child'?",
                options: ["Childs", "Children", "Childes", "Child's"],
                correct: 1
            },
            {
                id: 3,
                text: "Which word is a preposition?",
                options: ["Run", "Beautiful", "Under", "Quickly"],
                correct: 2
            },
            {
                id: 4,
                text: "What is the past tense of 'go'?",
                options: ["Goed", "Went", "Gone", "Going"],
                correct: 1
            },
            {
                id: 5,
                text: "Which sentence is in the passive voice?",
                options: [
                    "The cat chased the mouse.",
                    "The mouse was chased by the cat.",
                    "The cat is chasing the mouse.",
                    "The cat will chase the mouse."
                ],
                correct: 1
            },
            {
                id: 6,
                text: "What is an antonym for 'generous'?",
                options: ["Kind", "Stingy", "Friendly", "Rich"],
                correct: 1
            },
            {
                id: 7,
                text: "Which punctuation mark shows strong emotion?",
                options: ["Period", "Comma", "Exclamation mark", "Question mark"],
                correct: 2
            },
            {
                id: 8,
                text: "What type of word describes a noun?",
                options: ["Verb", "Adverb", "Adjective", "Pronoun"],
                correct: 2
            },
            {
                id: 9,
                text: "Which is the correct spelling?",
                options: ["Accomodate", "Acommodate", "Accommodate", "Acomodate"],
                correct: 2
            },
            {
                id: 10,
                text: "What is the comparative form of 'good'?",
                options: ["Gooder", "Better", "Best", "More good"],
                correct: 1
            },
            {
                id: 11,
                text: "Which sentence is correct?",
                options: [
                    "Their going to the store.",
                    "There going to the store.",
                    "They're going to the store.",
                    "They going to the store."
                ],
                correct: 2
            },
            {
                id: 12,
                text: "What is a homophone for 'pair'?",
                options: ["Pear", "Pare", "Peer", "Poor"],
                correct: 0
            },
            {
                id: 13,
                text: "Which word is an adverb?",
                options: ["Quick", "Quickly", "Quickness", "Quicken"],
                correct: 1
            },
            {
                id: 14,
                text: "What is the literary term for the main character in a story?",
                options: ["Antagonist", "Protagonist", "Narrator", "Author"],
                correct: 1
            },
            {
                id: 15,
                text: "Which is a compound sentence?",
                options: [
                    "The dog barked loudly.",
                    "The dog barked, and the cat ran away.",
                    "Barking loudly at the mailman.",
                    "The dog that barked loudly."
                ],
                correct: 1
            },
            {
                id: 16,
                text: "What does the prefix 'un-' mean?",
                options: ["Again", "Not", "Before", "After"],
                correct: 1
            },
            {
                id: 17,
                text: "Which is a metaphor?",
                options: [
                    "He runs like the wind.",
                    "Her smile was a ray of sunshine.",
                    "The water was as cold as ice.",
                    "She's taller than her brother."
                ],
                correct: 1
            },
            {
                id: 18,
                text: "What is the literary term for exaggeration?",
                options: ["Simile", "Metaphor", "Hyperbole", "Personification"],
                correct: 2
            },
            {
                id: 19,
                text: "Which word is misspelled?",
                options: ["Definitely", "Separate", "Occasion", "Arguement"],
                correct: 3
            },
            {
                id: 20,
                text: "What type of word replaces a noun?",
                options: ["Adjective", "Verb", "Pronoun", "Conjunction"],
                correct: 2
            },
            {
                id: 21,
                text: "Which is an example of alliteration?",
                options: [
                    "The sun smiled down.",
                    "Peter Piper picked a peck.",
                    "He was as strong as an ox.",
                    "The wind whispered through the trees."
                ],
                correct: 1
            },
            {
                id: 22,
                text: "What is the superlative form of 'bad'?",
                options: ["Badder", "Baddest", "Worse", "Worst"],
                correct: 3
            },
            {
                id: 23,
                text: "Which punctuation is used for possession?",
                options: ["Comma", "Apostrophe", "Semicolon", "Colon"],
                correct: 1
            },
            {
                id: 24,
                text: "What does 'benevolent' mean?",
                options: ["Evil", "Kind", "Large", "Small"],
                correct: 1
            },
            {
                id: 25,
                text: "Which literary device gives human qualities to non-human things?",
                options: ["Simile", "Metaphor", "Personification", "Alliteration"],
                correct: 2
            }
        ]
    }
];