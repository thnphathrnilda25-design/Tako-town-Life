'use strict';
// 50 townsfolk with unique names, generated deterministically so the cast never changes between sessions.
const NAMES_F = ['Emma', 'Olivia', 'Sophia', 'Mia', 'Chloe', 'Lily', 'Grace', 'Ruby', 'Hannah', 'Zoe', 'Nora', 'Ella', 'Ivy', 'Daisy', 'Alice', 'Luna', 'Maya', 'Rose', 'Claire', 'Jade', 'Hazel', 'Violet', 'Penny', 'Stella', 'Cora'];
const NAMES_M = ['Liam', 'Noah', 'Ethan', 'Jack', 'Leo', 'Max', 'Oscar', 'Henry', 'Theo', 'Finn', 'Owen', 'Ryan', 'Caleb', 'Felix', 'Sam', 'Eli', 'Ben', 'Hugo', 'Jasper', 'Miles', 'Colin', 'Dean', 'Gus', 'Walt', 'Arlo'];
const NAMES_TH_F = ['เอ็มม่า', 'โอลิเวีย', 'โซเฟีย', 'มีอา', 'โคลอี้', 'ลิลลี่', 'เกรซ', 'รูบี้', 'ฮันนาห์', 'โซอี้', 'นอร่า', 'เอลล่า', 'ไอวี่', 'เดซี่', 'อลิซ', 'ลูน่า', 'มายา', 'โรส', 'แคลร์', 'เจด', 'เฮเซล', 'ไวโอเล็ต', 'เพนนี่', 'สเตลล่า', 'คอร่า'];
const NAMES_TH_M = ['เลียม', 'โนอาห์', 'อีธาน', 'แจ็ค', 'ลีโอ', 'แม็กซ์', 'ออสการ์', 'เฮนรี่', 'ทีโอ', 'ฟินน์', 'โอเว่น', 'ไรอัน', 'เคเลบ', 'เฟลิกซ์', 'แซม', 'อีไล', 'เบน', 'ฮิวโก้', 'แจสเปอร์', 'ไมล์ส', 'คอลิน', 'ดีน', 'กัส', 'วอลต์', 'อาร์โล'];
const FOOD_POOL = ['rice', 'egg', 'veg', 'meat', 'milk', 'flour', 'fruit', 'bread', 'coffee', 'choco', 'flower', 'plush', 'book', 'omelet', 'salad', 'krapow', 'pancake', 'tomyum', 'steak', 'cake'];
const HAIR = [['#2a2a3a', '#14141e', '#4a4a6a'], ['#a0582e', '#6e3519', '#c8804e'], ['#f2a65a', '#c87a3a', '#ffd09a'], ['#3a2a1a', '#24180e', '#5a4a3a'],
  ['#f070b0', '#c04a8a', '#ffb0d8'], ['#3f74e8', '#2648b0', '#8ab0ff'], ['#8a5ad8', '#5a3aa8', '#c0a0ff'], ['#c4ecbc', '#88c08a', '#f0fff0'], ['#e8e8f0', '#a8a8b8', '#ffffff'], ['#d8b050', '#a88030', '#f8e090']];
const SHIRT = [['#c8402e', '#8a2a1e', '#6ad0e8'], ['#58c47a', '#2f7a48', '#245a34'], ['#9a48a8', '#6e2c7c', '#ff8ac8'], ['#58c8ec', '#3a8cc4', '#2648b0'], ['#f4f4f4', '#c8c8d4', '#3a5ad8'],
  ['#3a3a4a', '#24242e', '#e85a5a'], ['#f2c84a', '#c8982a', '#ffffff'], ['#e87a9a', '#b8506e', '#fff0f4'], ['#5a8ad8', '#3a5aa8', '#ffe14a'], ['#e8884a', '#b8602a', '#fff4e0']];
const PANTS = [['#3b2a3e', '#2a1a1e'], ['#24402c', '#18281c'], ['#2c3c9c', '#1c2468'], ['#6a5a4a', '#3a2a1e'], ['#f2d44a', '#e0a040']];
const STYLES_M = ['short', 'swept', 'short', 'long'], STYLES_F = ['bob', 'long', 'swept', 'bob'];
const SCHED = {
  student: [[6, 'home'], [8, 'school'], [12, 'plaza'], [13, 'school'], [15, 'park'], [17, 'mart'], [19, 'home'], [21, 'in']],
  worker: [[6, 'home'], [8, 'cafe'], [9, 'office'], [12, 'plaza'], [13, 'office'], [17, 'park'], [19, 'mart'], [21, 'home'], [22, 'in']],
  barista: [[6, 'home'], [7, 'cafe'], [12, 'plaza'], [13, 'cafe'], [17, 'park'], [19, 'cafe'], [21, 'home'], [22, 'in']],
  clerk: [[7, 'home'], [9, 'mart'], [13, 'plaza'], [14, 'mart'], [18, 'park'], [21, 'mart'], [22, 'home'], [23, 'in']],
  freelance: [[8, 'home'], [10, 'cafe'], [13, 'plaza'], [14, 'park'], [18, 'cafe'], [21, 'home'], [23, 'in']],
  athlete: [[5, 'park'], [9, 'home'], [11, 'park'], [14, 'plaza'], [17, 'park'], [20, 'home'], [22, 'in']],
  shopkeeper: [[7, 'home'], [9, 'furni'], [12, 'plaza'], [13, 'furni'], [18, 'park'], [20, 'plaza'], [21, 'home'], [22, 'in']],
  retiree: [[6, 'park'], [9, 'cafe'], [11, 'home'], [14, 'park'], [16, 'plaza'], [18, 'home'], [20, 'in']],
};
const ROLE_NAME = { student: 'นักเรียน', worker: 'พนักงานออฟฟิศ', barista: 'บาริสต้า', clerk: 'พนักงานร้านสะดวกซื้อ', freelance: 'ฟรีแลนซ์', athlete: 'นักกีฬา', shopkeeper: 'เจ้าของร้านเฟอร์นิเจอร์', retiree: 'ผู้เกษียณ' };
const ROLE_SAYS = {
  student: ['การบ้านเยอะมากเลย!', 'พักเที่ยงคือช่วงที่ดีที่สุดของโรงเรียน', 'โตขึ้นเราอยากเป็นนักวิทยาศาสตร์'],
  worker: ['หัวหน้าให้ทำรายงานอีกแล้ว…', 'กาแฟคือสิ่งเดียวที่ทำให้มีแรง', 'อยากเป็นผู้จัดการก่อนอายุ 30'],
  barista: ['วันนี้กาแฟหอมเป็นพิเศษ อยากลองชิมไหม?', 'ฝันอยากเปิดร้านเค้กเป็นของตัวเอง', 'ศิลปะลาเต้ต้องฝึกหลายปีเลยนะ'],
  clerk: ['ยินดีต้อนรับ! มินิมาร์ทเปิดถึงสี่ทุ่ม', 'ทำอาหารกินเองประหยัดกว่านะ', 'ผลไม้สดเพิ่งเข้าสต็อกเลย'],
  freelance: ['ทำงานบนม้านั่งในสวนก็ดีเหมือนกันนะ', 'เดดไลน์ก็แค่คำแนะนำ ใช่ไหม?', 'ช่วงบ่ายแสงในสวนสวยมาก'],
  athlete: ['วิ่งตอนเช้าแล้ววันดีทั้งวัน!', 'โปรตีนคือทุกสิ่ง', 'อยากวิ่งด้วยกันไหม?'],
  shopkeeper: ['โซฟาดี ๆ เปลี่ยนชีวิตได้เลยนะ', 'แวะมาดูเฟอร์นิเจอร์ใหม่สิ!', 'การแต่งบ้านคือความสนุกครึ่งหนึ่ง'],
  retiree: ['ตอนฉันยังสาว ที่นี่เป็นทุ่งนาเลยนะ', 'กินผักเยอะ ๆ นะลูก', 'ฉันรักดอกไม้มากกว่าอะไรทั้งหมด'],
};
const TRAIT_SAYS = {
  cheerful: 'ยิ้มเข้าไว้! วันนี้สั้นเกินกว่าจะหงุดหงิด', shy: '...เอ่อ สวัสดี ขอโทษนะ เราตื่นเต้นเวลาคุยกับคน', grumpy: 'หึ อย่ามาเสียเวลาเรา',
  smart: 'รู้ไหมว่าดวงจันทร์ถอยห่างจากโลกทุกปีนะ', lazy: 'ขออีกห้านาที... หรือห้าชั่วโมงก็ได้', kind: 'ถ้าต้องการให้ช่วยอะไรก็บอกนะ',
};
const TRAITS = Object.keys(TRAIT_SAYS);
const ROLES_ADULT = ['worker', 'worker', 'barista', 'clerk', 'freelance', 'athlete', 'shopkeeper', 'worker'];
const PEOPLE = (() => {
  let s = 4242; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, pick = a => a[r() * a.length | 0];
  const ages = [...[6, 7, 8, 9, 10, 11, 12, 12], ...[13, 14, 15, 16, 16, 17], ...Array.from({ length: 28 }, (_, i) => 19 + (i * 13) % 38), ...[62, 65, 68, 70, 72, 75, 78, 81]];
  const out = [];
  for (let i = 0; i < 50; i++) {
    const g = i % 2 ? 'f' : 'm', nameEn = (g === 'f' ? NAMES_F : NAMES_M)[i >> 1], n = (g === 'f' ? NAMES_TH_F : NAMES_TH_M)[i >> 1], age = ages[i];
    const role = age < 18 ? 'student' : age >= 60 ? 'retiree' : ROLES_ADULT[i % ROLES_ADULT.length];
    const hair = age >= 62 ? HAIR[8] : pick(HAIR), shirt = pick(SHIRT), pants = pick(PANTS), trait = pick(TRAITS);
    const pool = [...FOOD_POOL].sort(() => r() - .5);
    out.push({ id: nameEn.toLowerCase(), n, g, age, role, trait, date: age >= 18 && age <= 45 ? 1 : 0,
      pal: { style: pick(g === 'f' ? STYLES_F : STYLES_M), clip: g === 'f' && r() < .3 ? 1 : 0, skirt: g === 'f' && age >= 13 && r() < .35 ? 1 : 0,
        h: hair[0], H: hair[1], L: hair[2], c: shirt[0], C: shirt[1], a: shirt[2], p: pants[0], f: pants[1], e: '#3a2418' },
      love: pool.slice(0, 2), like: pool.slice(2, 5), hate: pool.slice(5, 7), sched: SCHED[role],
      says: [...ROLE_SAYS[role], TRAIT_SAYS[trait]] });
  }
  return out;
})();
console.assert(new Set(PEOPLE.map(p => p.id)).size === 50, 'NPC names must be unique');
