import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Utensils,
  Info,
  CheckCircle2,
  AlertCircle,
  Plane,
  Train,
  Bed,
  Camera,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  Wifi,
  Navigation,
  Footprints,
  Cloud,
  Sun,
  CloudRain,
  Thermometer,
  Languages,
  BookOpen
} from 'lucide-react';

const App = () => {
  const [activePart, setActivePart] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVocabOpen, setIsVocabOpen] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [weather, setWeather] = useState({});
  const [jpyAmount, setJpyAmount] = useState('1000');
  const [expandedEventId, setExpandedEventId] = useState(null);

  const getEventTypeBanner = (type, activity) => {
    const images = {
      food: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&q=80&w=1000",
      transport: "https://images.unsplash.com/photo-1533415112101-7b3b3a0ccb00?auto=format&fit=crop&q=80&w=1000",
      hotel: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000",
      sight: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=1000",
      walk: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&q=80&w=1000",
      default: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=1000"
    };

    if (!activity) return images.default;

    const actLower = activity.toLowerCase();
    if (actLower.includes('haneda') || actLower.includes('airport')) return "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=1000";
    if (actLower.includes('teamlab')) return "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000";
    if (actLower.includes('shibuya') || actLower.includes('scramble')) return "https://images.unsplash.com/photo-1542051812871-75750865d5eb?auto=format&fit=crop&q=80&w=1000";
    if (actLower.includes('uji') || actLower.includes('matcha') || actLower.includes('tea')) return "https://images.unsplash.com/photo-1582788325997-6aafff4dc70e?auto=format&fit=crop&q=80&w=1000";
    if (actLower.includes('fushimi') || actLower.includes('inari') || actLower.includes('shrines')) return "https://images.unsplash.com/photo-1513407030348-c1e6e3681427?auto=format&fit=crop&q=80&w=1000";
    if (actLower.includes('bamboo') || actLower.includes('arashiyama')) return "https://images.unsplash.com/photo-1510133744874-09698dbdcecd?auto=format&fit=crop&q=80&w=1000";
    if (actLower.includes('nara') || actLower.includes('deer')) return "https://images.unsplash.com/photo-1506459341490-b184f47dc209?auto=format&fit=crop&q=80&w=1000";
    if (actLower.includes('castle')) return "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&q=80&w=1000";

    return images[type] || images.default;
  };

  const getActivityRecommendations = (activity) => {
    if (!activity) return [];

    const recs = {
      "Haneda": ["Have your Visit Japan Web QR code ready on screen", "Pick up a Welcome Suica or Pasmo Passport at the station", "Use airport baggage delivery (Kuroneko Yamato) if you have large suitcases"],
      "Shintomicho": ["Check if they provide pajamas (many Japanese hotels do)", "Familiarize yourself with the nearest subway exits"],
      "Ramen Street": ["Expect a 20-30 min queue for Rokurinsha", "Buy your ticket from the vending machine first"],
      "Ginza": ["Visit Uniqlo's global flagship store", "Itoya stationery store is a must-visit nearby"],
      "Senso-ji": ["Buy an Omikuji (paper fortune) for 100 yen", "If you get a bad fortune, tie it to the racks to leave the bad luck behind", "Experience the incense smoke at the main cauldron for good health"],
      "Nakamise": ["Don't walk and eat! Eat at the stall where you bought the food", "Try the Ningyoyaki (sweet bean cakes) and fresh Agemanju"],
      "Asakusa Pier": ["Sit on the right side for better views of Skytree", "Get tickets in advance online if possible"],
      "Hama-rikyu": ["Enjoy matcha set at the Nakajima-no-ochaya tea house", "Notice the tide-water pond which changes level with Tokyo Bay"],
      "Manten Sushi": ["Trust the chef (Omakase style)", "No need for extra soy sauce, pieces are pre-seasoned"],
      "Monjayaki": ["Let the staff cook it for you if it's your first time", "Use the tiny spatulas to scrape and eat directly from the grill"],
      "Ueno Park": ["Bring a leisure sheet (picnic mat) to sit on", "Grab some bentos and drinks from a nearby conbini beforehand"],
      "Ameyoko": ["Bargaining is possible here (rare for Japan!)", "Try the fresh fruit skewers and Takoyaki"],
      "Akihabara": ["Bring your passport for tax-free shopping", "Check out Super Potato for retro gaming nostalgics"],
      "Onodera": ["Stand-up sushi means fast-paced but incredible quality at a lower price", "Order seasonal items (Ask: 'Osusume wa nan desu ka?')"],
      "teamLab": ["Wear pants that can be rolled up to your knees", "Avoid wearing skirts (mirrored floors)", "Download the teamLab app to interact with some exhibits"],
      "National Museum": ["See the Honkan (Japanese Gallery) if you only have one hour", "The museum shop is excellent for high-quality, unique souvenirs"],
      "Tsukiji": ["Go early (before 9 AM) to avoid the worst crowds", "Try the 100-yen Tamagoyaki (rolled omelet)", "Cash is king here"],
      "Imperial Palace": ["The East Gardens are free and offer a peaceful escape", "Check out the massive stone foundations of the old Edo castle"],
      "Chidorigafuchi": ["Rent a rowboat for the ultimate romantic view", "Expect massive crowds during peak bloom"],
      "Shibuya Sky": ["No loose items allowed on the roof (lockers provided)", "The escalator ride up is part of the experience, have camera ready"],
      "Ushigoro": ["Don't overcook A5 Wagyu! 3-5 seconds per side is enough", "Order the raw beef with egg yolk if you're adventurous"],
      "Meiji Jingu": ["Bow once before entering the Torii gates", "Wash your hands at the Chozuya before approaching the main shrine"],
      "Gotokuji": ["You can buy a cat statue, make a wish, and leave it, or take it home", "Please be quiet in the residential neighborhood nearby"],
      "Godzilla": ["Head to the 8th-floor terrace of Hotel Gracery for an up-close view", "The Godzilla roars on the hour (from 12:00 to 20:00)"],
      "Shinjuku Gyoen": ["Alcohol is strictly prohibited inside this park", "Requires a small entrance fee (around 500 yen)"],
      "Gov. Building": ["The South Observatory is open during the day, North is open at night", "Look for Mt. Fuji on clear days in the morning"],
      "Golden Gai": ["Many bars have a cover charge (table charge)", "Look for 'English Menu' or 'Tourists Welcome' signs if unsure"],
      "Omoide": ["Also known as Piss Alley!", "Great for cheap Yakitori skewers and a beer in a cramped, authentic setting"],
      "Tokyo Station": ["Stock up on Ekiben (station bentos) before boarding", "Locate your car number on the platform floor markings"],
      "Fushimi Inari": ["Hike up further past the halfway point to escape 90% of the crowds", "Stop for some Inari Sushi or Kitsune Udon at the base"],
      "Pontocho": ["Keep an eye out for Geiko and Maiko scurrying between appointments", "Many restaurants facing the river have outdoor terraces (Kawayuka)"],
      "Bamboo": ["Arrive before 8 AM for photos without crowds", "Combine with the nearby Tenryu-ji Temple"],
      "Tenryu-ji": ["The garden is famous for its 'borrowed scenery' of the Arashiyama mountains", "Take your shoes off and enjoy the view from the main hall"],
      "Otagi": ["Try to find a statue that looks like you (there are 1,200 unique ones!)", "A peaceful alternative to the crowded bamboo grove"],
      "Kinkaku-ji": ["Afternoons offer the best sunlight shining on the gold leaf", "Follow the set path, strict one-way system"],
      "Giro Giro": ["Modern, affordable Kaiseki. Bookings essential", "Sit at the counter to watch the chefs work"],
      "Keage": ["Walk right in the middle of the tracks for the best perspective", "Visit early morning if you want photos without crowds"],
      "Nanzen-ji": ["Climb to the top of the Sanmon gate for a great view", "The brick aqueduct is a very rare and photogenic sight in Kyoto"],
      "Philosopher's": ["Start from Ginkaku-ji and walk down to Nanzen-ji", "Stop by a local cafe along the canal for matcha"],
      "Kiyomizu-dera": ["Drink from the Otowa Waterfall for longevity, success, or love (choose only one!)", "The sunset view from the observation deck is spectacular"],
      "Miyako Odori": ["No photos allowed during the performance", "The theater is a beautiful example of early Showa architecture"],
      "Nijo Castle": ["Listen to the 'Nightingale floors' that squeak to warn of ninjas", "The gardens are spectacularly illuminated during spring"],
      "Nara": ["Keep any paper or maps hidden, the deer will eat them!", "Bow to the deer and they will bow back before you give them a cracker"],
      "Todai-ji": ["Try to squeeze through the 'Buddha's Nostril' pillar for enlightenment", "The scale of the bronze Buddha is hard to capture on camera"],
      "Byodo-in": ["Check your 10-yen coin—this is the temple pictured on it!", "Uji is famous for the best Matcha in Japan"],
      "Uji": ["Try the Matcha Gyoza or ice cream nearby", "Byodo-in's museum is partially underground and very modern"],
      "Nishiki": ["Try the 'Tako Tamago' (baby octopus with quail egg)", "Great place to buy high-quality Japanese kitchen knives"],
      "Umeda": ["The escalator going across the void is a photo highlight", "Visit just before sunset to see both day and night views"],
      "Shinsekai": ["Don't double-dip your Kushikatsu in the communal sauce!", "Try the mixed juice, a retro Osaka specialty"],
      "Glico": ["Take the classic pose photo on the Ebisu Bridge", "Eat Takoyaki and Okonomiyaki here"],
      "Checkout": ["Ensure you have not left anything in the safe or under the bed", "Leave room keys at the front desk"],
      "Namba Station": ["The Rapi:t train looks like a retro-futuristic blue spaceship", "Reserve seats in advance if traveling during rush hour"],
      "KIX": ["Stock up on Tokyo Banana and Royce Chocolate here", "Security can be slow, arrive at least 2.5 hours early"],
      "Airport": ["Ensure your liquids are packed correctly", "Have your boarding pass and passport easily accessible"]
    };

    const match = Object.keys(recs).find(key => activity.toLowerCase().includes(key.toLowerCase()));
    if (match) return recs[match];

    return ["Stay hydrated and wear comfortable walking shoes!", "Look around for small, hidden details and take plenty of photos.", "Check Google Maps for last-minute route changes."];
  };

  const vocabData = [
    {
      category: "Basic Phrases",
      phrases: [
        { en: "Thank you (polite)", ro: "Arigatou gozaimasu", jp: "ありがとうございます" },
        { en: "Excuse me / Sorry", ro: "Sumimasen", jp: "すみません" },
        { en: "Yes, please", ro: "Hai, onegaishimasu", jp: "はい、お願いします" },
        { en: "No, I’m okay / No thank you", ro: "Iie, daijoubu desu", jp: "いいえ, 大丈夫です" },
        { en: "Do you understand English?", ro: "Eigo wakarimasu ka?", jp: "英語分かりますか？" },
        { en: "I don’t understand", ro: "Wakarimasen", jp: "分かりません" },
        { en: "I understood / I got it", ro: "Wakarimashita", jp: "分かりました" },
        { en: "Please wait a moment", ro: "Chotto matte kudasai", jp: "ちょっと待ってください" }
      ]
    },
    {
      category: "Navigating the City",
      phrases: [
        { en: "Where is [place]?", ro: "[Place] wa doko desu ka?", jp: "[Place] はどこですか？" },
        { en: "Do you have [item]?", ro: "[Item] wa arimasu ka?", jp: "[Item] はありますか？" },
        { en: "What is the Wi-Fi password?", ro: "Wi-Fi no pasu waado wa nan desu ka?", jp: "Wi-Fiのパスワードは何ですか？" },
        { en: "To [place], please", ro: "[Place] made onegaishimasu", jp: "[Place] までお願いします" },
        { en: "I want to go to [place]", ro: "[Place] ni ikitai desu", jp: "[Place] に行きたいです" },
        { en: "Does this bus go to [place]?", ro: "Kono basu wa [Place] ni ikisu ka?", jp: "このバスは [Place] に行きますか？" }
      ]
    },
    {
      category: "Restaurant & Shopping",
      phrases: [
        { en: "How much is this?", ro: "Kore wa ikura desu ka?", jp: "これはいくらですか？" },
        { en: "Can I use a credit card?", ro: "Kurejitto kaado tsukaemasu ka?", jp: "クレジットカード使えますか？" },
        { en: "With [payment method], please", ro: "[Method] de onegaishimasu", jp: "[Method] でお願いします" },
        { en: "Welcome (You will hear this)", ro: "Irasshaimase", jp: "いらっしゃいませ" },
        { en: "How many people? (Hearing)", ro: "Nanmei-sama desu ka? (Reply: Futari desu)", jp: "何名様ですか？" },
        { en: "[Number] people, please", ro: "[Number]-nin desu", jp: "[Number] 人です" },
        { en: "Please give me [item]", ro: "[Item] kudasai", jp: "[Item] ください" },
        { en: "Please / I'd like [item]", ro: "[Item] onegaishimasu", jp: "[Item] お願いします" },
        { en: "Thank you for the meal", ro: "Gochisousama deshita", jp: "ごちそうさまでした" }
      ]
    },
    {
      category: "Photos",
      phrases: [
        { en: "Could you take a picture for me?", ro: "Shashin totte moratte mo ii desu ka?", jp: "写真撮ってもらってもいいですか？" },
        { en: "May I take a photo for you?", ro: "Yokattara torimashou ka?", jp: "よかったら撮りましょうか？" }
      ]
    }
  ];

  const areas = {
    "Tokyo": { lat: 35.6762, lon: 139.6503 },
    "Kyoto": { lat: 35.0116, lon: 135.7683 },
    "Osaka": { lat: 34.6937, lon: 135.5023 }
  };

  React.useEffect(() => {
    // Fetch Currency
    fetch('https://open.er-api.com/v6/latest/JPY')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates && data.rates.EUR) {
          setExchangeRate(data.rates.EUR);
        }
      })
      .catch(err => console.error("Currency fetch failed", err));

    // Fetch Weather for main cities with daily ranges
    Object.entries(areas).forEach(([city, coords]) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo`)
        .then(res => res.json())
        .then(data => {
          if (data && data.current_weather) {
            setWeather(prev => ({
              ...prev,
              [city]: {
                temp: data.current_weather.temperature,
                code: data.current_weather.weathercode,
                daily: data.daily // Full forecast object
              }
            }));
          }
        })
        .catch(err => console.error(`Weather fetch failed for ${city}`, err));
    });
  }, []);

  const getWeatherKey = (area) => {
    if (!area) return null;
    const lowerArea = area.toLowerCase();
    if (lowerArea.includes('tokyo') || lowerArea.includes('ginza') || lowerArea.includes('shinjuku')) return 'Tokyo';
    if (lowerArea.includes('kyoto') || lowerArea.includes('sanjo')) return 'Kyoto';
    if (lowerArea.includes('osaka') || lowerArea.includes('namba')) return 'Osaka';
    return null;
  };

  const getWeatherIcon = (code) => {
    if (code === undefined) return <Cloud size={14} />;
    if (code === 0) return <Sun size={14} className="text-orange-400" />;
    if (code <= 3) return <Cloud size={14} className="text-neutral-400" />;
    if (code >= 51) return <CloudRain size={14} className="text-blue-400" />;
    return <Cloud size={14} />;
  };

  const itineraryData = [
    {
      title: "Part 1: Tokyo East",
      subtitle: "The Historic & Blooming Heart",
      dates: "Mar 26 - Mar 28",
      area: "Ginza / Nihonbashi",
      hotel: "HOTEL LIVEMAX Tokyo Shintomicho",
      days: [
        {
          date: "Thu, Mar 26",
          label: "Day 0: Welcome to Tokyo",
          events: [
            { time: "14:25", activity: "Haneda Airport (HND) Arrival", type: "transport", transportMode: "public", note: "Welcome! Terminal 3. Clear immigration (approx. 1hr). Transport: Keikyu Line or Monorail to Ginza (35-45 min)." },
            { time: "17:00", activity: "Hotel Check-in: LIVEMAX Shintomicho", type: "hotel", transportMode: "public", note: "Drop bags and freshen up." },
            { time: "18:30", activity: "First Meal: Ramen Street", type: "food", transportMode: "walk", note: "Tokyo Ramen Street (Station basement). Rokurinsha for Tsukemen or Soranoiro. Alt: Kagari in Ginza for creamy chicken broth." },
            { time: "20:00", activity: "Ginza Chuo-dori Evening Walk", type: "walk", transportMode: "walk", note: "Architecture lit up beautifully. Stop at a Konbini (7-Eleven/Lawson) for Egg Salad Sandwich & tea for tomorrow." },
            { time: "21:30", activity: "Rest & Beat Jet Lag", type: "hotel", transportMode: "walk", note: "Sleep early to adjust to Japan time." }
          ]
        },
        {
          date: "Fri, Mar 27",
          label: "Day 1: Old Edo & River Breezes",
          events: [
            { time: "08:00", activity: "Senso-ji Temple (Asakusa)", type: "sight", transportMode: "public", note: "Tokyo's oldest temple. Red lantern (Kaminarimon) is iconic. Tip: Draw an Omikuji fortune for ¥100." },
            { time: "10:00", activity: "Nakamise Dori Snacking", type: "food", transportMode: "walk", note: "Try freshly baked Melonpan at Kagetsudo. Fluffy sweet bread (no actual melon)." },
            { time: "11:00", activity: "Water Bus to Hamarikyu", type: "transport", transportMode: "walk", note: "Tokyo Cruise boat from Asakusa Pier down Sumida River." },
            { time: "12:00", activity: "Hama-rikyu Gardens", type: "sight", transportMode: "boat", note: "Edo-period saltwater garden vs skyscrapers. Activity: Matcha and sweet at the island tea house." },
            { time: "13:30", activity: "Manten Sushi Marunouchi", type: "food", status: "confirmed", transportMode: "public", note: "Logistics: Booked! Incredible Omakase for the price (approx. ¥7,000)." },
            { time: "15:30", activity: "Ginza Central & Architecture", type: "walk", transportMode: "taxi", note: "Relaxed stroll. See Wako building clock tower and high-end facades." },
            { time: "19:00", activity: "Monjayaki Street (Tsukishima)", type: "food", transportMode: "public", note: "Unique Tokyo savory pancake. Monja Kura is the spot. Order Mentaiko & Cheese version." }
          ]
        },
        {
          date: "Sat, Mar 28",
          label: "Day 2: Sakura Explosion",
          events: [
            { time: "08:30", activity: "Ueno Park Hanami", type: "sight", transportMode: "public", note: "Hanami ground zero. Thousands of lanterns. Walk the main alley toward the National Museum." },
            { time: "10:00", activity: "Tokyo National Museum", type: "sight", transportMode: "walk", note: "Largest/oldest in Japan. Collection of art/artifacts. Spend 1-2 hours here (¥1,000)." },
            { time: "11:00", activity: "Ameyoko Market", type: "food", transportMode: "walk", note: "Street food chaos. Seafood bowls at Minatoya or snack on fruit sticks and takoyaki." },
            { time: "13:30", activity: "Akihabara Electric Town", type: "sight", transportMode: "train", note: "Radio Kaikan (anime) and Gachapon Hall (hundreds of machines). Sensory overload!" },
            { time: "15:30", activity: "Ginza Mitsukoshi Depachika", type: "food", transportMode: "taxi", note: "Gourmet food halls. Incredible confectionery and gourmet display. Experience the culture!" },
            { time: "18:30", activity: "Sushi Ginza Onodera Tōryūmon", type: "food", transportMode: "public", note: "Standing sushi bar. High Michelin-level quality at a lower price." },
            { time: "20:00", activity: "teamLab Planets", type: "sight", status: "confirmed", transportMode: "public", note: "Barefoot immersive art experience. Critical booking confirmed!" }
          ]
        }
      ]
    },
    {
      title: "Part 2: Tokyo West",
      subtitle: "Neon Finale",
      dates: "Mar 29 - Mar 30",
      area: "Shinjuku / Shibuya",
      hotel: "Premier Hotel Cabin Shinjuku",
      days: [
        {
          date: "Sun, Mar 29",
          label: "Day 3: Digital Art & Wagyu",
          events: [
            { time: "08:00", activity: "Tsukiji Outer Market", type: "food", transportMode: "public", note: "Tamagoyaki or wagyu skewer breakfast. Tip: Leave bags at Shimbashi coin lockers." },
            { time: "10:30", activity: "Imperial Palace East Gardens", type: "sight", transportMode: "walk", note: "Free admission. Massive stone walls of old Edo castle. Beautiful landscaping." },
            { time: "12:00", activity: "Chidorigafuchi Moat", type: "sight", transportMode: "public", note: "Classic Sakura postcard shot. Tip: Rowboats if line < 45m, else walk the path." },
            { time: "13:30", activity: "Ginza Depachika Lunch", type: "food", transportMode: "public", note: "Gourmet bento box from Mitsukoshi or casual high-quality spot." },
            { time: "16:30", activity: "Check-in: Premier Hotel Cabin", type: "hotel", transportMode: "public", note: "Retrieve bags and move to Shinjuku hotel." },
            { time: "18:30", activity: "Shibuya Sky Sunset", type: "sight", status: "pending", transportMode: "public", note: "Logistics: Book 14 days in advance for sunset slot." },
            { time: "20:00", activity: "Yakiniku Ushigoro Shinjuku", type: "food", status: "pending", transportMode: "walk", note: "Top-tier A5 Wagyu BBQ. High-priority reservation needed." }
          ]
        },
        {
          date: "Mon, Mar 30",
          label: "Day 4: Cats & Golden Gai",
          events: [
            { time: "09:00", activity: "Meiji Jingu Shrine", type: "sight", transportMode: "public", note: "Tranquil forest walk. Dedicated to Emperor Meiji. Peaceful contrast to the city." },
            { time: "11:00", activity: "Gotokuji Cat Temple", type: "sight", transportMode: "public", note: "Thousands of Maneki Neko statues. Photogenic. (40 min from Shinjuku)." },
            { time: "13:30", activity: "Lunch: AFURI Ramen", type: "food", transportMode: "public", note: "Harajuku/Shinjuku. Famous Yuzu-scented broth. Light and refreshing." },
            { time: "15:00", activity: "Shinjuku Gyoen Garden", type: "sight", transportMode: "public", note: "Huge park, late-blooming Sakura varieties. Beautiful and peaceful." },
            { time: "17:00", activity: "Shinjuku 3D Cat & Godzilla", type: "sight", transportMode: "walk", note: "Cross Shinjuku Vision 3D cat and Hotel Gracery Godzilla head." },
            { time: "18:00", activity: "Tokyo Gov. Building Views", type: "sight", transportMode: "walk", note: "Kenzo Tange complex. Free skyline views from tallest decks." },
            { time: "20:00", activity: "Omoide Yokocho (Piss Alley)", type: "food", transportMode: "walk", note: "Yakitori stalls, smoke, beer crates. Very authentic atmosphere." },
            { time: "22:00", activity: "Golden Gai Drinks", type: "food", transportMode: "walk", note: "End night at one of 200 tiny bars. Tip: Ship large luggage to Kyoto tonight!" }
          ]
        }
      ]
    },
    {
      title: "Part 3: Kyoto",
      subtitle: "The Cultural Heart",
      dates: "Mar 31 - Apr 3",
      area: "Sanjo / Kawaramachi",
      days: [
        {
          date: "Tue, Mar 31",
          label: "Day 5: Shinkansen & Red Gates",
          events: [
            { time: "09:00", activity: "Shinkansen to Kyoto", type: "transport", transportMode: "public", note: "Buy a Katsu Sando. Sit on Seat E (Right) for Mt. Fuji views." },
            { time: "11:30", activity: "Arrival & Drop Backpack", type: "hotel", transportMode: "public", note: "Taxi/subway to hotel to drop bags." },
            { time: "13:00", activity: "Lunch: Chao Chao Gyoza", type: "food", transportMode: "walk", note: "Award-winning, crispy gyoza near Sanjo/Gion." },
            { time: "14:30", activity: "Fushimi Inari Taisha", type: "sight", transportMode: "public", note: "Hike past Yotsutsuji intersection (30-40 mins) to escape crowds." },
            { time: "17:30", activity: "Pontocho Alley Stroll", type: "walk", transportMode: "public", note: "Atmospheric evening stroll down the narrow restaurant alley." },
            { time: "19:00", activity: "Menbaka Fire Ramen", type: "food", status: "pending", transportMode: "public", note: "Chef creates massive fire column. Tourist spectacle but tasty!" }
          ]
        },
        {
          date: "Wed, Apr 1",
          label: "Day 6: Bamboo & Gold",
          events: [
            { time: "07:00", activity: "Arashiyama Bamboo Grove", type: "sight", transportMode: "public", note: "Early arrival is spiritual; avoid the 10am nightmare crowds." },
            { time: "08:30", activity: "Tenryu-ji Garden", type: "sight", transportMode: "walk", note: "Beautiful Zen garden right next to the bamboo exit." },
            { time: "10:00", activity: "Otagi Nenbutsu-ji", type: "sight", transportMode: "taxi", note: "Hidden gem with 1,200 whimsical stone statues. Mossy and quiet." },
            { time: "12:30", activity: "Arashiyama Street Food", type: "food", transportMode: "walk", note: "Yuba snack or Soba noodles on the main street." },
            { time: "14:00", activity: "Kinkaku-ji (Golden Pavilion)", type: "sight", transportMode: "taxi", note: "Classic gold temple reflecting in the pond. Taxi from Arashiyama." },
            { time: "16:00", activity: "Ryoan-ji Rock Garden", type: "sight", transportMode: "taxi", note: "Optional: Famous Zen rock garden nearby if not templed out." },
            { time: "20:30", activity: "Giro Giro Hitoshina", type: "food", status: "confirmed", transportMode: "public", note: "Modern affordable Kaiseki. Booked! Look for Geiko in Gion." }
          ]
        },
        {
          date: "Thu, Apr 2",
          label: "Day 7: The Philosopher’s Walk",
          events: [
            { time: "08:30", activity: "Keage Incline Sakura", type: "sight", transportMode: "public", note: "Old railway tracks lined with Sakura. Stunning photo spot." },
            { time: "09:30", activity: "Nanzen-ji Temple", type: "sight", transportMode: "walk", note: "Massive Sanmon gate and Roman-style brick aqueduct." },
            { time: "10:30", activity: "Philosopher's Path", type: "walk", transportMode: "walk", note: "Canal lined with hundreds of cherry trees. Quintessential spring walk." },
            { time: "13:00", activity: "Udon near Ginkaku-ji", type: "food", transportMode: "walk", note: "Omen is famous for Udon at the end of the path." },
            { time: "14:30", activity: "Kiyomizu-dera Temple", type: "sight", transportMode: "taxi", note: "Massive wooden stage views. Taxi from Ginkaku-ji hill." },
            { time: "16:00", activity: "Sannen-zaka & Ninen-zaka", type: "walk", transportMode: "walk", note: "Preserved stone streets. Visit Starbucks tatami house." },
            { time: "16:30", activity: "Miyako Odori Geiko Dance", type: "sight", status: "confirmed", transportMode: "walk", note: "Gion Kobu Kaburenjo Theatre. Performance by Geiko/Maiko." },
            { time: "19:00", activity: "Dinner: Yakiniku Hiro", type: "food", transportMode: "walk", note: "Kyoto style BBQ. Order the Yukke (tartare)." },
            { time: "Night", activity: "Nijo Castle (Digital Art)", type: "sight", transportMode: "public", note: "NAKED FLOWERS evening event inside the castle. Visual spectacle." }
          ]
        },
        {
          date: "Fri, Apr 3",
          label: "Day 8: Nara & Uji Day Trip",
          events: [
            { time: "10:00", activity: "Nara Park & Deer", type: "sight", transportMode: "public", note: "Feed bowing deer crackers. Try Nakatanidou for fast mochi pounding." },
            { time: "11:30", activity: "Todai-ji Great Buddha", type: "sight", transportMode: "walk", note: "World's largest wooden building. Awe-inspiring bronze Buddha (¥600)." },
            { time: "14:45", activity: "Byodo-in Temple (Uji)", type: "sight", transportMode: "public", note: "UNESCO site. Phoenix Hall is on the ¥10 coin. Best Matcha source." },
            { time: "16:00", activity: "Uji Bridge & Matcha Shops", type: "food", transportMode: "walk", note: "Matcha ice cream or parfait. Nakamura Tokichi is recommended." },
            { time: "18:00", activity: "Nishiki Market Snacks", type: "food", transportMode: "public", note: "Kyoto's Kitchen. Early dinner or final Kyoto snacks." }
          ]
        }
      ]
    },
    {
      title: "Part 4: Osaka",
      subtitle: "The Kitchen of Japan",
      dates: "Apr 4 - Apr 5",
      area: "Namba / Dotonbori",
      hotel: "Hotel Balian Resort Namba",
      days: [
        {
          date: "Sat, Apr 4",
          label: "Day 9: Castles & Neon",
          events: [
            { time: "10:30", activity: "Check-in: Hotel Balian", type: "hotel", transportMode: "train", note: "Take JR or Hankyu to Namba (45m). Drop bags." },
            { time: "11:30", activity: "Umeda Sky Building", type: "sight", transportMode: "public", note: "Floating Garden. Iconic modern towers with 360 view." },
            { time: "14:00", activity: "Osaka Castle Park", type: "sight", transportMode: "public", note: " majestic facade. Skip interior if short on time." },
            { time: "16:00", activity: "Shinsekai District", type: "food", transportMode: "public", note: "Retro-futuristic vibe. Try Kushikatsu fried skewers at Daruma." },
            { time: "19:30", activity: "Dotonbori Night Tour", type: "sight", transportMode: "public", note: "Famous Glico Man and Crab signs. Farewell feast! Matsusakaagyu M recommended." }
          ]
        },
        {
          date: "Sun, Apr 5",
          label: "Day 10: Sayonara",
          events: [
            { time: "06:00", activity: "Hotel Checkout", type: "hotel", transportMode: "walk", note: "Early departure. Ensure nothing left behind." },
            { time: "06:30", activity: "Namba Station Transfer", type: "transport", transportMode: "public", note: "Nankai Rapi:t or Haruka Express (~45 min)." },
            { time: "07:30", activity: "Kansai Airport (KIX)", type: "transport", transportMode: "walk", note: "Check-in for Air China CA162. Fly home via Beijing." },
            { time: "09:05", activity: "Flight Departs", type: "transport", transportMode: "walk", note: "See you later, Japan!" }
          ]
        }
      ]
    }
  ];

  const getTypeIcon = (type) => {
    switch (type) {
      case 'transport': return <Train size={18} strokeWidth={1.5} className="text-[var(--color-accent-green)]" />;
      case 'food': return <Utensils size={18} strokeWidth={1.5} className="text-[#D97706]" />;
      case 'hotel': return <Bed size={18} strokeWidth={1.5} className="text-[#7C3AED]" />;
      case 'sight': return <Camera size={18} strokeWidth={1.5} className="text-[var(--color-accent-pink)]" />;
      case 'walk': return <MapPin size={18} strokeWidth={1.5} className="text-[var(--color-accent-green)]" />;
      default: return <Info size={18} strokeWidth={1.5} />;
    }
  };

  const getGoogleMapsUrl = (event, prevEvent, part) => {
    if (!event.activity) return '#';

    const destination = encodeURIComponent(event.activity);
    let origin = '';
    let travelMode = 'transit';

    switch (event.transportMode) {
      case 'walk': travelMode = 'walking'; break;
      case 'taxi': travelMode = 'driving'; break;
      case 'public':
      case 'train':
      case 'boat':
      default:
        travelMode = 'transit';
        break;
    }

    if (prevEvent) {
      origin = encodeURIComponent(prevEvent.activity);
    } else if (part.hotel) {
      origin = encodeURIComponent(part.hotel);
    }

    if (origin) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${travelMode}`;
    }

    return `https://www.google.com/maps/search/?api=1&query=${destination}`;
  };

  return (
    <div className="min-h-screen pb-44">
      {/* Header */}
      <header className="glass-header sticky top-0 z-[100] px-6 py-4 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[var(--color-accent-pink)] rounded-full flex items-center justify-center text-white text-xl shadow-inner">🌸</div>
          <div>
            <h1 className="text-base font-bold leading-none mb-1 text-[var(--color-sumi-black)] uppercase tracking-tight">Ber & Maru</h1>
            <p className="text-[10px] font-semibold text-[var(--color-sumi-gray)] uppercase tracking-[0.2em]">Japan 2026</p>
          </div>
        </div>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-accent-pink-soft)] transition-all active:scale-95 border border-[var(--color-border-light)] bg-white"
        >
          {isMenuOpen ? <X size={20} className="text-[var(--color-sumi-black)]" /> : <Menu size={20} className="text-[var(--color-sumi-black)]" />}
        </button>
      </header>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[90] bg-white/95 backdrop-blur-md pt-24 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
          <div className="max-w-2xl mx-auto px-6 space-y-8 pb-20">
            <h2 className="text-3xl font-bold text-[var(--color-sumi-black)] mb-8">Itinerary Phases</h2>
            <div className="grid gap-4">
              {itineraryData.map((part, idx) => (
                <button
                  key={idx}
                  onClick={() => { setActivePart(idx); setIsMenuOpen(false); }}
                  className={`group relative w-full text-left p-6 rounded-3xl border-2 transition-all duration-300 ${activePart === idx
                    ? 'border-[var(--color-accent-pink)] bg-[var(--color-accent-pink-soft)] text-[var(--color-sumi-black)]'
                    : 'border-[var(--color-border-light)] bg-white hover:border-[var(--color-accent-pink)]/30'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${activePart === idx ? 'text-[var(--color-accent-pink)]' : 'text-neutral-400'}`}>Part {idx + 1}</span>
                      <h3 className="text-xl font-bold mt-1">{part.title.split(': ')[1] || part.title}</h3>
                      <p className="text-sm text-neutral-500 mt-1 font-medium">{part.dates}</p>
                    </div>
                    <div className={`p-2 rounded-full transition-transform duration-300 ${activePart === idx ? 'bg-[var(--color-accent-pink)] text-white' : 'bg-neutral-100 text-neutral-400 group-hover:translate-x-1'}`}>
                      <ChevronRight size={20} strokeWidth={2.5} />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-8 border-t border-[var(--color-border-light)]">
              <h2 className="text-2xl font-bold text-[var(--color-sumi-black)] mb-6 font-instrument">Travel Essentials</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsVocabOpen(true)}
                  className="text-left p-6 rounded-[2rem] bg-orange-50/50 border border-orange-100 group hover:border-orange-200 transition-all active:scale-95"
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
                    <Languages size={20} />
                  </div>
                  <h4 className="font-bold text-[var(--color-sumi-black)] mb-2 font-instrument italic">Vocab</h4>
                  <ul className="text-xs space-y-2 text-orange-900/60 font-medium">
                    <li>• Sumimasen</li>
                    <li>• Arigato</li>
                    <li>• Onegaishimasu</li>
                  </ul>
                </button>
                <div className="p-6 rounded-[2rem] bg-blue-50/50 border border-blue-100 group hover:border-blue-200 transition-all">
                  <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen size={20} />
                  </div>
                  <h4 className="font-bold text-[var(--color-sumi-black)] mb-2 font-instrument italic">Etiquette</h4>
                  <ul className="text-xs space-y-2 text-blue-900/60 font-medium">
                    <li>• No Tipping (Keep it!)</li>
                    <li>• Shhh on Trains</li>
                    <li>• Take Trash Home</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-6 pt-10">
        <section className="mb-16 animate-in slide-in-from-bottom duration-700">
          <div className="relative p-8 rounded-[3rem] bg-white border border-[var(--color-border-light)] premium-shadow overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent-pink-soft)] rounded-bl-full -z-0 opacity-50"></div>
            <div className="relative z-10 flex flex-col items-start">
              <span className="px-3 py-1 bg-[var(--color-accent-pink-soft)] text-[var(--color-accent-pink)] text-[10px] font-bold rounded-full uppercase tracking-[0.2em] mb-4">
                {itineraryData[activePart].dates}
              </span>
              <h2 className="text-4xl font-bold text-[var(--color-sumi-black)] leading-[1.1] mb-2">
                {itineraryData[activePart].title}
              </h2>
              <p className="text-lg text-[var(--color-sumi-gray)] font-medium italic opacity-80">
                {itineraryData[activePart].subtitle}
              </p>
              <div className="flex items-center mt-6 space-x-2 text-[var(--color-sumi-gray)] opacity-60">
                <MapPin size={14} />
                <span className="text-xs font-bold uppercase tracking-widest">{itineraryData[activePart].area}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="relative space-y-16">
          <div className="absolute left-[20px] top-4 bottom-4 w-px bg-[var(--color-border-light)] z-0"></div>

          {itineraryData[activePart].days.map((day, dayIdx) => (
            <section key={dayIdx} className="relative z-10">
              <div className="flex items-center mb-8 sticky top-[80px] z-20 py-4 px-6 -mx-6 bg-[var(--color-bg-primary)]/95 backdrop-blur-sm border-b border-[var(--color-border-light)]/50 transition-all duration-300">
                <div className="w-10 h-10 bg-[var(--color-sumi-black)] text-white rounded-2xl flex items-center justify-center font-bold text-lg mr-5 shadow-lg shadow-black/10 ring-2 ring-white/10 shrink-0">
                  {day.date.split(',')[1]?.split(' ')[2] || dayIdx}
                </div>
                <div>
                  <h3 className="text-[10px] font-bold uppercase text-neutral-400 tracking-[0.25em] mb-0.5 leading-none font-inter">{day.date}</h3>
                  <div className="flex items-center gap-3">
                    <h4 className="text-2xl font-bold text-[var(--color-sumi-black)] leading-none font-instrument">{day.label}</h4>
                    {(() => {
                      const weatherKey = getWeatherKey(itineraryData[activePart].area);
                      const cityWeather = weather[weatherKey];
                      if (!cityWeather) return null;

                      // Try to find specific day forecast
                      const dayForecast = (() => {
                        if (!cityWeather.daily) return null;
                        const dayDate = new Date(day.date + ", 2026").toISOString().split('T')[0];
                        const dateIdx = cityWeather.daily.time.indexOf(dayDate);
                        if (dateIdx === -1) return null;
                        return {
                          max: cityWeather.daily.temperature_2m_max[dateIdx],
                          min: cityWeather.daily.temperature_2m_min[dateIdx]
                        };
                      })();

                      return (
                        <div className="flex items-center gap-3 px-3 py-1 bg-white/60 backdrop-blur-md rounded-xl border border-[var(--color-border-light)] shadow-sm animate-in fade-in zoom-in duration-500">
                          <div className="flex items-center gap-1.5 pr-2 border-r border-neutral-200">
                            {getWeatherIcon(cityWeather.code)}
                            <span className="text-[11px] font-extrabold text-[var(--color-sumi-black)] tabular-nums">{Math.round(cityWeather.temp)}°C</span>
                          </div>
                          {dayForecast && (
                            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-tighter text-neutral-500 tabular-nums">
                              <span className="flex items-center"><span className="text-[7px] mr-0.5 opacity-50">H:</span>{Math.round(dayForecast.max)}°</span>
                              <span className="flex items-center"><span className="text-[7px] mr-0.5 opacity-50">L:</span>{Math.round(dayForecast.min)}°</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="space-y-6 ml-[20px]">
                {day.events.map((event, eventIdx) => {
                  const prevEvent = eventIdx > 0 ? day.events[eventIdx - 1] : null;
                  const mapUrl = getGoogleMapsUrl(event, prevEvent, itineraryData[activePart]);

                  return (
                    <div key={eventIdx} className="relative pl-10 group">
                      <div className="absolute left-[-4.5px] top-6 w-2.5 h-2.5 rounded-full bg-white border-2 border-[var(--color-border-light)] ring-4 ring-[var(--color-bg-primary)] group-hover:border-[var(--color-accent-pink)] transition-colors duration-300 z-10"></div>

                      <div
                        className={`bg-white rounded-[2rem] border border-[var(--color-border-light)] premium-shadow transition-all duration-500 cursor-pointer overflow-hidden ${expandedEventId === `${dayIdx}-${eventIdx}` ? 'shadow-xl translate-y-[-4px] ring-2 ring-[var(--color-accent-pink)]/20' : 'hover:translate-y-[-4px] hover:shadow-lg hover:shadow-black/5'}`}
                        onClick={() => setExpandedEventId(expandedEventId === `${dayIdx}-${eventIdx}` ? null : `${dayIdx}-${eventIdx}`)}
                      >
                        {/* Custom Banner Glimpse */}
                        <div className="h-20 w-full relative overflow-hidden bg-neutral-100 group-hover:h-24 transition-all duration-500">
                          <img
                            src={getEventTypeBanner(event.type, event.activity)}
                            className="w-full h-full object-cover opacity-80 mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
                            alt={event.activity}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="bg-white/90 p-1.5 rounded-lg shadow-sm border border-white/20 text-neutral-800">
                                {getTypeIcon(event.type)}
                              </div>
                              <span className="text-white font-bold tracking-wide text-sm">{event.activity}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 flex flex-col gap-4">
                          <div className="w-full flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                              <span className="text-xs font-bold text-[var(--color-accent-pink)] tabular-nums uppercase tracking-widest">{event.time}</span>
                              {event.status === 'confirmed' && (
                                <div className="px-2 py-0.5 bg-green-50 rounded-full flex items-center justify-center border border-green-200">
                                  <CheckCircle2 size={10} className="text-green-500 mr-1" />
                                  <span className="text-[9px] font-bold text-green-700 uppercase tracking-wider">Confirmed</span>
                                </div>
                              )}
                            </div>
                            <a
                              href={mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-8 h-8 flex items-center justify-center bg-[var(--color-bg-primary)] text-[var(--color-sumi-gray)] rounded-full hover:bg-[var(--color-accent-pink)] hover:text-white transition-all active:scale-90 border border-[var(--color-border-light)] shrink-0"
                            >
                              <Navigation size={14} strokeWidth={2} />
                            </a>
                          </div>

                          <div className="flex gap-4 items-start pb-1">
                            <div className="flex flex-col gap-3 w-full">
                              {!expandedEventId || expandedEventId !== `${dayIdx}-${eventIdx}` ? (
                                <p className="text-sm text-[var(--color-sumi-gray)] leading-relaxed font-medium line-clamp-1 opacity-80">
                                  {event.note}
                                </p>
                              ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                  <div className="flex gap-3">
                                    <div className="w-1.5 rounded-full bg-[var(--color-border-light)] mb-1"></div>
                                    <p className="text-sm text-[var(--color-sumi-black)] leading-relaxed font-semibold">
                                      {event.note}
                                    </p>
                                  </div>

                                  <div className="bg-[var(--color-bg-primary)] rounded-2xl p-4 border border-[var(--color-border-light)]/50">
                                    <h6 className="flex items-center gap-1.5 font-bold text-[var(--color-accent-pink)] uppercase tracking-widest text-[10px] mb-3">
                                      <Info size={12} /> Pro Tips & Info
                                    </h6>
                                    <ul className="space-y-2">
                                      {getActivityRecommendations(event.activity).map((rec, i) => (
                                        <li key={i} className="flex gap-2 text-xs text-[var(--color-sumi-gray)] leading-snug">
                                          <span className="text-[var(--color-accent-pink)] mt-0.5 opacity-50">•</span>
                                          <span className="font-medium">{rec}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-[var(--color-bg-primary)] text-[9px] font-bold text-neutral-500 uppercase tracking-widest border border-neutral-100 hover:border-neutral-200 transition-colors">
                                  {event.transportMode === 'walk' ? <Footprints size={10} className="mr-1.5 opacity-60 text-[var(--color-accent-green)]" /> : <Train size={10} className="mr-1.5 opacity-60 text-blue-500" />}
                                  {event.transportMode}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main >

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-[200]">
        <div className="bg-[var(--color-sumi-black)]/90 backdrop-blur-xl text-white rounded-[2rem] p-1.5 flex items-center justify-between shadow-2xl shadow-black/40 border border-white/10 transition-all duration-300">
          <div className="flex items-center space-x-1 p-1">
            {itineraryData.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActivePart(idx)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs transition-all duration-500 ${activePart === idx
                  ? 'bg-white text-[var(--color-sumi-black)] shadow-lg scale-105'
                  : 'text-white/40 hover:text-white hover:bg-white/10'
                  }`}
              >
                P{idx + 1}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-white/10 mx-1 sm:mx-2"></div>
          <div className="flex flex-col items-end pr-3 sm:pr-6 select-none shrink-0">
            <span className="text-[7px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1 leading-none hidden sm:block">Converter</span>
            <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg border border-white/10 group focus-within:border-[var(--color-accent-pink)] transition-colors">
              <span className="text-[10px] font-bold text-white/50">¥</span>
              <input
                type="text"
                inputMode="numeric"
                value={jpyAmount}
                onChange={(e) => setJpyAmount(e.target.value.replace(/\D/g, ''))}
                className="w-10 sm:w-12 bg-transparent border-none text-[10px] sm:text-xs font-bold text-white focus:outline-none focus:ring-0 p-0 tabular-nums"
              />
              <div className="h-3 w-px bg-white/10"></div>
              <span className="text-[10px] sm:text-xs font-bold text-[var(--color-accent-pink)] tabular-nums whitespace-nowrap">
                €{exchangeRate ? (parseInt(jpyAmount || 0) * exchangeRate).toFixed(jpyAmount.length > 5 ? 0 : 2) : '...'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Vocab Modal */}
      {
        isVocabOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-[var(--color-sumi-black)]/40 backdrop-blur-sm" onClick={() => setIsVocabOpen(false)}></div>
            <div className="relative w-full max-w-lg bg-[var(--color-bg-primary)] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="p-6 border-b border-[var(--color-border-light)] flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <div>
                  <h3 className="text-2xl font-bold text-[var(--color-sumi-black)] font-instrument">Japanese Vocab</h3>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">20 Must-Know Phrases</p>
                </div>
                <button
                  onClick={() => setIsVocabOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[var(--color-border-light)] text-[var(--color-sumi-black)] hover:bg-neutral-50 transition-colors active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                {vocabData.map((section, sIdx) => (
                  <div key={sIdx} className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase text-[var(--color-accent-pink)] tracking-[0.2em] flex items-center gap-2">
                      <span className="w-8 h-px bg-[var(--color-accent-pink)]/30"></span>
                      {section.category}
                    </h4>
                    <div className="grid gap-3">
                      {section.phrases.map((phrase, pIdx) => (
                        <div key={pIdx} className="bg-white p-4 rounded-2xl border border-[var(--color-border-light)] premium-shadow group hover:border-[var(--color-accent-pink)]/30 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-bold text-[var(--color-sumi-black)] leading-tight">{phrase.en}</p>
                            <span className="text-[10px] font-medium text-neutral-400 italic tabular-nums">#{sIdx * 6 + pIdx + 1}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-xs font-medium text-[var(--color-sumi-gray)] opacity-60 font-mono tracking-tight">{phrase.ro}</p>
                            <p className="text-base font-bold text-[var(--color-sumi-black)] font-instrument">{phrase.jp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-white/50 backdrop-blur-md border-t border-[var(--color-border-light)]">
                <button
                  onClick={() => setIsVocabOpen(false)}
                  className="w-full py-4 bg-[var(--color-sumi-black)] text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default App;
