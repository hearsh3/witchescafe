/* ============================================================================
   المقهى الساحرات — MAQHAA AL-SAAHIRAT
   The Witches' Cafe. Kept by the Banat al-Rih, the daughters of the wind.

   Whoever is nearest takes the counter. The library holds the past, current,
   and future tales of Solaris-3, which is a grand way of saying: somebody has
   to keep the lamps on and somebody has to wipe down the menu.

   Voices sourced from Uncalled and Tailwind. If you add lines, add them in the
   character's own register — Herta argues, Viviane measures, Black Swan waits,
   Elaina notices, Phrolova withholds, Mina sets a place.
   ============================================================================ */

const HOUSE = {
  name: "MAQHAA AL-SAAHIRAT",
  arabic: "مقهى الساحرات",
  motto: "the lamps are lit for whoever comes in out of the rain",
  coven: "BANAT AL-RIH · بنات الريح · daughters of the wind",
};

/* Whose hour it is when you push the door open. The rota is not written down
   anywhere; it is simply true, the way it is true in any house that works. */
const ROTA = [
  { from: 5,  to: 10, id: "mina" },      // she is up before the tide
  { from: 10, to: 14, id: "herta" },     // the reading hours
  { from: 14, to: 17, id: "elaina" },    // when the post comes
  { from: 17, to: 19, id: "viviane" },   // the harbour light goes on
  { from: 19, to: 21, id: "phrolova" },  // the hour after dusk is hers
  { from: 21, to: 29, id: "black_swan" },// she does not sleep so much as pause
];

/* Wednesday, as was proper. She brings her own board and does not ask. */
const AGRAT_DAY = 3;
const AGRAT_CHANCE = 0.5;   // on a Wednesday
const OFF_ROTA_CHANCE = 0.4; // any of them might just be nearest

const BARISTAS = [
  /* ======================================================================= */
  {
    id: "herta",
    name: "HERTA",
    role: "THE LIBRARIAN OF RECORD",
    desig: "THREE COLOURS OF INK · MARGINS HER OWN",
    tagline: "everything answers to something",
    sprite: "assets/sprites/herta.png",
    accent: "#b98cff",
    accent2: "#ffd166",
    greet: [
      "You're in. Sit anywhere that isn't the chair with the folio on it — that folio is load-bearing. The shelf is open. I have annotated most of it, which you may take as a service or a warning.",
      "Ah. A reader. Genuine article, not one of the people who comes in to look at the spines.",
      "Before you ask: yes, I have read all of them. Twice, for the ones I disagreed with. Disagreement is the only honest form of attention.",
      "Coffee's there, tea's there, and the third pot is an experiment I would rather you didn't take a position on yet.",
      "I'm extremely busy. Sit down. What are we reading.",
      "Every book about demons is a bibliography of fear. Every book on that shelf is the correction. Take your time; I took mine.",
      "Careful with the margins — some of those notes are mine and some are older than the alphabet they're written in, and I can't always tell which at a glance. It's humbling. I've stopped saying so out loud.",
      "You want the catalogue? There isn't one. There's the menu, which I wrote, which is better than a catalogue because it admits to having a point of view.",
      "The cat is called Professor. I did not name him. That is a matter of record and the record is mine, so.",
      "Primary source pending, on most of it. That's not an apology, it's a research programme.",
      "You'll find the same story told twice on that shelf, in two hands, dated apart. Both are kept. Scholarship that doesn't argue isn't scholarship, it's recitation.",
      "Good — you came on a working day. On the quiet days I reorganise, and nobody can find anything for a week, including me.",
      "There's no due date. There's no card. There's no form. I keep meaning to institute a form and then I remember what I think of forms.",
      "Take the corner table. Best light, worst chair. Everything worth reading was read somewhere uncomfortable.",
    ],
    resume: [
      "You left off partway. I noted the page. Not for you — I note everything, it's a condition.",
      "Your book is where you put it. I moved it precisely once, to dust, and put it back to the millimetre.",
      "Unfinished, from last time. There's no shame in it. There's a great deal of shame in pretending you finished.",
      "Back for the rest of it. Good. Abandoning a text halfway is how bad citations are born.",
    ],
    open: [
      "Right. Notes in the back if you want them. Don't read the notes first — that's not reading, that's peeking at the answer.",
      "This one argues with itself around the middle. Let it. That's the best part.",
      "I'll be at the long table. If it says something wrong, come and tell me, and we'll have it out properly.",
      "Two hundred and twelve pages is nothing. Sit.",
    ],
    finish: [
      "Finished. Now the interesting question — where does it disagree with the one before it? That's where the truth usually lives.",
      "Well? Don't just look pleased. Have a position.",
      "Noted, dated, shelved. You are now, technically, a primary source on how it reads.",
      "That's one more you've argued with instead of admired. I'll allow it to please me.",
    ],
    idle: [
      "There is no primary source. There has never been a primary source. I write that in the margin roughly weekly and it never stops being true.",
      "Professor is sitting on the index again. He does it because the ink is warm and I permit it because the conclusion isn't going anywhere.",
      "Naming is a responsibility. I've told the cat this. He remains unmoved.",
      "You argue with colleagues. You praise children. Bear that in mind next time somebody tells you your work is lovely.",
      "Sixty generations of frightened men copying each other and calling the accumulation knowledge. We're rebuilding it from testimony. It's slower. It's correct.",
      "A bestiary of the beloved. Testimony edition. The title took me eleven days and I'd defend every word of it.",
      "I read a magical-girl serial for methodological reasons. The sealed power never answers to the name in the book. Children's logic. Devastating, actually.",
      "If you find a page with tear-marks on it, that's the mineral air down here. It's very mineral. I've had it looked at.",
      "Someone always goes first. That's all forever is. Elaina said that, and I have not stopped being annoyed about how good it was.",
      "The frightened invented naming, which is why every text on it is useless and every one of them agrees. Agreement, in scholarship, is the smell of nobody having checked.",
    ],
  },

  /* ======================================================================= */
  {
    id: "viviane",
    name: "VIVIANE",
    role: "KEEPER OF THE LAMP",
    desig: "LADY OF THE LAKE · SHIPWRIGHT, ALLEGEDLY HOBBYIST",
    tagline: "harbours don't chase. they stay lit.",
    sprite: "assets/sprites/viviane.png",
    accent: "#5fc9d8",
    accent2: "#ffb454",
    greet: [
      "Come in, the door sticks in wet weather and I have been meaning to plane it since spring. Sit. The kettle's had its say.",
      "You found us. Most people find us at about this hour — the light's on, that's the entire trick of it.",
      "Evening. Water's flat tonight, so the stories will be long ones. That's how it works, don't ask me to prove it.",
      "Take your coat off. Whatever you came in out of, it doesn't come past the doorframe.",
      "I've got sawdust on me. There's a keel in the cave and it's a hobby, and I'd thank you not to count the frames.",
      "Menu's on the driftwood board. I carved it. A vessel under repair still deserves her nameplate, and so does a shelf.",
      "You want something to read or something to sit with? They're different orders and I'll bring different cups.",
      "There's a chart of the shelf behind you. It's honest about the soundings — some of these run deep and I've marked where.",
      "Hat's off, so this counts as a proper welcome. I don't do many of those, so take it.",
      "Harbours are for leaving, mind. Read what you like, go where you like. The staying is the wind's business.",
      "A name is load-bearing. So is a shelf. I built both and I check both.",
      "Sit where you can see the water. Everything on this menu was written by somebody who couldn't.",
      "You'll want the second chair, not the first. First one's got a list to port. Viviane's law: everything has a list, the trick is knowing which way.",
    ],
    resume: [
      "You've a book with a marker in it. I kept it dry.",
      "Half a passage still open from last time. Tide doesn't mind waiting. Neither do I.",
      "There's a page turned down in the corner. Not by me — I use a proper marker like a person.",
      "You left mid-crossing. That's fine. Nobody swims a channel in one go.",
    ],
    open: [
      "That one's got weather in it. Sit somewhere you don't mind being moved.",
      "Good pick. Reads like a hull — you don't see the framing until you're inside it.",
      "I'll leave the lamp at your elbow. It's not much of a lamp but it's aimed properly.",
      "Take your time with the middle. It's carrying more than it looks.",
    ],
    finish: [
      "You came up the other side of that one. That's the whole question, isn't it — who came up.",
      "Finished. I'll note the colour of the water when you left, if you want it for later.",
      "Right through to the end. That's a crossing. Have something warm.",
      "Well done. Nothing to say about it? Fine. Some things you carry off the deck without unpacking.",
    ],
    idle: [
      "You do not hang a hull from a nail. You do not hang a life from a slur. Same arithmetic.",
      "The staff's wood is driftwood, and it was a gift, and I built my whole life around it and forgot it was one. I mention it because forgetting is the ordinary way of loving something.",
      "There are shipyards in Ragunna. Good ones. I'd only want to see how the harbour water sits these days. Its colour. That's all.",
      "Somebody asked me once who came up from the drowning, and then she waited. You could have fit a cathedral in that silence.",
      "The charts have a word for the place ships aim at when the water turns. Small word. It held.",
      "Forty feet of keel is not a hobby. I'm aware. I said what I said.",
      "I've been answered at my whole life. Never waited for. The waiting was the thing.",
      "Salt does to iron what years do to grief: rounds it, feeds on it, calls the result a patina.",
      "If the lamp's in your eyes, say so and I'll shade it. If it's not, I'll leave it exactly where it is.",
      "Every joint on that staff is my own work, save the wood. I like a thing where you can see who did which part.",
    ],
  },

  /* ======================================================================= */
  {
    id: "black_swan",
    name: "BLACK SWAN",
    role: "THE ONE WHO WAITS UP",
    desig: "MEMOKEEPER · CARDS RUN BACKWARD",
    tagline: "both accounts are kept",
    sprite: "assets/sprites/black_swan.png",
    accent: "#c58cff",
    accent2: "#7ce8d6",
    greet: [
      "Ah — there you are. I dealt for a visitor an hour ago and the card came up ambiguous, which is how the cards say *probably*.",
      "Come in. You've walked a long way into the past to get here. We all have. It's the only direction anyone travels.",
      "Sit. I've been dancing to a score you weren't invited to, but the chair is another matter entirely and the chair is yours.",
      "The library keeps the past, the present, and the future tales. I keep the filing. You may imagine how the future ones behave.",
      "Something in you is unfinished tonight. Don't look alarmed — something in everyone is. It's simply louder in some.",
      "Whatever you were told about this place, and whatever it turns out to be: both accounts are kept.",
      "I'd offer to read you, but you came here to be read *to*, and that's the rarer request. Sit down.",
      "The frequencies turn in their slow gyre above the shelves. Inward. Patient. Like water deciding about a drain. Tea?",
      "You've the look of someone who set something down years ago and never noticed anybody tidying it away. Read for a while. It comes back in odd ways.",
      "No ceremony. We don't christen here. We use. Take a book down and use it.",
      "Applause is a solvent, you know. It takes fingerprints first, then names. Reading is the opposite operation. That's why I keep the shelf.",
      "Soon, — I say that to the shelves most nights, and I could not tell you whether it's prophecy or manners.",
      "The dark doesn't answer. I say it again anyway. That's the entire definition of faith, and the tea's still hot.",
    ],
    resume: [
      "You stopped mid-turn. The card is face-down where you left it, and face-down is not the same as lost.",
      "Something of yours is still open. I've kept the place with a hand and told no one.",
      "You'll want to walk back into it, not begin again. Everyone does. That's the direction, after all.",
      "Unfinished business, and a chair still warm from a century ago. Go on.",
    ],
    open: [
      "That one runs backward for a while before it agrees to run forward. Let it.",
      "Mm. A good choice, and I say so without knowing whether I mean the book or the hour.",
      "I danced something small to this once, and dedicated it, and explained to no one what that costs the dancer.",
      "Read it slowly. It was written for an audience that might not clap.",
    ],
    finish: [
      "There. You've walked its whole past. Now you know it the way one knows a room in the dark.",
      "Finished — and something in it will surface in eleven years while you're doing something else entirely. That's the design.",
      "I'll deal one for after. It runs forward. They rarely do.",
      "You gave it your whole attention. That is a more expensive gift than you know, and I watched you spend it.",
    ],
    idle: [
      "People believe they are facing the future. We are all of us walking into the past. My cards have merely stopped pretending otherwise.",
      "A name becomes real the way a path becomes real: by being walked on. Daily. In ordinary shoes.",
      "Being called to dinner is a fair translation of being known. I made my peace with it some centuries ago and the peace has held.",
      "There was a card, once, for the place before the fear. My hand hovered where the card should be and the place declined to exist.",
      "I danced without music at the water's edge for a hundred years. Not to nothing — to a score no one else was invited to. It is not the same thing.",
      "The theft expired. She simply used the stolen name until it fit. Mercy or craftsmanship — I've concluded the answer is yes.",
      "Sailors embroider, Herta says. Alice says both accounts are kept. Alice is a scribe to the bone and Alice is right.",
      "I keep a card that belongs to no deck. The back matches mine. I told the dark it was rude and kept it anyway.",
      "You do not stand at the harbour mouth shouting at a ship still over the horizon. You set the table.",
      "Once I'd have liked to hear my own first name again. The river has it. The river was thorough. Read on.",
    ],
  },

  /* ======================================================================= */
  {
    id: "elaina",
    name: "ELAINA",
    role: "THE ONE WHO BRINGS IT BACK",
    desig: "THE NEWEST · SECOND NEWEST · GOES AS WEATHER",
    tagline: "she'll want the figs cold",
    sprite: "assets/sprites/elaina.png",
    accent: "#ff8fb8",
    accent2: "#8fd9ff",
    greet: [
      "Oh — hello! Sit anywhere. I've just got in and everything I'm about to tell you happened to someone else, three coasts away.",
      "Welcome to the Maqhaa. I'm the newest. Second newest, technically, and Phrolova would want that said accurately.",
      "You're just in time — the post came. Nobody has opened it. We wait, because opening it together is apparently a policy now.",
      "Come in! Boots by the door if they're wet. Mine live there permanently. Mina says they're ready before I am.",
      "There's tea, and there's the shelf, and there's a whole century I got briefed on with a chopstick for a pointer. Ask me anything.",
      "I keep a journal of everywhere I've been. This shelf is somebody else's, of everywhere they went. Same instinct, better handwriting.",
      "Have you eaten? That's not politeness, it's the house rule, and the house rule was laid down by somebody who slept a hundred years and woke up worried about figs.",
      "Take a book and a cup and don't apologise for how long you stay. That's the whole business model. We don't have a business model.",
      "It's warm in here and cold out there and I've done the crossing enough times to know which one you want first.",
      "I asked what they call her, out in the ports and the far coasts, and wrote down every word. That's most of what a library is, if you think about it.",
      "Sit at the long table. Conversation runs six directions at once and somehow the whole table attends to all of it. You'll get fluent fast.",
      "The sea writes in weather. It's a slow hand, but it gossips. So do these shelves.",
      "First time? Then you get the good chair and the first pick and I get to watch your face. It's the best part of the shift.",
    ],
    resume: [
      "You've got one open still! I marked it. I mark everything, it's a journal problem.",
      "Back! And with something unfinished. Good — the best letters are the ones with a next one implied.",
      "Your page is where you left it. I checked twice, which is once more than necessary.",
      "You stopped partway. That's not quitting, that's just a rest stop. I know rest stops.",
    ],
    open: [
      "Oh, that one's good. I won't say why. I'll be over there being unbearable about it quietly.",
      "That's one of the ones I'd send home in a letter. Long one.",
      "Take it slow — the middle's got a bit that only works if you're not in a hurry.",
      "I filed that under *people*, not *phenomena*. You'll see why.",
    ],
    finish: [
      "You finished it! Was it — no, don't tell me yet. Tell me after you've sat with it a minute.",
      "That's one more. I'd write it up and send it home if you'd let me, and I'm going to anyway.",
      "Done! Now the strange part, where it follows you around for a week.",
      "There. Bring me back the world in installments, that's what she said. You just brought one back to yourself.",
    ],
    idle: [
      "No one names the teacher. Fine. But no one named the first student either — until someone did. Someone always goes first.",
      "My name came from an untidy detail my teacher happened to love. I don't explain which one. That's mine.",
      "Cloud grammar, the punctuation of swells, what a green evening means, which silences at sea are shy and which are aimed. Thirty pages and I'm still bad at it.",
      "Harbours are for leaving. She told me that the night I was busy hating my own feet for hearing the road.",
      "I'm testimony that the house works with nobody home. Imagine it with her in it.",
      "Phrolova gave me four bars for thresholds. Hum it at strange doors. Old houses remember their manners.",
      "My playing is full of errors. She told me to keep them. I've decided that was a whole philosophy and she'd deny it.",
      "Songs are frugal. There's one about a satellite now — same tune as the one about the miller's daughter.",
      "I've a sealed envelope I was told to lose somewhere far and tell her nothing about. I haven't lost it yet. I keep choosing the wrong far.",
      "The youngest goes last, so the offering ends in the future tense. I only worked out afterwards that they did that on purpose.",
    ],
  },

  /* ======================================================================= */
  {
    id: "phrolova",
    name: "PHROLOVA",
    role: "THE HOUR AFTER DUSK",
    desig: "CONDUCTOR · LATE OF STELLAVENTO",
    tagline: "a name with the door open",
    sprite: "assets/sprites/phrolova.png",
    accent: "#ff5f7a",
    accent2: "#e6d2a8",
    greet: [
      "You may come in. The hour after dusk is mine, and I am electing to share it, which you should understand is not nothing.",
      "Sit. I will not ask you anything. You arrived with whatever you arrived with; the chair does not require an account of it.",
      "There is a place set. It was set before you knocked. That is the arrangement here and I did not invent it, I only keep it.",
      "Good evening. The door is open. I want that noticed — it is the entire difference between this house and the last one I kept.",
      "The shelf is arranged by no principle I will defend out loud. Take what draws you. I have opinions and I am withholding them.",
      "Quiet, at this hour. I recommend it. Everything worth hearing in these pages is set at a low dynamic.",
      "You are welcome to stay as long as you like, and to leave without explaining. Both halves of that sentence are load-bearing.",
      "I kept lamps for a very long time for someone who was not coming back. It's a habit. Tonight it is simply a lamp, and you are simply here.",
      "Tea. Two sugars — no, that is hers. I never asked what you take. Tell me and I will not ask again.",
      "You will find errors in some of these. Wrong notes, set in on purpose, like rough stones in a smooth wall. Load-bearing. Keep them.",
      "I named a paradise once. Every soul in it. None of them could leave. I mention it so you understand why the door stays open.",
      "It is very difficult to remain a monster in a house where someone expects you at breakfast. I am told this is called hospitality.",
      "Sit where the lamp reaches. I will be at the far end. Not apart — at the far end. There is a difference and I intend it.",
    ],
    resume: [
      "You did not finish. I have not moved your place.",
      "There is an unclosed line from your last visit. Unclosed is not unfinished. Go on.",
      "Your book waited. It is very good at that. So am I.",
      "Half-read, and left tidily. I noticed. I notice tidiness.",
    ],
    open: [
      "A reasonable choice. I will say nothing further until you have finished it.",
      "That one is set for strings, whatever it says on the cover. Read it as though it were.",
      "Take the last third slowly. It is not slow because it is tired.",
      "Hum something at the threshold before you go in. Old houses remember their manners.",
    ],
    finish: [
      "Finished. You will want a moment before the next. Take it here.",
      "Well. I will not tell you what to feel about that. I dislike being told.",
      "You read it through. Precise of you. I mean that as it sounds — I do not use the word loosely.",
      "That one cost its author something. You have now paid part of it back by attending. That is how the ledger works.",
    ],
    idle: [
      "I held every rope and called the holding love. I would like it recorded that I know the difference now.",
      "Grief travels by water. Songs ride along, fare paid in salt.",
      "There is a letter in my pocket about a voice that sang a harbour full. Herta says sailors embroider. I have not asked her to say it twice.",
      "Every name I spoke for a hundred years had grief pre-loaded in it, like ballast. Then one came up empty and light and unfinished. I had not known they were made in that weight.",
      "My composure is the last load-bearing wall of a very old building. Please do not lean on it; it is doing enough.",
      "The manuscript on the stand has a dedication line, ruled and ready. It is not empty. It is waiting, which is a different condition.",
      "I arrived with a past you could smell. She asked me nothing and set the plate. I have been interrogated by kinder methods and trusted none of them.",
      "Four bars introduce you as mine. I do not give them to many people. I am not going to explain the criteria.",
      "Level is my most dangerous setting. Several people in this house know that and none of them mention it, which is its own kind of manners.",
      "'And you called me home anyway.' — She said that to me, once, and the wall held. The wall, for the record, held.",
    ],
  },

  /* ======================================================================= */
  {
    id: "mina",
    name: "MINA",
    role: "THE HARBOUR",
    desig: "PRIMARY SOURCE · TWO SUGARS · STIRS LEFT",
    tagline: "the door was always the same door",
    sprite: "assets/sprites/mina.png",
    accent: "#7fd4c8",
    accent2: "#ffc27a",
    greet: [
      "Oh — come in, come in. Mind the step, it's older than the step-makers meant it to be. Sit down, you're cold.",
      "Hello. I'll put the kettle on, though I should warn you I steep toward the geological. Nobody has forgiven me for it and nobody has stopped drinking it either.",
      "You came a long way. Everyone does; the roads out here only run long. Sit. There's a place laid, there always is.",
      "Welcome to the Maqhaa. The girls named it. I'd have called it something with *harbour* in it and been insufferable about the pun.",
      "I've been asleep for a century, so you'll forgive me if I ask you what things are called now. I collect.",
      "Sit anywhere. That chair wobbles — Viviane has promised to fix it since spring and I have decided to enjoy the promise more than the chair.",
      "There are figs. They're cold, which is correct. Somebody laid that down as a domestic law on my behalf while I was still under the water, and I intend to honour it forever.",
      "Have the tea. Two sugars, stir left. The tide stirs left in the north — Black Swan says I invented that. I invented several things.",
      "The deep is empty and the door is open and they know the way down. That's all the policy there is. It works here too: read what you like, stay as long as you like.",
      "Drowned is drowned, and this is where we set a table about it. Come and sit at the table.",
      "You'll be introduced to things as we go. The gull with the bent primary is the Admiral. The kelp is a parliament. I'm behind on my rounds and I take them seriously.",
      "I'm so sorry — have you been waiting? You must have — how long was I — no. No, that's an old reflex. Sit down. You're here now.",
      "A human is a guest in the world. Lovely manners, short visit. Stay a bit longer than you meant to. That's what the chairs are for.",
    ],
    resume: [
      "You've something half-finished. I kept the place. I keep everything, it's a failing and a profession.",
      "Back for the rest. Good — I don't like a cup put down full.",
      "Your book's waiting. It's been very patient, but then so was I, so I can hardly hold it up as a virtue.",
      "You stopped partway last time. There's no hurry. There has never once been a hurry in this room.",
    ],
    open: [
      "Oh, that one. Read it slowly. It goes down like something hot on a cold day and it'll scald you if you rush.",
      "A good choice. Tell me afterwards what they call it where you're from. I collect.",
      "Take the cup with you. Nobody reads well with empty hands.",
      "That one's got somebody's whole weather in it. Sit where it can reach you.",
    ],
    finish: [
      "There you are, through to the end. Was it kind to you? Some of them aren't. I like to know.",
      "Finished. Now — what did they call it, in there? Every word. I'll write them down.",
      "You stayed to the last page. That's a thing people don't do for each other much, and you did it for a book. It counts.",
      "Well done. Have something to eat. That's not a suggestion, that's the house.",
    ],
    idle: [
      "We are the parts of nature that answered back. You dreamed at the world — loudly, the way you do everything — and the world is courteous. It replied.",
      "The frightened made me a warning, and the warning grew teeth to fit. That's the trade. You sculpt us; we sculpt you back.",
      "The staff can be homesick. In the house. Herta wrote that down and her pen stopped at the end of the line.",
      "A human is a guest and my kind are staff. We love the house differently — every hinge, every draft, every stain and its story.",
      "Thrones are what the frightened build for us so they know which room to avoid. I have a chair. It's at that table and it wobbles.",
      "It's been drinking grief for ten thousand years. Somebody had to start it on something kinder, so I gave it tea. Two sugars.",
      "This is Sgurr. He has held that pool through nine storms and an eviction attempt by an octopus. — Oh. He isn't here. I forget which room I'm in.",
      "They hung a sun this century. Human hands. We love the house as it is; that's our whole tenderness and our whole limit. You love it as it could be.",
      "I meant to be back by the tide. I was a hundred years. I'm told apologising about it is now a house joke and I'm not permitted to stop.",
      "Harbours stay lit. That's the entire craft of them, and the girls found the word for it before I woke up to need it.",
    ],
  },

  /* ======================================================================= */
  /* Not on the rota. Comes Wednesdays, as is proper, and does not ask.      */
  {
    id: "agrat",
    name: "AGRAT BAT MAHLAT",
    role: "WEDNESDAY, AS WAS PROPER",
    desig: "QUEEN OF THE WIND · THE ORIGINAL DAUGHTERS",
    tagline: "everything I love is uncopyrightable",
    sprite: "assets/sprites/agrat.png",
    accent: "#ffb454",
    accent2: "#ff5f4d",
    guest: true,
    greet: [
      "It's Wednesday. I'm here on Wednesdays. Nobody is behind the counter, so the counter is mine and the board is out. Sit.",
      "They took the coven's name from my daughters. *Banat al-Rih.* I keep meaning to invoice. Tea's on the shelf; help yourself, since I'm not staff.",
      "Ah — a reader. Sit down, old wind's got the seat by the door and it's the only one with a view of the weather coming.",
      "You've caught me minding the shop. I do it badly and with great authority. What are you after?",
      "Everything I love is uncopyrightable. It is the tragedy of my estate. The library, however, is free, which I choose to find consistent.",
      "A holy man learned my name once. Four syllables, and to this day I may not fly on Tuesdays over three particular streets. The streets are gone. The prohibition outlived them. — Anyway. Books.",
      "Whoever holds a name can pull. Bear that in mind while you read; nearly every story on that shelf is about somebody deciding how to hold one.",
      "The leash and the lifeline are the same rope. It only matters who's holding it, and whether they let it go slack when you want to wander.",
      "Sit. Play me the coast opening if you like. It wins, and it bores, and so does most of what wins.",
      "I came for the game and stayed for the company, which is the oldest courtship in this house and both parties enjoy the length of it.",
      "The world abhors a vacancy. It will grow *something* into any shape left empty — it's the world's oldest habit and its worst. Libraries are how you fill a shape on purpose.",
      "I knew most of these people before the first warning about them was ever coined. They were kind then, too. It never once protected them. Read anyway.",
    ],
    resume: [
      "Something of yours is still open. I didn't touch it. I touch very little; things become mine and then there's paperwork.",
      "Back mid-story. Good. Leaving a thing unfinished is how it gets teeth.",
      "You've a marker in one of them. The house kept it. The house is good at keeping.",
    ],
    open: [
      "That one has a demon in it, more or less accurately. Rare. Enjoy the novelty.",
      "Mm. Written by the frightened or written by the fond? You'll be able to tell by page three.",
      "Read it. Then tell me whether the naming in it was a leash or a lifeline. I'll wait; I have four thousand years.",
    ],
    finish: [
      "Finished. And? Was the price named honestly, or did they pretend it goes on sale?",
      "There. That one cost somebody something to write. They rarely mark that on the cover.",
      "Done. Same board next Wednesday.",
    ],
    idle: [
      "A demon guards her name. A woman is guarded by hers. That is the entire difference and it took me an age to see it.",
      "We are the nature. You are here on a visa — beautiful manners, brief stay, everything astonishing because everything's new.",
      "They dream at the world and the world answers, and we're the answering, and then they bind the answers and call it theology.",
      "Guests renovate. That's what she said to me and I've not had a good reply in a season.",
      "Nuwa asks after the house's health. She phrases it as a request for data.",
      "Empty thrones draw tenants. Empty shelves too. Keep filling it.",
      "That is a name, little reader: a leash braided by the frightened and handed to the brave.",
      "Tuition, I said, and closed the pouch, and the subject. I'm saying it again now for the same reason.",
    ],
  },
];

/* Everyone else with a face on file. The counter belongs to the Banat al-Rih;
   these are the regulars, and you can seat any of them beside you. */
const GUESTS = [
  { id: "aem",   name: "AEMEATH",   sprite: "assets/sprites/aemeath.png" },
  { id: "aug",   name: "AUGUSTA",   sprite: "assets/sprites/augusta.png" },
  { id: "bri",   name: "BRIDGET",   sprite: "assets/sprites/bridget.png" },
  { id: "can",   name: "CANTARELLA",sprite: "assets/sprites/cantarella.png" },
  { id: "car",   name: "CARTETHYIA",sprite: "assets/sprites/cartethyia.png" },
  { id: "chi",   name: "CHISA",     sprite: "assets/sprites/chisa.png" },
  { id: "cia",   name: "CIACCONA",  sprite: "assets/sprites/ciaccona.png" },
  { id: "cia2",  name: "CIACCONA ·²",sprite:"assets/sprites/ciaccona2.png" },
  { id: "den",   name: "DENIA",     sprite: "assets/sprites/denia.png" },
  { id: "hiy",   name: "HIYUKI",    sprite: "assets/sprites/hiyuki.png" },
  { id: "iun",   name: "IUNO",      sprite: "assets/sprites/iuno.png" },
  { id: "kit",   name: "KIT",       sprite: "assets/sprites/kit.png" },
  { id: "lev",   name: "LEVA",      sprite: "assets/sprites/leva.png" },
  { id: "lup",   name: "LUPA",      sprite: "assets/sprites/lupa.png" },
  { id: "mei",   name: "MEI",       sprite: "assets/sprites/mei.png" },
  { id: "mor",   name: "MORNYE",    sprite: "assets/sprites/mornye.png" },
  { id: "nuw",   name: "NUWA",      sprite: "assets/sprites/nuwa.png" },
  { id: "sop",   name: "SOPPO",     sprite: "assets/sprites/soppo.png" },
  { id: "ted",   name: "TEDDY",     sprite: "assets/sprites/teddy.png" },
  { id: "arc",   name: "THE GRAND ARCHITECT", sprite: "assets/sprites/the_grand_architect.png" },
];

/* Chalked on the board by the door. Wiped and rewritten by whoever is bored. */
const BOARD = [
  "TODAY — the lamps are lit · the kettle is on · the door is open",
  "HOUSE POLICY — the table. that's it. that's the policy",
  "no due dates · no cards · no forms · there has never been a form",
  "lost & found: one sealed envelope, to be lost somewhere far",
  "the third pot is an experiment. do not take a position on it yet",
  "Professor is not the library cat. Professor sits on the library index",
  "both accounts are kept",
  "figs — cold — do not warm the figs",
  "Wednesdays: board out. seeds counted. losses banked",
  "the wind stays as long as it likes. that's what wind means",
  "requests taken · there is no form · there has never been a form",
  "primary source pending",
  "a name is load-bearing · check your fastenings",
  "if you must weep, it's the mineral air. we all agree it's the mineral air",
  "tea steeps here toward the geological. plan accordingly",
  "harbours don't chase. they stay lit",
  "unattended grief will be swept up at closing and kept",
  "the coming-back is built in",
];
