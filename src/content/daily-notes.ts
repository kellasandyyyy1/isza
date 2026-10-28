// One short line per plan card that changes every day, under the card's phase sentence.
// Each is a plain, well established benefit or a small idea for today: one sentence, 12 words or fewer.
// Benefit-framed only: never an instruction, a judgement, an amount or a claim that anything fixes anything.
// Water is the one exception: its lines are friendly nudges to have a glass, each with a gentle benefit.
// Entries without phases suit every phase; the rest only show in the phases listed.

import type { Phase } from "@/lib/cycle";

export interface DailyNote {
  id: string;
  text: string;
  phases?: Phase[];
}

export type DailyNoteCard = "water" | "train" | "food" | "energy" | "sleep" | "social";

const water: DailyNote[] = [
  { id: "water-forget", text: "Don't forget a glass of water, it may help you stay focused." },
  { id: "water-temperature", text: "Time for a sip, water helps your body regulate its temperature." },
  { id: "water-awake", text: "A glass now may help you feel more awake this afternoon." },
  { id: "water-joints", text: "Grab some water, it helps keep the cushioning in your joints." },
  { id: "water-digestion", text: "A glass with your meal supports digestion through the day." },
  { id: "water-nutrients", text: "Sip some water, it is part of how your body carries nutrients." },
  { id: "water-skin", text: "Reach for your bottle, water helps keep your skin comfortable." },
  { id: "water-waking", text: "Start your morning with a glass, it helps you wake up gently." },
  { id: "water-nearby", text: "Keep a bottle nearby so a sip is always within reach." },
  { id: "water-before-moving", text: "Drink some water before you move, it supports your body during exercise." },
  { id: "water-after-moving", text: "A glass after training helps your body recover." },
  { id: "water-calm", text: "A water break may help you feel calmer and clearer." },
  { id: "water-foggy", text: "Feeling foggy, a glass of water may help clear your head." },
  { id: "water-warm-days", text: "On warm days, water helps your body keep cool." },
  { id: "water-clearing", text: "A glass now supports how your body clears out waste." },
  { id: "water-kidneys", text: "Water helps your kidneys do their daily work, so grab a glass." },
  { id: "water-blood", text: "Water is part of your blood, so keep sipping through the day." },
  { id: "water-mouth", text: "Take a sip, water keeps your mouth and lips comfortable." },
  { id: "water-tea", text: "Tea counts too, so a warm cup is a good refill." },
  { id: "water-fruit", text: "Fruits like watermelon and cucumber bring extra water with them." },
  { id: "water-sparkling", text: "Sparkling water counts too, so enjoy the fizz and stay refreshed." },
  { id: "water-lemon", text: "Add a slice of lemon if plain water feels boring today." },
  { id: "water-refill", text: "Refill your bottle between tasks, a quick reset for body and mind." },
  { id: "water-bedside", text: "Keep a glass by your bed, ready for when you wake." },
  { id: "water-meals", text: "Pair a glass with each meal, an easy way to remember water." },
  { id: "water-bag", text: "Pack a bottle in your bag so water goes where you go." },
  { id: "water-warm-drinks", text: "Warm drinks may feel soothing on period days, keep sipping.", phases: ["menstrual"] },
  { id: "water-workouts", text: "Energy often rises now, so pack water for your workouts.", phases: ["follicular"] },
  { id: "water-hard-days", text: "Hard training days often call for extra sips of water.", phases: ["ovulatory"] },
  { id: "water-bloating", text: "You may feel bloated now, and steady sips of water often help.", phases: ["luteal"] },
];

const train: DailyNote[] = [
  { id: "train-muscles-joints", text: "Movement helps keep muscles strong and joints moving well." },
  { id: "train-warm-up", text: "A short warm-up helps your body ease into a workout." },
  { id: "train-rest-days", text: "Rest days are part of how training works." },
  { id: "train-stairs", text: "Taking the stairs once today counts as movement." },
  { id: "train-stretch-tasks", text: "Stretching between tasks gives stiff shoulders a break." },
  { id: "train-sleep", text: "Regular movement supports deeper sleep at night." },
  { id: "train-brisk-walk", text: "A brisk walk counts as cardio." },
  { id: "train-bones", text: "Strength training helps keep bones strong over time." },
  { id: "train-mobility", text: "Five minutes of mobility is a nice break from sitting." },
  { id: "train-dancing", text: "Dancing in the kitchen counts as movement too." },
  { id: "train-cool-down", text: "A cool-down walk helps your breathing settle after training." },
  { id: "train-friend", text: "Moving with a friend can make a session more fun." },
  { id: "train-squats", text: "Bodyweight squats fit anywhere, with no equipment at all." },
  { id: "train-after-meals", text: "Walking after a meal is a gentle way to move." },
  { id: "train-form", text: "Good form matters more than speed or load." },
  { id: "train-mood", text: "Movement supports a steadier mood through the day." },
  { id: "train-gentle", text: "Gentle yoga or walking fits well on quieter days.", phases: ["menstrual"] },
  { id: "train-new-moves", text: "Rising energy makes this a good time to learn new moves.", phases: ["follicular"] },
  { id: "train-hard-warm-up", text: "A thorough warm-up is extra handy before your hardest sessions.", phases: ["ovulatory"] },
  { id: "train-moderate", text: "Steady, moderate sessions often feel good late in the cycle.", phases: ["luteal"] },
];

const food: DailyNote[] = [
  { id: "food-protein", text: "Protein helps your muscles repair after training." },
  { id: "food-iron", text: "Iron is part of how your blood carries oxygen." },
  { id: "food-fiber", text: "Fiber supports steady digestion." },
  { id: "food-magnesium", text: "Magnesium is part of how muscles and nerves work." },
  { id: "food-complex-carbs", text: "Complex carbs like rice, oats and kamote give lasting energy." },
  { id: "food-eggs", text: "Eggs are an easy, affordable source of protein." },
  { id: "food-malunggay", text: "Malunggay adds iron and color to soups like tinola." },
  { id: "food-pre-training", text: "A small snack an hour before training can feel good." },
  { id: "food-monggo", text: "Monggo brings protein and fiber together in one bowl." },
  { id: "food-oats-banana", text: "Oats with banana make a quick, steady breakfast." },
  { id: "food-greens", text: "Leafy greens like kangkong and pechay add iron to a meal." },
  { id: "food-peanut-toast", text: "Peanut butter on toast is a simple pre-workout bite." },
  { id: "food-local-fish", text: "Fish like tamban and galunggong are budget-friendly protein." },
  { id: "food-beans-rice", text: "Adding beans to rice turns it into a fuller meal." },
  { id: "food-yogurt", text: "Yogurt with fruit is an easy afternoon merienda." },
  { id: "food-batch-adobo", text: "Cooking a big batch of adobo makes the week easier." },
  { id: "food-iron-days", text: "Iron-rich foods like dilis and eggs suit these days well.", phases: ["menstrual"] },
  { id: "food-chicken-rice", text: "Chicken and rice after training pairs protein with carbs.", phases: ["follicular"] },
  { id: "food-tuna-bowl", text: "Tuna rice bowls make a quick, protein-rich lunch.", phases: ["ovulatory"] },
  { id: "food-magnesium-foods", text: "Nuts, oats and saba bring magnesium to the table.", phases: ["luteal"] },
];

const energy: DailyNote[] = [
  { id: "energy-daylight", text: "Daylight in the morning helps set your body clock." },
  { id: "energy-walk-outside", text: "A short walk outside can freshen up an afternoon." },
  { id: "energy-batching", text: "Batching hard tasks together leaves calmer time for later." },
  { id: "energy-short-break", text: "A five-minute break between tasks helps focus come back." },
  { id: "energy-sleep", text: "Steady sleep supports steady energy the next day." },
  { id: "energy-screen-break", text: "Stepping away from the screen gives your eyes a rest." },
  { id: "energy-lunch-break", text: "A regular lunch break splits the day into easier chunks." },
  { id: "energy-hardest-first", text: "Doing the hardest task first can make the day feel lighter." },
  { id: "energy-move-between", text: "Moving between meetings supports alertness." },
  { id: "energy-fresh-air", text: "Opening a window or stepping outside brings fresh air in." },
  { id: "energy-tidy-desk", text: "A quick tidy of your desk can clear your head too." },
  { id: "energy-breaks-count", text: "Short breaks are part of working well, not time lost." },
  { id: "energy-plan-tonight", text: "Picking tomorrow's top task tonight makes mornings easier." },
  { id: "energy-music", text: "Music you love can make chores move faster." },
  { id: "energy-water-break", text: "A glass of water is a natural break between tasks." },
  { id: "energy-light-tasks", text: "Lighter tasks fit well in the slower part of the afternoon." },
  { id: "energy-gaps", text: "Gaps in your schedule help on slower days.", phases: ["menstrual"] },
  { id: "energy-new-start", text: "Fresh energy suits starting something new today.", phases: ["follicular"] },
  { id: "energy-big-meeting", text: "A good day for the meeting you have been putting off.", phases: ["ovulatory"] },
  { id: "energy-buffer", text: "Buffer time between tasks keeps the day feeling calmer.", phases: ["luteal"] },
];

const sleep: DailyNote[] = [
  { id: "sleep-repair", text: "Sleep is when your muscles do much of their repair." },
  { id: "sleep-memory", text: "Sleep helps your brain sort and store what you learned." },
  { id: "sleep-steady-bedtime", text: "A steady bedtime helps your body know when to wind down." },
  { id: "sleep-dim-lights", text: "Dimming the lights an hour before bed signals evening." },
  { id: "sleep-phone-away", text: "A phone across the room makes winding down easier." },
  { id: "sleep-cool-dark", text: "A cool, dark room helps many people sleep well." },
  { id: "sleep-warm-shower", text: "A warm shower before bed can help you relax." },
  { id: "sleep-reading", text: "Reading a few pages is a gentle way to end the day." },
  { id: "sleep-wake-time", text: "Waking at a similar time each day supports a steady rhythm." },
  { id: "sleep-list", text: "Writing tomorrow's list clears your mind before bed." },
  { id: "sleep-mood", text: "Sleep supports a steadier mood the next day." },
  { id: "sleep-stretch", text: "A short stretch in bed is a soft way toward sleep." },
  { id: "sleep-bed-for-sleep", text: "Keeping the bed for sleep helps it feel restful." },
  { id: "sleep-morning-light", text: "Morning light helps set up good sleep later that night." },
  { id: "sleep-breathing", text: "Slow breathing for a minute is a calm way to settle." },
  { id: "sleep-routine", text: "A quiet routine at night is part of good recovery." },
  { id: "sleep-extra-rest", text: "Extra rest is welcome on period days.", phases: ["menstrual"] },
  { id: "sleep-easy-now", text: "Sleep often comes easily now, so a steady bedtime fits well.", phases: ["follicular"] },
  { id: "sleep-after-intense", text: "Winding down after intense days helps recovery keep up.", phases: ["ovulatory"] },
  { id: "sleep-earlier", text: "An earlier wind-down often feels good in this phase.", phases: ["luteal"] },
];

const social: DailyNote[] = [
  { id: "social-connection", text: "Connection with people you trust supports a steadier mood." },
  { id: "social-message", text: "A short message to a friend counts as connection." },
  { id: "social-alone", text: "Time alone is a valid way to recharge." },
  { id: "social-saying-no", text: "Saying no to plans is fine when rest sounds better." },
  { id: "social-quick-call", text: "A quick call can feel as good as a long visit." },
  { id: "social-shared-meal", text: "Sharing a meal is an easy way to catch up." },
  { id: "social-laughter", text: "Laughter with friends is part of feeling well." },
  { id: "social-walk", text: "A walk with someone mixes movement and company." },
  { id: "social-neighbor", text: "Small talk with a neighbor counts as connection too." },
  { id: "social-photo", text: "Sending a photo or meme is a light way to stay close." },
  { id: "social-nights-in", text: "Quiet evenings in are a good plan too." },
  { id: "social-talking", text: "Talking things through with someone helps ease stress." },
  { id: "social-voice-message", text: "A voice message is a warm way to check in." },
  { id: "social-one-friend", text: "Plans with one close friend can feel just right." },
  { id: "social-thanks", text: "Thanking someone today is a small, kind connection." },
  { id: "social-group-chat", text: "Group chats can wait until you feel like replying." },
  { id: "social-low-key", text: "Low-key plans and cozy nights in suit these days.", phases: ["menstrual"] },
  { id: "social-saying-yes", text: "You may feel more social now, and saying yes comes easily.", phases: ["follicular"] },
  { id: "social-events", text: "A good stretch for events, dates and catching up.", phases: ["ovulatory"] },
  { id: "social-quiet-time", text: "Protecting some quiet time is part of taking care of yourself.", phases: ["luteal"] },
];

export const DAILY_NOTES: Record<DailyNoteCard, DailyNote[]> = { water, train, food, energy, sleep, social };
