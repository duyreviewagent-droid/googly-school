// Every decision in Googly School. g is how good the choice is: 2 = the BEST decision … -2 = the WORST decision.
// e: what it changes — a subject (math english science history art pe), grades (all of them), pop, conduct, energy, money,
// friend / crush / bully (how they feel about you), det (detentions), flags (remembered for later).
// risk: { p, e, r, det } — a chance of getting caught, with its own result. {me}, {friend}, {crush}, {bully} are filled in.
export const CAST = {
  friend: { name: 'Jojo', color: '#ffb02a', look: { top: '#2a8a5a', style: 'hoodie', hat: 'backcap', hatColor: '#d83a2a', pants: '#2e4a7a' } },
  crush: { name: 'Sky', color: '#6ad8ff', look: { top: '#f4f0e8', style: 'sweater', hat: 'headphones', hatColor: '#ff6aa8', pants: '#3a3a3e' } },
  bully: { name: 'Brock', color: '#8a3a2a', look: { top: '#1a1a1e', style: 'jersey', num: 13, hat: 'backcap', hatColor: '#1a1a1e', pants: '#3a3a3e' }, size: 1.18, brows: true },
  nerd: { name: 'Milo', color: '#9ae86a', look: { top: '#e8e0c8', style: 'polo', hat: 'glasses', pants: '#b8a078' } },
  queen: { name: 'Madison', color: '#ff8ad8', look: { top: '#ff5aa8', style: 'tee', hat: 'shades', pants: '#f4f4f4' } },
  jock: { name: 'Chad', color: '#e8a86a', look: { top: '#d8202a', style: 'jersey', num: 23, hat: 'none', pants: '#3a3a3e' } },
  artsy: { name: 'Rain', color: '#b88aff', look: { top: '#3a3a4a', style: 'hoodie', hat: 'beanie', hatColor: '#ffd23a', pants: '#1e2230' } },
  gamer: { name: 'Pixel', color: '#5aff9a', look: { top: '#2a2a3a', style: 'hoodie', hat: 'headphones', hatColor: '#3aff6a', pants: '#3a3a3e' } },
};

// ------------------------------------------------------------------ hallway moments (between classes and before school)
export const HALL = [
  { id: 'bully_money', who: 'bully', years: [1], text: '{bully} slams your locker shut. "New kid. Lunch money. Now."', choices: [
    { t: 'Hand over $5', g: -1, e: { money: -5, pop: -3, bully: 5 }, r: '{bully} pockets it. "Same time tomorrow, shrimp."' },
    { t: 'Say no and walk away', g: 2, e: { pop: 4, bully: -5, conduct: 1 }, r: '{bully} blinks. Nobody has ever just… left. People noticed.' },
    { t: 'Tell a teacher', g: 1, e: { conduct: 3, pop: -2, bully: -10 }, r: 'Mr. Numbers walks {bully} to the office. Some kids call you a snitch.' },
    { t: 'Shove him into the lockers', g: -2, e: { pop: 3, conduct: -12, bully: -15 }, det: 1, r: 'CLANG. A teacher saw the whole thing. Detention.' },
  ] },
  { id: 'friend_homework', who: 'friend', text: '{friend}: "Dude. I forgot the math homework. Can I copy yours? Please?"', choices: [
    { t: 'Help them do it fast', g: 2, e: { friend: 8, math: 2, energy: -3 }, r: 'You explain it in 3 minutes. {friend} actually gets it now.' },
    { t: 'Let them copy', g: -1, e: { friend: 5, conduct: -2 }, risk: { p: 0.35, e: { math: -6, conduct: -8, friend: -3 }, r: 'Mr. Numbers notices two identical wrong answers. You BOTH get zeros.' }, r: '{friend} copies it word for word. You got away with it.' },
    { t: 'Say no', g: 0, e: { friend: -6 }, r: '{friend} sulks all the way to class.' },
    { t: 'Sell it to them for $5', g: -2, e: { money: 5, friend: -12 }, r: '{friend} pays. {friend} will remember this.' },
  ] },
  { id: 'crush_hi', who: 'crush', text: '{crush} is at the locker next to yours, dropping books everywhere.', choices: [
    { t: 'Help pick them up', g: 2, e: { crush: 10, pop: 2 }, r: '{crush} smiles. "Thanks! You\'re nice." Your googly eyes spin.' },
    { t: 'Laugh at them', g: -2, e: { crush: -15, pop: -2 }, r: 'Everybody heard. {crush} will not forget that.' },
    { t: 'Pretend you didn\'t see', g: 0, e: { crush: -2 }, r: 'You stare at your locker very hard.' },
    { t: 'Do a cool slide on the books', g: -1, e: { crush: -4, pop: 3, energy: -4 }, r: 'You slide, you slip, you land on your back. Some kids clap.' },
  ] },
  { id: 'skip_invite', who: 'jock', text: '{jock}: "We\'re skipping next period to get tacos. You in?"', choices: [
    { t: 'Go get tacos', g: -2, e: { pop: 6, energy: 8, money: -4 }, flags: { skipNext: 1 }, r: 'You sneak out the back. Best tacos ever. Your seat in class is empty.' },
    { t: 'No thanks, I have class', g: 2, e: { conduct: 2 }, r: '{jock} shrugs. "Nerd." You get to class on time.' },
    { t: 'Tell them it\'s a bad idea', g: 1, e: { pop: -2, conduct: 2 }, r: '{jock} laughs and goes anyway. Two of them get caught.' },
  ] },
  { id: 'lost_wallet', who: 'any', text: 'You find a wallet on the floor with $20 inside. Nobody is looking.', choices: [
    { t: 'Turn it in to the office', g: 2, e: { conduct: 6, pop: 2 }, r: 'It belonged to the lunch lady. She gives you free fries forever.', flags: { fries: 1 } },
    { t: 'Keep the money', g: -2, e: { money: 20, conduct: -3 }, risk: { p: 0.25, e: { conduct: -15, pop: -5 }, det: 1, r: 'A hall camera saw you. The principal calls you in.' }, r: 'You feel rich. And a little gross.' },
    { t: 'Ask around whose it is', g: 1, e: { pop: 3 }, r: 'It\'s a freshman\'s. They thank you ten times.' },
  ] },
  { id: 'fight_crowd', who: 'any', text: 'Two kids are about to fight by the fountain. A crowd is forming and phones are out.', choices: [
    { t: 'Go get a teacher', g: 2, e: { conduct: 5 }, r: 'Coach Whistle breaks it up. Nobody gets hurt.' },
    { t: 'Film it for the likes', g: -2, e: { pop: 4, conduct: -8 }, risk: { p: 0.4, e: { conduct: -10 }, det: 1, r: 'The video gets back to the principal. Detention for filming.' }, r: 'The video gets 400 views. You feel kind of bad.' },
    { t: 'Step in and calm them down', g: 1, e: { pop: 5, energy: -6 }, r: 'You say something so weird that both of them start laughing.' },
    { t: 'Yell "FIGHT! FIGHT!"', g: -1, e: { pop: 2, conduct: -6 }, r: 'Very helpful. Everyone runs over. A teacher glares at you.' },
  ] },
  { id: 'new_kid', who: 'any', text: 'A new kid is standing in the hallway holding their schedule upside down.', choices: [
    { t: 'Show them where to go', g: 2, e: { pop: 3, conduct: 2 }, r: 'They make it to class. They sit with you at lunch later.' },
    { t: 'Send them to the wrong room', g: -2, e: { pop: 1, conduct: -5 }, r: 'They end up in the janitor\'s closet. Not cool.' },
    { t: 'Ignore them', g: 0, e: {}, r: 'Someone else helps them. Eventually.' },
  ] },
  { id: 'graffiti', who: 'artsy', text: '{artsy} hands you a marker. "Tag the bathroom mirror with me. It\'s ART."', choices: [
    { t: 'Draw a giant googly eye', g: -2, e: { pop: 5, art: 2, conduct: -10 }, risk: { p: 0.45, e: { conduct: -10 }, det: 1, r: 'The janitor recognises your style. Detention, and you have to clean it.' }, r: 'It\'s beautiful. It\'s also vandalism.', flags: { prank: 1 } },
    { t: '"Let\'s do a mural for the art room instead"', g: 2, e: { art: 6, pop: 2 }, r: 'Mx. Palette LOVES the idea. You start a real mural.' },
    { t: 'No way', g: 1, e: { conduct: 1 }, r: '{artsy} rolls their eyes but puts the marker away.' },
  ] },
  { id: 'energy_drink', who: 'jock', text: '{jock} offers you a huge can of Mega Blast energy drink. "It\'s got 9 shots of caffeine, bro."', choices: [
    { t: 'Chug it', g: -1, e: { energy: 25, science: -2 }, r: 'You can see sounds now. Your hands are shaking. That\'s not good.', flags: { crash: 1 } },
    { t: 'Drink some water instead', g: 2, e: { energy: 6 }, r: 'Boring. Also correct.' },
    { t: 'Sell it to a freshman', g: -1, e: { money: 3, conduct: -3 }, r: 'The freshman vibrates through third period.' },
  ] },
  { id: 'janitor_mess', who: 'janitor', text: 'Mr. Mop slipped and dropped his whole bucket. Water is everywhere.', choices: [
    { t: 'Help him clean up', g: 2, e: { conduct: 6, energy: -4 }, r: 'Mr. Mop gives you a thumbs up. "You\'re alright, kid."', flags: { mopFriend: 1 } },
    { t: 'Slide through the water', g: -1, e: { pop: 3, energy: -3 }, r: 'Wheeee— SPLAT. Worth it? Mr. Mop sighs.' },
    { t: 'Walk around it', g: 0, e: {}, r: 'You tiptoe past.' },
  ] },
  { id: 'rumor', who: 'queen', text: '{queen}: "Oh my gosh, did you hear what {friend} did? Want me to tell everyone?"', choices: [
    { t: '"Stop spreading rumors"', g: 2, e: { friend: 6, pop: -2 }, r: '{queen} is shocked. {friend} hears you stood up for them.' },
    { t: '"Tell me EVERYTHING"', g: -1, e: { pop: 3, friend: -6 }, r: 'You hear it all. By lunch, the whole school does too.' },
    { t: 'Start an even bigger rumor', g: -2, e: { pop: 5, friend: -12, conduct: -4 }, r: 'Now there\'s a rumor that {friend} is secretly a robot. {friend} is not amused.' },
  ] },
  { id: 'phone_found', who: 'any', text: 'Somebody left their phone on the stairs. It\'s unlocked. Messages are popping up.', choices: [
    { t: 'Take it to the office', g: 2, e: { conduct: 4 }, r: 'The owner gets it back. Nice.' },
    { t: 'Post something silly from it', g: -2, e: { pop: 4, conduct: -8 }, risk: { p: 0.5, e: { conduct: -10 }, det: 1, r: 'They figure out it was you in about four minutes. Detention.' }, r: 'You post "I LOVE MATH" from their account. Everyone is confused.' },
    { t: 'Read their messages', g: -1, e: { pop: 1 }, r: 'Mostly memes. You feel weird about it.' },
  ] },
  { id: 'club_ask', who: 'nerd', text: '{nerd}: "Want to join chess club? We have snacks. And a trophy. Well, a participation trophy."', choices: [
    { t: 'Join chess club', g: 2, e: { math: 4, pop: -1 }, flags: { chess: 1 }, r: 'You\'re in. {nerd} is thrilled.' },
    { t: '"Chess is for nerds"', g: -1, e: { pop: 1 }, r: '{nerd} walks away. Their googly eyes droop.' },
    { t: '"Maybe later"', g: 0, e: {}, r: '"Okay! The offer is always open!"' },
  ] },
  { id: 'tryouts', who: 'jock', years: [1, 2], text: '{jock}: "Basketball tryouts are today after school. You should come!"', choices: [
    { t: 'Sign up for tryouts', g: 1, e: { pe: 4, pop: 3, energy: -5 }, flags: { team: 1 }, r: 'You make the team! (Barely. But still!)' },
    { t: '"I\'d rather study"', g: 1, e: { grades: 1 }, r: '{jock} shakes his head in disbelief.' },
    { t: '"Sports are dumb"', g: -1, e: { pop: -3 }, r: 'Several jocks heard that.' },
  ] },
  { id: 'hall_pass', who: 'friend', text: '{friend}: "I made a fake hall pass. It looks SO real. We can wander all period!"', choices: [
    { t: 'Use the fake pass', g: -2, e: { pop: 3, grades: -2 }, flags: { skipNext: 1 }, risk: { p: 0.5, e: { conduct: -15 }, det: 2, r: 'The principal holds the pass up to the light. "Googlesworth" is spelled wrong. Two detentions.' }, r: 'You wander the halls feeling like a spy.' },
    { t: '"Rip that up, dude"', g: 2, e: { friend: -2, conduct: 2 }, r: '{friend} sighs and tears it up. Probably for the best.' },
    { t: 'Take it and turn it in', g: -1, e: { conduct: 4, friend: -15 }, r: 'You turned in your best friend. {friend} is FURIOUS.' },
  ] },
  { id: 'bully_nerd', who: 'bully', text: '{bully} is holding {nerd}\'s backpack over a trash can.', choices: [
    { t: '"Put it down, Brock."', g: 2, e: { pop: 5, bully: -8, conduct: 2 }, flags: { hero: 1 }, r: 'Everyone turns to look. {bully} drops it and stomps off. {nerd} will never forget this.' },
    { t: 'Laugh along', g: -2, e: { pop: 2, bully: 8, conduct: -3 }, r: '{bully} grins at you. {nerd} looks crushed.' },
    { t: 'Go get a teacher', g: 1, e: { conduct: 3 }, r: 'Ms. Prose arrives. {bully} gets detention.' },
    { t: 'Walk past', g: -1, e: {}, r: 'You hear the backpack hit the trash.' },
  ] },
  { id: 'vend_stuck', who: 'any', text: 'Your chips got stuck in the vending machine. Kids are watching.', choices: [
    { t: 'Shake the machine', g: -1, e: { conduct: -3 }, risk: { p: 0.3, e: { energy: -10 }, r: 'The machine tips. You jump back just in time. A teacher saw.' }, r: 'Two bags fall. Bonus chips!' },
    { t: 'Ask the office for help', g: 1, e: {}, r: 'The secretary rolls her eyes and gets your chips out.' },
    { t: 'Walk away sadly', g: 0, e: { energy: -2 }, r: 'Goodbye, chips.' },
  ] },
  { id: 'crush_notes', who: 'crush', years: [2, 3], text: '{crush}: "I missed history yesterday… can I borrow your notes?"', choices: [
    { t: 'Sure! (and explain them)', g: 2, e: { crush: 10, history: 2 }, r: 'You study together for ten minutes. Best ten minutes of the week.' },
    { t: '"Only if you go out with me"', g: -1, e: { crush: -8 }, r: '"Uh… never mind." That was weird.' },
    { t: 'Give them fake notes', g: -2, e: { crush: -20 }, r: 'The notes say "History is when stuff happened. The end." {crush} fails the quiz.' },
  ] },
  { id: 'teacher_help', who: 'teacher', text: 'Mrs. Olden is struggling to carry a giant box of textbooks.', choices: [
    { t: 'Carry it for her', g: 2, e: { history: 3, conduct: 4, energy: -3 }, r: '"What a helpful googly!" She will remember this at grading time.' },
    { t: 'Keep walking', g: 0, e: {}, r: 'She drops three books. Somebody else helps.' },
    { t: 'Trip her "by accident"', g: -2, e: { conduct: -15, pop: 2 }, det: 1, r: 'That\'s just mean. Everyone saw. Detention.' },
  ] },
  { id: 'dare', who: 'jock', text: '{jock}: "I dare you to lick the flagpole. It\'s like, a school tradition."', choices: [
    { t: 'Lick it', g: -2, e: { pop: 5, energy: -6 }, r: 'It tastes like pennies and regret. Everyone cheers.' },
    { t: '"I dare YOU."', g: 1, e: { pop: 4 }, r: '{jock} does it. His tongue sticks for a second. Legend.' },
    { t: 'Just walk away', g: 1, e: {}, r: 'Smart. Tongues are important.' },
  ] },
  { id: 'running', who: 'any', text: 'You\'re late and the hall is empty. You could RUN.', choices: [
    { t: 'Sprint!', g: 0, e: { energy: -4 }, risk: { p: 0.3, e: { conduct: -3 }, r: 'Principal Googlesworth steps out of a doorway. "WALK, please."' }, r: 'Zoom.' },
    { t: 'Walk like a normal person', g: 1, e: {}, r: 'Calm and collected.' },
  ] },
  { id: 'gum', who: 'gamer', text: '{gamer} is sticking chewed gum under every desk in the hall display. "Achievement unlocked."', choices: [
    { t: 'Add your own gum', g: -2, e: { pop: 2, conduct: -6 }, risk: { p: 0.35, e: { conduct: -8 }, det: 1, r: 'Mr. Mop catches you mid-stick. Detention (scraping gum).' }, r: 'Gross. But you\'re part of the team now.' },
    { t: '"Dude, gross."', g: 1, e: {}, r: '{gamer} shrugs. "Your loss."' },
    { t: 'Tell Mr. Mop', g: 1, e: { conduct: 3, pop: -2 }, r: 'Mr. Mop hands {gamer} a scraper.' },
  ] },
  { id: 'friend_sad', who: 'friend', text: '{friend} looks really down. "My parents are fighting a lot. I don\'t wanna go home."', choices: [
    { t: 'Listen and walk them to the counselor', g: 2, e: { friend: 15, conduct: 2 }, r: '{friend} talks to the counselor. They say it helped a lot.' },
    { t: 'Make them laugh', g: 1, e: { friend: 8 }, r: 'You do your best googly impression of the principal. They laugh until they cry.' },
    { t: '"That\'s not my problem"', g: -2, e: { friend: -20 }, r: '{friend} goes quiet. That hurt.' },
  ] },
  { id: 'fire_dare', who: 'bully', years: [2, 3], text: '{bully}: "Bet you won\'t pull the fire alarm. Chicken."', choices: [
    { t: 'Pull it', g: -2, e: { pop: 6, conduct: -25 }, flags: { alarm: 1 }, det: 2, r: 'BRRRRING! The whole school empties onto the lawn. They know it was you.' },
    { t: '"I\'m not a chicken, I\'m smart"', g: 2, e: { pop: 2, bully: -4 }, r: '{bully} clucks at you. Nobody else does.' },
    { t: 'Make chicken noises back', g: 1, e: { pop: 4, bully: 4 }, r: 'Everyone laughs. At {bully}.' },
  ] },
  { id: 'selfie', who: 'queen', years: [2, 3], text: '{queen} wants a selfie with you for her 10,000 followers.', choices: [
    { t: 'Strike a pose', g: 1, e: { pop: 8 }, r: 'You go mini-viral. "Who is the googly next to Madison??"' },
    { t: 'Do a weird face', g: 1, e: { pop: 5 }, r: 'The weird face becomes a meme. You\'re famous (kind of).' },
    { t: 'Photobomb and steal her phone', g: -2, e: { pop: -5, conduct: -6 }, r: 'You run off with her phone for a joke. It is not funny to her.' },
  ] },
  { id: 'answers_sale', who: 'gamer', years: [2, 3], text: '{gamer}: "I\'ve got the answers to the next test. $10. Totally legit."', choices: [
    { t: 'Buy them', g: -2, e: { money: -10 }, flags: { answers: 1 }, risk: { p: 0.4, e: { conduct: -20 }, det: 2, r: 'A teacher finds the answer sheet in your backpack. Two detentions.' }, r: 'You fold the paper into your pocket. Your heart is pounding.' },
    { t: 'Report it to a teacher', g: 2, e: { conduct: 8, pop: -3 }, r: 'The test gets rewritten. Some kids are mad, but it was right.' },
    { t: '"Nah, I\'ll just study"', g: 2, e: { grades: 1 }, r: 'Look at you, being responsible.' },
  ] },
  { id: 'senior_prank', who: 'jock', years: [3], text: '{jock}: "SENIOR PRANK. We\'re filling the principal\'s office with 1,000 balloons. You in?"', choices: [
    { t: 'Blow up balloons all day', g: -1, e: { pop: 10, energy: -10 }, flags: { prank: 1 }, risk: { p: 0.3, e: { conduct: -12 }, det: 1, r: 'Googlesworth is not laughing. Detention for the whole crew.' }, r: 'The principal opens the door. POOF. Even he laughs a little.' },
    { t: 'Plan a nicer prank: breakfast for teachers', g: 2, e: { pop: 5, conduct: 8 }, r: 'You leave donuts in every classroom. Best "prank" ever.' },
    { t: 'Snitch', g: -1, e: { conduct: 3, pop: -10 }, r: 'The prank gets cancelled. The seniors know who snitched.' },
  ] },
  { id: 'college_talk', who: 'teacher', years: [3], text: 'Ms. Prose: "Have you started your college essays? The deadline is soon."', choices: [
    { t: 'Stay after to work on them', g: 2, e: { english: 5, energy: -6 }, flags: { essays: 1 }, r: 'You write about the day you became a googly. It\'s really good.' },
    { t: '"I\'ll do it the night before"', g: -1, e: {}, r: 'Ms. Prose sighs the sigh of a hundred teachers.' },
    { t: '"College is a scam"', g: -1, e: { english: -2 }, r: '"Well… maybe trade school, then? Have a plan!"' },
  ] },
  { id: 'bully_sorry', who: 'bully', years: [3], text: '{bully} looks nervous. "Hey… I was a jerk to you. My brother used to do it to me. Sorry."', choices: [
    { t: 'Accept the apology', g: 2, e: { bully: -30, pop: 3 }, flags: { bullyFriend: 1 }, r: 'You shake hands. {bully} actually smiles. Weird. Nice, though.' },
    { t: '"Too late."', g: 0, e: {}, r: '{bully} nods and walks off.' },
    { t: 'Film it and post it', g: -2, e: { pop: 2, bully: 20, conduct: -4 }, r: 'Everyone laughs at {bully}. Now YOU\'RE the bully.' },
  ] },
];

// ------------------------------------------------------------------ lunch: what you buy, and what happens at each table
export const LUNCH_MENU = { text: 'Miss Gloop: "What\'ll it be, hon?"', choices: [
  { t: 'Pizza ($3)', g: 0, cost: 3, e: { energy: 14 }, r: 'Greasy. Perfect.', food: 'pizza' },
  { t: 'Salad ($2)', g: 2, cost: 2, e: { energy: 18, pe: 1 }, r: 'Crunchy and green. Your body says thank you.', food: 'salad' },
  { t: 'Mystery Meat ($1)', g: -1, cost: 1, e: { energy: 6 }, risk: { p: 0.35, e: { energy: -15 }, r: 'Your stomach makes a noise like a whale. You spend 20 minutes in the restroom.' }, r: 'It tastes like… Tuesday?', food: 'meat' },
  { t: 'Nothing, save money', g: -1, cost: 0, e: { energy: -6, money: 0 }, r: 'Your stomach growls through all of fifth period.' },
] };
export const TABLE_EVENTS = {
  jocks: [
    { text: '{jock}: "Arm wrestle for my dessert?"', choices: [
      { t: 'Arm wrestle', g: 0, e: { pe: 2, pop: 3, energy: -4 }, r: 'You lose, but it was close. They respect it.' },
      { t: 'Challenge to a pudding-eating contest', g: -1, e: { pop: 6, energy: -6 }, r: 'You win. Nobody should eat that much pudding.' },
      { t: 'Politely decline', g: 0, e: {}, r: '"Weak, bro." But he gives you the dessert anyway.' },
    ] },
    { text: 'The jocks are chanting "FOOD FIGHT! FOOD FIGHT!"', choices: [
      { t: 'Throw the first tater tot', g: -2, e: { pop: 8, conduct: -15 }, flags: { foodfight: 1 }, det: 1, r: 'FOOD FIGHT!!! Chaos. Glorious chaos. Then detention.' },
      { t: 'Duck under the table', g: 1, e: {}, r: 'Smart. A meatball flies over your head.' },
      { t: '"Guys. Chill."', g: 1, e: { pop: -2, conduct: 2 }, r: 'They chill. Mostly.' },
    ] },
  ],
  popular: [
    { text: '{queen} looks you up and down. "Um, who invited you?"', choices: [
      { t: 'Compliment her shoes', g: 1, e: { pop: 5 }, r: '"Ugh, finally someone noticed." You get to stay.' },
      { t: 'Sit down anyway, confidently', g: 1, e: { pop: 6 }, r: 'Confidence is everything. They let you stay.' },
      { t: 'Insult her back', g: -1, e: { pop: -4 }, r: 'The table goes silent. You eat alone after all.' },
      { t: 'Leave for your friends\' table', g: 2, e: { friend: 5 }, r: '{friend} saved you a seat.' },
    ] },
    { text: 'The popular kids are planning a party this weekend.', choices: [
      { t: 'Ask if you can come', g: 0, e: { pop: 3 }, r: '"I guess?" You\'re on the list!', flags: { party: 1 } },
      { t: 'Offer to DJ', g: 1, e: { pop: 7 }, r: 'You\'re officially the DJ. No pressure.', flags: { party: 1 } },
      { t: '"Parties are overrated"', g: 0, e: { pop: -2 }, r: 'Everyone stares at you like you have three eyes.' },
    ] },
  ],
  nerds: [
    { text: '{nerd}: "We\'re studying for the test. Want to join our flashcard circle?"', choices: [
      { t: 'Study with them', g: 2, e: { grades: 3, pop: -1 }, r: 'You learn more in 15 minutes than in a whole week.' },
      { t: 'Steal their flashcards', g: -2, e: { conduct: -6, nerd: 0 }, r: 'You run. You trip. The flashcards go everywhere.' },
      { t: 'Just eat and listen', g: 1, e: { grades: 1 }, r: 'Some of it sinks in!' },
    ] },
    { text: '{nerd} built a tiny robot out of a juice box. "Want to see it walk?"', choices: [
      { t: '"That\'s so cool!"', g: 2, e: { science: 3, friend: 0 }, r: 'It walks three steps and falls over. Everyone cheers.' },
      { t: 'Flick it off the table', g: -2, e: { pop: 1, conduct: -4 }, r: 'The robot is gone. {nerd}\'s eyes fill with tears.' },
    ] },
  ],
  artsy: [
    { text: '{artsy}: "Draw on my cast with me? Everyone\'s signing it."', choices: [
      { t: 'Draw an amazing googly', g: 1, e: { art: 3, pop: 2 }, r: 'Honestly, it\'s the best drawing on there.' },
      { t: 'Write something rude', g: -2, e: { pop: -3 }, r: 'Now {artsy} has to wear that for six weeks.' },
    ] },
  ],
  gamers: [
    { text: '{gamer}: "1v1 me on my phone. Loser gives up their dessert."', choices: [
      { t: 'Play (and try hard)', g: 0, e: { pop: 3, energy: -2 }, r: 'You win by one point. The table goes wild.' },
      { t: 'Play until class starts', g: -1, e: { energy: -4 }, flags: { lateLunch: 1 }, r: 'You look up. Everyone is gone. The bell rang a while ago.' },
    ] },
  ],
  band: [
    { text: 'The band kids are doing a lunch-table drum solo with forks.', choices: [
      { t: 'Join in', g: 1, e: { pop: 4, art: 2 }, r: 'You find the rhythm. You ARE the rhythm.' },
      { t: 'Start a fork war', g: -1, e: { conduct: -5, pop: 2 }, r: 'A fork lands in Miss Gloop\'s hairnet.' },
    ] },
  ],
  friends: [
    { text: '{friend}: "I\'m starving. Can I have half your lunch?"', choices: [
      { t: 'Share it', g: 2, e: { friend: 8, energy: -4 }, r: '{friend}: "You\'re the best. I owe you forever."' },
      { t: 'Eat it all in front of them', g: -2, e: { friend: -10 }, r: 'Very slowly. Very rudely.' },
      { t: 'Buy them a snack', g: 2, e: { friend: 10, money: -2 }, r: '{friend} hugs you. Googly eyes everywhere.' },
    ] },
    { text: '{friend}: "Dude. {crush} is looking at you. Go talk to them!"', choices: [
      { t: 'Go say hi', g: 1, e: { crush: 8, pop: 2 }, r: 'You say "hi." They say "hi." That\'s a start.' },
      { t: 'Hide behind your tray', g: 0, e: {}, r: 'Very subtle.' },
      { t: 'Send {friend} to do it for you', g: -1, e: { crush: -2, friend: -2 }, r: '{friend} says something so embarrassing you want to evaporate.' },
    ] },
  ],
  empty: [
    { text: 'You sit alone at the empty table. It\'s very quiet.', choices: [
      { t: 'Read a book', g: 1, e: { english: 3, energy: 4 }, r: 'Peaceful. You finish a whole chapter.' },
      { t: 'Do tomorrow\'s homework', g: 2, e: { grades: 2 }, r: 'Tonight is going to be SO free.' },
      { t: 'Invite the new kid over', g: 2, e: { pop: 4 }, r: 'Now there are two of you. Then five. It\'s a table now.' },
    ] },
  ],
};

// ------------------------------------------------------------------ in class (on top of the teacher's questions)
export const CLASS_TEMPT = [
  { text: '{friend} passes you a note: "this class is SO boring 😴 draw the teacher as a potato"', choices: [
    { t: 'Draw an amazing potato teacher', g: -1, e: { pop: 3, S: -2 }, risk: { p: 0.35, e: { conduct: -6, S: -2 }, r: '{teacher} intercepts the note and reads it OUT LOUD. The class dies laughing. You don\'t.' }, r: 'Your potato is a masterpiece. {friend} snorts.' },
    { t: 'Ignore it and take notes', g: 2, e: { S: 3 }, r: 'You actually understand today\'s lesson.' },
    { t: 'Write back "stop, I\'m learning"', g: 1, e: { S: 1, friend: -1 }, r: '{friend} dramatically slumps in their chair.' },
  ] },
  { text: 'Your phone buzzes in your pocket. It could be important. (It\'s probably a meme.)', choices: [
    { t: 'Check it under the desk', g: -1, e: { S: -2 }, risk: { p: 0.4, e: { conduct: -5 }, r: '"Is that a PHONE?" {teacher} takes it until the end of the day.' }, r: 'It\'s a meme. A really good one though.' },
    { t: 'Leave it', g: 2, e: { S: 2 }, r: 'Focused. Proud of you.' },
    { t: 'Turn the volume ALL the way up for a laugh', g: -2, e: { pop: 3, conduct: -8 }, det: 1, r: 'A loud airhorn sound fills the room. Detention.' },
  ] },
  { text: 'Your eyes feel SO heavy. The teacher\'s voice is like a lullaby.', choices: [
    { t: 'Take a tiny nap', g: -1, e: { energy: 12, S: -4 }, risk: { p: 0.5, e: { conduct: -4, pop: -2 }, r: 'You snore. LOUDLY. Everyone turns around. There\'s drool.' }, r: 'Zzz… you wake up refreshed and totally lost.', sleep: true },
    { t: 'Splash water on your face', g: 2, e: { energy: 4, S: 2 }, r: 'Awake! You ask to go to the fountain and come right back.' },
    { t: 'Pinch yourself and focus', g: 1, e: { S: 1 }, r: 'Ow. But you\'re awake.' },
  ] },
  { text: 'The kid next to you left their homework out. It\'s all done. Yours isn\'t.', choices: [
    { t: 'Copy it real quick', g: -2, e: { S: 2 }, risk: { p: 0.35, e: { S: -8, conduct: -8 }, r: '{teacher}: "Interesting. You BOTH spelled \'the\' wrong." Zeros for both.' }, r: 'Done. Got away with it this time.' },
    { t: 'Admit you didn\'t do it', g: 2, e: { S: -1, conduct: 2 }, r: '{teacher} gives you until tomorrow. Honesty helps.' },
    { t: 'Do it fast right now', g: 1, e: { S: 1, energy: -2 }, r: 'Rushed but yours.' },
  ] },
  { text: '{teacher} turns around to write on the board. The room is very quiet…', choices: [
    { t: 'Throw a paper ball at the board', g: -2, e: { pop: 5, conduct: -10 }, throwIt: true, risk: { p: 0.55, e: { conduct: -5 }, det: 1, r: '{teacher} spins around. "Who threw that?!" Everyone looks at you. Detention.' }, r: 'Bullseye! Nobody saw. The class is trying not to laugh.' },
    { t: 'Keep writing notes', g: 2, e: { S: 2 }, r: 'Good.' },
    { t: 'Make a tiny googly noise', g: -1, e: { pop: 2, conduct: -2 }, r: '"Boing." Three people giggle.' },
  ] },
  { text: 'You have no idea what\'s going on in this lesson.', choices: [
    { t: 'Raise your hand and ask', g: 2, e: { S: 5, pop: -1 }, raise: true, r: '{teacher} explains it again. Suddenly it clicks. Half the class was lost too.' },
    { t: 'Pretend you get it', g: -1, e: { S: -3 }, r: 'You nod along. You get none of it.' },
    { t: 'Ask {friend}', g: 1, e: { S: 2 }, r: '{friend} explains it wrong but confidently. You kind of get it.' },
  ] },
  { text: 'Somebody behind you is kicking your chair. Over and over.', choices: [
    { t: 'Ask them nicely to stop', g: 2, e: { conduct: 1 }, r: '"Oh — sorry!" They stop.' },
    { t: 'Turn around and yell', g: -1, e: { conduct: -5 }, r: '"IS THERE A PROBLEM BACK THERE?" says {teacher}. Yes. You.' },
    { t: 'Kick their desk back', g: -2, e: { conduct: -8, pop: 1 }, risk: { p: 0.5, e: { conduct: -4 }, det: 1, r: 'The desk screeches across the floor. Detention.' }, r: 'Chair war. Nobody wins.' },
  ] },
  { text: 'A substitute is teaching today. They don\'t know anyone\'s name.', choices: [
    { t: 'Answer to a fake name', g: -1, e: { pop: 5, conduct: -3 }, r: 'You are "Sir Googlington III" for the day.' },
    { t: 'Be helpful to the sub', g: 2, e: { S: 2, conduct: 4 }, r: 'The sub leaves a note: "{me} was wonderful."' },
    { t: 'Convince them class is cancelled', g: -2, e: { pop: 8, S: -5, conduct: -10 }, risk: { p: 0.6, e: { conduct: -5 }, det: 1, r: 'The sub checks with the office. Detention for the whole plan.' }, r: 'Half the class leaves. Chaos.' },
  ] },
  { text: 'Pop quiz! The teacher walks around the room handing them out.', quiz: true },
  { text: 'You\'re starving. There\'s a bag of chips in your backpack.', choices: [
    { t: 'Eat them super quietly', g: -1, e: { energy: 5 }, risk: { p: 0.45, e: { conduct: -3 }, r: 'CRUNCH. The loudest chip in the history of chips.' }, r: 'The quietest crunching ever done by a googly.' },
    { t: 'Wait for lunch', g: 1, e: {}, r: 'Your stomach growls in protest.' },
    { t: 'Share them with the whole row', g: 0, e: { pop: 4, conduct: -2 }, r: 'Now the whole row is crunching.' },
  ] },
  { text: '{crush} sits next to you today. Your googly eyes will not stop wobbling.', choices: [
    { t: 'Whisper a joke', g: 0, e: { crush: 5, S: -1 }, r: '{crush} laughs silently. It was worth it.' },
    { t: 'Focus on the lesson', g: 1, e: { S: 2 }, r: 'Smart. {crush} notices you\'re smart.' },
    { t: 'Stare at them the whole period', g: -1, e: { crush: -4, S: -3 }, r: '"Um. Is there something on my face?"' },
  ] },
  { text: 'Group project time. Your group wants you to do ALL the work.', choices: [
    { t: 'Split the work fairly', g: 2, e: { S: 4, pop: 1 }, r: 'Everyone does their part. A+ project.' },
    { t: 'Do nothing, let them carry', g: -2, e: { S: -3, pop: -3 }, r: 'They put "did nothing" next to your name on the poster.' },
    { t: 'Do it all yourself', g: 1, e: { S: 5, energy: -8 }, r: 'Exhausting, but it looks amazing.' },
  ] },
];
export const ART_PROMPTS = [
  { text: 'Mx. Palette: "Today, paint something that makes you feel something."', choices: [
    { t: 'Paint your family', g: 2, e: { art: 6 }, r: 'Mx. Palette gets a little teary.' },
    { t: 'Trace a picture from your phone', g: -1, e: { art: -3 }, risk: { p: 0.5, e: { art: -6 }, r: '"This is literally a famous painting." Busted.' }, r: 'It looks great. It isn\'t yours though.' },
    { t: 'Paint Principal Googlesworth as a clown', g: -2, e: { pop: 6, art: 2, conduct: -6 }, risk: { p: 0.4, e: { conduct: -5 }, det: 1, r: 'The painting ends up in the hallway show. So does detention.' }, r: 'Everyone sneaks a look. Honestly, it\'s a good likeness.' },
  ] },
  { text: 'You knock over a jar of blue paint. It\'s spreading across the table.', choices: [
    { t: 'Clean it up right away', g: 2, e: { art: 2, conduct: 2 }, r: 'Fast hands. Barely a stain.' },
    { t: 'Turn it into art', g: 1, e: { art: 5 }, r: 'You call it "The Ocean Is Sad." Mx. Palette loves it.' },
    { t: 'Blame {friend}', g: -2, e: { friend: -10 }, r: '{friend} stares at you. "Seriously?"' },
  ] },
  { text: 'Clay day! Everyone is making pots.', choices: [
    { t: 'Make a careful vase', g: 2, e: { art: 5 }, r: 'It\'s lopsided, but it\'s beautiful.' },
    { t: 'Make a clay googly of yourself', g: 1, e: { art: 4, pop: 2 }, r: 'Everyone wants one now.' },
    { t: 'Throw clay at the ceiling', g: -2, e: { pop: 4, conduct: -8 }, throwIt: true, r: 'It sticks. It will stay there for 30 years.' },
  ] },
  { text: 'The art show is next week. Want to enter something?', choices: [
    { t: 'Enter and work extra hard', g: 2, e: { art: 7, energy: -5 }, flags: { artshow: 1 }, r: 'Your piece gets an honorable mention!' },
    { t: 'Maybe next year', g: 0, e: {}, r: 'Maybe.' },
  ] },
];
export const PE_PROMPTS = [
  { text: 'Coach Whistle: "DODGEBALL! Pick a side!"', choices: [
    { t: 'Go all in', g: 1, e: { pe: 6, energy: -8, pop: 3 }, r: 'You catch a ball out of the air. The gym goes nuts.' },
    { t: 'Hide in the back', g: -1, e: { pe: -3 }, r: 'You survive by being forgettable.' },
    { t: 'Peg Coach Whistle', g: -2, e: { pop: 8, conduct: -10 }, throwIt: true, det: 1, r: 'THWACK. Right on the whistle. Legendary. Detention.' },
  ] },
  { text: 'Coach: "Mile run. Four laps. Go!"', choices: [
    { t: 'Run your best', g: 2, e: { pe: 6, energy: -10 }, r: 'New personal record!' },
    { t: 'Walk and chat', g: -1, e: { pe: -3, pop: 2 }, r: 'Coach blows the whistle at you twelve times.' },
    { t: 'Cut across the field', g: -2, e: { pe: -5, conduct: -4 }, r: 'You "finish" in two minutes. Coach is not fooled.' },
  ] },
  { text: 'You forgot your gym clothes.', choices: [
    { t: 'Tell Coach the truth', g: 2, e: { pe: -1 }, r: 'You sit out today, but Coach appreciates it.' },
    { t: 'Play in your normal clothes', g: 1, e: { pe: 2, energy: -4 }, r: 'Sweaty jeans. But you tried!' },
    { t: 'Say your dog ate them', g: -1, e: { pe: -3 }, r: '"Your dog ate your SHORTS?" Coach writes it down.' },
  ] },
  { text: 'Basketball practice drills. {jock} is hogging the ball.', choices: [
    { t: 'Call for a pass and hustle', g: 2, e: { pe: 5, pop: 2 }, r: 'Swish! Coach nods.' },
    { t: 'Steal it from your own teammate', g: -1, e: { pe: 2, pop: -2 }, r: 'Technically a good steal. Socially, not great.' },
    { t: 'Sit on the ball', g: -1, e: { pe: -3, pop: 3 }, r: 'Nobody can play. You are the ball throne.' },
  ] },
  { text: 'Climbing the rope today. It goes up to the ceiling.', choices: [
    { t: 'Climb to the top', g: 2, e: { pe: 7, energy: -8 }, r: 'You ring the bell at the top! Coach cheers!' },
    { t: 'Climb halfway and slide down', g: 1, e: { pe: 3 }, r: 'Rope burn. But still, halfway!' },
    { t: 'Swing on it like Tarzan', g: -1, e: { pop: 4, pe: -1, conduct: -2 }, r: 'AAAAHHH-AH-AHHH!' },
  ] },
];

// ------------------------------------------------------------------ the evening at home (between days)
export const NIGHT = { text: 'After school at home. What do you do tonight?', choices: [
  { t: '📚 Study and do homework', g: 2, e: { grades: 3, energy: -6 }, r: 'Your brain is full. Tomorrow is going to go well.' },
  { t: '🎮 Video games until 3 AM', g: -2, e: { energy: -25, pop: 2, grades: -2 }, r: 'You beat the final boss. Your alarm goes off 4 hours later.' },
  { t: '😴 Sleep early', g: 1, e: { energy: 30 }, r: 'You wake up feeling like a brand new googly.' },
  { t: '🍕 Hang out with friends', g: 0, e: { pop: 5, friend: 5, energy: -10, money: -4 }, r: 'Pizza, jokes, and way too much soda.' },
  { t: '🧹 Do chores for allowance', g: 1, e: { money: 10, energy: -4 }, r: 'Your room is clean. Your wallet is not empty.' },
  { t: '🌙 Sneak out after curfew', g: -2, e: { pop: 6, energy: -20 }, risk: { p: 0.45, e: { conduct: -10, energy: -5 }, r: 'Your mom was waiting in the kitchen with the lights off. Grounded.' }, r: 'You and {friend} get ice cream at midnight. Your mom never finds out.' },
] };

// ------------------------------------------------------------------ getting called to the principal's office
export const OFFICE = { text: 'Principal Googlesworth folds his hands. "Explain yourself."', choices: [
  { t: 'Tell the truth and apologize', g: 2, e: { conduct: 6 }, r: '"I appreciate your honesty. Try to do better." He sounds like he means it.', soften: true },
  { t: 'Blame someone else', g: -2, e: { conduct: -6, friend: -5 }, r: '"I have it on camera." Oh. Right. Cameras.' },
  { t: 'Argue that it wasn\'t a big deal', g: -1, e: { conduct: -3 }, r: '"It\'s a big deal to ME." He writes something down.' },
  { t: 'Cry huge googly tears', g: 0, e: {}, r: 'He hands you a tissue. It doesn\'t get you out of it, but he feels bad.' },
] };

// ------------------------------------------------------------------ big days
export const SPECIAL = {
  dance: { text: 'The HOMECOMING DANCE. The music is loud and the gym is full of balloons.', choices: [
    { t: 'Ask {crush} to dance', g: 1, e: { crush: 12, pop: 4 }, dance: true, r: 'A slow song comes on. You dance. Nobody else exists.', need: { crush: 45 }, fail: { e: { crush: -2, pop: -2 }, r: '"Oh, um, I\'m getting punch." Ouch.' } },
    { t: 'Dance like nobody\'s watching', g: 1, e: { pop: 8, energy: -8 }, dance: true, r: 'Everybody was watching. They loved it. You invented a dance.' },
    { t: 'Stand by the wall all night', g: 0, e: { energy: 4 }, r: 'The wall is a good listener.' },
    { t: 'Dump a bag of glitter on the dance floor', g: -2, e: { pop: 5, conduct: -12 }, det: 1, r: 'The gym will sparkle until the end of time. Mr. Mop weeps.' },
  ] },
  election: { text: 'Class president speeches. It\'s your turn at the podium. The whole school is watching.', choices: [
    { t: '"I\'ll fix the bathrooms and get better lunches"', g: 2, e: { pop: 6 }, vote: 1.2, r: 'Real promises. People clap. Loudly.' },
    { t: '"FREE PIZZA EVERY DAY!" (you can\'t)', g: -1, e: { pop: 10 }, vote: 1.4, r: 'The crowd goes WILD. You have no idea how to do this.' },
    { t: 'Roast the other candidates', g: -2, e: { pop: 4, conduct: -6 }, vote: 0.9, r: 'Some people laugh. Some people boo. The teachers look horrified.' },
    { t: 'Freeze up and say "uh… vote for me?"', g: 0, e: { pop: -2 }, vote: 0.6, r: '"…Thank you." Silence. Somebody coughs.' },
  ] },
  talent: { text: 'The TALENT SHOW! You\'re next. The spotlight is on the stage.', choices: [
    { t: 'Sing your heart out', g: 1, e: { pop: 10, art: 4 }, perform: 'sing', r: 'You hit the high note. The gym erupts.', need: { art: 70 }, fail: { e: { pop: 3 }, r: 'You miss the high note by a lot. But people cheer for the effort!' } },
    { t: 'Do a googly eye trick', g: 1, e: { pop: 8 }, perform: 'eyes', r: 'You spin your pupils in opposite directions. Somebody faints.' },
    { t: 'Tell jokes about the teachers', g: -1, e: { pop: 12, conduct: -8 }, perform: 'joke', r: 'The students scream laughing. The teachers do not.' },
    { t: 'Chicken out', g: -1, e: { pop: -4 }, r: 'You run off the stage before the music starts.' },
  ] },
  game: { text: 'THE CHAMPIONSHIP GAME. Googlies vs. the Eastside Eyeballs. Tied, 10 seconds left.', team: true, choices: [
    { t: 'Take the last shot yourself', g: 1, e: { pop: 12, pe: 5 }, shoot: 0.55, r: 'SWISH! GOOGLIES WIN! They carry you off the court!', fail: { e: { pop: -3 }, r: 'Clank. Off the rim. Overtime… and a loss.' } },
    { t: 'Pass to the open teammate', g: 2, e: { pop: 8, pe: 4 }, shoot: 0.7, r: 'Perfect pass. {jock} scores. GOOGLIES WIN! Everyone knows it was your assist.', fail: { e: { pop: 1 }, r: 'Great pass. Bad shot. We lose by one.' } },
    { t: 'Try a half-court trick shot', g: -1, e: { pop: 3 }, shoot: 0.15, r: 'NO WAY. IT WENT IN. You\'re a legend forever.', fail: { e: { pop: -6 }, r: 'It hits the scoreboard. Coach puts his face in his hands.' } },
  ], watch: [
    { t: 'Cheer as loud as you can', g: 2, e: { pop: 5, energy: -4 }, r: 'Your voice is gone, but the Googlies win!' },
    { t: 'Paint your face in school colors', g: 1, e: { pop: 6, art: 2 }, r: 'Blue and gold googly! You end up on the local news.' },
    { t: 'Heckle the other team\'s parents', g: -2, e: { conduct: -10 }, det: 1, r: 'A dad in a sweater vest reports you. Detention.' },
    { t: 'Leave early to beat traffic', g: 0, e: { energy: 6 }, r: 'You hear the cheering from the parking lot.' },
  ] },
  college: { text: 'Senior year. The counselor asks where you\'re applying to college.', choices: [
    { t: 'Googly University (the best, super hard)', g: 1, e: {}, flags: { apply: 'top' }, r: 'Big dreams! It depends on your grades and your essays.' },
    { t: 'State college (solid choice)', g: 2, e: {}, flags: { apply: 'state' }, r: 'Smart and realistic.' },
    { t: 'Art school', g: 1, e: {}, flags: { apply: 'art' }, r: 'Follow your heart (and your paintbrush).' },
    { t: 'Nowhere. I\'ll figure it out', g: -1, e: {}, flags: { apply: 'none' }, r: 'The counselor writes "…" in her notes.' },
  ] },
  prom: { text: 'PROM NIGHT. Everyone is dressed up. The gym looks like Paris.', choices: [
    { t: 'Ask {crush} to be your prom date', g: 1, e: { crush: 15, pop: 5 }, dance: true, r: '"I was hoping you\'d ask." You dance under the paper Eiffel Tower.', need: { crush: 55 }, fail: { e: { crush: -3, pop: -2 }, r: '"Oh — I already said yes to someone else. Sorry!"' } },
    { t: 'Go with your friends as a group', g: 2, e: { friend: 12, pop: 6 }, dance: true, r: 'You and {friend} do the worm at the same time. Iconic.' },
    { t: 'Campaign hard for Prom Royalty', g: 0, e: { pop: 4, energy: -6 }, flags: { royalty: 1 }, r: 'You hand out 200 googly-eye stickers with your face on them.' },
    { t: 'Spike the punch with hot sauce', g: -2, e: { pop: 3, conduct: -15 }, det: 1, r: 'Forty seniors breathe fire at once. They know it was you.' },
  ] },
};
