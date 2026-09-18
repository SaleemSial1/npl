import os
import re

team_data = {
    "biratnagar-kings": {
        "intro1": "The <strong>Biratnagar Kings</strong> are an official franchise in the Nepal Premier League (NPL) Season 3. Representing the eastern hub of Biratnagar, the team has strategically built a squad focused on all-round depth and aggressive middle-order batting.",
        "intro2": "For the upcoming 2026 season in Kirtipur, the Kings have locked in a robust core during the retention and auction windows, setting their sights firmly on the championship title."
    },
    "chitwan-rhinos": {
        "intro1": "The <strong>Chitwan Rhinos</strong> enter the Nepal Premier League (NPL) Season 3 as a franchise built on dynamic stroke play and versatile bowling. Representing the wildlife-rich Chitwan region, the Rhinos have historically focused on assembling a powerful T20 lineup.",
        "intro2": "With key domestic stars secured during the July 2026 mega auction, the Rhinos are finalizing their strategy for the Kirtipur conditions, aiming to dominate the spin-friendly tracks."
    },
    "janakpur-bolts": {
        "intro1": "The <strong>Janakpur Bolts</strong> are a flagship franchise in the Nepal Premier League (NPL) representing Madhesh Province. Known for their electrifying brand of cricket, the Bolts have restructured their leadership and core squad heading into Season 3.",
        "intro2": "Under new captaincy and with a revamped spin attack suited for the Tribhuvan University ground, the Bolts are preparing for a highly competitive 2026 tournament window."
    },
    "karnali-yaks": {
        "intro1": "The <strong>Karnali Yaks</strong> bring the resilient spirit of Nepal's rugged Karnali province to the Nepal Premier League (NPL) 2026. The franchise has consistently prioritized developing homegrown talent alongside impactful overseas signings.",
        "intro2": "Following the latest player retention and auction cycles, the Yaks have assembled a balanced squad designed to challenge the league's heavyweights in the upcoming Kirtipur fixtures."
    },
    "kathmandu-gurkhas": {
        "intro1": "The <strong>Kathmandu Gurkhas</strong> are the capital city's premier franchise in the Nepal Premier League (NPL). Drawing inspiration from their namesake's legendary courage, the team features a stable core of experienced international and domestic players.",
        "intro2": "With strategic retentions and high-value auction buys, the Gurkhas are positioned as formidable contenders for the NPL 2026 championship."
    },
    "lumbini-lions": {
        "intro1": "The <strong>Lumbini Lions</strong> are a powerhouse franchise in the Nepal Premier League (NPL), representing the historic Lumbini region. As defending champions (in the current franchise structure), the Lions made waves with aggressive bidding during the 2026 mega auction.",
        "intro2": "Armed with marquee batting talent and a proven winning formula, the team is heavily favored to mount a strong title defense in Kirtipur."
    },
    "pokhara-avengers": {
        "intro1": "The <strong>Pokhara Avengers</strong> represent Nepal's scenic lake city in the Nepal Premier League (NPL) Season 3. The franchise has heavily invested in top-order firepower and aggressive bowling tactics for the 2026 campaign.",
        "intro2": "By retaining explosive national team openers and securing high-value domestic stars, the Avengers are built to maximize powerplay scoring at the TU Cricket Ground."
    },
    "sudurpaschim-royals": {
        "intro1": "The <strong>Sudurpaschim Royals</strong> represent the far-western region of Nepal and stand out as one of the most consistent performers in franchise history. Known for their tactical acumen and spin mastery, they are perennial title contenders.",
        "intro2": "Having reached the finals previously, the Royals have bolstered their 2026 squad with key overseas all-rounders, aiming to cross the final hurdle and lift the NPL trophy."
    }
}

def clean_html(slug, html):
    # 1. Replace intro texts for standard teams
    if '<section class="team-intro">' in html:
        # Find the content inside <div class="team-intro-content">
        pattern = r'(<div class="team-intro-content">)(.*?)(</div>\s*</div>\s*</section>)'
        
        if slug in team_data:
            new_intro = f"""\\1
<p class="intro-text">
    {team_data[slug]['intro1']}
</p>
<p class="intro-text">
    {team_data[slug]['intro2']}
</p>
\\3"""
            html = re.sub(pattern, new_intro, html, flags=re.DOTALL)
            
    # 2. Replace intro texts for biratnagar/chitwan
    if '<!-- Intro Text -->' in html:
        pattern = r'(<!-- Intro Text -->\s*<section class="intro-card">)(.*?)(</section>)'
        if slug in team_data:
            new_intro = f"""\\1
<p>
    {team_data[slug]['intro1']}
</p>
<p>
    {team_data[slug]['intro2']}
</p>
\\3"""
            html = re.sub(pattern, new_intro, html, flags=re.DOTALL)
            
    # 3. Completely REMOVE fake history sections from main-content
    # The hallucinated sections usually span from <section class="history"> to 
    # either <!-- Sidebar Content Integrated into Main Content --> or <!-- Fan Support --> closing
    
    # Let's just remove anything from <!-- Team History Section --> to <!-- Sidebar Content Integrated into Main Content -->
    history_start = html.find('<!-- Team History Section -->')
    if history_start == -1:
        history_start = html.find('<section class="history">')
        
    sidebar_start = html.find('<!-- Sidebar Content Integrated into Main Content -->')
    
    if history_start != -1 and sidebar_start != -1 and history_start < sidebar_start:
        # We delete everything in between, and put a verified section instead, or nothing
        html = html[:history_start] + html[sidebar_start:]

    return html

for filename in os.listdir("teams"):
    if not filename.endswith(".html"):
        continue
    
    filepath = os.path.join("teams", filename)
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()
        
    slug = filename.replace(".html", "")
    new_html = clean_html(slug, html)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_html)

print("Team contents cleaned and improved!")
