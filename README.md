# Pixel Town 32

A 2.5D pixel life sim in a town. Single page, no build step, no game engine. Everything is plain HTML, CSS and JavaScript. The 12-category expansion plan is in [`ROADMAP.md`](ROADMAP.md).

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
| `js/life.js` | Character creator (Thai/English names, start at 16 or 6, hairstyles and customizable top/bottom/shoes), parents and genetics, aging, birthdays. Hairstyles are strictly separated by gender: `HAIR_G` lists the 12 male and 10 female cuts, `hairOk(g,id)`/`hairFor(g,style,hx)`/`hairPick(g)`/`normalizeLook(look)` guarantee a body never wears the other gender's cut (and men never get skirts or dresses). `dnaLine(from)` prints which parent each hair colour, skin tone and eye colour came from. `bakeLook(look,p,k)` stores a generated NPC outfit once in `look.base`, so a body's sprite is identical whether you are playing it or walking past it. |
| `js/seasons.js` | Seasons, weather, 5 festivals with 4 plaza activities each, souvenirs. |
| `js/school.js` | Classes, homework, exams, report cards, graduation. |
| `js/shops.js` | Extra shops and buildings, fishing. |
| `js/pets.js` | Pets, community garden. |
| `js/wardrobe.js` | 138 clothing items, hairstyles, dyes, fashion shop, salon, closet. The closet/salon hair list only offers cuts for the body's gender (`hairOk`), illegal hair in `st.wear` is ignored, and `makeFamily()` bakes each parent's generated outfit into `look.base` so parent sprites and their switchable bodies match. |
| `js/townlife.js` | NPC real hours (home by dark, staggered bedtimes, lit windows only while awake), needs (hunger/energy/fun), shop shifts (shop closed with no staff; one night clerk keeps the mart 24h), weather reactions, friends/couples walk together, readable chat bubbles, NPCs remark on you, NPC dating/break-ups/weddings, birthday wishes, favours, good-night texts, 📰 news app. |
| `js/npclife.js` | NPC life core: long-term goals per role and daily goals, six needs (adds loneliness/stress/privacy to hunger/energy/fun), event-driven schedules, seven weekly routines, nine hobbies, life-stage flavour, personal events with news, NPC–NPC bond labels, and profile/chat/thought integration. Wraps `slotOf`, `tick`, `seasonTick`, `personOpts`, `chatLine`, `mindOf`, `relProfileView` and `drawEnt`; it does not replace the walk, shop or romance systems. |
| `js/npcdeep.js` | Memory & trust: a persistent trust score separate from friendship, weighted memories with salience decay, secrets with promise/leak/spread/found-out tracking, grudges with venue avoidance and reconciliation (including player mediation), and NPC crushes. Wraps `remember`, `memoryLine`, `apologize`, `date`, `confess`, `slotOf`, `seasonTick`, `chatHook`, `mindOf`, `chatLine`, `personOpts` and `relProfileView`; state is lazily created so old saves keep working. |
| `js/npcmove.js` | Living households: ten seeded families, four migration types (couples move in together, grown teens move out, elders join family, overcrowded homes split), daily household sync, family routines, per-home furniture and family portraits, migration news and player hooks (help move, farewell party, visit the new home). Wraps `roomLayout`, `drawNpcRoomBg`, `enterNpcHome`, `relProfileView`, `APP.rel`, `slotOf`, `drawEnt`, `seasonTick`, `makePeople`, `applyEvent`, `divorce` and `start`. |
| `js/nightlife.js` | Night market (18:00–00:30), café bar after 19:00, stargazing, fireflies; weekly events (Wed quiz, Fri movie, Sat farmers' market, Sun park concert); Valentine's, music fest, Loy Krathong on the river, Christmas; police patrols, wanted level, arrests/fines/jail, shoplifting, night pickpockets; new weather visuals (slanted rain, splashes, lightning, fog, cloud shadows, sun rays, vignette). |
| `js/fashion.js` | Style looks (drip, old money, kid, jacket, vintage, minimal, emo): 13 hairstyles, 60 curated items, full-look sets at 15% off. `npcWear` gives every townsperson a deterministic outfit across top, bottom, shoes, hat, glasses, accessory and hair, avoiding duplicate full outfits until the combination pool runs out; `nwHair` only draws cuts from that person's gender list. Adult women get a `bust` palette flag (shading only). |
| `js/minis.js` | Mini-games: timing bar, quiz, Simon, dodge runner, memory, dance. |
| `js/anim.js` | Activity animations and progress bar. Wraps the furniture and town actions. |
| `js/love.js` | Dating, proposals, weddings, children, playing as your child. |
| `js/dating.js` | Relationship progress panel (stage, next step, progress bar), free dates from 10 friendship, and confession from 20 with no gift. Player romance is open to every adult 18+ — including partnered and older townsfolk — with one free casual walk per NPC per day. |
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
| `js/tech.js` | Five online career tracks (programmer, game developer, YouTube creator, streamer, graphic designer) worked from the home PC, a daily four-offer online gig board, portfolio rank and followers, PC/phone integration and four achievements. |
| `js/tutorial.js` | Guided nine-step onboarding quest (walk, HUD, phone, online app, apply, first remote shift, first online gig, sleep, save) with a floating tracker, world marker and screen-edge compass, pulsing target buttons, skip/close, and replay from the phone's 🧭 app. |
| `js/lighting.js` | Cinematic lighting pass: smooth time-of-day colour grading, street-lamp cones and pools, lit-window spill tied to residents who are actually awake and shops that are actually open, neon sign glow, car head/tail lights, wet-road reflections, moon/sun beams through house windows, and warm lamp/TV light in interiors. Cached gradient sprites keep it cheap; `game.js` calls `ambientPass`/`lightPass` only when they exist, so the old flat overlay is still the fallback. |
| `js/status.js` | Birth status and social class: five classes (ยากจน / พออยู่พอกิน / ชั้นกลาง / มีฐานะ / ร่ำรวย), creator picker, starting money/home/furniture, class-based XP and wages, daily social mobility, NPC class from role, town class distribution and equality, the `🏅 สถานะ` phone app, and class inheritance through `passTorch`. |
| `js/safety.js` | Safety and quality of life: place/time-based safety index, night thief risk, uneasy moodlet, HUD safety row, daily safety news, CCTV project and patrol policy, and the `🏙️ เมือง` phone app with city stats, class mix, projects, policies and a safe walk home. |
| `js/income.js` | Extra income: a daily three-job side board with an all-three bonus, three online freelance offers per day, a four-asset investment market with daily prices, and a daily check-in streak. Adds phone apps, a PC shortcut and a board in the plaza. |
| `js/stories.js` | Phase 5 "ชุดเชื่อมเมือง": three connected four-chapter life stories (the old café, the furniture family, the carpenter's secret) sharing one backstory, one chapter per in-game day with a one-day grace window, a `📖 เรื่องราว` phone app, ending-specific rewards, three world flags, story phone messages, and two enterable interiors (ร้านกาแฟเก่า, โรงไม้) on the `nRoom` scene. |
| `js/funtime.js` | 15 inviteable activities for a partner, spouse, parent, child or close friend (picnic, movie night, stargazing, night market, beach trip, family dinner…), each with a two-person animation, place/time/price rules, a daily cooldown, relationship/mood rewards, a keepsake photo in the phone album, and a 🖼️ memory log with daily and streak bonuses. |
| `js/timeskip.js` | Sleep through whole years from the bed: 🌌 นอนข้ามเวลา offers 1/2/3/5/10 years, simulates every birthday inside the skip (aging, parent deaths, town news, inflation, job wages), auto-resolves missed story chapters, and reports everything in one 🌅 summary panel. Sleeping is free. Old saves get `st.ts` lazily. |
| `js/swap.js` | Family switching: the `👪 ครอบครัว` phone app plays any household member (parents, spouse, siblings, kids of any age) back and forth for free, leaves the body you left behind as an NPC living at home, keeps one shared household purse while skills/inventory/outfit/job stay per person, warps you home from anywhere, and pays the family members you are not playing at 18:00. Haircuts, dyes and outfits you change while playing a body are written back to that body's record and NPC sprite; every body sprite is built from `palOf(look)` plus its baked `look.base`, so the person you switch into is pixel-identical to the NPC you left behind. A 🧬 DNA section in the app lists which parent gave each hair colour, skin tone and eye colour. Old saves get `st.famSw` and `st.ageShift0` lazily. |
| `js/sibling.js` | Siblings rolled at the start of a new life (22% none, 46% one, 32% two): an older brother/sister or younger one, 1–5 years apart, with their own name, gender, trait, schedule, DNA record from พ่อ/แม่, and a baked everyday outfit. They live in the house, show up in the `👪 ครอบครัว` app, journal and family rows, can be switched into like any family member, and answer to คุยด้วย / กอด / เล่นด้วยกัน / ขอเงินพี่ / ให้ของขวัญ. `ensureSibs()` is idempotent, so `makeFamily`, `passTorch` and `start` can rebuild the household without duplicating anyone. |
| `js/famgig.js` | Family help gigs: walk up to a parent, sibling or spouse at their workplace, at school or at home in the evening and choose “ช่วยงาน”. You get a share of their wage (45% at work, a smaller household rate at home, nothing but skill and bond for school/toddler help), +4 closeness, a little skill XP, and they remember it. Once per person per day, reset at midnight. Family members who are inside a building are reachable through that building's door option; the 👪 app lists who still needs a hand today and the running total earned. Old saves get `st.fgig` lazily. |
| `js/famshop.js` | Family food stall: cook dishes at home, then sell them at a stall on the town plaza (09:00–21:00). Prices come from the café value table × cooking skill quality. One family member can work the counter — a mother/spouse adds 12% price, a father 6%, a sibling +2 customers — for a 20% cut of the gross, but only while their own schedule has them free (home, plaza, park); at work or school they give no bonus. Customers are capped per day (`4 + charm/2 + helper + reputation/20`, −2 in rain, +2 at festivals), so a session is: cook a batch, walk to the plaza, sell it, go home. Tracks `st.famShop` lazily (today's takings, best day, days open, reputation, helper, family's share) and shows a section in the 👪 app. Adds a white/blue/pink apron top and one new cut per gender (quiff, low bun). |
| `js/system.js` | Title screen with save slots, pause menu, settings. Any Escape that closes a conversation is swallowed so the pause menu cannot open on top of it. |

## Load order (important)

`pixel-town-32.html` loads the modules in this order:

```
people, game, mapart, wearart, life, seasons, school, shops, pets, wardrobe, fashion,
minis, anim, love, phone, walk, dialog, events, audio, collect, biz, quests, adventure,
mayor, talkbox, goals, wallet, lively, homes, family, collections, career, tech, income,
housing, social, memory, realism, townlife, npclife, npcdeep, npcmove, nightlife, tutorial, lighting,
status, safety, dating, stories, funtime, timeskip, sibling, swap, famgig, famshop, system
```

Modules are plain scripts that share one global scope. A later module can replace or wrap an earlier one's functions (for example `talk`, `say`, `updatePerson`, `personOpts`, `seasonTick`, `lifeTick`, `drawEnt`, `update`). Changing the order will break things. Add new modules before `system.js`, and register them in the array at the bottom of the HTML.

## Architecture notes

- **Rendering:** everything draws to one 2D canvas. `render()` in `game.js` sorts sprites and buildings by their `y` so that things further down the screen draw on top.
- **Lighting:** `lighting.js` is the final presentation layer. `game.js` calls `ambientPass(sc, d, camX, camY)` after the world is drawn (smooth dawn/day/dusk/night gradient instead of one flat navy rectangle), then `overlayFx` draws weather, then `lightPass(sc, camX, camY, d)` paints artificial light on top so lamps and windows still glow through rain and fog. Light sprites and lamp cones are cached canvases; window spill reads `TL.lit` (awake residents) and `shopOpen()` so only genuinely lit rooms throw light. Interiors get warm lamp pools, TV flicker and window beams; the mine gets a torch and a cave vignette. With no lighting module, or if it fails to load, `render()` falls back to the old flat overlay and radial glows.
- **Scenes:** `town`, `home`, `nRoom` (a visited neighbour's living room) and `mine`. Each is a scene object with `W`, `H`, `tile`, `solid`, `statics`, `targets`, `ents`.
- **Neighbour homes:** `homes.js` adds a door target to every non-shop building. A visit only opens when at least one resident is actually inside (`hidden` + `in`/`home` slot), so daytime knocks get a polite "come back in the evening". The interior is a 10×8 room rebuilt from the furniture catalogue, styled by the household head's trait, and up to four residents wander inside. Residents are frozen (`p.visiting`) while you are in their home. Praising the home is a once-a-day +3 relationship action, and the living room has a sofa (rest 30 minutes) and TV (watch together for an hour) target. Saving inside moves the save back to that home's town door.
- **Relationship app:** `APP.rel` is added to the phone by `homes.js`. It lists townsfolk with relationship buckets (family/friend/love/acquaintance), shows household, head of house, likes, contact status, gift/talk counts, and can jump to messages or pin the home. The pinned home is drawn as a small heart on the phone map.
- **Story arcs (Phase 5):** `stories.js` owns `st.story` (`v`, `arc`, `mem`, `perk`, `world`, `avail`) and never touches the seven-chapter main story in `Q().story`. Three arcs — café (`finn`), family (`ryan`/`ivy`) and woodshop (`cora`) — unlock through a relationship threshold plus a minimum day, then schedule chapters at +0/+2/+4/+6 days with a one-day grace window. A missed chapter is logged and skipped, and a missed finale resolves to the arc's default ending. Each ending sets a world flag (`world.cafe` 0/1/2, `world.family` 1/2/3, `world.workshop` 0/1), sends an in-character phone message, and offers one of three once-only rewards from the story app. `APP.story` shows active, completed and locked arcs, chapter progress, summaries, missed-chapter markers and unclaimed rewards. `ร้านกาแฟเก่า` and `โรงไม้` reuse the `nRoom` scene with their own backgrounds, statics and targets plus `visit.story`; saving or leaving maps back to the building door like a neighbour home. Story rooms clear `p.visiting` on exit so no NPC stays frozen.
- **Career app and odd jobs:** `APP.work` in `career.js` shows your current title, shift window, performance bar and promotion requirement, and lets you apply or quit. Each day two paid odd jobs are posted at the cafe, minimart or office; accept one in the app, then choose the gig option at that workplace during its time window. Gigs pay by skill level and mini-game score, give skill XP and count toward the `gig1`/`gig10` achievements.
- **Online careers:** `tech.js` merges five remote tracks into `JOBS` with `remote: 1|2`, so they share the normal shift mini-game, performance bar, pay ladder and promotion rules. They are hidden from the local job list and instead appear in `APP.online`; work them from the computer at home (`FURN_ACTS.pc` gains "เริ่มกะ…"). A separate board posts four paid gigs per day (drawn deterministically from 14 offers), each with a skill, time, energy cost and mini-game. `techState()` in `st.tech` tracks the daily board, portfolio pieces and shift count; rank thresholds are 4/12/24/40/60 pieces and followers are 15 per piece. All of it saves with the normal game state.
- **Guided tutorial:** `tutorial.js` drives nine steps stored in `st.tut` (`on`, `step`, `at/base`, `flags`, `claimed`, `finished`). Each step has a live `done()` check, optional UI selector to pulse, and optional world target drawn as a bobbing gold marker or a screen-edge compass arrow. The tracker hides while a panel, menu, mini-game or fade is open and reappears with the phone-panel banner; steps can be skipped or paused, and the phone's 🧭 app replays the whole chain. New games start it automatically; old saves get an inert legacy record and can start it from the app. Completion pays ฿300, mood and logic XP once per save and unlocks the `tutorial` achievement.
- **Extra income:** `income.js` adds four channels beside the existing jobs and business. The plaza board (and `APP.hustle`) posts three side jobs each day; each pays by skill and mini-game score, and doing all three pays a ฿60 bonus plus coffee. `APP.free` posts three online freelance offers per day, with higher pay for higher skills and a few level requirements. `APP.invest` tracks four town assets whose prices move every day; buying and selling uses the player's own cash only, so it works alongside the family wallet. The board also has a once-a-day check-in whose streak raises the reward. State lives in `st.income`; side and freelance lists reset in `incomeDaily()` through `seasonTick`, while investments persist. All four count toward new achievements.
- **Shop orders:** your own shop gets one bulk order per day in the business panel. Deliver the requested stock for 1.4× market value into the cash drawer and +3 reputation; the order resets each morning.
- **Family life:** `family.js` adds the `table` furniture (฿450 at the furniture shop). Every furniture rebuild gives the placed table a live target: a daily family dinner (one cooked dish, +food/mood and relationship with spouse and kids), a party on the day of a wedding anniversary, a child's birthday or your own birthday (needs a cake or a dish, pays out gifts and affection), and homework help for school-age kids. The sofa also gains a once-a-day family hour. The spouse brings home a daily paycheck at 18:00 based on their role, and the journal family tab lists today's events with countdowns plus dinner/party totals. The relationship app shows spouse and children at the top.
- **Collections:** `collections.js` wraps `addItem` to record every fish, bug and fossil gained (never sales or donations) and every dish cooked. Fish roll a species-specific size, so each species keeps a personal best in `st.rec`. `APP.collect` is the phone's collection app with four tabs, catch counts, best sizes, museum status, a quick donate button and the recipe book. Milestone rewards (`st.crewards`) pay for 6 fish species, all bugs, all fossils and all 7 recipes; old saves seed the record from inventory and museum donations.
- **Unique outfits:** `fashion.js` replaces the old fixed style looks with `npcWear(person, key)`. It groups people by boy/girl/man/woman/elder and draws a top, bottom, shoes and optional hat/glasses/accessory from the full wardrobe, plus a hairstyle. Picks are seeded from the person's stable id, cached in `NW_CACHE`, and tracked in shared full-outfit and core-clothes signature sets, so no two townsfolk look identical until their demographic's combinations are exhausted. Yearly newborns, player children and park kids use the same function.
- **Birth status and social class:** `status.js` stores `st.cls` (`born`, `id`, `best`, `base`, `since`, `hist`, `met`, `line`). The creator injects a five-button class picker (`BIRTH_PICK`) and `clsApplyBirth()` sets starting cash, family purse, `homeLv`, furniture set, inventory and a little skill XP before `start()`. Current class is recomputed daily: net assets (`cashOwn + famMoney + home value + 50% furniture + 50% skills`) are compared with the starting `base`; +฿4k/12k/30k/60k moves you up a step and -฿3k/10k/25k moves you down. Each class has an XP multiplier (poor learns faster) and a wage multiplier (rich has connections), shown in `APP.cls`. NPC class is deterministic from role plus an id hash, appears in the relationship profile, and feeds `clsSplit()`/`inequality()`. `stat('equality')` is a sixth city stat derived from inequality plus civic effects; `PROJECTS.housing` and the `welfare` policy raise it. Old saves get a lazy `st.cls` derived from current assets, so nobody is punished by the update.
- **Safety and QoL:** `safety.js` computes `safetyAt(x, y)` from the city safety stat, time of day, nearby anchors (plaza/cafe/mart are safer at night, park/school/library are not) and nearby police. `nightRiskMul()` scales the night pickpocket spawn chance in `nightlife.js`; a `🌙 ระวังตัวยามค่ำ` moodlet, a HUD safety row and daily town news surface the risk. The CCTV project and patrol policy raise safety, and `APP.city` shows town stats, class mix, projects, policies and a 10-minute safe walk home.
- **Mobile UI:** the shell adds safe-area spacing, larger touch targets (42px buttons, 50px dock), wrapping hints, a `dvh`-bounded panel and a compact item layout below 420px. Landscape phones get a two-column panel/menu, a horizontal tab strip, 38–44px item buttons and hidden bottom close buttons (✕, tap outside and back all close). The expanded HUD caps its detail block at 54% of the visible height and scrolls inside it, so the collapse bar and most of the screen stay reachable. A portrait rotate screen covers the game on touch devices.
- **Interaction:** a target is `{ x, y, name, opts }`. `opts` is an array of `[label, fn]` or a getter that returns one. Modules add options by wrapping the getter (see `addOpts`, `extend`, `animTarget` in the code).
- **State:** one object `st`. It is saved to `localStorage` under `pixeltown32-v3-s1..3`. Old saves are migrated only for slot 1.
- **Time:** `st.min` counts game minutes. One real second is two game minutes. `day()`, `hour()`, `age()` derive from it.
- **Starting age:** `st.ageShift` moves the calendar age up; new games start at 16 by default, with a 6-year-old option for the childhood path. `st.lastAge` drives birthday checks.
- **Progression extras:** `st.goals` is the day one checklist, `st.fest` records festival activities per festival day, and `st.gear.bossKills` / `st.gear.cleared` / `st.gear.heart` track mine bosses and the permanent +20 max-HP clear reward.
- **Family wallet:** under 18, `st.money` is a computed total (`wallet.js` installs the accessor). Spending takes from `st.famMoney` first, so the player's own cash survives childhood. `cashOwn()` reads the player's own part, and the bank only deposits own cash. Asking a parent for money works once per day and can be refused. After day 1 the family purse gets +฿300 a week, capped at ฿1,500, and it stops mattering at 18. Saves from before the update are detected with `st.wallet`.
- **NPC daily life:** `schedOf()` shifts every schedule by about ±15 minutes and swaps park/plaza stops for personal favourite haunts. NPCs walk to a building's door, fade out, and are hidden inside; they reappear at that door on the way out. Some workers and students stay outside on a break instead of entering. Held props (umbrella, cup, bag, folder, book, phone) and paired chat bubbles vary the crowd. Paths come from `findPath()` in `walk.js`: a binary-heap A* over reused typed arrays, cached by start/target tile pair (600 entries), so repeating commutes cost a map lookup. A cold search on the 40×30 town measures ~0.6ms; a cached one is effectively free.
- **NPC life core:** `npclife.js` gives every townsperson a persistent life record in `st.npcLife[id]` (`g` long-term goal, `gp` progress, `hb` hobby, `q`/`qp` daily goal, `ev` active personal event, `gd`/`gc`/`grad` completion and graduation). Goals advance only while the NPC is actually doing a matching activity, so work, school and hobbies matter. Six needs are tracked: hunger/energy/fun stay in `st.npcN[id]`, while `lo` loneliness, `sx` stress and `pv` privacy are added lazily to the same record. `st.nplDay` guards the once-a-day rollover: new daily goals, event expiry, at most two new personal events, and news. `nplSlot()` overlays events, routines and hobbies on the normal schedule but keeps the base slot for normal work shifts, festival evenings, weekly event gatherings and the 24-hour night clerk; only an active personal event can override a work shift. The relationship profile gains a life section (goal, daily goal, hobby, weekday routine, needs, closest bonds, rival, life-stage line), and NPC chat/thoughts occasionally mention them. Old saves get defaults on first use; 50 NPCs add about 0.05 ms per `tick` and 0.12 ms per full `slotOf` sweep on the test machine. See `ROADMAP.md` for the 12-category plan.
- **Memory & trust:** `npcdeep.js` adds `st.npcTrust[id]` (0–100, seeded from friendship and a stable per-person hash, kept separate from `rel.f`), `st.npcSecret[id]`, `st.npcGrudge[pairKey]`, `st.npcCrush[id]`, `st.npcChatDay[id]` and `st.npcDeepDay`. `remember()` now stamps each memory with an importance `w`, and a table maps interactions (gifts, favours, insults, violence, dates, apologies) to trust changes. `memoryLine` chooses the most salient memory the NPC has not mentioned that day, with salience decaying over time, so recent strong events push out old small talk. Secrets open at trust 50: listening raises trust, promising raises it further, and telling another NPC leaks it (−18 trust, −12 friendship, +12 hatred) and starts a rumour chain through the listener's friends; the owner finds out a day or two later (−10 more), while seven quiet days grant a kept-secret bonus. Grudges come from `npcLife` fights and hostile NPC pairs, make the pair avoid a shared free-time venue about 72% of the time, expire on their own, or can be reconciled through player mediation in chat. Crushes are NPC→NPC (rarely NPC→player) and show up in thoughts, chat and the profile. The relationship profile appends trust, latest memories, secret/leak status, active grudge and crush rows. Old saves get every key lazily. Measured on the test machine: `slotOf` about 3 µs/call, `tick` about 0.06 ms for 52 people, and the full once-a-day rollover about 1.2 ms.
- **Living households & migration:** `npcmove.js` seeds ten households in `st.npcMove.home` while keeping `p.home` as the building index, so paths, doors, interiors and old saves keep working. Four migration types run every two days from `seasonTick` in a `couple → teen → elder → split` cycle: couples move in together, teens aged 16–19 rent a room, elders join a family with children, and homes over six people split (a couple or an adult moves out, with a guard that never leaves minors without an adult). Moves update membership live and write `townNews`, while the door and household panel offer help-moving (฿80 + trust for three days), a farewell party (needs a dish and posts news) and a first-visit mood bonus. Each household gets a daily routine — dinner, chores, childcare, birthday/anniversary party, or a free day — that pulls its members home at the appointed hours and draws a small routine badge while they walk home. Interiors are rebuilt per house: the base layout gains a dining table, second bed, PC, teddy, plants and shelves from the residents, and the wall gets a family portrait with one head per member, crayon drawings when children live there, and a HOME n plaque. The relationship app shows recent moves, and every profile gains household, routine, birthday, wedding anniversary and latest move rows. Old saves upgrade once (`NM_VER`); family members and the player's own household are never migrated.
- **Sleep:** the bed menu offers 2, 4, 8 and 10 hours directly. Short naps give partial energy, 8 hours refills fully, and 10 hours gives the most mood but leaves the player hungry and awake late.
- **Town ambience:** `lively.js` draws birds and butterflies above the scene, moves stray cats, opens the market at 06:00–11:00, puts a musician on the street at 17:30–21:00, and adds quiet procedural bird, cricket and crowd sounds. The market and musician are also interaction targets.
- **Language:** the player-facing UI is Thai. Building wall signs stay English (`MART`, `CHAPEL`, `TOWN HALL`, …) because the 3×5 sign font only has ASCII glyphs.
- **Balance knobs:** `CFG.diff` (easy/normal/hard) scales drains and event rates. Most prices and rewards are literal numbers in the module that owns them.

## Known limits

- Balance is still tuned by code review and scripted playtests rather than a long hand-played campaign.
- Sound and the mini-game visuals have been checked by code path only, not by ear or by eye at length.
- The town has ten home buildings for fifty townsfolk, so households still share rooms; a visit shows up to four residents in the living room. Migration and household balance are tuned by deterministic test runs, not a long campaign.
- Tested with scripts in the browser plus smoke tests, not by hand from start to finish.

## Testing

Modules contain `console.assert` checks at load time (item tables, placement, interaction points). Open the console: any failed assert prints a message. There is no test runner.

## Added in the sprite / life-sim update

| File | What it is |
|---|---|
| `js/wearart.js` | Rewritten: 24x40 sprites, 7 frames per direction (idle + 6-frame walk), all hair/clothing layers redrawn for the new body. Replaces the old 32x32 `charCanvas`/`sheet` in `game.js`. |
| `js/housing.js` | Move out at 18 (7-day deadline), rent studio/apartment/house or buy with a 40-week mortgage, weekly rent, eviction after 3 missed payments, separate parents' house (`parentsHome`), partner moves in. |
| `js/social.js` | 19 two-person social actions with animations (hug, kiss, comfort, dance, argue, slap, apologise…) and adults-only private time with consent and fade-to-black. |
| `js/dating.js` | Relationship progress, next-step guidance, free dates from 10 friendship, confession from 20, open to every adult 18+, and one free casual walk per NPC per day. |
| `js/memory.js` | NPC memories, memory lines in dialogue, gossip through friends, NPC-to-NPC friendships/feuds, town reputation, aging, parents' and player's death, funerals, inheritance. |
| `js/realism.js` | Stress, sleep debt, weight, injuries, food poisoning/colds, moodlets, loans + credit score, utility bills by usage, yearly inflation. Bladder/bathroom/shower hygiene systems were removed. |

## Fun times with people you love (`js/funtime.js`)

`personOpts` gains **🎈 ชวนทำกิจกรรมด้วยกัน** for a partner, spouse, live-in partner, any family
member (parents and children) and any townsperson at 40+ friendship. It opens a menu of 15 small
outings and cosy moments, each with its own place (home / outside / anywhere), time window, price,
two-person `pairAct` animation, once-per-day cooldown (the beach trip is once a week) and rewards
in mood, food, energy, a skill and relationship (children gain `bond` instead).

| Kind | Examples |
|---|---|
| Outdoors | ปิกนิก, เดินตลาดกลางคืน, ปั่นจักรยาน, กินไอศกรีม, ทริปทะเล |
| At home | ดูหนัง, ทำอาหารด้วยกัน, แช่น้ำอุ่น, ร้องคาราโอเกะ |
| Anywhere | นั่งดูดาว, ถ่ายรูปคู่ |
| Family | กินข้าวเย็นพร้อมหน้า, ช่วยกันทำงานบ้าน, นั่งคุยกันยาว ๆ, เล่านิทานก่อนนอน (children only) |

Every moment is logged in `st.fun` (`log`, `total`, `day`, `count`, `streak`, `streakDay`, `last`)
and **🖼️ อัลบั้มโมเมนต์** lists the last 24. A finished activity also calls the phone's `snap()` so a
keepsake photo lands in the camera album. Three activities in one day (🌟) and three days in a row
(🔥) give a small mood bonus. All state is created lazily, so old saves load unchanged, and nothing
here is required for the story or the money balance.

Load order now ends with: `… career, tech, income, housing, social, memory, realism, townlife, npclife, npcdeep, npcmove, nightlife, tutorial, lighting, status, safety, dating, stories, funtime, timeskip, sibling, swap, famgig, famshop, system`. Backups of the files before the sprite update: `js.backup-before-sprites/`.

## Sleeping through years (`js/timeskip.js`)

The bed menu gains **🌌 นอนข้ามเวลา (ข้ามได้หลายปี)**. Pick 1, 2, 3, 5 or 10 years; the confirm step
shows the days, the new age and how much your job will pay for the skipped working days. **Sleeping
costs nothing** — no living cost, rent, mortgage, bills or loan payments are charged for the missed
days. Instead your current job keeps paying: each skipped working day earns that job's shift wage at
your current level (× `payMul()`, class and mayor wage bonuses; office jobs rest on weekends), and an
unemployed character simply earns nothing. The skip lands at 07:00 exactly N×28 days later and stops on
every birthday in between, so `dieCheck()`, `yearlyWorld()` and inflation (`tsInflate()`, copied from
`dailyMoney()`) see each year: you age, your parents age and may pass away, townsfolk marry / have
children / die, prices and wages inflate. Then one `lifeTick()` / `seasonTick()` settles the new day —
graduation, a pending birth, housing deadlines, phone messages and `stDayCheck()`, which auto-skips
missed story chapters. Any bill that still fires on the wake-up morning is refunded, so a long sleep
never costs money.

Waking up restores a rested body (respecting the age-50 energy cap), clears illness and injury, resets
rent arrears, and extends a passed move-out deadline by 7 days so you are not evicted while asleep.
Napping while pregnant is blocked until the baby arrives. Everything is reported in a **🌅 ตื่นขึ้นมา**
panel (age, days, `💼 รายได้ระหว่างหลับ +฿…` with the number of worked days and the average wage, money
before → after, parents, children, missed chapters, inflation, new messages, notable events and a dream
line); the same summary can be reopened from the bed. State lives in `st.ts` (`n`, `years`, `last`,
`sum`) and the 🌌 หลับข้ามปี achievement unlocks at five skipped years. Toasts raised during the
simulation are collected instead of spamming the screen, and the random daily event is suppressed on
the first morning so the summary is not buried under a pop-up.

## Family switching, warp and family income (`js/swap.js`)

เปิด **👪 ครอบครัว** ในมือถือเพื่อสลับชีวิตเป็นคนในบ้านคนไหนก็ได้ — พ่อ แม่ คู่สมรส พี่/น้อง และลูกทุกวัย
รวมเด็ก — สลับไป-กลับได้ไม่จำกัดและฟรี ไม่มีคูลดาวน์หรือค่าใช้จ่าย ตัวที่คุณทิ้งไว้จะยังอยู่ที่บ้าน
ในร่าง NPC ที่เดินไปมาและใช้ชีวิตต่อ และเดินไปคุยหรือกด “🔄 สลับกลับมาเป็นตัวเอง” ได้ตลอด

- **กระเป๋าเดียวทั้งบ้าน**: เงิน, บ้าน, เฟอร์นิเจอร์, ความสัมพันธ์, มือถือ, ความสำเร็จ และชนชั้น
  เป็นของส่วนกลาง สกิล, ของในกระเป๋า, ชุด/ทรงผม, อาชีพ, พลังงาน, ความหิว, อารมณ์, การเรียน
  และสุขภาพ แยกตามคน (ตาราง `SW_FIELDS` ใน `js/swap.js`) เก็บไว้ใน `st.famSw.rec[id]`
- **เพศ**: ทุกที่ที่บอกชื่อจะบอกเพศด้วย — HUD (`♀`/`♂` ย่อ และคำเต็มเมื่อกางแผง), แอป 👪 ครอบครัว
  (มีรูปตัวละครย่อของแต่ละคน), สมุดบันทึกแท็บ “ผู้คน”, แอป 💞 ความสัมพันธ์ และหน้าโปรไฟล์
  (`♂ ผู้ชาย` / `♀ ผู้หญิง`) — เพศของแต่ละร่างมาจาก `look.g` / `p.g` เดิมของเกม ไม่มีข้อมูลใหม่ที่ต้องย้ายเซฟ
- **อายุต่อคน**: `st.ageShift0` จำอายุของชีวิตหลักไว้ ทำให้ `parentAge()` ไม่เปลี่ยนตามร่างที่เล่นอยู่
  และแต่ละคนยังแก่อายุตามปฏิทินเหมือนเดิม
- **ตัดผม/แต่งตัวติดกับคนนั้น**: กด **👚 เปลี่ยนชุด/ทรงผม** ในแอป 👪 (ต้องอยู่บ้าน — ถ้าอยู่ที่อื่น
  เกมจะบอกให้วาปกลับบ้านฟรีก่อน) แล้วแก้ทรงผม สีย้อม เสื้อผ้าได้ตามปกติ สิ่งที่เปลี่ยนจะถูกเขียน
  กลับไปที่ `st.famSw.rec[id]` (`look`, `wear`, `outfit`) ตอนสลับร่าง และ `swSyncHouse(id)` อัปเดต
  `st.parents.dad/mom.look`, `p.look`, `k.look`, `s.look` ให้ตรงกัน จากนั้น `swRepaint(id)` วาดสไปรต์ NPC
  ใหม่ทันที (และ `swRepaintAll()` ทำซ้ำทุกครั้งที่ `start` หรือ `rebuildHome`)
  - **ชุดประจำตัวอบครั้งเดียว**: `bakeLook(look, p, k)` เรียก `npcWear` ให้ NPC คนนั้นครั้งเดียวแล้วเก็บผลไว้ใน
    `look.base` (ตัดคีย์ผมออก) ทุกสไปรต์ — NPC ที่เดินอยู่, รูปย่อในแอป, ร่างที่คุณสลับเข้าไป — วาดจาก
    `palOf(look)` ที่ merge `look.base` ตัวเดียวกัน จึงออกมาเหมือนกันทุกพิกเซล ไม่ต้องเรียก `npcWear`
    ซ้ำ (ตัวนั้นผูกกับตำแหน่ง/แคช `NW_POS`/`NW_CACHE` จึงสุ่มชุดใหม่ทุกครั้งที่เรียก)
  - ถอดเสื้อ/หมวกออกแล้วสลับร่าง ช่องนั้นจะว่างจริง (ไม่กลับไปใส่ชุดเดิมให้เอง) — `st.wear` เก็บเฉพาะ id
    ของ `WITEM` ไม่มีข้อมูลสี/ทรงปนอยู่
  - รูปย่อในแอป 👪 และสไปรต์ร่างที่คุณทิ้งไว้ก็ใช้ชุด/ทรงผมชุดเดียวกัน
  - ถ้าทรงผมในเซฟผิดเพศ (เซฟเก่าหรือแก้เอง) `normalizeLook()` จะแก้ให้เป็นทรงของเพศนั้นทันทีทั้งตอน
    โหลดและตอนสลับร่าง
- **🧬 DNA**: แอป 👪 มีส่วน “DNA ครอบครัว” บอกว่าสีผม/สีผิว/สีตาแต่ละอย่างได้จากพ่อหรือแม่
  (`dnaLine(from)`) ใช้ทั้งกับคุณ พี่น้อง ลูก และแสดงในสมุดบันทึกกับแถวครอบครัว
- **🏠 วาปกลับบ้าน (ฟรี)**: ปุ่มในแอป ใช้ได้จากทุกที่ (ในเมือง บ้านพ่อแม่ ฯลฯ) ไม่มีค่าใช้จ่าย
- **รายได้ครอบครัว**: พ่อ ฿165/วัน, แม่ ฿120/วัน (คูณ `st.infl`), ลูกและพี่/น้อง ฿100/วันเมื่อ 18+,
  ฿55/วันเมื่อ 16–17, ต่ำกว่า 16 ไม่มีรายได้ และคู่สมรสใช้เงินเดือนเดิมใน `family.js`
  จ่ายตอน 18:00 วันละครั้งต่อคน ข้ามคนที่คุณกำลังเล่นอยู่ และข้ามคู่สมรสเพื่อไม่ให้ได้เงินซ้ำ
  (ถ้าเล่นเป็นคู่สมรสเอง เงินเดือน NPC จะหยุดและคุณต้องเข้าผลัดเอง) สรุปในแอปและ toast
- **ความปลอดภัย**: ถ้าคนที่คุณเล่นอยู่หายไปจากบ้าน (เสียชีวิต/ย้ายออก/เซฟถูกแก้) `swGuard()` จะพา
  กลับมาเป็นตัวเองให้อัตโนมัติ และ `passTorch` จะไม่ทำงานจนกว่าจะกลับมาเป็นตัวเองก่อน
  เซฟเก่าไม่มี `st.famSw`/`st.ageShift0` ก็เล่นต่อได้ทันที (สร้างให้เองตอนเริ่ม)

## พี่น้อง ทรงผมแยกเพศ และ DNA (`js/sibling.js`, `js/life.js`)

- **สุ่มพี่/น้องตอนเริ่มชีวิตใหม่** — `sibCount()` วัดดวง: 22% ไม่มีพี่น้อง, 46% มี 1 คน, 32% มี 2 คน
  แต่ละคนสุ่มเป็นพี่ (45%) หรือน้อง, ชาย/หญิง, อายุห่าง 1–5 ปี, ชื่อจาก `KID_NAMES`, นิสัยจาก `TRAITS`
  และสีผม/ผิว/ตาที่ถอดมาจากพ่อหรือแม่คนละส่วน (`from` = `{hair:'พ่อ'|'แม่', skin:…, eye:…}`)
  เก็บใน `st.sibs` เป็น `{id, n, g, age0, older, trait, look, from}` — เซฟเก่าที่ไม่มี `st.sibs`
  จะถูกสุ่มให้ครั้งแรกตอนโหลด แล้วจำไว้ในเซฟ
- **อยู่บ้านเดียวกันจริง** — `syncSibs()` สร้าง entity ใน `fam` + `people` (บ้านเดียวกับคุณ, ตารางเวลา
  ตามวัย, `slotOf` เดิม) จึงเดินไปมาในบ้าน, อยู่ในแถว “อยู่บ้านตอนนี้”, มีแถวในสมุดบันทึก,
  สลับร่างได้จากแอป 👪 และมีรายได้ครอบครัวเหมือนคนอื่น `ensureSibs()` ลบของเก่าก่อนสร้างใหม่
  จึงเรียกซ้ำได้ไม่มีความซ้ำซ้อน
- **ตัวเลือกคุยกับพี่น้อง**: คุยด้วย / กอด / เล่นด้วยกัน / ขอเงินพี่ (พี่ที่ 18+ และสนิท 50+) /
  ให้ของขวัญ — ใช้ระบบเดิม (`relOf`, `fx`, `giftPanel`) ทั้งหมด
- **ทรงผมแยกเพศเด็ดขาด** — `HAIR_G` กำหนดว่าทรงไหนเป็นของผู้ชาย 12 ทรง / ผู้หญิง 10 ทรง ไม่มีทรงไหน
  อยู่ทั้งสองฝั่ง: `hairOk(g,id)` ตรวจ, `hairFor(g,style,hx)` เลือกทรงฐานที่ถูกเพศให้ทรงพิเศษ
  (เช่น หางม้า → ผมยาว, มวยคู่ → บ๊อบ), `hairPick(g)` สุ่มเฉพาะของเพศนั้น และ `normalizeLook(look)`
  ซ่อมทุก look ที่เข้ามา (เซฟเก่า, ร่างที่สลับ, NPC) พร้อมกันนั้นผู้ชายจะไม่ได้รับกระโปรง/เดรส
  หน้าเลือกทรงผมในหน้าแรกและในตู้เสื้อผ้ากรองด้วย `hairOk` และ `nwHair` ของ NPC ก็สุ่มจากทรงของ
  เพศนั้นเท่านั้น
- **เสื้อกับผมไม่ทับกัน** — เลเยอร์ผมวาดหลังศูนย์กลางหัวและไม่ลงมาถึงลำตัว (ตรวจด้วยการสแกนพิกเซล
  ในมุมมองด้านหน้า) ส่วนมุมมองด้านข้างผมอยู่ข้างลำตัว และด้านหลังผมทับเสื้อตามธรรมชาติของการมองจากข้างหลัง
- **DNA ไม่มั่ว** — พ่อแม่แต่ละคนมี `look.hair/skin/eye` ของตัวเอง ลูกและพี่น้องรับค่าจากคนใดคนหนึ่ง
  แล้วจำชื่อผู้ให้ไว้ใน `from`; `dnaLine(from)` แปลงเป็นข้อความ `สีผมจาก… · สีผิวจาก… · สีตาจาก…`
  แสดงในแอป 👪 (ทั้งของคุณ พี่น้อง และลูก) และในสมุดบันทึก — ค่าที่แสดงตรงกับสีที่วาดจริงเสมอ
  เพราะทุกสไปรต์ใช้ `palOf(look)` ตัวเดียวกัน

## ช่วยงานครอบครัว (`js/famgig.js`)

เดินไปหาคนในบ้านแล้วเลือก **“ช่วยงาน…”** — ได้เงิน ส่วนแบ่งจากค่าจ้างของเขา ความสนิท และสกิล

- **ที่ทำงาน**: ยืนที่ประตูออฟฟิศ/คาเฟ่/มินิมาร์ท/ร้านเฟอร์นิเจอร์ หรือโรงเรียน จะมีตัวเลือก
  `ช่วยงานที่คาเฟ่กับ ซาร่า (45 นาที · +฿56)` — ได้ **45% ของค่าจ้างรายวัน**ของคนนั้น และมีโอกาส 28%
  ได้ทิป ฿10–25 (ปัดเศษตาม `st.infl` ผ่าน `swWage`)
- **ที่บ้าน** (ตอนเย็น/กลางคืนที่ทุกคนอยู่บ้าน): `ช่วยงานที่บ้าน (20 นาที · +฿46)` — ใช้เวลา 20 นาที
  ได้ `15 + 18% ของค่าจ้าง`
- **โรงเรียน**: `ช่วยงานที่โรงเรียนกับ น้อง…` — ไม่ได้เงิน แต่ได้ `ตรรกะ` +8 และความสนิท
- **น้องเล็กกว่า 6 ขวบ**: `ช่วยดูน้อง` — ไม่มีเงิน ได้ `ศิลปะ` +8, อารมณ์ +5 และความสนิท
- ทุกครั้ง: ความสนิท +4 (สูงสุด 100), สกิล +8, พลังงาน −6, อาหาร −3, พลังใจ +5, และNPC
  จำได้ (`remember(id,'help',…)`) — **วันละครั้งต่อคน** รีเซ็ตตอนขึ้นวันใหม่
- แอป 👪 มีส่วน **🤝 ช่วยงานครอบครัว** บอกว่าใครช่วยแล้ววันนี้ (✅) ใครยังไม่ได้ช่วย และยอดรวมที่หาได้
- คนที่ทำงานอยู่ในอาคารจะคลิกไม่ได้ จึงเพิ่มตัวเลือกเดียวกันที่ **ประตูอาคารนั้น** (`fgWrapTargets`
  ห่อ `opts` ของ `town.targets` แบบ getter ตามพิกัด `BUILDINGS[].ix/iy`) โดยไม่ทับตัวเลือกเดิม
  (สมัครงาน/งานพิเศษ ยังอยู่ครบ)
- พี่น้องมี `role` ตามวัย (`student` < 18, `worker` 18+) และเด็กเล็กได้ `_sched = [[0,'in']]`
  จึงอยู่บ้านทั้งวัน ไม่เดินไปโรงเรียนเอง

## ซุ้มอาหารครอบครัว (`js/famshop.js`)

วงจรเล่นสั้น ๆ 5–10 นาที: **ทำอาหารที่บ้าน → เดินไปขายที่ซุ้มกลางลานเมือง → กลับบ้าน**

- ที่ลานเมือง (พิกัด `20×T+16, 8×T+22` ใกล้กระดานประกาศ) มีซุ้มเปิด **09:00–21:00** ตัวเลือก
  `🧺 เปิดซุ้มขายอาหาร` — ข้างในมีรายการอาหารที่ทำเองในกระเป๋า พร้อมราคาต่อจาน
- ราคา = `BIZ.cafe.value[id]` (โต๊ะราคาเดิมของคาเฟ่) × คุณภาพจากสกิลทำอาหาร
  (`1 + min(30%, lv(cook)×3%)`) × ชื่อเสียงซุ้ม (`+ สูงสุด 10%`) × โบนัสคนช่วย
- **คนช่วย**: ชวนพ่อ แม่ คู่สมรส หรือพี่น้องได้หนึ่งคน
  - แม่/คู่สมรส: ราคา +12%, ลูกค้า +1 (ช่วยเรื่องครัว)
  - พ่อ: ราคา +6%, ลูกค้า +1
  - พี่น้อง: ลูกค้า +2 (อายุต่ำกว่า 18 ได้ +2 เช่นกัน แต่ราคา +4%)
  - คนช่วยได้ **20% ของยอดขาย** (บันทึกใน `st.famShop.helpEarn`) และความสนิท +1 ต่อจาน
  - **ต้องว่างจริง**: เช็ก `slotOf()` ของเขา — ถ้าอยู่ที่ทำงาน/โรงเรียนจะไม่มาและไม่ให้โบนัส
    (ซุ้มจะขึ้นว่า “กำลังทำงานอยู่ — โบนัสกลับมาตอนเย็น/วันหยุด”) คนช่วยจึงถูกวาดที่ซุ้มเฉพาะตอนมาช่วยจริง
- **ลูกค้าจำกัดต่อวัน**: `4 + floor(charm/2) + โบนัสคนช่วย + floor(ชื่อเสียง/20)`
  (ฝนตก −2, เทศกาล +2, สูงสุด 12 คน) — ขายหมดแล้วต้องรอพรุ่งนี้ ทำให้แต่ละรอบสั้นและมีจังหวะ
- ขายแล้วได้เงิน (80% เข้ากระเป๋าเรา, 20% แบ่งคนช่วย), เสน่ห์ +2 ต่อจาน, พลังงาน −1, พลังใจ +2,
  ใช้เวลา 6 นาทีต่อจาน, ชื่อเสียงซุ้ม +1 ต่อจาน และมีบทลูกค้า NPC สุ่มมาสั่งพร้อมคำชม
- แอป 👪 มีส่วน **🧺 ซุ้มอาหารครอบครัว**: คนช่วย, ยอดวันนี้, ลูกค้าที่เหลือ, ขายดีที่สุด,
  จำนวนวันที่เปิด, ชื่อเสียง และยอดรวม — ทั้งหมดเก็บใน `st.famShop` (สร้างเองให้เซฟเก่า)
- เตาทำอาหารมีข้อความเตือนว่าทำเสร็จแล้วเอาไปขายที่ซุ้มได้
- เพิ่มของใหม่ทางหน้าตา: **ผ้ากันเปื้อน** (ขาว/น้ำเงิน/ชมพู, ฿80) และทรงผมใหม่เพศละหนึ่งแบบ
  — **เสยเปิดหน้าผาก** (ชาย) และ **เกล้าต่ำ** (หญิง) ผ่าน `HAIR_G`, `HX_STYLE`, `CREATOR_HAIR`,
  `HAIRSTYLES` ตามกฎแยกทรงผมชาย/หญิงเดิม

## Map redesign (`js/mapart.js`, loaded right after `game.js`)

Keeps every building and tile coordinate north of row 30. Extends the town to 40x44: rows 30–31 are the main road, rows 32–35 form a residential grass lane with five new family homes (building indices 24–28), row 36 is a riverside walk, rows 37–41 are a cliff-lined river with three wooden bridges on the road columns, and rows 42–43 are forest edge with a small meadow. Tile types: 0 grass, 1 cobblestone,
2/7 dirt path, 3 meadow, 4 water, 5 bridge, 6 cliff. Also redraws trees, lamps and buildings (gable tile roofs,
timber or brick walls, shutters, chimney smoke) and adds walk-through scenery. Cars reduced to 3.
