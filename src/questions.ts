/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question } from './types';

export const QUESTIONS: Question[] = [
  {
    id: 'fav-snack',
    category: 'favorites',
    categoryLabel: '🌸 Sweet Favorites',
    text: 'What is your absolute favorite treat or comfort snack to share on a cozy night in?',
    options: [
      { id: 'pizza', text: 'Cheesy Pizza & Garlic Knots', emoji: '🍕' },
      { id: 'sushi', text: 'Fresh Sushi & Sweet Boba Tea', emoji: '🍣' },
      { id: 'icecream', text: 'Pint of Chocolate/Strawberry Ice Cream', emoji: '🍦' },
      { id: 'chips', text: 'Movie Popcorn & Crunchy Snacks', emoji: '🍿' }
    ],
    quizmasterComment: {
      partnerA: "Snacks are the ultimate love language! Tell me what gets your tummy rumbling...",
      partnerBCorrect: "Tummy telepathy! You know exactly what fuels their soul! 🍕",
      partnerBIncorrect: "Oh, so close! Maybe they are secretly craving that other treat today! 🍦"
    }
  },
  {
    id: 'lazy-sunday',
    category: 'favorites',
    categoryLabel: '🌸 Sweet Favorites',
    text: 'What is your absolute favorite way to spend a lazy Sunday morning together?',
    options: [
      { id: 'sleepin', text: 'Sleeping in late & cuddling in bed', emoji: '🛌' },
      { id: 'brunch', text: 'Making soft pancakes & drinking coffee', emoji: '🥞' },
      { id: 'gaming', text: 'Playing cozy video games side-by-side', emoji: '🎮' },
      { id: 'walk', text: 'Going for a sunny, slow stroll in the park', emoji: '🌳' }
    ],
    quizmasterComment: {
      partnerA: "Sundays are sacred. How do we recharge those batteries together?",
      partnerBCorrect: "Bullseye! Sundays are perfect when spent exactly how you predicted! 🥞",
      partnerBIncorrect: "Aw! Although that sounds fun, they preferred a different cozy morning vibe!"
    }
  },
  {
    id: 'sleepy-animal',
    category: 'memory',
    categoryLabel: '🐾 Pictorial & Memory',
    text: 'Which of these adorable animals represents how you act when you are sleepy or tired?',
    options: [
      { id: 'koala', text: 'Koala (Super clingy & wants constant hugs)', emoji: '🐨' },
      { id: 'panda', text: 'Panda (Extremely lazy & just rolls around)', emoji: '🐼' },
      { id: 'kitten', text: 'Kitten (Slightly sassy, grumpy & needs snacks)', emoji: '🐱' },
      { id: 'sloth', text: 'Sloth (Brain is fully turned off, slow replies)', emoji: '🦥' }
    ],
    quizmasterComment: {
      partnerA: "Be honest now! We all have a sleepy animal spirit inside us.",
      partnerBCorrect: "Yes! You've definitely seen them in full sleepy mode! Too cute! 🐨",
      partnerBIncorrect: "Haha! You might think they act like that, but they see themselves differently! 🐾"
    }
  },
  {
    id: 'mood-face',
    category: 'memory',
    categoryLabel: '🐾 Pictorial & Memory',
    text: 'Which emoji represents your immediate response when you see your partner after a long day?',
    options: [
      { id: 'blush', text: '🥰 Heart-eyes blush (Total melt-down)', emoji: '🥰' },
      { id: 'excited', text: '🐕 Excited puppy (Wants to jump up & down)', emoji: '🐕' },
      { id: 'sigh', text: '😮‍💨 Deep relief (Sinking into a relaxed hug)', emoji: '😮‍💨' },
      { id: 'giggle', text: '🤪 Goofy wiggle (Instantly starting to tease you)', emoji: '🤪' }
    ],
    quizmasterComment: {
      partnerA: "Aww, think about that warm, fuzzy feeling when they open the door...",
      partnerBCorrect: "Aww! You felt that same connection! Your hearts are perfectly synced! 🥰",
      partnerBIncorrect: "Close, but their actual heart reaction is just a little different! So lovely anyway."
    }
  },
  {
    id: 'future-trip',
    category: 'future',
    categoryLabel: '✈️ Future Dreams',
    text: 'If we won a surprise getaway trip tomorrow, where would you choose to fly off to?',
    options: [
      { id: 'cabin', text: 'A snowy, wooden mountain cabin with a fireplace', emoji: '🏔️' },
      { id: 'beach', text: 'A pastel cottage on a quiet, turquoise beach', emoji: '🏖️' },
      { id: 'tokyo', text: 'Strolling under pink cherry blossoms in Tokyo/Seoul', emoji: '🌸' },
      { id: 'camping', text: 'Glamping under the bright stars & roasting marshmallows', emoji: '🌌' }
    ],
    quizmasterComment: {
      partnerA: "Let your imagination fly! Where is your dream refuge?",
      partnerBCorrect: "Pack your bags! You two are headed to the exact same mental vacation! 🌌",
      partnerBIncorrect: "Well, that is a gorgeous idea, but their wanderlust is pointing elsewhere! 🗺️"
    }
  },
  {
    id: 'dream-home',
    category: 'future',
    categoryLabel: '✈️ Future Dreams',
    text: 'Which aesthetic represents your absolute dream home together in the future?',
    options: [
      { id: 'cottage', text: 'Cozy forest cottage full of green plants & reading nooks', emoji: '🏡' },
      { id: 'penthouse', text: 'Modern minimalist penthouse with floor-to-ceiling city views', emoji: '🏢' },
      { id: 'farmhouse', text: 'Sunny farmhouse with a golden flower garden & puppy', emoji: '🌻' },
      { id: 'retro', text: 'Whimsical, colorful retro-vintage apartment full of art', emoji: '🎨' }
    ],
    quizmasterComment: {
      partnerA: "Close your eyes & picture your peaceful sanctuary. Which one feels like home?",
      partnerBCorrect: "Perfect! You both share the exact same daydream of your future together! 🏡",
      partnerBIncorrect: "Ah, they have a slightly different vision for the future sanctuary! Time to compare notes! 📝"
    }
  },
  {
    id: 'fight-fix',
    category: 'habits',
    categoryLabel: '💌 Funny Habits',
    text: 'When we have a small argument, which reconciliation tactic do you secretly appreciate the most?',
    options: [
      { id: 'boba', text: 'Bringing me my favorite food or boba as a silent treaty', emoji: '🧋' },
      { id: 'hug', text: 'A sudden, silent "sneak-attack" warm tight hug', emoji: '🫂' },
      { id: 'goofy', text: 'Making silly faces or telling dumb jokes until I giggle', emoji: '🥺' },
      { id: 'letter', text: 'A cute written sticky note or sweet text explaining things', emoji: '💌' }
    ],
    quizmasterComment: {
      partnerA: "It happens to the best of us! How does your heart get soft again?",
      partnerBCorrect: "Spot on! You really know the secret key to unlocking their heart! 🫂",
      partnerBIncorrect: "Oh! Although that works, they secretly appreciate a different sweet gesture more!"
    }
  },
  {
    id: 'superpower',
    category: 'habits',
    categoryLabel: '💌 Funny Habits',
    text: 'What do you think is your secret "Superpower" in our relationship?',
    options: [
      { id: 'planner', text: 'Master planner of cute dates & navigating map routes', emoji: '🗺️' },
      { id: 'dj', text: 'DJ of perfect road trip playlists & cozy bedroom mood music', emoji: '🎵' },
      { id: 'snacker', text: 'snack retriever & master chef of delicious treats', emoji: '🍔' },
      { id: 'cuddler', text: 'Professional warming blanket & cuddle provider', emoji: '🧸' }
    ],
    quizmasterComment: {
      partnerA: "Every partner has an elite skill. What's your legendary power?",
      partnerBCorrect: "Absolutely! You recognize their true legendary talent! 🦸‍♀️",
      partnerBIncorrect: "Hahaha, they claim a different special power! Do you agree? 😂"
    }
  },
  {
    id: 'love-language',
    category: 'favorites',
    categoryLabel: '🌸 Sweet Favorites',
    text: 'If you could receive a surprise gift right now, what would make your heart swell the most?',
    options: [
      { id: 'flowers', text: 'A sweet bouquet of flowers or a small cute toy', emoji: '💐' },
      { id: 'handmade', text: 'Something handmade, thoughtful, or written from the heart', emoji: '🎨' },
      { id: 'spa', text: 'A relaxing massage, spa day, or pure quiet pampering', emoji: '💆‍♀️' },
      { id: 'adventure', text: 'Tickets to a fun concert, museum, or theme park date!', emoji: '🎟️' }
    ],
    quizmasterComment: {
      partnerA: "Treat yourself! Choose the gift that triggers instant hand flutters.",
      partnerBCorrect: "Bingo! You know exactly what sets their heart custom-sparkling! 💐",
      partnerBIncorrect: "Ooh! They actually prefer something else to trigger those happy flutters!"
    }
  },
  {
    id: 'quirky-habit',
    category: 'habits',
    categoryLabel: '💌 Funny Habits',
    text: 'Which of these mildly ridiculous behaviors acts as your signature quirk?',
    options: [
      { id: 'noises', text: 'Making weird random noises/squeaks for no reason', emoji: '🔊' },
      { id: 'stealing', text: 'Secretly stealing your hoodies & over-sized shirts', emoji: '🧥' },
      { id: 'staring', text: 'Staring at you intensely until you notice & look back', emoji: '👁️' },
      { id: 'coldfeet', text: 'Putting my ice-cold hands/feet on you to warm them up', emoji: '🥶' }
    ],
    quizmasterComment: {
      partnerA: "Aha! Time to confess your cute, quirky little sins.",
      partnerBCorrect: "Haha! Yes! You know their quirky habits only too well! 🥶",
      partnerBIncorrect: "Oh! You predicted that one, but they confessed to another silly crime! 😂"
    }
  },
  {
    id: 'first-movie',
    category: 'anniversary_memories',
    categoryLabel: '🎉 Anniversary Memories',
    text: 'What was the first movie or show you watched together?',
    options: [
      { id: 'romcom', text: 'A cute romantic comedy or teen drama', emoji: '🍿' },
      { id: 'horror', text: 'A scary horror/mysterious thriller (perfect for cuddling)', emoji: '👻' },
      { id: 'animated', text: 'A wholesome Disney/Ghibli animated masterpiece', emoji: '🧸' },
      { id: 'action', text: 'An epic action-adventure or sci-fi blockbuster', emoji: '🚀' }
    ],
    quizmasterComment: {
      partnerA: "Let's test your memory! What started your cozy screening sessions together?",
      partnerBCorrect: "Memory master! You recall that screen cuddle perfectly! 🎬",
      partnerBIncorrect: "Aww! No worries, sound the movie horn and plan a re-watch! 🍿"
    }
  },
  {
    id: 'first-date',
    category: 'anniversary_memories',
    categoryLabel: '🎉 Anniversary Memories',
    text: 'Where did you go on your very first official date together?',
    options: [
      { id: 'cafe', text: 'A cozy local coffee shop or tea house', emoji: '☕' },
      { id: 'restaurant', text: 'A nice restaurant or cute dinner spot', emoji: '🍝' },
      { id: 'park', text: 'A slow stroll in the park or botanical garden', emoji: '🌳' },
      { id: 'fun-activity', text: 'A fun activity (bowling, arcade, museum, or concert)', emoji: '🎯' }
    ],
    quizmasterComment: {
      partnerA: "Think back to those butterflies! Where did that magical first date take place?",
      partnerBCorrect: "Aww, yes! That first date location is locked deep in your precious memories! ☕",
      partnerBIncorrect: "Ah, the nervousness of that day might have twisted the memories a bit! ✨"
    }
  },
  {
    id: 'anniversary-season',
    category: 'anniversary_memories',
    categoryLabel: '🎉 Anniversary Memories',
    text: 'What is your favorite memory or way of celebrating our anniversary?',
    options: [
      { id: 'fancy-dinner', text: 'Getting dressed up for a fancy candlelit dinner', emoji: '🕯️' },
      { id: 'getaway', text: 'Taking a cozy weekend trip to escape the city', emoji: '🚗' },
      { id: 'home', text: 'Cooking a delicious dinner together at home with wine/boba', emoji: '🍷' },
      { id: 'no-fuss', text: 'Exchanging thoughtful hand-written notes and cards', emoji: '💌' }
    ],
    quizmasterComment: {
      partnerA: "Anniversaries are milestones of love. How does your heart like to celebrate?",
      partnerBCorrect: "Perfect compatibility! Celebrating love is always sweetest when you match! 💍",
      partnerBIncorrect: "Oh! Though that sounds wonderful, they actually prefer another cozy style! 🥰"
    }
  },
  {
    id: 'endearing-quirk',
    category: 'pet_peeves_quirks',
    categoryLabel: '✨ Pet Peeves & Quirks',
    text: "What's a small habit of your partner that others might find annoying, but you find endearing?",
    options: [
      { id: 'messy', text: 'Leaving random half-empty water cups or messy piles around', emoji: '🥤' },
      { id: 'talking', text: 'Talking constantly or humming during movies or shows', emoji: '💬' },
      { id: 'fidgeting', text: 'Fidgeting constantly or playing with your hair/sleeves', emoji: '💇‍♂️' },
      { id: 'indecisive', text: 'Taking 30 minutes to choose simple things like what to eat', emoji: '🤔' }
    ],
    quizmasterComment: {
      partnerA: "A true partner loves all your little imperfections. Which one is your special quirk?",
      partnerBCorrect: "Unconditional love! You both know exactly what makes you lovable! 💕",
      partnerBIncorrect: "Oh! You picked that, but they think another quirk is their signature cute habit!"
    }
  },
  {
    id: 'eye-roller',
    category: 'pet_peeves_quirks',
    categoryLabel: '✨ Pet Peeves & Quirks',
    text: 'Which habit is most likely to make you laugh and roll your eyes at the same time?',
    options: [
      { id: 'phone', text: 'Showing me 50 pet/meme videos while I am trying to read or work', emoji: '📱' },
      { id: 'shop', text: 'Buying cute things/trinkets that we absolutely do not need', emoji: '🛍️' },
      { id: 'puns', text: 'Telling extremely terrible dad puns and laughing at them alone', emoji: '🥸' },
      { id: 'blanket', text: 'Hogging the entire blanket like an absolute cute burrito', emoji: '🌯' }
    ],
    quizmasterComment: {
      partnerA: "It's a combination of irritation and cute overload! Confess your trait.",
      partnerBCorrect: "Haha! Busted! You knew exactly what silly crime they commit! 🌯",
      partnerBIncorrect: "Whoops! Although that was a solid guess, they went for another eye-roll favorite!"
    }
  },
  {
    id: 'hangry-mode',
    category: 'pet_peeves_quirks',
    categoryLabel: '✨ Pet Peeves & Quirks',
    text: 'How does your partner act when they are secretly HANGRY (hungry and angry)?',
    options: [
      { id: 'silent', text: 'Complete silence (staring blankly into the distance)', emoji: '👁️_👁️' },
      { id: 'whiny', text: 'Extremely whiny (pouting and making funny sad squeaks)', emoji: '🥺' },
      { id: 'sassy', text: 'Super sassy and sarcastic (everything becomes a hilarious debate)', emoji: '💅' },
      { id: 'impatient', text: 'Restless and checking the food tracker app every 10 seconds', emoji: '⏱️' }
    ],
    quizmasterComment: {
      partnerA: "Food can solve everything! Reveal your wild animal hangry identity.",
      partnerBCorrect: "Hangry telepathy! You know that hangry routine only too well! 🥖",
      partnerBIncorrect: "Haha! Maybe you haven't seen them at peak hunger, or they think they're sassier! 🍕"
    }
  },
  {
    id: 'spontaneous-move',
    category: 'future_dreams',
    categoryLabel: '🌌 Future Dreams',
    text: 'If you could spontaneously move anywhere tomorrow, where would your partner choose?',
    options: [
      { id: 'island', text: 'A peaceful tropical island with fresh coconuts and beaches', emoji: '🏝️' },
      { id: 'city', text: 'A hyper-busy neon metropolis like Tokyo, New York, or Paris', emoji: '🗼' },
      { id: 'country', text: 'A slow-living country village with a farm and soft hills', emoji: '🐑' },
      { id: 'europe', text: 'A historic European river town with cobblestones and bakeries', emoji: '🥐' }
    ],
    quizmasterComment: {
      partnerA: "Wanderlust calls! If we could pack a small suitcase and teleport, where are we going?",
      partnerBCorrect: "Passport to the soul! You both have the exact same mental relocation target! 🥐",
      partnerBIncorrect: "A beautiful escape! But their heart-compass is pointing towards a different horizon! 🗺️"
    }
  },
  {
    id: 'bucket-list',
    category: 'future_dreams',
    categoryLabel: '🌌 Future Dreams',
    text: 'What is your ultimate dream bucket-list adventure to experience together?',
    options: [
      { id: 'aurora', text: 'Cuddling under the green glowing Aurora Borealis in Norway', emoji: '🌌' },
      { id: 'balloon', text: 'Flying over fairy chimneys in a hot air balloon in Cappadocia', emoji: '🎈' },
      { id: 'roadtrip', text: 'Buying a cute vintage camper van and driving coast-to-coast', emoji: '🚐' },
      { id: 'scuba', text: 'Diving in the majestic coral reefs and swimming with turtles', emoji: '🐢' }
    ],
    quizmasterComment: {
      partnerA: "Dream big! What represents the summit of your shared experiences?",
      partnerBCorrect: "Wow! To the moon and back! You share the exact same adventure goals! 🌌",
      partnerBIncorrect: "A marvelous dream! But they have an alternative epic adventure in mind!"
    }
  },
  {
    id: 'future-pet',
    category: 'future_dreams',
    categoryLabel: '🌌 Future Dreams',
    text: 'If you could build something crazy in our future backyard, what would you choose?',
    options: [
      { id: 'hottub', text: 'A steamy hot tub under a wooden gazebo with fairy lights', emoji: '🪵' },
      { id: 'treehouse', text: 'A whimsical multi-floor adult treehouse with a reading room', emoji: '🏡' },
      { id: 'cinema', text: 'A giant outdoor cinema screen with cozy bean bag loungers', emoji: '🪐' },
      { id: 'greenhouse', text: 'A lush glass greenhouse full of exotic flowers and herbs', emoji: '🌿' }
    ],
    quizmasterComment: {
      partnerA: "Let's turn that future backyard into a private wonderland! What's the centerpiece?",
      partnerBCorrect: "Dream backyard matched! You should start drawing the blueprint now! 🌿",
      partnerBIncorrect: "Ooh! They actually dreamt of another magical piece of paradise! ✨"
    }
  }
];
