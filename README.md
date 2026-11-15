# Pixel Town 32

A 2.5D pixel life sim in a town. Single page, no build step, no game engine. Everything is plain HTML, CSS and JavaScript.

## Run it

Browsers block some features on `file://`, so serve the folder:

```bash
python -m http.server 8765
```

Then open `http://localhost:8765/pixel-town-32.html`.

## Files

| Path | What it is |
|---|---|
| `pixel-town-32.html` | Page shell, CSS, HUD/panel markup. Loads the modules below. |
| `js/people.js` | 50 townsfolk: names, ages, roles, traits, schedules, likes and dislikes. |
| `js/game.js` | Core: canvas renderer with 16×32 character sprites, town and home maps, buildings, state, actions, panels, save/load, main loop. Bed offers 2/4/8/10-hour sleep with different recovery, hunger and lateness effects. |
| `js/wearart.js` | Pixel art for clothing layers and hair extras. |
| `js/life.js` | Character creator (Thai/English names, start at 16 or 6, 22 hairstyles and customizable top/bottom/shoes), parents and genetics, aging, birthdays. |
| `js/seasons.js` | Seasons, weather, 5 festivals with 4 plaza activities each, souvenirs. |
| `js/school.js` | Classes, homework, exams, report cards, graduation. |
| `js/shops.js` | Extra shops and buildings, fishing. |
| `js/pets.js` | Pets, community garden. |
| `js/wardrobe.js` | 138 clothing items, hairstyles, dyes, fashion shop, salon, closet. |
| `js/townlife.js` | NPC real hours (home by dark, staggered bedtimes, lit windows only while awake), needs (hunger/energy/fun), shop shifts (shop closed with no staff; one night clerk keeps the mart 24h), weather reactions, friends/couples walk together, readable chat bubbles, NPCs remark on you, NPC dating/break-ups/weddings, birthday wishes, favours, good-night texts, 📰 news app. |
| `js/nightlife.js` | Night market (18:00–00:30), café bar after 19:00, stargazing, fireflies; weekly events (Wed quiz, Fri movie, Sat farmers' market, Sun park concert); Valentine's, music fest, Loy Krathong on the river, Christmas; police patrols, wanted level, arrests/fines/jail, shoplifting, night pickpockets; new weather visuals (slanted rain, splashes, lightning, fog, cloud shadows, sun rays, vignette). |
| `js/fashion.js` | Style looks (drip, old money, kid, jacket, vintage, minimal, emo): 13 hairstyles, 60 curated items, full-look sets at 15% off, townsfolk dressed by style. Adult women get a `bust` palette flag (shading only). |
| `js/minis.js` | Mini-games: timing bar, quiz, Simon, dodge runner, memory, dance. |
| `js/anim.js` | Activity animations and progress bar. Wraps the furniture and town actions. |
| `js/love.js` | Dating, proposals, weddings, children, playing as your child. |
| `js/phone.js` | Phone: messages, camera, shop delivery, bank, map, calendar, games. |
| `js/walk.js` | A* pathfinding for NPCs, personal schedules, real walk-to-door building entry with fade in/out, held props and idle chats, NPC aging and yearly world events (births, marriages, deaths). |
| `js/dialog.js` | Conversation choices, hatred, rumours, apologies. |
| `js/events.js` | Random life events, illness, bills, tax. |
| `js/audio.js` | Synthesised music and sound effects (Web Audio, no files). |
| `js/collect.js` | Bugs, fossils, fish, museum, sports contests. |
| `js/biz.js` | Your own cafe, boutique or market; town commerce policies affect customer demand. |
| `js/quests.js` | Bounty board, favours, the main story. |
| `js/adventure.js` | The mine: 30 floors, ores, gems, monsters, blacksmith, bosses on floors 10/20/30 and the final clear. |
| `js/mayor.js` | Town treasury and rolling budgets, public approval and elections, four policy groups, multi-day civic construction, and feedback to shop demand, wages, and festivals. |
| `js/talkbox.js` | Dialogue box with portraits, NPC thoughts and dreams, one-at-a-time thought bubbles. |
| `js/goals.js` | First-day checklist (eat, talk to a parent, enter town, open the journal). Shown only on day one, then it disappears. |
| `js/wallet.js` | Family wallet for players under 18: everyday spending draws from the family purse first, own cash is preserved, parents top up weekly, saves stay compatible. |
| `js/lively.js` | Town life and ambience: birds, butterflies, stray cats, kid wanderers, morning market stalls, evening street musician, bird/cricket/murmur ambience. |
| `js/homes.js` | Neighbour homes and the relationship app: knock on a home door, visit the generated living room when residents are inside, browse households, profiles, contact status and pin a home on the map. |
| `js/family.js` | Family life: dining table furniture, family dinners, birthday and anniversary parties, homework help, a family hour on the sofa, spouse paycheck and family summaries in the journal and relationship app. |
| `js/collections.js` | Hobby records: fish/bug/fossil catch counts, personal-best fish sizes, cooked-recipe book, phone collection app, quick museum donations and milestone rewards. |
| `js/career.js` | Career app and odd jobs: job status, promotion ladder, apply/quit, two paid gigs per day, and civic wage-policy bonuses. |
| `js/system.js` | Title screen with save slots, pause menu, settings. |

## Load order (important)

`pixel-town-32.html` loads the modules in this order:

```
people, game, mapart, wearart, life, seasons, school, shops, pets, wardrobe, fashion,
minis, anim, love, phone, walk, dialog, events, audio, collect, biz, quests, adventure,
mayor, talkbox, goals, wallet, lively, homes, family, collections, career, housing,
social, memory, realism, system
```

Modules are plain scripts that share one global scope. A later module can replace or wrap an earlier one's functions (for example `talk`, `say`, `updatePerson`, `personOpts`, `seasonTick`, `lifeTick`, `drawEnt`, `update`). Changing the order will break things. Add new modules before `system.js`, and register them in the array at the bottom of the HTML.

## Architecture notes

- **Rendering:** everything draws to one 2D canvas. `render()` in `game.js` sorts sprites and buildings by their `y` so that things further down the screen draw on top.
- **Scenes:** `town`, `home`, `nRoom` (a visited neighbour's living room) and `mine`. Each is a scene object with `W`, `H`, `tile`, `solid`, `statics`, `targets`, `ents`.
- **Neighbour homes:** `homes.js` adds a door target to every non-shop building. A visit only opens when at least one resident is actually inside (`hidden` + `in`/`home` slot), so daytime knocks get a polite "come back in the evening". The interior is a 10×8 room rebuilt from the furniture catalogue, styled by the household head's trait, and up to four residents wander inside. Residents are frozen (`p.visiting`) while you are in their home. Praising the home is a once-a-day +3 relationship action, and the living room has a sofa (rest 30 minutes) and TV (watch together for an hour) target. Saving inside moves the save back to that home's town door.
- **Relationship app:** `APP.rel` is added to the phone by `homes.js`. It lists townsfolk with relationship buckets (family/friend/love/acquaintance), shows household, head of house, likes, contact status, gift/talk counts, and can jump to messages or pin the home. The pinned home is drawn as a small heart on the phone map.
- **Career app and odd jobs:** `APP.work` in `career.js` shows your current title, shift window, performance bar and promotion requirement, and lets you apply or quit. Each day two paid odd jobs are posted at the cafe, minimart or office; accept one in the app, then choose the gig option at that workplace during its time window. Gigs pay by skill level and mini-game score, give skill XP and count toward the `gig1`/`gig10` achievements.
- **Shop orders:** your own shop gets one bulk order per day in the business panel. Deliver the requested stock for 1.4× market value into the cash drawer and +3 reputation; the order resets each morning.
- **Family life:** `family.js` adds the `table` furniture (฿450 at the furniture shop). Every furniture rebuild gives the placed table a live target: a daily family dinner (one cooked dish, +food/mood and relationship with spouse and kids), a party on the day of a wedding anniversary, a child's birthday or your own birthday (needs a cake or a dish, pays out gifts and affection), and homework help for school-age kids. The sofa also gains a once-a-day family hour. The spouse brings home a daily paycheck at 18:00 based on their role, and the journal family tab lists today's events with countdowns plus dinner/party totals. The relationship app shows spouse and children at the top.
- **Collections:** `collections.js` wraps `addItem` to record every fish, bug and fossil gained (never sales or donations) and every dish cooked. Fish roll a species-specific size, so each species keeps a personal best in `st.rec`. `APP.collect` is the phone's collection app with four tabs, catch counts, best sizes, museum status, a quick donate button and the recipe book. Milestone rewards (`st.crewards`) pay for 6 fish species, all bugs, all fossils and all 7 recipes; old saves seed the record from inventory and museum donations.
- **Mobile UI:** the shell adds safe-area spacing, larger touch targets (42px buttons, 50px dock), wrapping hints, a `dvh`-bounded panel and a compact item layout below 420px.
- **Interaction:** a target is `{ x, y, name, opts }`. `opts` is an array of `[label, fn]` or a getter that returns one. Modules add options by wrapping the getter (see `addOpts`, `extend`, `animTarget` in the code).
- **State:** one object `st`. It is saved to `localStorage` under `pixeltown32-v3-s1..3`. Old saves are migrated only for slot 1.
- **Time:** `st.min` counts game minutes. One real second is two game minutes. `day()`, `hour()`, `age()` derive from it.
- **Starting age:** `st.ageShift` moves the calendar age up; new games start at 16 by default, with a 6-year-old option for the childhood path. `st.lastAge` drives birthday checks.
- **Progression extras:** `st.goals` is the day one checklist, `st.fest` records festival activities per festival day, and `st.gear.bossKills` / `st.gear.cleared` / `st.gear.heart` track mine bosses and the permanent +20 max-HP clear reward.
- **Family wallet:** under 18, `st.money` is a computed total (`wallet.js` installs the accessor). Spending takes from `st.famMoney` first, so the player's own cash survives childhood. `cashOwn()` reads the player's own part, and the bank only deposits own cash. Asking a parent for money works once per day and can be refused. After day 1 the family purse gets +฿300 a week, capped at ฿1,500, and it stops mattering at 18. Saves from before the update are detected with `st.wallet`.
- **NPC daily life:** `schedOf()` shifts every schedule by about ±15 minutes and swaps park/plaza stops for personal favourite haunts. NPCs walk to a building's door, fade out, and are hidden inside; they reappear at that door on the way out. Some workers and students stay outside on a break instead of entering. Held props (umbrella, cup, bag, folder, book, phone) and paired chat bubbles vary the crowd.
- **Sleep:** the bed menu offers 2, 4, 8 and 10 hours directly. Short naps give partial energy, 8 hours refills fully, and 10 hours gives the most mood but leaves the player hungry and awake late.
- **Town ambience:** `lively.js` draws birds and butterflies above the scene, moves stray cats, opens the market at 06:00–11:00, puts a musician on the street at 17:30–21:00, and adds quiet procedural bird, cricket and crowd sounds. The market and musician are also interaction targets.
- **Language:** the player-facing UI is Thai. Building wall signs stay English (`MART`, `CHAPEL`, `TOWN HALL`, …) because the 3×5 sign font only has ASCII glyphs.
- **Balance knobs:** `CFG.diff` (easy/normal/hard) scales drains and event rates. Most prices and rewards are literal numbers in the module that owns them.

## Known limits

- Balance is still tuned by code review and scripted playtests rather than a long hand-played campaign.
- Sound and the mini-game visuals have been checked by code path only, not by ear or by eye at length.
- NPC pathfinding is a plain A* on the tile grid and can be slow if many NPCs move at once.
- The town has five home buildings for fifty townsfolk, so each house is a large shared household; a visit shows up to four residents in the living room.
- Tested with scripts in the browser plus smoke tests, not by hand from start to finish.

## Testing

Modules contain `console.assert` checks at load time (item tables, placement, interaction points). Open the console: any failed assert prints a message. There is no test runner.

## Added in the sprite / life-sim update

| File | What it is |
|---|---|
| `js/wearart.js` | Rewritten: 24x40 sprites, 7 frames per direction (idle + 6-frame walk), all hair/clothing layers redrawn for the new body. Replaces the old 32x32 `charCanvas`/`sheet` in `game.js`. |
| `js/housing.js` | Move out at 18 (7-day deadline), rent studio/apartment/house or buy with a 40-week mortgage, weekly rent, eviction after 3 missed payments, separate parents' house (`parentsHome`), partner moves in. |
| `js/social.js` | 19 two-person social actions with animations (hug, kiss, comfort, dance, argue, slap, apologise…) and adults-only private time with consent and fade-to-black. |
| `js/memory.js` | NPC memories, memory lines in dialogue, gossip through friends, NPC-to-NPC friendships/feuds, town reputation, aging, parents' and player's death, funerals, inheritance. |
| `js/realism.js` | Bladder, stress, sleep debt, weight, injuries, food poisoning/colds, moodlets, loans + credit score, utility bills by usage, yearly inflation. |

Load order now ends with: `… career, housing, social, memory, realism, system`. Backup of the files before this update: `js.backup-before-sprites/`.

## Map redesign (`js/mapart.js`, loaded right after `game.js`)

Keeps every building and tile coordinate north of row 30. Extends the town to 40x42: a cliff-lined river (rows 32-36) with
three wooden bridges on the road columns, a meadow and a forest edge to the south. Tile types: 0 grass, 1 cobblestone,
2/7 dirt path, 3 meadow, 4 water, 5 bridge, 6 cliff. Also redraws trees, lamps and buildings (gable tile roofs,
timber or brick walls, shutters, chimney smoke) and adds walk-through scenery. Cars reduced to 3.
