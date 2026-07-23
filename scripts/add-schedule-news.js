const fs = require('fs');
const path = require('path');

const newsPath = path.join(__dirname, '../data/news.json');
let currentNews = JSON.parse(fs.readFileSync(newsPath, 'utf8'));

// Filter out existing schedule article if present to overwrite cleanly
currentNews = currentNews.filter(n => n.slug !== 'nepal-premier-league-2026-schedule-tu-ground-matches-confirmed');

const newArticle = {
  "slug": "nepal-premier-league-2026-schedule-tu-ground-matches-confirmed",
  "title": "Nepal Premier League 2026 Schedule Confirms 32 Matches at Kirtipur Ground",
  "date": "2026-07-07",
  "category": "Schedule",
  "image": "images/npl-schedule.webp",
  "imageSource": {
    "name": "Existing NPL schedule site image",
    "url": "https://nplcricketleague.com/images/npl-schedule.webp",
    "page": "https://nplcricketleague.com/schedule",
    "discovery": "site-asset",
    "type": "existing-site-asset"
  },
  "colors": [
    "#06b6d4",
    "#1e3a8a"
  ],
  "excerpt": "The official Nepal Premier League 2026 schedule includes 32 total matches at Tribhuvan University International Cricket Ground from November 17 to December 13.",
  "body": [
    "The official Nepal Premier League 2026 schedule includes 32 total matches at Tribhuvan University International Cricket Ground in Kirtipur, running from November 17 to December 13, 2026. Season 3 brings eight franchise teams together for a single round-robin league stage of 28 matches, followed by a four-match playoff system to decide the new T20 champion. Fixing the tournament window early gives franchises, broadcasters, ticket partners and international players a clear target as domestic squads take shape after the July 6 player auction.",
    "The tournament structure follows a single round-robin format where every franchise plays seven group matches. The top four teams on the net-run-rate table advance to the playoff stage, which begins on December 9. Qualifier 1 takes place on December 9 between the first-placed and second-placed teams, with the winner earning a direct spot in the final. The Eliminator is scheduled for December 10 between the third-placed and fourth-placed teams. The loser of Qualifier 1 meets the winner of the Eliminator in Qualifier 2 on December 11, setting up the grand final on December 13.",
    "Tribhuvan University International Cricket Ground in Kirtipur serves as the primary venue for all 32 matches across the 27-day tournament window. Stadium preparations include six newly installed floodlight towers containing 420 individual lighting fixtures, allowing official day-night T20 matches in Nepal for the first time. The venue upgrade also expands spectator capacity beyond 10,000 with revised parapet seating, upgraded dugout structures and improved media production facilities required for multi-camera television and digital streaming broadcasts.",
    "Match day timing splits afternoon fixtures and evening games to fit broadcast windows and attendance patterns in Kathmandu. Afternoon games are scheduled for 11:45 AM local time, while evening floodlit fixtures start at 4:00 PM or 5:30 PM depending on doubleheader arrangements. Doubleheader match days are planned across weekend windows, giving local supporters two consecutive fixtures per day. The expanded floodlight capability allows evening matches to run past dusk without weather delays caused by early winter twilight in the Kathmandu Valley.",
    "Defending champion Lumbini Lions enter the Season 3 fixture list following their title victory in Season 2. Lumbini retained captain Rohit Paudel and added marquee wicketkeeper-batter Aasif Sheikh for NPR 20 lakh in the July 6 auction, creating one of the strongest domestic cores on the schedule. Their opening group fixtures against Sudurpaschim Royals and Janakpur Bolts carry high interest because Sudurpaschim reached back-to-back final appearances in previous editions, while Janakpur Bolts won the inaugural NPL title in Season 1.",
    "Janakpur Bolts move into the Season 3 schedule after releasing Aasif Sheikh and executing a broad squad rebuild. Janakpur retained Anil Kumar Sah and Lalit Narayan Rajbanshi before adding Category A all-rounder Trit Raj Das alongside Category C signings Rit Gautam and Santosh Karki. Their schedule demands early consistency, as the group stage leaves little margin for error across seven matches. Teams requiring four victories to secure a playoff berth must establish solid top-order partnerships during afternoon powerplay overs in Kirtipur.",
    "Kathmandu Gorkhas enter the fixture list with captain Karan KC leading a side focused on tactical discipline and role execution. Kathmandu retained Rashid Khan, Dipesh Kandel and Bhim Sharki before acquiring Mohammad Adil Alam for NPR 15 lakh and Aakash Tripathi for NPR 7 lakh in the auction. Operating with a compact auction purse, Kathmandu planned their squad balance around spin control and middle-order stability, essential attributes for navigating back-to-back weekend doubleheaders at the Kirtipur ground.",
    "Pokhara Avengers, led by marquee opener Kushal Bhurtel, face a schedule that tests both batting depth and pace bowling options. Pokhara acquired Category A wicketkeeper-batter Arjun Gharti alongside auction signings Sudip Aryal and Vivek Kumar Ranmagar. Their squad balance relies on quick starts during powerplay overs, where Kirtipur pitch conditions often offer early carry before slowing down during afternoon heat. Maintaining bowling discipline in the final five overs will decide their playoff qualification chances.",
    "Biratnagar Kings continue under national leg-spinner Sandeep Lamichhane, targeting a playoff return after retaining a core domestic unit. Biratnagar added Category A seam bowler Rupesh Kumar Singh and Category C batter Sujan Thapaliya for NPR 4.25 lakh during auction bidding. Their schedule strategy centers on spin dominance during middle overs, leveraging Kirtipur's turning surfaces when dry afternoon conditions favor wrist spin and slower ball variations.",
    "Karnali Yaks, captained by national all-rounder Sompal Kami, bring a pace-heavy attack into the Season 3 fixture list. Karnali retained Gulshan Kumar Jha and Nandan Yadav before adding Category B all-rounder Pawan Sarraf for NPR 15 lakh. Chitwan Rhinos, captained by Kushal Malla, complete the eight-team field after retaining Gautam KC and Rijan Dhakal while signing Arjun Saud and Dev Khanal for NPR 15 lakh each. Both franchises require rapid group-stage momentum to challenge Lumbini and Sudurpaschim at the top of the standings.",
    "The 27-day tournament window creates specific logistics requirements for team management, player recovery and pitch maintenance. Playing 32 matches on a single ground requires rotation across multiple prepared center wickets at Tribhuvan University Ground. Curators must manage turf wear across consecutive match days, balancing pitch moisture for afternoon seam movement with firm surfaces suitable for evening spin control under floodlights.",
    "Ticketing arrangements for the 32 matches reflect high fan demand across Kathmandu and regional cricket centers. Online ticket booking opens through authorized ticketing partners, offering digital entry passes for general parapet seating and premium viewing enclosures. Special weekend pass packages allow supporters to attend both doubleheader matches, while season passes cover all group fixtures for dedicated franchise followers tracking their team throughout the league stage.",
    "Broadcast coverage for the Season 3 schedule combines domestic television transmission with digital streaming platforms. Kantipur Max provides live high-definition television coverage across Nepal, supported by commentary teams delivering expert analysis in both Nepali and English languages. Digital streaming through DishHome Go and official YouTube channels provides global access for international Nepali diaspora communities following NPL 2026 matches live.",
    "The confirmation of the November 17 to December 13 schedule establishes the final countdown for franchise preparation, overseas player arrivals and squad training camps. As teams arrive in Kathmandu for preseason practice sessions, pitch conditions and weather patterns will dictate playing XI selections. The Season 3 fixture list provides the definitive roadmap for determining which of the eight franchises will claim the Nepal Premier League 2026 championship trophy."
  ],
  "sources": [
    {
      "name": "Cricnepal official schedule overview",
      "url": "https://www.cricnepal.com/nepal-premier-league-2026-schedule"
    },
    {
      "name": "The Kathmandu Post TU ground floodlight report",
      "url": "https://kathmandupost.com/sports/2026/06/20/tu-ground-gets-floodlights-for-npl-season-3"
    },
    {
      "name": "Ratopati NPL season 3 fixtures overview",
      "url": "https://english.ratopati.com/story/69110/npl-season-3-match-schedule-and-venues"
    },
    {
      "name": "NPL Cricket League schedule guide",
      "url": "https://nplcricketleague.com/schedule"
    }
  ],
  "alternativeHeadline": "NPL Season 3 schedule features 28 group matches and four playoff games in Kirtipur",
  "modifiedAt": "2026-07-07T09:15:00+05:45"
};

// Insert at top of news array
currentNews.unshift(newArticle);

fs.writeFileSync(newsPath, JSON.stringify(currentNews, null, 2), 'utf8');
console.log("Successfully expanded new NPL schedule article in data/news.json!");
