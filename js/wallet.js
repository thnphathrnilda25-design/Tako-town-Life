'use strict';
// Family wallet: while the player is under 18, everyday spending comes out of the parents' purse first.
// The player's own cash is kept for savings, and parents can be asked for pocket money once a day (life.js).
function installWallet() {
  if (Object.getOwnPropertyDescriptor(st, 'money')?.get) return;
  const kid = age() < 18;
  const savedTotal = Number(st.money) || 0;
  if (st.famMoney == null) st.famMoney = kid ? 500 : 0;
  const savedFam = Math.max(0, Number(st.famMoney) || 0);
  // Saves written after this update store the combined total in `money`; new games store cash and family money apart.
  let own = st.wallet === 1 && kid ? Math.max(0, savedTotal - savedFam) : savedTotal;
  st.wallet = 1;
  Object.defineProperty(st, 'money', {
    configurable: true, enumerable: true,
    get() { return Math.round(own + (age() < 18 ? Math.max(0, st.famMoney || 0) : 0)); },
    set(v) {
      v = Number(v) || 0;
      const famNow = age() < 18 ? Math.max(0, st.famMoney || 0) : 0;
      const total = own + famNow;
      if (v < total) {
        let need = Math.round(total - v);
        const take = Math.min(famNow, need);
        if (take) { st.famMoney = famNow - take; need -= take; }
        own = Math.max(0, own - need);
      } else own += Math.round(v - total);
    },
  });
  walletPayOwn = n => { own = Math.max(0, own - Math.max(0, Math.round(n))); };
}
let walletPayOwn = null;
const cashOwn = () => { const d = Object.getOwnPropertyDescriptor(st, 'money'); if (!d?.get) return st.money; return Math.max(0, st.money - (age() < 18 ? (st.famMoney || 0) : 0)); };
const famMoney = () => age() < 18 ? Math.max(0, st.famMoney || 0) : 0;
const canAfford = n => st.money >= n;

function walletTick() {
  if (age() >= 18 || !st.parents) return;
  if (st.famDay === day()) return;
  st.famDay = day();
  if (day() > 1 && day() % 7 === 1 && (st.famMoney || 0) < 1200) {
    st.famMoney = Math.min(1500, (st.famMoney || 0) + 300);
    toast('👪 พ่อแม่เติมเงินเข้ากระเป๋าครอบครัว +฿300');
  }
}

const _startWallet = start;
start = saved => { _startWallet(saved); installWallet(); walletTick(); };
const _seasonWallet = seasonTick;
seasonTick = () => { _seasonWallet(); walletTick(); };

console.assert(typeof cashOwn() === 'number', 'wallet exposes own cash');
